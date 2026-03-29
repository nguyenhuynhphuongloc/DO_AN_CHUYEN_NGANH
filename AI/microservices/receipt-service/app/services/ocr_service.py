from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from paddleocr import PaddleOCR


class OCRService:
    def __init__(self) -> None:
        self._ocr = PaddleOCR(
            lang="en",
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
            enable_mkldnn=False,
            cpu_threads=2,
        )

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
        }


@lru_cache(maxsize=1)
def get_ocr_service() -> OCRService:
    return OCRService()
