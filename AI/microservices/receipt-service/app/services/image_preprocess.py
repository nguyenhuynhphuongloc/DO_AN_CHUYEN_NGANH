from __future__ import annotations

from pathlib import Path

import cv2

MAX_IMAGE_SIDE = 1280


def preprocess_image(input_path: str, output_path: str) -> str:
    source = cv2.imread(input_path)
    if source is None:
        raise ValueError("Unable to read receipt image for preprocessing")

    height, width = source.shape[:2]
    largest_side = max(height, width)
    if largest_side > MAX_IMAGE_SIDE:
        scale = MAX_IMAGE_SIDE / float(largest_side)
        resized_width = max(1, int(width * scale))
        resized_height = max(1, int(height * scale))
        source = cv2.resize(source, (resized_width, resized_height), interpolation=cv2.INTER_AREA)

    grayscale = cv2.cvtColor(source, cv2.COLOR_BGR2GRAY)
    enhanced = cv2.convertScaleAbs(grayscale, alpha=1.35, beta=10)
    blurred = cv2.GaussianBlur(enhanced, (3, 3), 0)

    destination = Path(output_path)
    destination.parent.mkdir(parents=True, exist_ok=True)

    if not cv2.imwrite(str(destination), blurred):
        raise ValueError("Unable to save preprocessed receipt image")

    return str(destination)
