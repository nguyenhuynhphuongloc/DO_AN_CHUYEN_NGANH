from __future__ import annotations

from .config import settings


def preprocess_receipt_image(image_bytes: bytes, *, file_name: str, mime_type: str) -> bytes:
    if not settings.receipt_preprocess_enabled:
        return image_bytes
    return image_bytes
