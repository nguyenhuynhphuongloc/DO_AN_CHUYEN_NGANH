from __future__ import annotations

from datetime import datetime
from typing import Any


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
            value = _to_float(candidate.get(key))
            if value is not None:
                return min(max(value, 0.0), 1.0)
    return present_default


def _format_amount_display(amount: float | None) -> str | None:
    if amount is None:
        return None
    if float(amount).is_integer():
        return f"{amount:,.0f}".replace(",", ".")
    return f"{amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


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
    }


def normalize_veryfi_document(document: dict[str, Any], *, raw_text: str, runtime: dict[str, Any]) -> dict[str, Any]:
    vendor = _as_dict(document.get("vendor"))
    payment = _as_dict(document.get("payment"))
    line_items = [item for item in (_normalize_line_item(entry) for entry in _as_list(document.get("line_items"))) if item]

    merchant_name = _clean_text(vendor.get("name")) or _clean_text(document.get("vendor_name"))
    transaction_date = _coerce_date(document.get("date"))
    transaction_datetime = _coerce_datetime(document.get("date"))
    total_amount = _to_float(document.get("total"))
    currency = _clean_text(document.get("currency_code")) or _clean_text(document.get("currency")) or "VND"
    provider_category = _clean_text(document.get("category"))
    payment_method = _clean_text(payment.get("display_name")) or _clean_text(payment.get("type"))

    normalized_receipt = {
        "fields": {
            "merchant_name": merchant_name,
            "transaction_date": transaction_date,
            "transaction_datetime": transaction_datetime,
            "total_amount": total_amount,
            "currency": currency,
            "payment_method": payment_method,
        },
        "items": line_items,
        "receipt_summary": {
            "merchant_name": merchant_name,
            "transaction_date": transaction_date,
            "transaction_datetime": transaction_datetime,
            "total_amount": total_amount,
            "currency": currency,
            "provider_category": provider_category,
            "line_items": line_items,
        },
    }

    return {
        "raw_text": raw_text or "",
        "normalized_receipt": normalized_receipt,
        "review_defaults": {
            "merchant_name": merchant_name,
            "transaction_date": transaction_date,
            "total_amount": total_amount,
            "total_amount_display": _format_amount_display(total_amount),
            "currency": currency,
        },
        "debug": {
            "provider_document_id": document.get("id"),
            "provider_payload_summary": {
                "document_type": document.get("document_type"),
                "category": provider_category,
                "created_date": document.get("created_date"),
            },
        },
        "runtime": runtime,
    }
