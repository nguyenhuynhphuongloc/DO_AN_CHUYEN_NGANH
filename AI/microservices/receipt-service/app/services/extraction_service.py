from __future__ import annotations

import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

DATE_PATTERNS = [
    re.compile(r"\b(\d{2}/\d{2}/\d{4})\b"),
    re.compile(r"\b(\d{2}-\d{2}-\d{4})\b"),
]
NUMBER_PATTERN = re.compile(r"(?<!\d)(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?)(?!\d)")
TOTAL_KEYWORDS = (
    "total",
    "thanh toan",
    "net total",
    "tong",
    "tien hang",
    "t.tien",
    "amount due",
)
IGNORE_AMOUNT_KEYWORDS = (
    "phone",
    "invoice",
    "hoa don",
    "gio vao",
    "gio in",
    "table",
    "guest",
    "bill no",
)


def _parse_date(raw_value: str) -> date | None:
    normalized = raw_value.replace("-", "/")
    for fmt in ("%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(normalized, fmt).date()
        except ValueError:
            continue
    return None


def _parse_decimal(raw_value: str) -> Decimal | None:
    cleaned = raw_value.strip()
    if "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(",", "")
    elif "," in cleaned:
        comma_groups = cleaned.split(",")
        if len(comma_groups) > 1 and all(len(group) == 3 for group in comma_groups[1:]):
            cleaned = "".join(comma_groups)
        else:
            cleaned = cleaned.replace(",", ".")
    elif "." in cleaned:
        dot_groups = cleaned.split(".")
        if len(dot_groups) > 1 and all(len(group) == 3 for group in dot_groups[1:]):
            cleaned = "".join(dot_groups)

    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


def _extract_amounts_from_line(line: str) -> list[Decimal]:
    amounts: list[Decimal] = []
    for match in NUMBER_PATTERN.finditer(line):
        raw_value = match.group(1)
        if "/" in line and len(raw_value) == 4 and raw_value.isdigit():
            continue
        amount = _parse_decimal(match.group(1))
        if amount is None:
            continue
        # Ignore obvious identifiers such as invoice numbers.
        if "." not in raw_value and "," not in raw_value and len(raw_value) >= 8:
            continue
        amounts.append(amount)
    return amounts


def extract_all(lines: list[str], raw_text: str) -> dict[str, str | float | None]:
    merchant_name = lines[0].strip() if lines else None

    transaction_date: date | None = None
    for pattern in DATE_PATTERNS:
        match = pattern.search(raw_text)
        if match:
            transaction_date = _parse_date(match.group(1))
            if transaction_date is not None:
                break

    preferred_amounts: list[Decimal] = []
    fallback_amounts: list[Decimal] = []

    for index, line in enumerate(lines):
        normalized_line = line.casefold()
        if any(keyword in normalized_line for keyword in IGNORE_AMOUNT_KEYWORDS):
            continue

        line_amounts = _extract_amounts_from_line(line)

        if any(keyword in normalized_line for keyword in TOTAL_KEYWORDS):
            preferred_amounts.extend(line_amounts)
            for offset in (1, 2):
                if index + offset >= len(lines):
                    break
                preferred_amounts.extend(_extract_amounts_from_line(lines[index + offset]))
            continue

        if line_amounts:
            fallback_amounts.extend(line_amounts)

    total_amount = None
    if preferred_amounts:
        total_amount = max(preferred_amounts)
    elif fallback_amounts:
        total_amount = max(fallback_amounts)

    return {
        "merchant_name": merchant_name,
        "transaction_date": transaction_date.isoformat() if transaction_date else None,
        "total_amount": float(total_amount) if total_amount is not None else None,
        "currency": "VND",
    }
