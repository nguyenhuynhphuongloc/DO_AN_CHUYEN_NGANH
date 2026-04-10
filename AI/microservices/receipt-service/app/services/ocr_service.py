from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path

import paddle

from app.core.config import settings

from paddleocr import PaddleOCR

logger = logging.getLogger(__name__)


class OCRService:
    def __init__(self) -> None:
        self._device = self._build_ocr()

    def _create_ocr(self, *, use_gpu: bool) -> PaddleOCR:
        return PaddleOCR(
            lang=settings.ocr_language,
            device="gpu" if use_gpu else "cpu",
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
            enable_mkldnn=settings.ocr_enable_mkldnn,
            cpu_threads=settings.ocr_cpu_threads,
        )

    def _build_ocr(self) -> str:
        device = settings.ocr_device.strip().lower()
        if device not in {"auto", "gpu", "cpu"}:
            raise ValueError(f"Unsupported OCR_DEVICE '{settings.ocr_device}'")

        if device == "cpu":
            self._ocr = self._create_ocr(use_gpu=False)
            logger.info("Initialized PaddleOCR on CPU")
            return "cpu"

        gpu_available = bool(paddle.is_compiled_with_cuda()) and paddle.device.cuda.device_count() > 0
        if not gpu_available:
            logger.info("GPU OCR requested but CUDA runtime is unavailable; using CPU")
            self._ocr = self._create_ocr(use_gpu=False)
            logger.info("Initialized PaddleOCR on CPU")
            return "cpu"

        try:
            self._ocr = self._create_ocr(use_gpu=True)
            logger.info("Initialized PaddleOCR on GPU")
            return "gpu"
        except Exception as exc:
            if device == "gpu":
                logger.warning("PaddleOCR GPU initialization failed, falling back to CPU: %s", exc)
            else:
                logger.info("PaddleOCR GPU not available, using CPU fallback: %s", exc)
            self._ocr = self._create_ocr(use_gpu=False)
            logger.info("Initialized PaddleOCR on CPU")
            return "cpu"

    @property
    def device(self) -> str:
        return self._device

    def extract_text(self, image_path: str) -> dict[str, str | list[str] | float | list[float]]:
        image = str(Path(image_path))
        result = self._ocr.predict(image)

        lines: list[str] = []
        confidences: list[float] = []

        for item in result or []:
            if isinstance(item, dict):
                payload = item.get("res") if "res" in item else item
            else:
                payload = getattr(item, "res", None) or item
            if not payload:
                continue

            texts = payload.get("rec_texts", []) if isinstance(payload, dict) else []
            scores = payload.get("rec_scores", []) if isinstance(payload, dict) else []
            for index, text in enumerate(texts):
                normalized = str(text).strip()
                if not normalized:
                    continue
                lines.append(normalized)
                confidences.append(float(scores[index]) if index < len(scores) else 0.0)

        raw_text = "\n".join(lines)
        average_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        return {
            "raw_text": raw_text,
            "lines": lines,
            "confidence": average_confidence,
            "confidences": confidences,
            "device": self.device,
            "provider": "paddleocr",
        }


@lru_cache(maxsize=1)
def get_ocr_service() -> OCRService:
    return OCRService()
