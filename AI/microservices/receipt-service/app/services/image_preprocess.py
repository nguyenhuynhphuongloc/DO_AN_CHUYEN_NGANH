from __future__ import annotations

from pathlib import Path
from typing import Any

import cv2
import numpy as np

MAX_LONG_SIDE = 2200
MIN_SHORT_SIDE = 900
MAX_UPSCALE = 1.6
LANDSCAPE_ROTATION_RATIO = 1.15
DESKEW_THRESHOLD_DEGREES = 0.4


def _resize_for_receipt(source: np.ndarray, metadata: dict[str, Any]) -> np.ndarray:
    height, width = source.shape[:2]
    long_side = max(height, width)
    short_side = min(height, width)
    scale = 1.0

    if long_side > MAX_LONG_SIDE:
        scale = MAX_LONG_SIDE / float(long_side)
    elif short_side < MIN_SHORT_SIDE and long_side < MAX_LONG_SIDE:
        scale = min(MAX_UPSCALE, MIN_SHORT_SIDE / float(short_side))

    if abs(scale - 1.0) < 0.01:
        metadata["resize_scale"] = 1.0
        metadata["resized_dimensions"] = {"height": height, "width": width}
        return source

    resized = cv2.resize(
        source,
        (max(1, int(width * scale)), max(1, int(height * scale))),
        interpolation=cv2.INTER_CUBIC if scale > 1.0 else cv2.INTER_AREA,
    )
    new_height, new_width = resized.shape[:2]
    metadata["resize_scale"] = round(scale, 4)
    metadata["resized_dimensions"] = {"height": new_height, "width": new_width}
    return resized


def _rotate_to_portrait(source: np.ndarray, metadata: dict[str, Any]) -> np.ndarray:
    height, width = source.shape[:2]
    if width <= height * LANDSCAPE_ROTATION_RATIO:
        metadata["portrait_rotation_applied"] = False
        return source

    rotated = cv2.rotate(source, cv2.ROTATE_90_CLOCKWISE)
    metadata["portrait_rotation_applied"] = True
    metadata["portrait_rotation_degrees"] = 90.0
    return rotated


def _estimate_skew_angle(grayscale: np.ndarray) -> float:
    _, threshold = cv2.threshold(grayscale, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    coords = np.column_stack(np.where(threshold > 0))
    if coords.size == 0:
        return 0.0

    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = 90 + angle
    return float(angle)


def _deskew_image(source: np.ndarray, metadata: dict[str, Any]) -> np.ndarray:
    grayscale = cv2.cvtColor(source, cv2.COLOR_BGR2GRAY)
    angle = _estimate_skew_angle(grayscale)
    metadata["deskew_angle"] = round(angle, 3)
    if abs(angle) < DESKEW_THRESHOLD_DEGREES:
        metadata["deskew_applied"] = False
        return source

    height, width = source.shape[:2]
    center = (width // 2, height // 2)
    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(
        source,
        matrix,
        (width, height),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE,
    )
    metadata["deskew_applied"] = True
    return rotated


def preprocess_image(input_path: str, output_path: str) -> dict[str, Any]:
    source = cv2.imread(input_path)
    if source is None:
        raise ValueError("Unable to read receipt image for preprocessing")

    metadata: dict[str, Any] = {
        "input_path": input_path,
        "original_dimensions": {"height": int(source.shape[0]), "width": int(source.shape[1])},
        "pipeline": [],
    }

    working = _rotate_to_portrait(source, metadata)
    metadata["pipeline"].append("rotate_to_portrait")

    working = _resize_for_receipt(working, metadata)
    metadata["pipeline"].append("safe_resize")

    working = _deskew_image(working, metadata)
    metadata["pipeline"].append("deskew")

    grayscale = cv2.cvtColor(working, cv2.COLOR_BGR2GRAY)
    metadata["pipeline"].append("grayscale")

    clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
    normalized = clahe.apply(grayscale)
    metadata["pipeline"].append("clahe")

    denoised = cv2.fastNlMeansDenoising(normalized, None, h=9, templateWindowSize=7, searchWindowSize=21)
    metadata["pipeline"].append("denoise")

    sharpened = cv2.addWeighted(denoised, 1.35, cv2.GaussianBlur(denoised, (0, 0), 1.1), -0.35, 0)
    metadata["pipeline"].append("sharpen")

    thresholded = cv2.adaptiveThreshold(
        sharpened,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        11,
    )
    metadata["pipeline"].append("adaptive_threshold")

    destination = Path(output_path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not cv2.imwrite(str(destination), thresholded):
        raise ValueError("Unable to save preprocessed receipt image")

    metadata["output_path"] = str(destination)
    metadata["output_dimensions"] = {"height": int(thresholded.shape[0]), "width": int(thresholded.shape[1])}

    return {
        "output_path": str(destination),
        "metadata": metadata,
    }
