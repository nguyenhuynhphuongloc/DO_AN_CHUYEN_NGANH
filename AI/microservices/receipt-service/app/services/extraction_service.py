from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation

DATE_PATTERN = re.compile(r"(?<!\d)(\d{1,2})[\/.\-\s](\d{1,2})[\/.\-\s](\d{2,4})(?!\d)")
NUMBER_PATTERN = re.compile(r"(?<!\d)(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?)(?!\d)")

MERCHANT_EXCLUDE_KEYWORDS = (
    "dt",
    "dien thoai",
    "hotline",
    "mst",
    "ma so thue",
    "tax code",
    "dia chi",
    "address",
    "cashier",
    "thu ngan",
    "ban",
    "table",
)
ADDRESS_HINTS = ("dia chi", "address", "duong", "street", "phuong", "quan", "ward", "district", "tp", "hcm", "ha noi")
PAYMENT_METHOD_KEYWORDS = {
    "cash": "cash",
    "tien mat": "cash",
    "visa": "card",
    "mastercard": "card",
    "the": "card",
    "credit": "card",
    "debit": "card",
    "momo": "momo",
    "zalopay": "zalopay",
    "banking": "bank_transfer",
    "chuyen khoan": "bank_transfer",
    "qr": "qr_payment",
}
RECEIPT_NUMBER_HINTS = ("so hd", "so hoa don", "receipt", "bill no", "invoice", "check no", "ma gd")
TOTAL_KEYWORDS = ("tong thanh toan", "tong cong", "can thanh toan", "phai tra", "tong tien", "thanh tien", "total", "amount due", "grand total")
SUBTOTAL_KEYWORDS = ("tam tinh", "subtotal", "tien hang", "sub total", "cong tien hang")
TAX_KEYWORDS = ("vat", "thue", "tax", "gtgt")
DISCOUNT_KEYWORDS = ("giam gia", "discount", "promo", "khuyen mai")
SERVICE_CHARGE_KEYWORDS = ("phi phuc vu", "service charge", "phu thu")
IGNORE_AMOUNT_KEYWORDS = ("phone", "invoice no", "table", "guest", "hotline")
CURRENCY_KEYWORDS = {
    "vnd": "VND",
    "vnđ": "VND",
    "dong": "VND",
    "usd": "USD",
    "$": "USD",
}


@dataclass
class AmountCandidate:
    label: str
    amount: Decimal
    line_index: int
    line_text: str
    score: int


def _normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.casefold())
    stripped = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    stripped = stripped.replace("đ", "d")
    cleaned = re.sub(r"[^a-z0-9%/\-.,: ]+", " ", stripped)
    return re.sub(r"\s+", " ", cleaned).strip()


def _parse_date_from_parts(day: str, month: str, year: str) -> date | None:
    try:
        year_int = int(year)
        if year_int < 100:
            year_int += 2000 if year_int < 70 else 1900
        return date(year_int, int(month), int(day))
    except ValueError:
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
        if len(raw_value) >= 8 and "." not in raw_value and "," not in raw_value:
            continue
        amount = _parse_decimal(raw_value)
        if amount is not None:
            amounts.append(amount)
    return amounts


def _detect_currency(lines: list[str]) -> str | None:
    for line in lines:
        normalized = _normalize_text(line)
        for keyword, currency in CURRENCY_KEYWORDS.items():
            if keyword in normalized or keyword in line.casefold():
                return currency
    return None


def _extract_transaction_date(lines: list[str], raw_text: str) -> date | None:
    searchable = "\n".join(lines) if lines else raw_text
    for match in DATE_PATTERN.finditer(searchable):
        parsed = _parse_date_from_parts(*match.groups())
        if parsed is not None and parsed.year >= 2000:
            return parsed
    return None


def _score_merchant_candidate(line: str, index: int) -> int:
    normalized = _normalize_text(line)
    if not normalized:
        return -100
    if any(keyword in normalized for keyword in MERCHANT_EXCLUDE_KEYWORDS):
        return -50
    if NUMBER_PATTERN.search(line):
        return -10

    score = 50 - (index * 8)
    if line.isupper():
        score += 10
    if len(line) <= 36:
        score += 6
    if "&" in line or "-" in line:
        score += 1
    return score


def _extract_merchant_name(lines: list[str]) -> str | None:
    candidates = [(line.strip(), _score_merchant_candidate(line, index)) for index, line in enumerate(lines[:8])]
    candidates = [candidate for candidate in candidates if candidate[1] > 0]
    if not candidates:
        return None
    return max(candidates, key=lambda item: item[1])[0]


def _extract_optional_address(lines: list[str]) -> str | None:
    for line in lines[:10]:
        normalized = _normalize_text(line)
        if any(keyword in normalized for keyword in ADDRESS_HINTS):
            return line.strip()
    return None


def _extract_receipt_number(lines: list[str]) -> str | None:
    for line in lines[:12]:
        normalized = _normalize_text(line)
        if any(keyword in normalized for keyword in RECEIPT_NUMBER_HINTS):
            parts = re.split(r"[:#]", line, maxsplit=1)
            return parts[-1].strip() if parts else line.strip()
    return None


def _extract_payment_method(lines: list[str]) -> str | None:
    for line in lines:
        normalized = _normalize_text(line)
        for keyword, method in PAYMENT_METHOD_KEYWORDS.items():
            if keyword in normalized:
                return method
    return None


def _amount_label(normalized_line: str) -> tuple[str | None, int]:
    if any(keyword in normalized_line for keyword in DISCOUNT_KEYWORDS):
        return "discount_amount", 80
    if any(keyword in normalized_line for keyword in SERVICE_CHARGE_KEYWORDS):
        return "service_charge", 75
    if any(keyword in normalized_line for keyword in TAX_KEYWORDS):
        return "tax_amount", 85
    if any(keyword in normalized_line for keyword in SUBTOTAL_KEYWORDS):
        return "subtotal_amount", 70
    if any(keyword in normalized_line for keyword in TOTAL_KEYWORDS):
        return "total_amount", 100
    return None, 0


def _collect_amount_candidates(lines: list[str]) -> list[AmountCandidate]:
    candidates: list[AmountCandidate] = []
    for index, line in enumerate(lines):
        normalized = _normalize_text(line)
        if any(keyword in normalized for keyword in IGNORE_AMOUNT_KEYWORDS):
            continue

        label, base_score = _amount_label(normalized)
        line_amounts = _extract_amounts_from_line(line)
        if not line_amounts:
            continue

        for amount in line_amounts:
            score = base_score
            if amount >= Decimal("1000"):
                score += 5
            if index < 8:
                score += 1
            candidates.append(
                AmountCandidate(
                    label=label or "fallback_amount",
                    amount=amount,
                    line_index=index,
                    line_text=line.strip(),
                    score=score,
                )
            )
    return candidates


def _select_amount(candidates: list[AmountCandidate], label: str) -> Decimal | None:
    matching = [candidate for candidate in candidates if candidate.label == label]
    if not matching:
        return None
    if label == "discount_amount":
        return max(matching, key=lambda candidate: (candidate.score, abs(candidate.amount))).amount
    return max(matching, key=lambda candidate: (candidate.score, candidate.amount)).amount


def _fallback_total(candidates: list[AmountCandidate]) -> Decimal | None:
    fallback_candidates = [candidate.amount for candidate in candidates if candidate.label in {"total_amount", "fallback_amount"}]
    if not fallback_candidates:
        return None
    return max(fallback_candidates)


def _extract_items(lines: list[str], amount_candidates: list[AmountCandidate]) -> list[dict[str, float | str]] | None:
    items: list[dict[str, float | str]] = []
    used_indices = {candidate.line_index for candidate in amount_candidates if candidate.label != "fallback_amount"}
    for index, line in enumerate(lines):
        if index in used_indices:
            continue
        normalized = _normalize_text(line)
        if any(
            keyword in normalized
            for keyword in (
                *TOTAL_KEYWORDS,
                *SUBTOTAL_KEYWORDS,
                *TAX_KEYWORDS,
                *DISCOUNT_KEYWORDS,
                *SERVICE_CHARGE_KEYWORDS,
                *MERCHANT_EXCLUDE_KEYWORDS,
                *RECEIPT_NUMBER_HINTS,
            )
        ):
            continue
        if DATE_PATTERN.search(line):
            continue

        amounts = _extract_amounts_from_line(line)
        if not amounts or len(line.strip()) < 4:
            continue
        if len(amounts) == 1 and amounts[0] < Decimal("1000"):
            continue

        name = NUMBER_PATTERN.sub("", line).strip(" .:-")
        if len(name) < 2:
            continue
        items.append({"name": name, "amount": float(amounts[-1]), "line": line.strip()})
        if len(items) >= 12:
            break
    return items or None


def _compact_optional_payload(payload: dict[str, object | None]) -> dict[str, object | None]:
    return {key: value for key, value in payload.items() if value is not None}


def extract_all(lines: list[str], raw_text: str) -> dict[str, object | None]:
    merchant_name = _extract_merchant_name(lines)
    transaction_date = _extract_transaction_date(lines, raw_text)
    currency = _detect_currency(lines)

    amount_candidates = _collect_amount_candidates(lines)
    subtotal_amount = _select_amount(amount_candidates, "subtotal_amount")
    tax_amount = _select_amount(amount_candidates, "tax_amount")
    discount_amount = _select_amount(amount_candidates, "discount_amount")
    service_charge = _select_amount(amount_candidates, "service_charge")
    total_amount = _select_amount(amount_candidates, "total_amount") or _fallback_total(amount_candidates)

    optional_payload = _compact_optional_payload(
        {
            "merchant_address": _extract_optional_address(lines),
            "receipt_number": _extract_receipt_number(lines),
            "payment_method": _extract_payment_method(lines),
            "subtotal_amount": float(subtotal_amount) if subtotal_amount is not None else None,
            "discount_amount": float(discount_amount) if discount_amount is not None else None,
            "service_charge": float(service_charge) if service_charge is not None else None,
            "items": _extract_items(lines, amount_candidates),
        }
    )

    return {
        "merchant_name": merchant_name,
        "transaction_date": transaction_date.isoformat() if transaction_date else None,
        "total_amount": float(total_amount) if total_amount is not None else None,
        "tax_amount": float(tax_amount) if tax_amount is not None else None,
        "currency": currency,
        "extracted_json": optional_payload,
    }
