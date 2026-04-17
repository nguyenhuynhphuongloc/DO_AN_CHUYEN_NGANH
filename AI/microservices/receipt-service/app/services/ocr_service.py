from __future__ import annotations

import logging
import time
from functools import lru_cache
from pathlib import Path
from typing import Any

import cv2

from app.core.config import settings
from app.services.ocr_pipeline import (
    DetectionResult,
    RecognitionBatchResult,
    extract_crops,
    get_paddle_detector,
    get_paddle_recognizer,
    get_vietocr_recognizer,
    sort_boxes_into_rows,
)
from app.services.ocr_postprocess import estimate_low_quality, normalize_vietnamese_lines

logger = logging.getLogger(__name__)

SUPPORTED_RECOGNIZER_BACKENDS = {"vietocr", "paddle"}


class OCRService:
    def __init__(self) -> None:
        self._detector = get_paddle_detector()
        self._recognizers = {
            "paddle": get_paddle_recognizer(),
            "vietocr": get_vietocr_recognizer(),
        }
        self._primary_backend = self._normalize_backend(settings.ocr_recognizer_backend, default="paddle")
        self._fallback_backend = self._normalize_backend(settings.ocr_fallback_recognizer_backend, default="")
        if self._fallback_backend == self._primary_backend:
            self._fallback_backend = ""

    def _normalize_backend(self, backend: str | None, *, default: str) -> str:
        candidate = (backend or default).strip().lower()
        if candidate in SUPPORTED_RECOGNIZER_BACKENDS:
            return candidate
        if candidate:
            logger.warning("Unsupported OCR recognizer backend '%s'; using '%s'", candidate, default or "none")
        return default

    def _get_recognizer(self, backend: str):
        recognizer = self._recognizers.get(backend)
        if recognizer is None:
            raise ValueError(f"Unsupported recognizer backend '{backend}'")
        return recognizer

    def runtime_info(self) -> dict[str, Any]:
        detector_runtime = dict(getattr(self._detector, "_runtime", {}))
        detector_runtime["detector_backend"] = "paddle"
        detector_runtime["recognizer_backend"] = self._primary_backend
        return detector_runtime

    def _recognition_runtime(
        self,
        *,
        profile: str,
        backend: str,
        image: Any,
        ordered_boxes: list,
        order_metadata: dict[str, Any],
    ) -> tuple[RecognitionBatchResult, dict[str, Any]]:
        crop_start = time.perf_counter()
        crops = extract_crops(image, ordered_boxes)
        crop_seconds = time.perf_counter() - crop_start

        recognition_start = time.perf_counter()
        recognition = self._get_recognizer(backend).recognize(crops, profile=profile)
        recognition_seconds = time.perf_counter() - recognition_start

        runtime = {
            "crop_seconds": round(crop_seconds, 4),
            "recognition_seconds": round(recognition_seconds, 4),
            "crop_count": len(crops),
            "row_grouping": order_metadata,
        }
        return recognition, runtime

    def _build_result_payload(
        self,
        *,
        profile: str,
        backend: str,
        detection: DetectionResult,
        recognition: RecognitionBatchResult,
        ordering_metadata: dict[str, Any],
        detection_seconds: float,
        crop_seconds: float,
        recognition_seconds: float,
        total_ocr_seconds: float,
        fallback_used: bool,
    ) -> dict[str, Any]:
        original_lines = [line.text for line in recognition.lines if line.text.strip()]
        original_confidences = [line.confidence for line in recognition.lines if line.text.strip()]
        normalized_lines, postprocess_metadata = normalize_vietnamese_lines(original_lines, original_confidences)
        raw_text = "\n".join(normalized_lines)
        average_confidence = (
            sum(original_confidences) / len(original_confidences) if original_confidences else 0.0
        )
        low_quality_lines = sum(1 for line in original_lines if estimate_low_quality(line))
        low_quality_ratio = (low_quality_lines / len(original_lines)) if original_lines else 1.0
        short_line_ratio = (
            sum(1 for line in original_lines if len(line.strip()) <= 4) / len(original_lines)
            if original_lines
            else 1.0
        )

        runtime = {
            **detection.runtime,
            **recognition.runtime,
            "detector_backend": "paddle",
            "recognizer_backend": backend,
            "recognizer_backend_requested": self._primary_backend,
            "recognizer_backend_fallback": self._fallback_backend or None,
            "actual_device": recognition.runtime.get("actual_device") or detection.runtime.get("actual_device"),
            "detector_device": detection.runtime.get("detector_device") or detection.runtime.get("actual_device"),
            "recognizer_device": recognition.runtime.get("recognizer_device") or recognition.runtime.get("actual_device"),
            "text_detection_model_name": detection.runtime.get("text_detection_model_name"),
            "text_recognition_model_name": recognition.runtime.get("text_recognition_model_name"),
            "recognizer_confidence_semantics": recognition.confidence_semantics,
            "recognizer_backend_caveats": [
                *recognition.backend_caveats,
                "fallback_used_refers_to_recognizer_backend_selection",
            ],
            "row_grouping": ordering_metadata,
            "detected_box_count": len(ordering_metadata.get("ordered_box_indices", [])),
            "line_count": len(normalized_lines),
            "detection_seconds": round(detection_seconds, 4),
            "crop_seconds": round(crop_seconds, 4),
            "recognition_seconds": round(recognition_seconds, 4),
            "total_ocr_seconds": round(total_ocr_seconds, 4),
        }

        return {
            "raw_text": raw_text,
            "lines": normalized_lines,
            "confidence": average_confidence,
            "confidences": original_confidences,
            "device": runtime.get("actual_device"),
            "provider": "paddleocr" if backend == "paddle" else "paddleocr+vietocr",
            "ocr_language": settings.ocr_primary_language,
            "fallback_used": fallback_used,
            "low_quality_ratio": low_quality_ratio,
            "postprocess": postprocess_metadata,
            "raw_lines_before_postprocess": original_lines,
            "profile": profile,
            "line_count": len(normalized_lines),
            "detected_box_count": len(ordering_metadata.get("ordered_box_indices", [])),
            "short_line_ratio": round(short_line_ratio, 4),
            "engine_config": {
                "profile": profile,
                "language": settings.ocr_primary_language,
                "device": runtime.get("actual_device"),
                "detector_backend": "paddle",
                "recognizer_backend": backend,
                "text_detection_model_name": detection.runtime.get("text_detection_model_name"),
                "text_recognition_model_name": recognition.runtime.get("text_recognition_model_name"),
                "row_grouping_tolerance": settings.ocr_row_grouping_tolerance,
                "recognizer_confidence_semantics": recognition.confidence_semantics,
            },
            "runtime": runtime,
            "ordering": ordering_metadata,
        }

    def _should_use_fallback(self, result: dict[str, Any]) -> bool:
        if not self._fallback_backend:
            return False
        confidence = float(result.get("confidence") or 0.0)
        line_count = int(result.get("line_count") or 0)
        low_quality_ratio = float(result.get("low_quality_ratio") or 0.0)
        no_text = not str(result.get("raw_text") or "").strip()
        return (
            no_text
            or line_count == 0
            or confidence < settings.ocr_fallback_confidence_threshold
            or (
                settings.ocr_force_fallback_on_low_quality
                and low_quality_ratio >= settings.ocr_fast_low_quality_threshold
            )
        )

    def _compare_results(self, primary: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
        primary_score = float(primary.get("confidence") or 0.0) - (0.15 * float(primary.get("low_quality_ratio") or 0.0))
        fallback_score = float(fallback.get("confidence") or 0.0) - (0.15 * float(fallback.get("low_quality_ratio") or 0.0))
        return fallback if fallback_score >= primary_score else primary

    def extract_text(self, image_path: str, *, profile: str = "recovery") -> dict[str, Any]:
        selected_profile = profile if profile in {"fast", "recovery"} else "recovery"
        image = cv2.imread(str(Path(image_path)))
        if image is None:
            raise ValueError("Unable to read receipt image for OCR")

        detection_start = time.perf_counter()
        detection = self._detector.detect(image, profile=selected_profile)
        detection_seconds = time.perf_counter() - detection_start

        ordered_boxes, row_grouping = sort_boxes_into_rows(
            detection.boxes,
            tolerance_factor=settings.ocr_row_grouping_tolerance,
        )
        ordering_metadata = {
            **row_grouping,
            "ordered_box_indices": [box.index for box in ordered_boxes],
        }

        primary_recognition, primary_metrics = self._recognition_runtime(
            profile=selected_profile,
            backend=self._primary_backend,
            image=image,
            ordered_boxes=ordered_boxes,
            order_metadata=ordering_metadata,
        )
        primary_total = detection_seconds + float(primary_metrics["crop_seconds"]) + float(primary_metrics["recognition_seconds"])
        primary_result = self._build_result_payload(
            profile=selected_profile,
            backend=self._primary_backend,
            detection=detection,
            recognition=primary_recognition,
            ordering_metadata=ordering_metadata,
            detection_seconds=detection_seconds,
            crop_seconds=float(primary_metrics["crop_seconds"]),
            recognition_seconds=float(primary_metrics["recognition_seconds"]),
            total_ocr_seconds=primary_total,
            fallback_used=False,
        )

        if not self._should_use_fallback(primary_result):
            logger.info(
                "OCR profile=%s detector=paddle recognizer=%s device=%s boxes=%s lines=%s timings={det=%.4f crop=%.4f rec=%.4f total=%.4f}",
                selected_profile,
                self._primary_backend,
                primary_result.get("device"),
                primary_result.get("detected_box_count"),
                primary_result.get("line_count"),
                detection_seconds,
                float(primary_metrics["crop_seconds"]),
                float(primary_metrics["recognition_seconds"]),
                primary_total,
            )
            return primary_result

        fallback_backend = self._fallback_backend
        fallback_recognition, fallback_metrics = self._recognition_runtime(
            profile=selected_profile,
            backend=fallback_backend,
            image=image,
            ordered_boxes=ordered_boxes,
            order_metadata=ordering_metadata,
        )
        fallback_total = detection_seconds + float(fallback_metrics["crop_seconds"]) + float(fallback_metrics["recognition_seconds"])
        fallback_result = self._build_result_payload(
            profile=selected_profile,
            backend=fallback_backend,
            detection=detection,
            recognition=fallback_recognition,
            ordering_metadata=ordering_metadata,
            detection_seconds=detection_seconds,
            crop_seconds=float(fallback_metrics["crop_seconds"]),
            recognition_seconds=float(fallback_metrics["recognition_seconds"]),
            total_ocr_seconds=fallback_total,
            fallback_used=True,
        )
        selected_result = self._compare_results(primary_result, fallback_result)
        if selected_result is fallback_result:
            selected_result["fallback_used"] = True
        logger.info(
            "OCR profile=%s detector=paddle primary=%s fallback=%s selected=%s device=%s boxes=%s lines=%s timings=%s",
            selected_profile,
            self._primary_backend,
            fallback_backend,
            selected_result["engine_config"]["recognizer_backend"],
            selected_result.get("device"),
            selected_result.get("detected_box_count"),
            selected_result.get("line_count"),
            selected_result.get("runtime"),
        )
        return selected_result


@lru_cache(maxsize=1)
def get_ocr_service() -> OCRService:
    return OCRService()
