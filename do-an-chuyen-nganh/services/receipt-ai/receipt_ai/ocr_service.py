from __future__ import annotations

from receipt_ai.receipt_intelligence import ReceiptOcrRequestMetadata, parse_receipt_and_suggest_category


def process_receipt_image(
    image_bytes: bytes,
    *,
    file_name: str = "receipt.jpg",
    mime_type: str = "image/jpeg",
    metadata: ReceiptOcrRequestMetadata | None = None,
) -> dict:
    request_metadata = metadata or ReceiptOcrRequestMetadata(
        user_id="anonymous",
        include_debug=False,
        allowed_categories=[],
    )
    return parse_receipt_and_suggest_category(
        image_bytes=image_bytes,
        file_name=file_name,
        mime_type=mime_type,
        metadata=request_metadata,
    )
