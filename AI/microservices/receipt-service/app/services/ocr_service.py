from __future__ import annotations

import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import paddle
from paddleocr import PaddleOCR

from app.core.config import settings
from app.services.ocr_postprocess import estimate_low_quality, normalize_vietnamese_lines

logger = logging.getLogger(__name__)


class OCRService:
    def __init__(self) -> None:
        self._engines: dict[str, dict[str, PaddleOCR]] = {"fast": {}, "recovery": {}}
        self._engine_configs: dict[str, dict[str, dict[str, Any]]] = {"fast": {}, "recovery": {}}
        self._runtime_info = self._build_runtime_info()
        self._primary_language = ""
        self._fallback_language = ""
        self._device = self._build_ocr_engines()

    def _build_runtime_info(self) -> dict[str, Any]:
        compiled_with_cuda = bool(paddle.is_compiled_with_cuda())
        cuda_device_count = paddle.device.cuda.device_count() if compiled_with_cuda else 0
        requested_device = settings.ocr_device.strip().lower()
        return {
            "requested_device": requested_device,
            "compiled_with_cuda": compiled_with_cuda,
            "cuda_device_count": int(cuda_device_count),
            "cuda_visible_devices": os.environ.get("CUDA_VISIBLE_DEVICES"),
            "nvidia_visible_devices": os.environ.get("NVIDIA_VISIBLE_DEVICES"),
            "nvidia_driver_capabilities": os.environ.get("NVIDIA_DRIVER_CAPABILITIES"),
        }

    def _build_profile_options(self, profile: str, language: str) -> dict[str, Any]:
        if profile == "fast":
            detector_model = settings.ocr_fast_detector_model
            recognition_model = (
                settings.ocr_fast_recognition_model_en
                if language == self._fallback_language
                else settings.ocr_fast_recognition_model_vi
            )
            flags = {
                "use_doc_orientation_classify": False,
                "use_doc_unwarping": False,
                "use_textline_orientation": False,
            }
        else:
            detector_model = settings.ocr_recovery_detector_model
            recognition_model = (
                settings.ocr_recovery_recognition_model_en
                if language == self._fallback_language
                else settings.ocr_recovery_recognition_model_vi
            )
            flags = {
                "use_doc_orientation_classify": True,
                "use_doc_unwarping": True,
                "use_textline_orientation": True,
            }

        return {
            "profile": profile,
            "language": language,
            "text_detection_model_name": detector_model,
            "text_recognition_model_name": recognition_model,
            "doc_orientation_classify_model_name": "PP-LCNet_x1_0_doc_ori",
            "doc_unwarping_model_name": "UVDoc",
            "textline_orientation_model_name": "PP-LCNet_x1_0_textline_ori",
            "limit_side_len": 1536 if profile == "fast" else 2048,
            "enable_mkldnn": settings.ocr_enable_mkldnn,
            "cpu_threads": settings.ocr_cpu_threads,
            **flags,
        }

    def _create_ocr(self, *, use_gpu: bool, config: dict[str, Any]) -> PaddleOCR:
        return PaddleOCR(
            lang=config["language"],
            device="gpu" if use_gpu else "cpu",
            text_detection_model_name=config["text_detection_model_name"],
            text_recognition_model_name=config["text_recognition_model_name"],
            doc_orientation_classify_model_name=config["doc_orientation_classify_model_name"],
            doc_unwarping_model_name=config["doc_unwarping_model_name"],
            textline_orientation_model_name=config["textline_orientation_model_name"],
            use_doc_orientation_classify=config["use_doc_orientation_classify"],
            use_doc_unwarping=config["use_doc_unwarping"],
            use_textline_orientation=config["use_textline_orientation"],
            text_det_limit_side_len=config["limit_side_len"],
            enable_mkldnn=config["enable_mkldnn"],
            cpu_threads=config["cpu_threads"],
        )

    def _build_ocr_engines(self) -> str:
        device = self._runtime_info["requested_device"]
        if device not in {"auto", "gpu", "cpu"}:
            raise ValueError(f"Unsupported OCR_DEVICE '{settings.ocr_device}'")

        primary_language = (settings.ocr_primary_language or settings.ocr_language or "vi").strip().lower()
        fallback_language = (settings.ocr_fallback_language or "en").strip().lower()
        if primary_language == fallback_language:
            fallback_language = "en" if primary_language != "en" else "vi"

        self._primary_language = primary_language
        self._fallback_language = fallback_language
        for profile in ("fast", "recovery"):
            self._engine_configs[profile]["primary"] = self._build_profile_options(profile, self._primary_language)
            self._engine_configs[profile]["fallback"] = self._build_profile_options(profile, self._fallback_language)

        if device == "cpu":
            self._runtime_info["actual_device"] = "cpu"
            logger.info(
                "Prepared PaddleOCR runtime on CPU (primary=%s fallback=%s)",
                primary_language,
                fallback_language,
            )
            return "cpu"

        gpu_available = bool(self._runtime_info["compiled_with_cuda"]) and int(self._runtime_info["cuda_device_count"]) > 0
        if not gpu_available:
            logger.info(
                "GPU OCR requested but CUDA runtime is unavailable; using CPU "
                "(compiled_with_cuda=%s device_count=%s cuda_visible_devices=%s nvidia_visible_devices=%s)",
                self._runtime_info["compiled_with_cuda"],
                self._runtime_info["cuda_device_count"],
                self._runtime_info["cuda_visible_devices"],
                self._runtime_info["nvidia_visible_devices"],
            )
            self._runtime_info["actual_device"] = "cpu"
            logger.info(
                "Prepared PaddleOCR runtime on CPU (primary=%s fallback=%s)",
                primary_language,
                fallback_language,
            )
            return "cpu"

        try:
            self._runtime_info["actual_device"] = "gpu"
            logger.info(
                "Prepared PaddleOCR runtime on GPU (primary=%s fallback=%s)",
                primary_language,
                fallback_language,
            )
            return "gpu"
        except Exception as exc:
            if device == "gpu":
                logger.warning("PaddleOCR GPU initialization failed, falling back to CPU: %s", exc)
            else:
                logger.info("PaddleOCR GPU not available, using CPU fallback: %s", exc)
            self._runtime_info["actual_device"] = "cpu"
            logger.info(
                "Prepared PaddleOCR runtime on CPU (primary=%s fallback=%s)",
                primary_language,
                fallback_language,
            )
            return "cpu"

    def _get_engine(self, profile: str, role: str) -> tuple[PaddleOCR, dict[str, Any]]:
        cached = self._engines[profile].get(role)
        config = self._engine_configs[profile][role]
        if cached is not None:
            return cached, config

        use_gpu = self._device == "gpu"
        try:
            engine = self._create_ocr(use_gpu=use_gpu, config=config)
        except Exception as exc:
            if use_gpu:
                logger.warning(
                    "OCR engine initialization failed on GPU for profile=%s role=%s; retrying on CPU: %s",
                    profile,
                    role,
                    exc,
                )
                self._device = "cpu"
                self._runtime_info["actual_device"] = "cpu"
                engine = self._create_ocr(use_gpu=False, config=config)
            else:
                raise

        self._engines[profile][role] = engine
        logger.info(
            "Configured OCR engine profile=%s role=%s device=%s det=%s rec=%s doc_orientation=%s unwarp=%s textline_orientation=%s limit_side_len=%s",
            profile,
            role,
            self._device,
            config["text_detection_model_name"],
            config["text_recognition_model_name"],
            config["use_doc_orientation_classify"],
            config["use_doc_unwarping"],
            config["use_textline_orientation"],
            config["limit_side_len"],
        )
        return engine, config

    @property
    def device(self) -> str:
        return self._device

    def runtime_info(self) -> dict[str, Any]:
        return dict(self._runtime_info)

    def _extract_from_engine(self, engine: PaddleOCR, image_path: str, *, config: dict[str, Any]) -> dict[str, object]:
        image = str(Path(image_path))
        result = engine.predict(image)

        lines: list[str] = []
        confidences: list[float] = []
        detected_box_count = 0

        for item in result or []:
            if isinstance(item, dict):
                payload = item.get("res") if "res" in item else item
            else:
                payload = getattr(item, "res", None) or item
            if not payload:
                continue

            texts = payload.get("rec_texts", []) if isinstance(payload, dict) else []
            scores = payload.get("rec_scores", []) if isinstance(payload, dict) else []
            boxes = payload.get("dt_polys", []) if isinstance(payload, dict) else []
            if boxes:
                detected_box_count += len(boxes)
            elif texts:
                detected_box_count += len(texts)

            for index, text in enumerate(texts):
                normalized = str(text).strip()
                if not normalized:
                    continue
                lines.append(normalized)
                confidences.append(float(scores[index]) if index < len(scores) else 0.0)

        average_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        low_quality_lines = sum(1 for line in lines if estimate_low_quality(line))
        low_quality_ratio = (low_quality_lines / len(lines)) if lines else 0.0
        short_line_ratio = (
            sum(1 for line in lines if len(line.strip()) <= 4) / len(lines)
            if lines
            else 1.0
        )
        return {
            "lines": lines,
            "confidences": confidences,
            "confidence": average_confidence,
            "low_quality_ratio": low_quality_ratio,
            "line_count": len(lines),
            "detected_box_count": detected_box_count,
            "short_line_ratio": round(short_line_ratio, 4),
            "engine_config": {
                "profile": config["profile"],
                "language": config["language"],
                "device": self.device,
                "text_detection_model_name": config["text_detection_model_name"],
                "text_recognition_model_name": config["text_recognition_model_name"],
                "limit_side_len": config["limit_side_len"],
                "use_doc_orientation_classify": config["use_doc_orientation_classify"],
                "use_doc_unwarping": config["use_doc_unwarping"],
                "use_textline_orientation": config["use_textline_orientation"],
            },
        }

    def _needs_fallback(self, primary_result: dict[str, object]) -> bool:
        confidence = float(primary_result.get("confidence") or 0.0)
        low_quality_ratio = float(primary_result.get("low_quality_ratio") or 0.0)
        too_low_confidence = confidence < settings.ocr_fallback_confidence_threshold
        low_quality = settings.ocr_force_fallback_on_low_quality and low_quality_ratio >= 0.35
        return too_low_confidence or low_quality

    def extract_text(self, image_path: str, *, profile: str = "recovery") -> dict[str, object]:
        selected_profile = profile if profile in self._engines else "recovery"
        primary_engine, primary_config = self._get_engine(selected_profile, "primary")
        primary_result = self._extract_from_engine(
            primary_engine,
            image_path,
            config=primary_config,
        )
        selected_result = primary_result
        selected_language = self._primary_language
        selected_config = primary_config
        used_fallback = False

        if self._needs_fallback(primary_result):
            fallback_engine, fallback_config = self._get_engine(selected_profile, "fallback")
            fallback_result = self._extract_from_engine(
                fallback_engine,
                image_path,
                config=fallback_config,
            )
            primary_score = float(primary_result.get("confidence") or 0.0) - (
                0.15 * float(primary_result.get("low_quality_ratio") or 0.0)
            )
            fallback_score = float(fallback_result.get("confidence") or 0.0) - (
                0.15 * float(fallback_result.get("low_quality_ratio") or 0.0)
            )
            if fallback_score >= primary_score:
                selected_result = fallback_result
                selected_language = self._fallback_language
                selected_config = fallback_config
                used_fallback = True

        original_lines = list(selected_result.get("lines", []))
        original_confidences = [float(score) for score in list(selected_result.get("confidences", []))]
        normalized_lines, postprocess_metadata = normalize_vietnamese_lines(original_lines, original_confidences)
        raw_text = "\n".join(normalized_lines)
        average_confidence = sum(original_confidences) / len(original_confidences) if original_confidences else 0.0

        runtime = {
            **self.runtime_info(),
            "engine_device": self.device,
            "profile": selected_profile,
            "language": selected_language,
            "text_detection_model_name": selected_config["text_detection_model_name"],
            "text_recognition_model_name": selected_config["text_recognition_model_name"],
            "limit_side_len": selected_config["limit_side_len"],
            "use_doc_orientation_classify": selected_config["use_doc_orientation_classify"],
            "use_doc_unwarping": selected_config["use_doc_unwarping"],
            "use_textline_orientation": selected_config["use_textline_orientation"],
        }

        return {
            "raw_text": raw_text,
            "lines": normalized_lines,
            "confidence": average_confidence,
            "confidences": original_confidences,
            "device": self.device,
            "provider": "paddleocr",
            "ocr_language": selected_language,
            "fallback_used": used_fallback,
            "low_quality_ratio": float(selected_result.get("low_quality_ratio") or 0.0),
            "postprocess": postprocess_metadata,
            "raw_lines_before_postprocess": original_lines,
            "profile": selected_profile,
            "line_count": int(selected_result.get("line_count") or len(normalized_lines)),
            "detected_box_count": int(selected_result.get("detected_box_count") or len(normalized_lines)),
            "short_line_ratio": float(selected_result.get("short_line_ratio") or 0.0),
            "engine_config": selected_result.get("engine_config"),
            "runtime": runtime,
        }


@lru_cache(maxsize=1)
def get_ocr_service() -> OCRService:
    return OCRService()
