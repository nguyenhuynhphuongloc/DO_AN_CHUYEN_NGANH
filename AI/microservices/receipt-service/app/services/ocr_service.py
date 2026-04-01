from __future__ import annotations

import logging
import re
import unicodedata
from functools import lru_cache
from pathlib import Path
from typing import Any

import paddle
from paddleocr import PaddleOCR

from app.core.config import settings

OCR_LANGUAGE_FALLBACKS = ("en",)
logger = logging.getLogger(__name__)


def _normalize_ocr_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.casefold())
    stripped = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    stripped = stripped.replace("đ", "d").replace("Đ", "d")
    stripped = re.sub(r"[^a-z0-9\s]", " ", stripped)
    return re.sub(r"\s+", " ", stripped).strip()


class OCRService:
    def __init__(self) -> None:
        self._selected_lang = OCR_LANGUAGE_FALLBACKS[0]
        self._selected_device = "cpu"
        self._ocr = self._build_ocr()

    def _candidate_devices(self) -> list[str]:
        preferred = settings.receipt_ocr_device.strip().lower()
        if preferred == "auto":
            devices = ["gpu:0", "cpu"]
        elif preferred:
            devices = [preferred]
            if preferred != "cpu" and settings.receipt_ocr_allow_cpu_fallback:
                devices.append("cpu")
        else:
            devices = ["cpu"]
        return devices

    def _device_is_supported(self, device: str) -> bool:
        normalized = device.strip().lower()
        if not normalized.startswith("gpu"):
            return True

        if not paddle.device.is_compiled_with_cuda():
            logger.warning("Skipping PaddleOCR device=%s because Paddle is not compiled with CUDA", device)
            return False

        gpu_count = paddle.device.cuda.device_count()
        if gpu_count < 1:
            logger.warning("Skipping PaddleOCR device=%s because no CUDA device is available", device)
            return False

        if ":" in normalized:
            try:
                index = int(normalized.split(":", 1)[1])
            except ValueError:
                logger.warning("Skipping PaddleOCR device=%s because the GPU index is invalid", device)
                return False
            if index < 0 or index >= gpu_count:
                logger.warning("Skipping PaddleOCR device=%s because only %s CUDA device(s) are visible", device, gpu_count)
                return False

        return True

    def _build_ocr(self) -> PaddleOCR:
        last_error: Exception | None = None
        for device in self._candidate_devices():
            if not self._device_is_supported(device):
                continue
            for lang in OCR_LANGUAGE_FALLBACKS:
                try:
                    ocr = PaddleOCR(
                        lang=lang,
                        device=device,
                        use_doc_orientation_classify=True,
                        use_doc_unwarping=True,
                        use_textline_orientation=True,
                        enable_hpi=settings.receipt_ocr_enable_hpi,
                        precision=settings.receipt_ocr_precision,
                        enable_mkldnn=settings.receipt_ocr_enable_mkldnn,
                        cpu_threads=settings.receipt_ocr_cpu_threads,
                    )
                    self._selected_lang = lang
                    self._selected_device = device
                    logger.info("Initialized PaddleOCR with device=%s lang=%s", device, lang)
                    return ocr
                except Exception as exc:  # pragma: no cover - depends on local OCR runtime
                    last_error = exc
                    logger.warning("Failed to initialize PaddleOCR with device=%s lang=%s: %s", device, lang, exc)

        raise RuntimeError("Unable to initialize PaddleOCR with a supported language") from last_error

    def _coerce_payload(self, item: Any) -> dict[str, Any]:
        if isinstance(item, dict):
            payload = item.get("res") if "res" in item else item
        else:
            payload = getattr(item, "res", None) or item
        return payload if isinstance(payload, dict) else {}

    def _summarize_doc_preprocessor(self, payload: dict[str, Any]) -> dict[str, Any]:
        summary: dict[str, Any] = {}
        for key, value in payload.items():
            if key.endswith("_img") and hasattr(value, "shape"):
                summary[key] = {
                    "shape": list(value.shape),
                    "dtype": str(getattr(value, "dtype", "")),
                }
            elif hasattr(value, "tolist"):
                summary[key] = value.tolist()
            else:
                summary[key] = value
        return summary

    def extract_text(self, image_path: str) -> dict[str, Any]:
        image = str(Path(image_path))
        result = self._ocr.predict(image)

        lines: list[str] = []
        normalized_lines: list[str] = []
        confidences: list[float] = []
        line_details: list[dict[str, Any]] = []
        doc_preprocessor: dict[str, Any] | None = None

        for item in result or []:
            payload = self._coerce_payload(item)
            if not payload:
                continue

            if doc_preprocessor is None and isinstance(payload.get("doc_preprocessor_res"), dict):
                doc_preprocessor = self._summarize_doc_preprocessor(payload["doc_preprocessor_res"])

            texts = payload.get("rec_texts", [])
            scores = payload.get("rec_scores", [])
            boxes = payload.get("rec_boxes", [])
            textline_angles = payload.get("textline_orientation_angles", [])

            for index, text in enumerate(texts):
                normalized = str(text).strip()
                if not normalized:
                    continue

                confidence = float(scores[index]) if index < len(scores) else 0.0
                box = boxes[index].tolist() if index < len(boxes) and hasattr(boxes[index], "tolist") else boxes[index] if index < len(boxes) else None
                angle = float(textline_angles[index]) if index < len(textline_angles) else None

                lines.append(normalized)
                ascii_text = _normalize_ocr_text(normalized)
                if ascii_text:
                    normalized_lines.append(ascii_text)
                confidences.append(confidence)
                line_details.append(
                    {
                        "text": normalized,
                        "normalized_text": ascii_text,
                        "confidence": confidence,
                        "box": box,
                        "angle": angle,
                    }
                )

        raw_text = "\n".join(lines)
        normalized_text = "\n".join(normalized_lines)
        average_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        return {
            "raw_text": raw_text,
            "lines": lines,
            "normalized_text": normalized_text,
            "normalized_lines": normalized_lines,
            "confidence": average_confidence,
            "confidences": confidences,
            "line_details": line_details,
            "doc_preprocessor": doc_preprocessor,
            "model_lang": self._selected_lang,
            "model_device": self._selected_device,
        }


@lru_cache(maxsize=1)
def get_ocr_service() -> OCRService:
    return OCRService()
