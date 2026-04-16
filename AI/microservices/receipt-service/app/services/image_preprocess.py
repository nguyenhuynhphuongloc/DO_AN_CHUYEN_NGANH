from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

MAX_LONG_SIDE = 2200
MIN_SHORT_SIDE = 900


def _safe_resize(source: np.ndarray) -> tuple[np.ndarray, dict]:
    height, width = source.shape[:2]
    long_side = max(height, width)
    short_side = min(height, width)
    scale = 1.0

    if long_side > MAX_LONG_SIDE:
        scale = MAX_LONG_SIDE / float(long_side)
    elif short_side < MIN_SHORT_SIDE:
        scale = MIN_SHORT_SIDE / float(short_side)

    if abs(scale - 1.0) < 0.01:
        return source, {"scale": 1.0, "resized_from": [width, height], "resized_to": [width, height]}

    resized_width = max(1, int(width * scale))
    resized_height = max(1, int(height * scale))
    interpolation = cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC
    resized = cv2.resize(source, (resized_width, resized_height), interpolation=interpolation)
    return resized, {
        "scale": round(scale, 4),
        "resized_from": [width, height],
        "resized_to": [resized_width, resized_height],
    }


def _deskew(gray: np.ndarray) -> tuple[np.ndarray, float]:
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresholded = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    coords = np.column_stack(np.where(thresholded < 255))
    if len(coords) < 200:
        return gray, 0.0

    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = 90 + angle
    if abs(angle) < 0.7:
        return gray, 0.0

    height, width = gray.shape[:2]
    center = (width // 2, height // 2)
    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    deskewed = cv2.warpAffine(
        gray,
        matrix,
        (width, height),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE,
    )
    return deskewed, float(angle)


def preprocess_image_with_metadata(input_path: str, output_path: str, *, profile: str = "recovery") -> tuple[str, dict]:
    source = cv2.imread(input_path)
    if source is None:
        raise ValueError("Unable to read receipt image for preprocessing")
    input_size = [int(source.shape[1]), int(source.shape[0])]

    source, resize_meta = _safe_resize(source)

    grayscale = cv2.cvtColor(source, cv2.COLOR_BGR2GRAY)
    pipeline_steps = ["resize", "grayscale"]
    rotated_90 = False
    deskew_angle = 0.0

    if profile == "fast":
        normalized = cv2.normalize(grayscale, None, 0, 255, cv2.NORM_MINMAX)
        denoised = cv2.fastNlMeansDenoising(normalized, h=4, templateWindowSize=7, searchWindowSize=15)
        processed = denoised
        pipeline_steps.extend(["normalize", "denoise-light"])
    else:
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        normalized = clahe.apply(grayscale)
        denoised = cv2.fastNlMeansDenoising(normalized, h=7, templateWindowSize=7, searchWindowSize=21)
        sharpen_kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]], dtype=np.float32)
        sharpened = cv2.filter2D(denoised, -1, sharpen_kernel)
        deskewed, deskew_angle = _deskew(sharpened)
        processed = deskewed
        pipeline_steps.extend(["clahe", "denoise", "sharpen", "deskew"])

    height, width = processed.shape[:2]
    if width > height * 1.35:
        processed = cv2.rotate(processed, cv2.ROTATE_90_CLOCKWISE)
        rotated_90 = True
    pipeline_steps.append("orientation-check")

    destination = Path(output_path)
    destination.parent.mkdir(parents=True, exist_ok=True)

    if not cv2.imwrite(str(destination), processed):
        raise ValueError("Unable to save preprocessed receipt image")

    metadata = {
        **resize_meta,
        "input_size": input_size,
        "profile": profile,
        "deskew_angle": round(deskew_angle, 3),
        "rotated_90": rotated_90,
        "pipeline": pipeline_steps,
        "output_size": [int(processed.shape[1]), int(processed.shape[0])],
    }
    return str(destination), metadata


def preprocess_image(input_path: str, output_path: str, *, profile: str = "recovery") -> str:
    processed_path, _ = preprocess_image_with_metadata(input_path, output_path, profile=profile)
    return processed_path
