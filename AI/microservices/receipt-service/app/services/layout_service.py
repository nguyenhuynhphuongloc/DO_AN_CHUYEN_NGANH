from __future__ import annotations

import logging
import os
import tempfile
import time
from functools import lru_cache
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import requests

from app.core.config import settings
from app.services.layout_models import LayoutDetectionResult, RawLayoutDetection
from app.services.layout_postprocess import postprocess_layout_blocks

try:
    from ultralytics import YOLO
except ImportError:  # pragma: no cover
    YOLO = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)


class LayoutService:
    def __init__(self) -> None:
        self._model: Any | None = None
        self._model_error: str | None = None
        self._model_source: str | None = None
        self._loaded_model_path: str | None = None
        self._model_device: str | None = None

    def _model_path(self) -> Path | None:
        if not settings.ocr_layout_model_path.strip():
            return None
        return Path(settings.ocr_layout_model_path).expanduser()

    def _base_runtime(self, *, profile: str) -> dict[str, Any]:
        backend = settings.ocr_layout_backend.strip().lower() or "disabled"
        return {
            "backend": backend,
            "profile": profile,
            "model_path": settings.ocr_layout_model_path or None,
            "model_loaded": bool(self._model is not None),
            "model_source": self._model_source,
            "device": self._model_device,
            "auto_download_enabled": bool(settings.ocr_layout_model_auto_download),
            "download_url": settings.ocr_layout_model_download_url or None,
            "confidence_threshold": settings.ocr_layout_confidence_threshold,
            "iou_threshold": settings.ocr_layout_iou_threshold,
        }

    def _download_model(self, target_path: Path) -> Path:
        download_url = settings.ocr_layout_model_download_url.strip()
        if not download_url:
            raise FileNotFoundError(f"Layout model is missing and no download URL is configured for {target_path}")
        target_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = target_path.with_suffix(f"{target_path.suffix}.download")
        logger.info("Downloading layout model backend=%s url=%s target=%s", settings.ocr_layout_backend, download_url, target_path)
        try:
            with requests.get(
                download_url,
                stream=True,
                timeout=settings.ocr_layout_model_download_timeout_seconds,
            ) as response:
                response.raise_for_status()
                with temp_path.open("wb") as handle:
                    for chunk in response.iter_content(chunk_size=1024 * 1024):
                        if chunk:
                            handle.write(chunk)
            temp_path.replace(target_path)
        except Exception:
            if temp_path.exists():
                temp_path.unlink(missing_ok=True)
            raise
        self._model_source = f"download:{download_url}"
        logger.info("Layout model downloaded successfully source=%s path=%s", self._model_source, target_path)
        return target_path

    def _resolve_model_path(self, *, allow_download: bool) -> Path:
        model_path = self._model_path()
        if model_path is None:
            raise FileNotFoundError("OCR layout model path is not configured")
        if model_path.exists() and model_path.is_file() and os.access(model_path, os.R_OK):
            self._model_source = "local"
            return model_path
        if allow_download and settings.ocr_layout_model_auto_download:
            return self._download_model(model_path)
        raise FileNotFoundError(f"OCR layout model path is missing or unreadable: {model_path}")

    def _predict_device_arg(self) -> Any | None:
        requested = (settings.ocr_device or "auto").strip().lower()
        if requested == "cpu":
            return "cpu"
        if requested == "gpu":
            return 0
        return None

    def _resolve_model_device(self) -> str:
        try:
            model = getattr(self._model, "model", None)
            if model is not None and hasattr(model, "parameters"):
                return str(next(model.parameters()).device)
        except Exception:  # pragma: no cover - runtime-dependent
            pass
        device_arg = self._predict_device_arg()
        if device_arg == "cpu":
            return "cpu"
        if device_arg == 0:
            return "cuda:0"
        return "auto"

    def validate_runtime(self, *, profile: str = "startup", ensure_load: bool = False) -> dict[str, Any]:
        runtime = self._base_runtime(profile=profile)
        enabled = bool(settings.ocr_layout_enabled)
        if not enabled:
            return {
                "enabled": False,
                "available": False,
                "reason": "layout_disabled",
                "runtime": runtime,
            }
        if self._model_path() is None:
            logger.warning("Layout OCR disabled due to missing/invalid model: OCR_LAYOUT_MODEL_PATH is empty")
            return {
                "enabled": True,
                "available": False,
                "reason": "missing_model",
                "runtime": runtime,
            }
        if not ensure_load:
            try:
                resolved = self._resolve_model_path(allow_download=False)
                runtime["model_path"] = str(resolved)
                runtime["model_source"] = self._model_source
            except FileNotFoundError:
                pass
            return {
                "enabled": True,
                "available": runtime.get("model_path") is not None,
                "reason": None if runtime.get("model_path") is not None else "missing_model",
                "runtime": runtime,
            }
        try:
            self._get_model()
            runtime = self._base_runtime(profile=profile)
            runtime["model_path"] = self._loaded_model_path
            runtime["model_loaded"] = True
            runtime["model_source"] = self._model_source
            runtime["device"] = self._model_device
            return {
                "enabled": True,
                "available": True,
                "reason": None,
                "runtime": runtime,
            }
        except FileNotFoundError as exc:
            self._model_error = str(exc)
            logger.warning("Layout OCR disabled due to missing model: %s", exc)
            runtime["download_error"] = self._model_error
            return {
                "enabled": True,
                "available": False,
                "reason": "missing_model",
                "runtime": runtime,
            }
        except Exception as exc:  # pragma: no cover - runtime-dependent
            self._model_error = str(exc)
            logger.warning("Layout OCR disabled because the model could not be loaded: %s", exc)
            runtime["load_error"] = self._model_error
            return {
                "enabled": True,
                "available": False,
                "reason": "layout_model_load_failed",
                "runtime": runtime,
            }

    def _get_model(self) -> Any:
        if YOLO is None:
            raise RuntimeError("Ultralytics is not installed")
        if self._model is not None:
            return self._model
        model_path = self._resolve_model_path(allow_download=True)
        try:
            self._model = YOLO(str(model_path))
            self._loaded_model_path = str(model_path)
            self._model_device = self._resolve_model_device()
        except Exception as exc:  # pragma: no cover - runtime-dependent
            self._model_error = str(exc)
            raise RuntimeError(f"Failed to load layout model from {model_path}: {exc}") from exc
        logger.info(
            "Configured layout detector backend=%s model=%s source=%s device=%s",
            settings.ocr_layout_backend,
            model_path,
            self._model_source,
            self._model_device,
        )
        return self._model

    def _write_debug_image(
        self,
        image: np.ndarray,
        *,
        raw_detections: list[RawLayoutDetection],
        debug_tag: str | None,
    ) -> str | None:
        tag = (debug_tag or "unknown").replace("/", "_").replace("\\", "_").replace(":", "_")
        debug_dir = Path("/tmp") if Path("/tmp").exists() else Path(tempfile.gettempdir())
        debug_path = debug_dir / f"layout_debug_{tag}.jpg"
        canvas = image.copy()
        for detection in raw_detections:
            x1, y1, x2, y2 = detection.bbox
            cv2.rectangle(canvas, (x1, y1), (x2, y2), (0, 180, 255), 2)
            label = f"{detection.raw_label}:{detection.confidence:.2f}"
            cv2.putText(canvas, label, (x1, max(y1 - 8, 12)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 180, 255), 2)
        if cv2.imwrite(str(debug_path), canvas):
            return str(debug_path)
        return None

    def detect(self, image: np.ndarray, *, profile: str, debug_tag: str | None = None) -> LayoutDetectionResult:
        enabled = bool(settings.ocr_layout_enabled)
        backend = settings.ocr_layout_backend.strip().lower() or "disabled"
        base_runtime = self._base_runtime(profile=profile)
        if not enabled:
            return LayoutDetectionResult(
                enabled=False,
                used=False,
                backend=backend,
                blocks=[],
                runtime={**base_runtime, "layout_seconds": 0.0},
                raw_detections_count=0,
                postprocessed_block_count=0,
                fallback_reason="layout_disabled",
            )
        validation = self.validate_runtime(profile=profile, ensure_load=True)
        if not validation["available"]:
            return LayoutDetectionResult(
                enabled=True,
                used=False,
                backend=backend,
                blocks=[],
                runtime={**base_runtime, "layout_seconds": 0.0},
                raw_detections_count=0,
                postprocessed_block_count=0,
                fallback_reason=str(validation["reason"]),
            )

        started = time.perf_counter()
        try:
            logger.info(
                "Starting layout inference profile=%s backend=%s model=%s source=%s device=%s",
                profile,
                backend,
                self._loaded_model_path or settings.ocr_layout_model_path or None,
                self._model_source,
                self._model_device,
            )
            model = self._get_model()
            predict_kwargs = {
                "source": image,
                "verbose": False,
                "conf": settings.ocr_layout_confidence_threshold,
                "iou": settings.ocr_layout_iou_threshold,
            }
            device_arg = self._predict_device_arg()
            if device_arg is not None:
                predict_kwargs["device"] = device_arg
            results = model.predict(**predict_kwargs)
            raw_detections: list[RawLayoutDetection] = []
            names = getattr(results[0], "names", {}) if results else {}
            if results and getattr(results[0], "boxes", None) is not None:
                boxes = results[0].boxes
                xyxy = boxes.xyxy.cpu().numpy() if hasattr(boxes.xyxy, "cpu") else np.asarray(boxes.xyxy)
                confs = boxes.conf.cpu().numpy() if hasattr(boxes.conf, "cpu") else np.asarray(boxes.conf)
                clses = boxes.cls.cpu().numpy() if hasattr(boxes.cls, "cpu") else np.asarray(boxes.cls)
                for box, confidence, cls in zip(xyxy, confs, clses, strict=False):
                    label = str(names.get(int(cls), str(cls)))
                    bbox = (
                        max(int(round(box[0])), 0),
                        max(int(round(box[1])), 0),
                        min(int(round(box[2])), image.shape[1]),
                        min(int(round(box[3])), image.shape[0]),
                    )
                    raw_detections.append(
                        RawLayoutDetection(
                            raw_label=label,
                            confidence=float(confidence),
                            bbox=bbox,
                        )
                    )
            logger.info("Layout inference produced %s raw detections for profile=%s", len(raw_detections), profile)
            debug_image_path = self._write_debug_image(image, raw_detections=raw_detections, debug_tag=debug_tag)
            blocks, postprocess = postprocess_layout_blocks(
                raw_detections,
                image_shape=(image.shape[0], image.shape[1]),
            )
            logger.info(
                "Layout postprocess profile=%s raw=%s final=%s removed_low_conf=%s removed_small=%s removed_overlap=%s merged=%s capped=%s",
                profile,
                len(raw_detections),
                len(blocks),
                postprocess.get("skipped_low_confidence"),
                postprocess.get("skipped_small_blocks"),
                postprocess.get("skipped_overlap"),
                postprocess.get("merged_count"),
                postprocess.get("capped_count"),
            )
            runtime = {
                **base_runtime,
                "model_path": self._loaded_model_path or settings.ocr_layout_model_path or None,
                "model_loaded": bool(self._model is not None),
                "model_source": self._model_source,
                "device": self._model_device,
                "layout_seconds": round(time.perf_counter() - started, 4),
                "raw_detection_count": len(raw_detections),
                "postprocess": postprocess,
                "debug_image_path": debug_image_path,
            }
            if not blocks:
                return LayoutDetectionResult(
                    enabled=True,
                    used=False,
                    backend=backend,
                    blocks=[],
                    runtime=runtime,
                    raw_detections_count=len(raw_detections),
                    postprocessed_block_count=0,
                    debug_image_path=debug_image_path,
                    fallback_reason="no_usable_layout_blocks",
                )
            if len(blocks) < 2:
                return LayoutDetectionResult(
                    enabled=True,
                    used=False,
                    backend=backend,
                    blocks=blocks,
                    runtime=runtime,
                    raw_detections_count=len(raw_detections),
                    postprocessed_block_count=len(blocks),
                    debug_image_path=debug_image_path,
                    fallback_reason="too_few_layout_blocks",
                )
            if all(block.label == "metadata" for block in blocks):
                return LayoutDetectionResult(
                    enabled=True,
                    used=False,
                    backend=backend,
                    blocks=blocks,
                    runtime=runtime,
                    raw_detections_count=len(raw_detections),
                    postprocessed_block_count=len(blocks),
                    debug_image_path=debug_image_path,
                    fallback_reason="all_metadata_blocks",
                )
            return LayoutDetectionResult(
                enabled=True,
                used=True,
                backend=backend,
                blocks=blocks,
                runtime=runtime,
                raw_detections_count=len(raw_detections),
                postprocessed_block_count=len(blocks),
                debug_image_path=debug_image_path,
                fallback_reason=None,
            )
        except Exception as exc:  # pragma: no cover - runtime-dependent
            logger.warning("Layout detection failed for profile=%s: %s", profile, exc)
            return LayoutDetectionResult(
                enabled=True,
                used=False,
                backend=backend,
                blocks=[],
                runtime={**base_runtime, "layout_seconds": round(time.perf_counter() - started, 4)},
                raw_detections_count=0,
                postprocessed_block_count=0,
                fallback_reason="layout_model_load_failed",
            )


@lru_cache(maxsize=1)
def get_layout_service() -> LayoutService:
    return LayoutService()
