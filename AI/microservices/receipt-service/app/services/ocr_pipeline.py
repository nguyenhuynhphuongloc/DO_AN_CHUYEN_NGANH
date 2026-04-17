from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from functools import lru_cache
from statistics import median
from typing import Any, Protocol

import cv2
import numpy as np
import paddle
from paddleocr import TextDetection, TextRecognition
from PIL import Image

from app.core.config import settings

try:
    import torch
except ImportError:  # pragma: no cover - optional dependency in some environments
    torch = None  # type: ignore[assignment]

try:
    from vietocr.tool.config import Cfg
    from vietocr.tool.predictor import Predictor
except ImportError:  # pragma: no cover - optional dependency in some environments
    Cfg = None  # type: ignore[assignment]
    Predictor = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class OCRBox:
    points: list[tuple[float, float]]
    index: int
    row: int = 0
    order: int = 0

    @property
    def xs(self) -> list[float]:
        return [point[0] for point in self.points]

    @property
    def ys(self) -> list[float]:
        return [point[1] for point in self.points]

    @property
    def left(self) -> float:
        return min(self.xs)

    @property
    def right(self) -> float:
        return max(self.xs)

    @property
    def top(self) -> float:
        return min(self.ys)

    @property
    def bottom(self) -> float:
        return max(self.ys)

    @property
    def width(self) -> float:
        return max(self.right - self.left, 1.0)

    @property
    def height(self) -> float:
        return max(self.bottom - self.top, 1.0)

    @property
    def center_y(self) -> float:
        return self.top + (self.height / 2.0)


@dataclass(slots=True)
class DetectionResult:
    boxes: list[OCRBox]
    confidence: float | None
    runtime: dict[str, Any]


@dataclass(slots=True)
class RecognizedLine:
    text: str
    confidence: float
    backend_payload: dict[str, Any]


@dataclass(slots=True)
class RecognitionBatchResult:
    lines: list[RecognizedLine]
    runtime: dict[str, Any]
    confidence_semantics: str
    backend_caveats: list[str]


class OCRDetector(Protocol):
    def detect(self, image: np.ndarray, *, profile: str) -> DetectionResult: ...


class OCRRecognizer(Protocol):
    @property
    def backend_name(self) -> str: ...

    def recognize(
        self,
        crops: list[np.ndarray],
        *,
        profile: str,
    ) -> RecognitionBatchResult: ...


def _build_paddle_runtime_info() -> dict[str, Any]:
    compiled_with_cuda = bool(paddle.is_compiled_with_cuda())
    cuda_device_count = paddle.device.cuda.device_count() if compiled_with_cuda else 0
    requested_device = settings.ocr_device.strip().lower()
    actual_device = "cpu"
    if requested_device == "gpu" and compiled_with_cuda and int(cuda_device_count) > 0:
        actual_device = "gpu"
    elif requested_device == "auto" and compiled_with_cuda and int(cuda_device_count) > 0:
        actual_device = "gpu"
    return {
        "requested_device": requested_device,
        "compiled_with_cuda": compiled_with_cuda,
        "cuda_device_count": int(cuda_device_count),
        "cuda_visible_devices": os.environ.get("CUDA_VISIBLE_DEVICES"),
        "nvidia_visible_devices": os.environ.get("NVIDIA_VISIBLE_DEVICES"),
        "nvidia_driver_capabilities": os.environ.get("NVIDIA_DRIVER_CAPABILITIES"),
        "actual_device": actual_device,
    }


def _clamp_confidence(value: Any) -> float:
    try:
        return min(max(float(value), 0.0), 1.0)
    except (TypeError, ValueError):
        return 0.0


def _coerce_payload(item: Any) -> dict[str, Any]:
    if isinstance(item, dict):
        payload = item.get("res") if "res" in item else item
        if isinstance(payload, dict):
            return payload
    payload = getattr(item, "res", None)
    if isinstance(payload, dict):
        return payload
    if hasattr(item, "__dict__"):
        return dict(getattr(item, "__dict__", {}))
    return {}


def _normalize_points(raw_box: Any, *, index: int) -> OCRBox | None:
    if raw_box is None:
        return None
    box_array = np.asarray(raw_box, dtype=np.float32)
    if box_array.ndim != 2 or box_array.shape[0] < 4 or box_array.shape[1] != 2:
        return None
    points = [(float(point[0]), float(point[1])) for point in box_array[:4]]
    return OCRBox(points=points, index=index)


def _order_quad(points: np.ndarray) -> np.ndarray:
    ordered = np.zeros((4, 2), dtype=np.float32)
    sums = points.sum(axis=1)
    diffs = np.diff(points, axis=1).reshape(-1)
    ordered[0] = points[np.argmin(sums)]
    ordered[2] = points[np.argmax(sums)]
    ordered[1] = points[np.argmin(diffs)]
    ordered[3] = points[np.argmax(diffs)]
    return ordered


def extract_crops(image: np.ndarray, boxes: list[OCRBox]) -> list[np.ndarray]:
    crops: list[np.ndarray] = []
    for box in boxes:
        ordered = _order_quad(np.asarray(box.points, dtype=np.float32))
        width_top = np.linalg.norm(ordered[0] - ordered[1])
        width_bottom = np.linalg.norm(ordered[3] - ordered[2])
        height_left = np.linalg.norm(ordered[0] - ordered[3])
        height_right = np.linalg.norm(ordered[1] - ordered[2])
        target_width = max(int(round(max(width_top, width_bottom))), 1)
        target_height = max(int(round(max(height_left, height_right))), 1)
        destination = np.array(
            [
                [0, 0],
                [target_width - 1, 0],
                [target_width - 1, target_height - 1],
                [0, target_height - 1],
            ],
            dtype=np.float32,
        )
        matrix = cv2.getPerspectiveTransform(ordered, destination)
        crop = cv2.warpPerspective(
            image,
            matrix,
            (target_width, target_height),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE,
        )
        if crop.size == 0:
            x1 = max(int(round(box.left)), 0)
            y1 = max(int(round(box.top)), 0)
            x2 = min(int(round(box.right)), image.shape[1])
            y2 = min(int(round(box.bottom)), image.shape[0])
            crop = image[y1:y2, x1:x2]
        crops.append(crop)
    return crops


def sort_boxes_into_rows(
    boxes: list[OCRBox],
    *,
    tolerance_factor: float,
) -> tuple[list[OCRBox], dict[str, Any]]:
    if not boxes:
        return [], {
            "row_grouping_tolerance": round(tolerance_factor, 4),
            "row_tolerance_pixels": 0.0,
            "row_count": 0,
        }

    heights = [box.height for box in boxes]
    tolerance_pixels = max(8.0, median(heights) * tolerance_factor)
    sorted_candidates = sorted(boxes, key=lambda box: (box.top, box.left, box.index))
    rows: list[list[OCRBox]] = []
    current_row: list[OCRBox] = []
    current_anchor = 0.0
    for box in sorted_candidates:
        if not current_row:
            current_row = [box]
            current_anchor = box.center_y
            continue
        if abs(box.center_y - current_anchor) <= tolerance_pixels:
            current_row.append(box)
            current_anchor = sum(item.center_y for item in current_row) / len(current_row)
            continue
        rows.append(current_row)
        current_row = [box]
        current_anchor = box.center_y
    if current_row:
        rows.append(current_row)

    ordered: list[OCRBox] = []
    for row_index, row in enumerate(rows):
        for order_index, box in enumerate(sorted(row, key=lambda item: (item.left, item.top, item.index))):
            box.row = row_index
            box.order = len(ordered)
            ordered.append(box)

    metadata = {
        "row_grouping_tolerance": round(tolerance_factor, 4),
        "row_tolerance_pixels": round(float(tolerance_pixels), 2),
        "row_count": len(rows),
        "row_lengths": [len(row) for row in rows],
    }
    return ordered, metadata


class PaddleDetectorAdapter:
    def __init__(self) -> None:
        self._runtime = _build_paddle_runtime_info()
        self._models: dict[str, TextDetection] = {}

    def _profile_config(self, profile: str) -> dict[str, Any]:
        return {
            "model_name": (
                settings.ocr_fast_detector_model if profile == "fast" else settings.ocr_recovery_detector_model
            ),
            "limit_side_len": 1536 if profile == "fast" else 2048,
        }

    def _get_model(self, profile: str) -> tuple[TextDetection, dict[str, Any]]:
        if profile in self._models:
            return self._models[profile], self._profile_config(profile)

        config = self._profile_config(profile)
        model = TextDetection(
            model_name=config["model_name"],
            device=self._runtime["actual_device"],
        )
        self._models[profile] = model
        logger.info(
            "Configured Paddle detector profile=%s device=%s model=%s",
            profile,
            self._runtime["actual_device"],
            config["model_name"],
        )
        return model, config

    def detect(self, image: np.ndarray, *, profile: str) -> DetectionResult:
        model, config = self._get_model(profile)
        output = model.predict(input=image, batch_size=1)
        boxes: list[OCRBox] = []
        for payload_index, item in enumerate(output or []):
            payload = _coerce_payload(item)
            raw_boxes = payload.get("dt_polys")
            if raw_boxes is None or (hasattr(raw_boxes, "__len__") and len(raw_boxes) == 0):
                raw_boxes = payload.get("boxes")
            if raw_boxes is None:
                raw_boxes = []
            for box_index, raw_box in enumerate(raw_boxes):
                box = _normalize_points(raw_box, index=(payload_index * 1000) + box_index)
                if box is not None:
                    boxes.append(box)
        runtime = {
            **self._runtime,
            "detector_backend": "paddle",
            "detector_device": self._runtime["actual_device"],
            "text_detection_model_name": config["model_name"],
            "text_det_limit_side_len": config["limit_side_len"],
        }
        return DetectionResult(boxes=boxes, confidence=None, runtime=runtime)


class PaddleRecognizerAdapter:
    backend_name = "paddle"

    def __init__(self) -> None:
        self._runtime = _build_paddle_runtime_info()
        self._models: dict[str, TextRecognition] = {}

    def _profile_config(self, profile: str) -> dict[str, Any]:
        return {
            "model_name": (
                settings.ocr_fast_recognition_model_paddle
                if profile == "fast"
                else settings.ocr_recovery_recognition_model_paddle
            ),
        }

    def _get_model(self, profile: str) -> tuple[TextRecognition, dict[str, Any]]:
        if profile in self._models:
            return self._models[profile], self._profile_config(profile)

        config = self._profile_config(profile)
        model = TextRecognition(
            model_name=config["model_name"],
            device=self._runtime["actual_device"],
        )
        self._models[profile] = model
        logger.info(
            "Configured Paddle recognizer profile=%s device=%s model=%s",
            profile,
            self._runtime["actual_device"],
            config["model_name"],
        )
        return model, config

    def recognize(self, crops: list[np.ndarray], *, profile: str) -> RecognitionBatchResult:
        if not crops:
            return RecognitionBatchResult(
                lines=[],
                runtime={
                    **self._runtime,
                    "recognizer_backend": self.backend_name,
                    "recognizer_device": self._runtime["actual_device"],
                    "text_recognition_model_name": self._profile_config(profile)["model_name"],
                },
                confidence_semantics="paddle_rec_score",
                backend_caveats=[],
            )

        model, config = self._get_model(profile)
        output = model.predict(input=crops, batch_size=max(settings.ocr_recognizer_batch_size, 1))
        lines: list[RecognizedLine] = []
        for item in output or []:
            payload = _coerce_payload(item)
            text = str(payload.get("rec_text") or payload.get("text") or "").strip()
            if not text and isinstance(payload.get("rec_texts"), list) and payload["rec_texts"]:
                text = str(payload["rec_texts"][0]).strip()
            confidence = _clamp_confidence(payload.get("rec_score"))
            if confidence == 0.0 and isinstance(payload.get("rec_scores"), list) and payload["rec_scores"]:
                confidence = _clamp_confidence(payload["rec_scores"][0])
            lines.append(
                RecognizedLine(
                    text=text,
                    confidence=confidence,
                    backend_payload={"raw": payload},
                )
            )

        return RecognitionBatchResult(
            lines=lines,
            runtime={
                **self._runtime,
                "recognizer_backend": self.backend_name,
                "recognizer_device": self._runtime["actual_device"],
                "text_recognition_model_name": config["model_name"],
            },
            confidence_semantics="paddle_rec_score",
            backend_caveats=[],
        )


class VietOCRRecognizerAdapter:
    backend_name = "vietocr"

    def __init__(self) -> None:
        self._predictor: Predictor | None = None
        self._runtime = self._build_runtime()

    def _build_runtime(self) -> dict[str, Any]:
        requested_device = settings.ocr_device.strip().lower()
        torch_available = torch is not None
        cuda_available = bool(torch_available and torch.cuda.is_available())
        actual_device = "cpu"
        if requested_device == "gpu" and cuda_available:
            actual_device = "gpu"
        elif requested_device == "auto" and cuda_available:
            actual_device = "gpu"
        return {
            "requested_device": requested_device,
            "torch_available": torch_available,
            "torch_cuda_available": cuda_available,
            "torch_cuda_device_count": int(torch.cuda.device_count()) if cuda_available else 0,
            "actual_device": actual_device,
        }

    def _get_predictor(self) -> Predictor:
        if Predictor is None or Cfg is None:
            raise RuntimeError("VietOCR is not installed. Install the vietocr package to use this recognizer backend.")
        if self._predictor is not None:
            return self._predictor
        config = Cfg.load_config_from_name(settings.ocr_vietocr_config_name)
        config["device"] = "cuda:0" if self._runtime["actual_device"] == "gpu" else "cpu"
        config["cnn"]["pretrained"] = False
        if settings.ocr_vietocr_weights:
            config["weights"] = settings.ocr_vietocr_weights
        self._predictor = Predictor(config)
        logger.info(
            "Configured VietOCR recognizer device=%s config=%s weights=%s",
            self._runtime["actual_device"],
            settings.ocr_vietocr_config_name,
            settings.ocr_vietocr_weights or "default",
        )
        return self._predictor

    def recognize(self, crops: list[np.ndarray], *, profile: str) -> RecognitionBatchResult:
        if not crops:
            return RecognitionBatchResult(
                lines=[],
                runtime={
                    **self._runtime,
                    "recognizer_backend": self.backend_name,
                    "recognizer_device": self._runtime["actual_device"],
                    "text_recognition_model_name": settings.ocr_vietocr_config_name,
                },
                confidence_semantics="vietocr_sequence_probability",
                backend_caveats=["vietocr_probability_is_sequence_level"],
            )

        predictor = self._get_predictor()
        images = [Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)) for crop in crops]
        predicted = predictor.predict_batch(images, return_prob=True)
        if isinstance(predicted, tuple):
            texts, probabilities = predicted
        else:
            texts, probabilities = predicted, [None] * len(images)
        lines: list[RecognizedLine] = []
        for text, probability in zip(texts, probabilities, strict=False):
            lines.append(
                RecognizedLine(
                    text=str(text).strip(),
                    confidence=_clamp_confidence(probability),
                    backend_payload={"probability": probability},
                )
            )
        return RecognitionBatchResult(
            lines=lines,
            runtime={
                **self._runtime,
                "recognizer_backend": self.backend_name,
                "recognizer_device": self._runtime["actual_device"],
                "text_recognition_model_name": settings.ocr_vietocr_config_name,
            },
            confidence_semantics="vietocr_sequence_probability",
            backend_caveats=["vietocr_probability_is_sequence_level"],
        )


@lru_cache(maxsize=1)
def get_paddle_detector() -> PaddleDetectorAdapter:
    return PaddleDetectorAdapter()


@lru_cache(maxsize=1)
def get_paddle_recognizer() -> PaddleRecognizerAdapter:
    return PaddleRecognizerAdapter()


@lru_cache(maxsize=1)
def get_vietocr_recognizer() -> VietOCRRecognizerAdapter:
    return VietOCRRecognizerAdapter()
