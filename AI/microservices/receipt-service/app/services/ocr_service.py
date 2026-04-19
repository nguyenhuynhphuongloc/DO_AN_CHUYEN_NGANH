from __future__ import annotations

import logging
from pathlib import Path
import time
from functools import lru_cache
from typing import Any

import cv2

from app.core.config import settings
from app.services.layout_models import LayoutBlock, LayoutDetectionResult
from app.services.layout_service import get_layout_service
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


def _crop_layout_block(image: Any, block: LayoutBlock) -> Any:
    return image[block.top : block.bottom, block.left : block.right]


class OCRService:
    def __init__(self) -> None:
        self._detector = get_paddle_detector()
        self._layout_service = get_layout_service()
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

    def _build_payload(
        self,
        *,
        profile: str,
        backend: str,
        detection_runtime: dict[str, Any],
        recognition_runtime: dict[str, Any],
        ordering_metadata: dict[str, Any],
        original_lines: list[str],
        original_confidences: list[float],
        detection_seconds: float,
        crop_seconds: float,
        recognition_seconds: float,
        total_ocr_seconds: float,
        fallback_used: bool,
        detected_box_count: int,
        layout_result: LayoutDetectionResult | None = None,
    ) -> dict[str, Any]:
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
        layout_debug = layout_result.to_debug_dict() if layout_result is not None else {
            "enabled": False,
            "used": False,
            "backend": settings.ocr_layout_backend,
            "fallback_reason": None,
            "runtime": {"layout_seconds": 0.0},
            "blocks": [],
        }

        runtime = {
            **detection_runtime,
            **recognition_runtime,
            "detector_backend": "paddle",
            "recognizer_backend": backend,
            "recognizer_backend_requested": self._primary_backend,
            "recognizer_backend_fallback": self._fallback_backend or None,
            "actual_device": recognition_runtime.get("actual_device") or detection_runtime.get("actual_device"),
            "detector_device": detection_runtime.get("detector_device") or detection_runtime.get("actual_device"),
            "recognizer_device": recognition_runtime.get("recognizer_device") or recognition_runtime.get("actual_device"),
            "text_detection_model_name": detection_runtime.get("text_detection_model_name"),
            "text_recognition_model_name": recognition_runtime.get("text_recognition_model_name"),
            "recognizer_confidence_semantics": recognition_runtime.get("recognizer_confidence_semantics"),
            "recognizer_backend_caveats": recognition_runtime.get("recognizer_backend_caveats", []),
            "row_grouping": ordering_metadata,
            "detected_box_count": detected_box_count,
            "line_count": len(normalized_lines),
            "detection_seconds": round(detection_seconds, 4),
            "crop_seconds": round(crop_seconds, 4),
            "recognition_seconds": round(recognition_seconds, 4),
            "total_ocr_seconds": round(total_ocr_seconds, 4),
            "layout_enabled": layout_debug.get("enabled"),
            "layout_used": layout_debug.get("used"),
            "layout_backend": layout_debug.get("backend"),
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
            "detected_box_count": detected_box_count,
            "short_line_ratio": round(short_line_ratio, 4),
            "engine_config": {
                "profile": profile,
                "language": settings.ocr_primary_language,
                "device": runtime.get("actual_device"),
                "detector_backend": "paddle",
                "recognizer_backend": backend,
                "text_detection_model_name": detection_runtime.get("text_detection_model_name"),
                "text_recognition_model_name": recognition_runtime.get("text_recognition_model_name"),
                "row_grouping_tolerance": settings.ocr_row_grouping_tolerance,
                "recognizer_confidence_semantics": recognition_runtime.get("recognizer_confidence_semantics"),
                "layout_enabled": layout_debug.get("enabled"),
                "layout_used": layout_debug.get("used"),
            },
            "runtime": runtime,
            "ordering": ordering_metadata,
            "layout": layout_debug,
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

    def _whole_image_payload(
        self,
        image: Any,
        *,
        profile: str,
        backend: str,
        layout_result: LayoutDetectionResult | None = None,
    ) -> dict[str, Any]:
        detection_start = time.perf_counter()
        detection = self._detector.detect(image, profile=profile)
        detection_seconds = time.perf_counter() - detection_start

        ordered_boxes, row_grouping = sort_boxes_into_rows(
            detection.boxes,
            tolerance_factor=settings.ocr_row_grouping_tolerance,
        )
        ordering_metadata = {
            **row_grouping,
            "ordered_box_indices": [box.index for box in ordered_boxes],
        }
        recognition, recognition_metrics = self._recognition_runtime(
            profile=profile,
            backend=backend,
            image=image,
            ordered_boxes=ordered_boxes,
            order_metadata=ordering_metadata,
        )
        original_lines = [line.text for line in recognition.lines if line.text.strip()]
        original_confidences = [line.confidence for line in recognition.lines if line.text.strip()]
        recognition_runtime = {
            **recognition.runtime,
            "recognizer_confidence_semantics": recognition.confidence_semantics,
            "recognizer_backend_caveats": [
                *recognition.backend_caveats,
                "fallback_used_refers_to_recognizer_backend_selection",
            ],
        }
        total = detection_seconds + float(recognition_metrics["crop_seconds"]) + float(recognition_metrics["recognition_seconds"])
        return self._build_payload(
            profile=profile,
            backend=backend,
            detection_runtime=detection.runtime,
            recognition_runtime=recognition_runtime,
            ordering_metadata=ordering_metadata,
            original_lines=original_lines,
            original_confidences=original_confidences,
            detection_seconds=detection_seconds,
            crop_seconds=float(recognition_metrics["crop_seconds"]),
            recognition_seconds=float(recognition_metrics["recognition_seconds"]),
            total_ocr_seconds=total,
            fallback_used=False,
            detected_box_count=len(ordering_metadata.get("ordered_box_indices", [])),
            layout_result=layout_result,
        )

    def _layout_payload(self, image: Any, *, profile: str, backend: str, layout_result: LayoutDetectionResult) -> dict[str, Any]:
        all_lines: list[str] = []
        all_confidences: list[float] = []
        total_detection_seconds = 0.0
        total_crop_seconds = 0.0
        total_recognition_seconds = 0.0
        total_detected_boxes = 0
        ordering_entries: list[dict[str, Any]] = []
        layout_blocks_debug: list[dict[str, Any]] = []
        detection_runtime = dict(getattr(self._detector, "_runtime", {}))
        recognition_runtime: dict[str, Any] = {}

        for order_index, block in enumerate(layout_result.blocks):
            block_image = _crop_layout_block(image, block)
            if block_image is None or getattr(block_image, "size", 0) == 0:
                continue
            detection_start = time.perf_counter()
            detection = self._detector.detect(block_image, profile=profile)
            block_detection_seconds = time.perf_counter() - detection_start
            total_detection_seconds += block_detection_seconds
            detection_runtime = detection.runtime

            ordered_boxes, row_grouping = sort_boxes_into_rows(
                detection.boxes,
                tolerance_factor=settings.ocr_row_grouping_tolerance,
            )
            recognition, metrics = self._recognition_runtime(
                profile=profile,
                backend=backend,
                image=block_image,
                ordered_boxes=ordered_boxes,
                order_metadata=row_grouping,
            )
            total_crop_seconds += float(metrics["crop_seconds"])
            total_recognition_seconds += float(metrics["recognition_seconds"])
            total_detected_boxes += len(ordered_boxes)

            block_lines = [line.text for line in recognition.lines if line.text.strip()]
            block_confidences = [line.confidence for line in recognition.lines if line.text.strip()]
            start_index = len(all_lines)
            all_lines.extend(block_lines)
            all_confidences.extend(block_confidences)
            end_index = len(all_lines)

            ordering_entries.append(
                {
                    "layout_block_index": order_index,
                    "label": block.label,
                    "raw_label": block.raw_label,
                    "row_grouping": row_grouping,
                    "ordered_box_indices": [box.index for box in ordered_boxes],
                }
            )
            layout_blocks_debug.append(
                {
                    **block.to_debug_dict(),
                    "ocr_line_count": len(block_lines),
                    "ocr_text": "\n".join(block_lines),
                    "ocr_timings": {
                        "detection_seconds": round(block_detection_seconds, 4),
                        "crop_seconds": round(float(metrics["crop_seconds"]), 4),
                        "recognition_seconds": round(float(metrics["recognition_seconds"]), 4),
                    },
                    "line_indices": list(range(start_index, end_index)),
                }
            )
            recognition_runtime = {
                **recognition.runtime,
                "recognizer_confidence_semantics": recognition.confidence_semantics,
                "recognizer_backend_caveats": [
                    *recognition.backend_caveats,
                    "fallback_used_refers_to_recognizer_backend_selection",
                ],
            }

        layout_debug = LayoutDetectionResult(
            enabled=layout_result.enabled,
            used=layout_result.used,
            backend=layout_result.backend,
            blocks=layout_result.blocks,
            runtime={
                **layout_result.runtime,
                "layout_seconds": layout_result.runtime.get("layout_seconds", 0.0),
            },
            raw_detections_count=layout_result.raw_detections_count,
            postprocessed_block_count=layout_result.postprocessed_block_count,
            debug_image_path=layout_result.debug_image_path,
            fallback_reason=layout_result.fallback_reason,
        ).to_debug_dict()
        layout_debug["blocks"] = layout_blocks_debug
        ordering_metadata = {
            "layout_block_order": ordering_entries,
            "row_grouping_tolerance": settings.ocr_row_grouping_tolerance,
        }
        total_ocr_seconds = (
            float(layout_result.runtime.get("layout_seconds", 0.0))
            + total_detection_seconds
            + total_crop_seconds
            + total_recognition_seconds
        )
        return self._build_payload(
            profile=profile,
            backend=backend,
            detection_runtime=detection_runtime,
            recognition_runtime=recognition_runtime,
            ordering_metadata=ordering_metadata,
            original_lines=all_lines,
            original_confidences=all_confidences,
            detection_seconds=total_detection_seconds,
            crop_seconds=total_crop_seconds,
            recognition_seconds=total_recognition_seconds,
            total_ocr_seconds=total_ocr_seconds,
            fallback_used=False,
            detected_box_count=total_detected_boxes,
            layout_result=LayoutDetectionResult(
                enabled=layout_result.enabled,
                used=layout_result.used,
                backend=layout_result.backend,
                blocks=layout_result.blocks,
                runtime={**layout_result.runtime, "layout_seconds": layout_result.runtime.get("layout_seconds", 0.0)},
                raw_detections_count=layout_result.raw_detections_count,
                postprocessed_block_count=layout_result.postprocessed_block_count,
                debug_image_path=layout_result.debug_image_path,
                fallback_reason=layout_result.fallback_reason,
            ),
        )

    def extract_text(self, image_path: str, *, profile: str = "recovery", debug_tag: str | None = None) -> dict[str, Any]:
        selected_profile = profile if profile in {"fast", "recovery"} else "recovery"
        image = cv2.imread(str(Path(image_path)))
        if image is None:
            raise ValueError("Unable to read receipt image for OCR")

        effective_debug_tag = debug_tag or Path(image_path).stem
        layout_result = self._layout_service.detect(image, profile=selected_profile, debug_tag=effective_debug_tag)
        logger.info(
            "Layout decision profile=%s used=%s fallback_reason=%s raw=%s postprocessed=%s debug_image=%s",
            selected_profile,
            layout_result.used,
            layout_result.fallback_reason,
            layout_result.raw_detections_count,
            layout_result.postprocessed_block_count,
            layout_result.debug_image_path,
        )
        if layout_result.blocks:
            logger.info(
                "Final layout blocks profile=%s blocks=%s",
                selected_profile,
                [
                    {
                        "index": block.index,
                        "label": block.label,
                        "raw_label": block.raw_label,
                        "bbox": list(block.bbox),
                        "confidence": round(float(block.confidence), 4),
                    }
                    for block in layout_result.blocks
                ],
            )
        primary_result = (
            self._layout_payload(image, profile=selected_profile, backend=self._primary_backend, layout_result=layout_result)
            if layout_result.used
            else self._whole_image_payload(image, profile=selected_profile, backend=self._primary_backend, layout_result=layout_result)
        )

        if not self._should_use_fallback(primary_result):
            logger.info(
                "OCR profile=%s detector=paddle recognizer=%s layout_used=%s device=%s boxes=%s lines=%s timings=%s",
                selected_profile,
                self._primary_backend,
                (primary_result.get("layout") or {}).get("used"),
                primary_result.get("device"),
                primary_result.get("detected_box_count"),
                primary_result.get("line_count"),
                primary_result.get("runtime"),
            )
            return primary_result

        fallback_backend = self._fallback_backend
        fallback_result = (
            self._layout_payload(image, profile=selected_profile, backend=fallback_backend, layout_result=layout_result)
            if layout_result.used
            else self._whole_image_payload(image, profile=selected_profile, backend=fallback_backend, layout_result=layout_result)
        )
        fallback_result["fallback_used"] = True
        selected_result = self._compare_results(primary_result, fallback_result)
        if selected_result is fallback_result:
            selected_result["fallback_used"] = True
        logger.info(
            "OCR profile=%s detector=paddle primary=%s fallback=%s selected=%s layout_used=%s device=%s boxes=%s lines=%s timings=%s",
            selected_profile,
            self._primary_backend,
            fallback_backend,
            selected_result["engine_config"]["recognizer_backend"],
            (selected_result.get("layout") or {}).get("used"),
            selected_result.get("device"),
            selected_result.get("detected_box_count"),
            selected_result.get("line_count"),
            selected_result.get("runtime"),
        )
        return selected_result


@lru_cache(maxsize=1)
def get_ocr_service() -> OCRService:
    return OCRService()
