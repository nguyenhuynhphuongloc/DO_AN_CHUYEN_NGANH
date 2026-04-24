from __future__ import annotations

from datetime import datetime
from typing import Any


def _clean_text(value: Any) -> str | None:
    if value in (None, ""):
        return None
    normalized = str(value).strip()
    return normalized or None


def _format_amount(amount: float | int | None, currency: str | None) -> str | None:
    if amount is None:
        return None
    normalized_currency = _clean_text(currency) or "VND"
    numeric_amount = float(amount)
    if numeric_amount.is_integer():
        formatted = f"{numeric_amount:,.0f}"
    else:
        formatted = f"{numeric_amount:,.2f}".rstrip("0").rstrip(".")
    return f"{formatted} {normalized_currency}".replace(",", ".")


def _format_date(value: str | None) -> str | None:
    normalized = _clean_text(value)
    if normalized is None:
        return None
    candidates = [normalized, normalized[:10], normalized[:19]]
    for candidate in candidates:
        for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
            try:
                return datetime.strptime(candidate, fmt).strftime("%d/%m/%Y")
            except ValueError:
                continue
    return normalized


def build_receipt_description(
    *,
    merchant_name: str | None,
    category_name: str | None,
    transaction_date: str | None,
    total_amount: float | int | None,
    currency: str | None,
) -> str | None:
    merchant = _clean_text(merchant_name)
    category = _clean_text(category_name)
    date_label = _format_date(transaction_date)
    amount_label = _format_amount(total_amount, currency)

    sentence_parts: list[str] = []
    if date_label:
        sentence_parts.append(f"Ngay {date_label}")
    if merchant:
        sentence_parts.append(f"chi tai {merchant}")
    elif category:
        sentence_parts.append(f"chi cho {category}")
    if amount_label:
        sentence_parts.append(f"so tien {amount_label}")
    if category and merchant:
        sentence_parts.append(f"thuoc nhom {category}")

    description = " ".join(sentence_parts).strip()
    return description or merchant or category
