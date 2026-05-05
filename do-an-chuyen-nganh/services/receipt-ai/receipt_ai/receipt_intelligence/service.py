from __future__ import annotations

import os
import tempfile
from pathlib import Path

from .category_resolver import ReceiptCategoryResolutionService
from .contracts import (
    ReceiptOcrError,
    ReceiptOcrFailureResponse,
    ReceiptOcrRequestMetadata,
    ReceiptOcrReviewFields,
    ReceiptOcrSuccessResponse,
)
from .description_builder import build_receipt_description
from .errors import ReceiptCategoryResolutionError, ReceiptIntelligenceError, ReceiptNotReceiptError
from .normalizer import normalize_veryfi_document
from .preprocess import preprocess_receipt_image
from .veryfi_parser import VeryfiReceiptParser


def _safe_suffix(file_name: str, mime_type: str) -> str:
    suffix = Path(file_name).suffix
    if suffix:
        return suffix
    if mime_type == "image/png":
        return ".png"
    if mime_type == "image/webp":
        return ".webp"
    return ".jpg"


def _looks_like_receipt(normalized: dict, raw_text: str) -> bool:
    receipt = normalized.get("normalized_receipt") or {}
    fields = receipt.get("fields") or {}
    summary = receipt.get("receipt_summary") or {}
    items = receipt.get("items") or []

    document_type = ((normalized.get("debug") or {}).get("provider_payload_summary") or {}).get("document_type")
    if isinstance(document_type, str):
        normalized_type = document_type.strip().lower()
        if normalized_type and normalized_type not in {"receipt", "invoice", "bill", "order"}:
            return False

    has_money = fields.get("total_amount") is not None or summary.get("total_amount") is not None
    has_merchant = bool(fields.get("merchant_name") or summary.get("merchant_name"))
    has_date = bool(fields.get("transaction_date") or summary.get("transaction_date"))
    has_items = bool(items)
    has_receipt_words = any(
        keyword in (raw_text or "").lower()
        for keyword in ("total", "subtotal", "receipt", "invoice", "cash", "change", "vat", "tong", "thanh tien")
    )

    return has_money and (has_merchant or has_date or has_items or has_receipt_words)


def parse_receipt_and_suggest_category(
    *,
    image_bytes: bytes,
    file_name: str,
    mime_type: str,
    metadata: ReceiptOcrRequestMetadata,
) -> dict:
    parser = VeryfiReceiptParser()
    category_service = ReceiptCategoryResolutionService()

    try:
        prepared_bytes = preprocess_receipt_image(image_bytes, file_name=file_name, mime_type=mime_type)

        temp_path: str | None = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=_safe_suffix(file_name, mime_type)) as temp_file:
                temp_file.write(prepared_bytes)
                temp_path = temp_file.name

            parser_result = parser.parse_document(temp_path, external_id=f"{metadata.user_id}-{Path(file_name).stem}")
        finally:
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)

        normalized = normalize_veryfi_document(
            parser_result.document,
            raw_text=parser_result.raw_text,
            runtime=parser_result.runtime,
        )

        if not _looks_like_receipt(normalized, parser_result.raw_text):
            raise ReceiptNotReceiptError("Đây không phải là ảnh hóa đơn hợp lệ.")

        category_suggestion = None
        category_errors: list[ReceiptOcrError] = []
        try:
            category_suggestion = category_service.resolve_category(
                normalized_receipt=normalized["normalized_receipt"],
                categories=[candidate.model_dump() for candidate in metadata.allowed_categories],
            )
        except ReceiptCategoryResolutionError as exc:
            category_errors.append(ReceiptOcrError(code="CATEGORY_SUGGESTION_FAILED", message=str(exc)))

        category_name = category_suggestion["category_name"] if category_suggestion else None
        review_defaults = normalized["review_defaults"]
        review_fields = ReceiptOcrReviewFields(
            merchant_name=review_defaults.get("merchant_name"),
            transaction_date=review_defaults.get("transaction_date"),
            total_amount=review_defaults.get("total_amount"),
            total_amount_display=review_defaults.get("total_amount_display"),
            currency=review_defaults.get("currency") or metadata.currency_preference or "VND",
            category_id=category_suggestion["category_id"] if category_suggestion else None,
            category_name=category_name,
            category_reason=category_suggestion["reason"] if category_suggestion else None,
            description=build_receipt_description(
                merchant_name=review_defaults.get("merchant_name"),
                category_name=category_name,
                transaction_date=review_defaults.get("transaction_date"),
                total_amount=review_defaults.get("total_amount"),
                currency=review_defaults.get("currency") or metadata.currency_preference or "VND",
            ),
            user_note="",
        )

        success = ReceiptOcrSuccessResponse(
            raw_text=normalized["raw_text"],
            review_fields=review_fields,
            normalized_receipt=normalized["normalized_receipt"],
            debug=normalized["debug"] if metadata.include_debug else None,
            errors=category_errors,
        )
        return success.model_dump()
    except ReceiptNotReceiptError as exc:
        failure = ReceiptOcrFailureResponse(
            errors=[ReceiptOcrError(code="NOT_RECEIPT", message=str(exc))]
        )
        return failure.model_dump()
    except ReceiptIntelligenceError as exc:
        failure = ReceiptOcrFailureResponse(
            errors=[ReceiptOcrError(code="RECEIPT_PARSE_FAILED", message=str(exc))]
        )
        return failure.model_dump()
    except Exception as exc:  # pragma: no cover
        failure = ReceiptOcrFailureResponse(
            errors=[ReceiptOcrError(code="UNEXPECTED_ERROR", message=str(exc))]
        )
        return failure.model_dump()
