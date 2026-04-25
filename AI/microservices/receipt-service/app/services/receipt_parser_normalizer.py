from __future__ import annotations

from datetime import datetime
from typing import Any

from app.services.receipt_description_service import build_receipt_description


def _as_dict(value: Any) -> dict[str, Any]:
    return dict(value) if isinstance(value, dict) else {}


def _as_list(value: Any) -> list[Any]:
    return list(value) if isinstance(value, list) else []


def _clean_text(value: Any) -> str | None:
    if value in (None, ""):
        return None
    normalized = str(value).strip()
    return normalized or None


def _to_float(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _coerce_date(value: Any) -> str | None:
    normalized = _clean_text(value)
    if normalized is None:
        return None
    if "T" in normalized:
        normalized = normalized.split("T", 1)[0]
    if " " in normalized:
        normalized = normalized.split(" ", 1)[0]
    try:
        return datetime.fromisoformat(normalized).date().isoformat()
    except ValueError:
        if (
            len(normalized) == 10
            and normalized[4:5] == "-"
            and normalized[7:8] == "-"
            and normalized[:4].isdigit()
            and normalized[5:7].isdigit()
            and normalized[8:10].isdigit()
        ):
            return normalized
        return None


def _coerce_datetime(value: Any) -> str | None:
    normalized = _clean_text(value)
    if normalized is None:
        return None
    candidate = normalized.replace("Z", "+00:00")
    if "T" not in candidate and " " not in candidate:
        return None
    try:
        return datetime.fromisoformat(candidate).isoformat()
    except ValueError:
        return None


def _confidence(candidate: Any, *, present_default: float | None = None) -> float | None:
    if candidate in (None, "", {}):
        return None
    if isinstance(candidate, dict):
        for key in ("confidence", "score", "probability"):
            coerced = _to_float(candidate.get(key))
            if coerced is not None:
                return min(max(coerced, 0.0), 1.0)
    return present_default


def _normalize_line_item(raw_item: Any) -> dict[str, Any] | None:
    item = _as_dict(raw_item)
    if not item:
        return None
    name = (
        _clean_text(item.get("description"))
        or _clean_text(item.get("text"))
        or _clean_text(item.get("name"))
        or _clean_text(item.get("line_items_text"))
    )
    quantity = _to_float(item.get("quantity"))
    unit_price = _to_float(item.get("unit_price")) or _to_float(item.get("price"))
    line_total = _to_float(item.get("total")) or _to_float(item.get("line_total")) or _to_float(item.get("subtotal"))
    if not any(value is not None for value in (name, quantity, unit_price, line_total)):
        return None
    return {
        "name": name,
        "quantity": quantity,
        "unit_price": unit_price,
        "line_total": line_total,
        "confidence": _confidence(item, present_default=0.8 if name else None),
        "source_lines": [],
    }


def _description_text(
    items: list[dict[str, Any]],
    vendor_name: str | None,
    category: str | None,
    transaction_date: str | None,
    total_amount: float | None,
    currency: str | None,
) -> str | None:
    generated = build_receipt_description(
        merchant_name=vendor_name,
        category_name=category,
        transaction_date=transaction_date,
        total_amount=total_amount,
        currency=currency,
    )
    if generated:
        return generated
    labels = [str(item["name"]) for item in items if item.get("name")]
    if labels:
        return " | ".join(labels[:5])
    return vendor_name or category


def normalize_veryfi_document(document: dict[str, Any], *, raw_text: str, runtime: dict[str, Any]) -> dict[str, Any]:
    vendor = _as_dict(document.get("vendor"))
    payment = _as_dict(document.get("payment"))
    line_items = [item for item in (_normalize_line_item(entry) for entry in _as_list(document.get("line_items"))) if item]

    merchant_name = _clean_text(vendor.get("name")) or _clean_text(document.get("vendor_name"))
    merchant_address = _clean_text(vendor.get("address")) or _clean_text(document.get("bill_to_address"))
    merchant_phone = _clean_text(vendor.get("phone_number")) or _clean_text(document.get("phone"))
    transaction_date = _coerce_date(document.get("date"))
    transaction_datetime = _coerce_datetime(document.get("date"))
    total_amount = _to_float(document.get("total"))
    tax_amount = _to_float(document.get("tax"))
    subtotal_amount = _to_float(document.get("subtotal"))
    discount_amount = _to_float(document.get("discount"))
    currency = _clean_text(document.get("currency_code")) or _clean_text(document.get("currency"))
    payment_method = _clean_text(payment.get("display_name")) or _clean_text(payment.get("type"))
    receipt_number = (
        _clean_text(document.get("invoice_number"))
        or _clean_text(document.get("document_reference_number"))
        or _clean_text(document.get("order_number"))
    )
    category = _clean_text(document.get("category"))

    field_confidence: dict[str, float | None] = {
        "merchant_name": _confidence(vendor, present_default=0.88 if merchant_name else None),
        "transaction_date": _confidence(document.get("date"), present_default=0.84 if transaction_date else None),
        "transaction_datetime": _confidence(document.get("date"), present_default=0.84 if transaction_datetime else None),
        "total_amount": _confidence(document.get("total"), present_default=0.9 if total_amount is not None else None),
        "currency": _confidence(document.get("currency_code"), present_default=0.8 if currency else None),
        "payment_method": _confidence(payment, present_default=0.75 if payment_method else None),
        "subtotal_amount": _confidence(document.get("subtotal"), present_default=0.78 if subtotal_amount is not None else None),
        "tax_amount": _confidence(document.get("tax"), present_default=0.78 if tax_amount is not None else None),
        "discount_amount": _confidence(document.get("discount"), present_default=0.7 if discount_amount is not None else None),
        "receipt_number": _confidence(document.get("document_reference_number"), present_default=0.72 if receipt_number else None),
        "merchant_address": _confidence(vendor.get("address"), present_default=0.76 if merchant_address else None),
        "merchant_phone": _confidence(vendor.get("phone_number"), present_default=0.72 if merchant_phone else None),
    }

    review_fields = [
        field_name
        for field_name in ("merchant_name", "transaction_date", "total_amount", "currency")
        if field_confidence.get(field_name) is None or float(field_confidence[field_name] or 0.0) < 0.65
    ]
    if merchant_name is None:
        review_fields.append("merchant_name")
    if transaction_date is None:
        review_fields.append("transaction_date")
    if total_amount is None or total_amount <= 0:
        review_fields.append("total_amount")
    if currency is None:
        review_fields.append("currency")

    fields = {
        "merchant_name": merchant_name,
        "transaction_date": transaction_date,
        "transaction_datetime": transaction_datetime,
        "total_amount": total_amount,
        "currency": currency,
        "subtotal_amount": subtotal_amount,
        "tax_amount": tax_amount,
        "discount_amount": discount_amount,
        "service_charge": None,
        "payment_method": payment_method,
        "receipt_number": receipt_number,
        "merchant_address": merchant_address,
        "merchant_phone": merchant_phone,
        "cashier_name": None,
        "table_number": None,
        "guest_count": None,
        "time_in": None,
        "time_out": None,
    }
    description_text = _description_text(
        line_items,
        merchant_name,
        category,
        transaction_date,
        total_amount,
        currency,
    )

    extracted_json = {
        "normalized_text": {
            "raw_text": raw_text or None,
            "normalized_text": raw_text or None,
            "normalized_lines": [line for line in raw_text.splitlines() if line.strip()],
        },
        "fields": fields,
        "items": line_items,
        "receipt_summary": {
            "merchant_name": merchant_name,
            "transaction_date": transaction_date,
            "transaction_datetime": transaction_datetime,
            "total_amount": total_amount,
            "currency": currency,
            "provider_category": category,
            "line_items": line_items,
        },
        "field_confidence": field_confidence,
        "needs_review_fields": sorted(set(review_fields)),
        "description_text": description_text,
        "parser_metadata": {
            "provider": "veryfi",
            "document_id": document.get("id"),
            "document_type": document.get("document_type"),
            "category": category,
            "runtime": runtime,
        },
        "provider_document_summary": {
            "id": document.get("id"),
            "document_type": document.get("document_type"),
            "created_date": document.get("created_date"),
            "category": category,
        },
        "review_defaults": {
            "merchant_name": merchant_name,
            "amount": total_amount,
            "transaction_time": transaction_datetime or transaction_date,
            "description": description_text,
        },
    }

    top_level_confidences = [
        confidence
        for key, confidence in field_confidence.items()
        if key in {"merchant_name", "transaction_date", "total_amount", "currency"} and confidence is not None
    ]
    overall_confidence = sum(top_level_confidences) / len(top_level_confidences) if top_level_confidences else 0.0

    return {
        "merchant_name": merchant_name,
        "transaction_date": transaction_date,
        "transaction_datetime": transaction_datetime,
        "total_amount": total_amount,
        "tax_amount": tax_amount,
        "currency": currency,
        "confidence_score": round(overall_confidence, 4),
        "extracted_json": extracted_json,
    }
