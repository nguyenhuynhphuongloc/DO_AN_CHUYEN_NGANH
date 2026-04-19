from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any

EXTRACTION_VERSION = "hybrid-v1"

DATE_PATTERN = re.compile(r"\b(\d{1,4}[\/\-.:]\d{1,2}[\/\-.:]\d{1,4})\b")
TIME_PATTERN = re.compile(r"\b(\d{1,2}[:h]\d{2}(?::\d{2})?)\b")
NUMBER_PATTERN = re.compile(r"(?<!\d)(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?)(?!\d)")
PHONE_PATTERN = re.compile(r"(\+?\d[\d\s().-]{7,}\d)")
RECEIPT_NUMBER_PATTERN = re.compile(
    r"(?:receipt|invoice|bill|check|order|txn|trans)(?:\s*(?:no|#|number))?[:\s-]*([A-Z0-9-]{3,})",
    re.I,
)
CASHIER_PATTERN = re.compile(r"(?:cashier|server|staff|served by|operator)[:\s-]*([A-Z0-9 ._-]{2,})", re.I)
TABLE_PATTERN = re.compile(r"\b(?:table|tbl)\b[\s:#-]*([A-Z0-9-]{1,8})", re.I)
GUEST_PATTERN = re.compile(r"(?:guest|pax|covers?)[\s:#-]*(\d{1,3})", re.I)
ADDRESS_HINT_PATTERN = re.compile(
    r"\d+.+(?:street|st|road|rd|avenue|ave|district|ward|city|building|floor|lane|blvd)",
    re.I,
)

TOTAL_KEYWORDS = ("grand total", "amount due", "balance due", "net total", "total")
SUBTOTAL_KEYWORDS = ("subtotal", "sub total", "before tax")
TAX_KEYWORDS = ("tax", "vat", "gst")
DISCOUNT_KEYWORDS = ("discount", "promo", "saving", "voucher")
SERVICE_KEYWORDS = ("service charge", "svc", "service", "tip")
PAYMENT_SUMMARY_KEYWORDS = TOTAL_KEYWORDS + SUBTOTAL_KEYWORDS + TAX_KEYWORDS + DISCOUNT_KEYWORDS + SERVICE_KEYWORDS
CASH_TENDERED_KEYWORDS = ("cash", "tender", "received", "change")
PAYMENT_METHOD_KEYWORDS = {
    "master card": "mastercard",
    "mastercard": "mastercard",
    "visa": "visa",
    "momo": "momo",
    "qr": "qr",
    "bank transfer": "bank",
    "bank": "bank",
    "credit card": "card",
    "debit card": "card",
    "card": "card",
    "cash": "cash",
}
CURRENCY_KEYWORDS = {
    "vnd": "VND",
    "usd": "USD",
    "eur": "EUR",
    "sgd": "SGD",
    "gbp": "GBP",
    "$": "USD",
    "€": "EUR",
    "£": "GBP",
    "đ": "VND",
    "₫": "VND",
}
HEADER_EXCLUDE_HINTS = (
    "http",
    "www",
    "invoice",
    "receipt",
    "bill",
    "table",
    "guest",
    "welcome",
    "thank",
    "cashier",
    "phone",
)
PROMO_HINTS = ("sale", "discount", "promo", "member", "points", "thank", "see you again", "follow us")
GENERIC_SLOGANS = ("welcome", "thank you", "sale center", "super sale", "hotline")
PHONE_LINE_HINTS = ("phone", "tel", "contact", "mobile", "hotline")
ITEM_SKIP_HINTS = PAYMENT_SUMMARY_KEYWORDS + CASH_TENDERED_KEYWORDS + (
    "invoice",
    "receipt",
    "phone",
    "table",
    "guest",
    "road",
    "street",
    "avenue",
    "address",
    "cashier",
)
METADATA_HINTS = (
    "receipt",
    "invoice",
    "bill",
    "date",
    "time",
    "phone",
    "address",
    "cashier",
    "table",
    "guest",
    "served by",
    "operator",
)


@dataclass
class Candidate:
    value: Any
    confidence: float
    source_lines: list[int]
    source_text: list[str]
    reason: str
    zone: str


def _clamp_confidence(value: float) -> float:
    return max(0.0, min(value, 1.0))


def _normalize_whitespace(value: str) -> str:
    return " ".join(value.strip().split())


def _normalize_payment_tokens(value: str) -> str:
    normalized = value
    normalized = re.sub(r"\bmaster\s*card\b", "mastercard", normalized, flags=re.I)
    normalized = re.sub(r"\bcredit\s*card\b", "card", normalized, flags=re.I)
    normalized = re.sub(r"\bdebit\s*card\b", "card", normalized, flags=re.I)
    normalized = re.sub(r"\bqr\s*code\b", "qr", normalized, flags=re.I)
    return normalized


def _normalize_line(value: str) -> str:
    normalized = value.strip()
    normalized = normalized.replace("\u2014", "-").replace("\u2013", "-")
    normalized = normalized.replace("|", " ")
    normalized = normalized.replace("•", " ")
    normalized = re.sub(r"\s+", " ", normalized)
    normalized = re.sub(r"(?<=\d)\s*[:;]\s*(?=\d)", "/", normalized)
    normalized = re.sub(r"(?<=\d)\s+[./-]\s+(?=\d)", "/", normalized)
    normalized = re.sub(r"(?<=\d)\s+(?=\d{2}\b)", ":", normalized)
    normalized = re.sub(r"\bsub\s*t0tal\b", "subtotal", normalized, flags=re.I)
    normalized = re.sub(r"\bt0tal\b", "total", normalized, flags=re.I)
    normalized = re.sub(r"\binv0ice\b", "invoice", normalized, flags=re.I)
    normalized = re.sub(r"\bdale\b", "date", normalized, flags=re.I)
    normalized = _normalize_payment_tokens(normalized)
    return _normalize_whitespace(normalized)


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


def _parse_date(raw_value: str) -> date | None:
    normalized = raw_value.strip().replace(".", "/").replace("-", "/")
    normalized = re.sub(r"(?<=\d):(?=\d)", "/", normalized)
    parts = normalized.split("/")
    if len(parts) != 3:
        return None

    if len(parts[0]) == 4:
        try:
            return datetime.strptime(normalized, "%Y/%m/%d").date()
        except ValueError:
            return None

    if len(parts[2]) == 2:
        parts[2] = f"20{parts[2]}"
        normalized = "/".join(parts)

    for fmt in ("%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(normalized, fmt).date()
        except ValueError:
            continue
    return None


def _parse_time(raw_value: str) -> str | None:
    normalized = raw_value.strip().lower().replace("h", ":").replace(".", ":")
    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            return datetime.strptime(normalized, fmt).time().isoformat(timespec="minutes")
        except ValueError:
            continue
    return None


def _extract_amounts_from_line(line: str) -> list[Decimal]:
    amounts: list[Decimal] = []
    for match in NUMBER_PATTERN.finditer(line):
        raw_value = match.group(1)
        if "/" in line and len(raw_value) == 4 and raw_value.isdigit():
            continue
        amount = _parse_decimal(raw_value)
        if amount is None:
            continue
        if "." not in raw_value and "," not in raw_value and len(raw_value) >= 8:
            continue
        amounts.append(amount)
    return amounts


def _looks_like_phone_line(line: str, raw_match: str) -> bool:
    folded = line.casefold()
    if any(hint in folded for hint in PHONE_LINE_HINTS):
        return True
    return raw_match.strip().startswith("+") or any(separator in raw_match for separator in ("(", ")", "-", "."))


def _select_best(candidates: list[Candidate]) -> Candidate | None:
    if not candidates:
        return None
    return max(candidates, key=lambda candidate: candidate.confidence)


def _select_best_amount(candidates: list[Candidate]) -> Candidate | None:
    if not candidates:
        return None
    return max(candidates, key=lambda candidate: (candidate.confidence, float(candidate.value)))


def _build_line_records(lines: list[str]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for index, raw_line in enumerate(lines):
        normalized = _normalize_line(raw_line)
        if not normalized:
            continue
        records.append(
            {
                "index": index,
                "raw": raw_line,
                "text": normalized,
                "folded": normalized.casefold(),
                "amounts": _extract_amounts_from_line(normalized),
            }
        )
    return records


def _looks_like_item_line(record: dict[str, Any]) -> bool:
    folded = record["folded"]
    if any(keyword in folded for keyword in ITEM_SKIP_HINTS):
        return False
    if DATE_PATTERN.search(record["text"]) or "www" in folded:
        return False
    if not record["amounts"]:
        return False
    if len(record["amounts"]) > 4:
        return False
    return bool(re.search(r"[A-Za-z]", record["text"]))


def _build_zones(records: list[dict[str, Any]], layout_blocks: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    zone_map: dict[int, str] = {}
    header_indices: list[int] = []
    metadata_indices: list[int] = []
    item_indices: list[int] = []
    summary_indices: list[int] = []
    footer_indices: list[int] = []
    block_map: dict[int, dict[str, Any]] = {}

    if layout_blocks:
        label_to_zone = {
            "header": "header",
            "items": "item_table",
            "totals": "payment_summary",
            "payment_info": "payment_summary",
            "footer": "footer",
            "metadata": "metadata",
        }
        for block in layout_blocks:
            zone = label_to_zone.get(str(block.get("label") or "metadata"), "metadata")
            for line_index in block.get("line_indices") or []:
                block_map[int(line_index)] = {
                    "zone": zone,
                    "label": block.get("label"),
                    "index": block.get("index"),
                    "raw_label": block.get("raw_label"),
                }

    summary_start: int | None = None
    for record in records:
        folded = record["folded"]
        if any(keyword in folded for keyword in PAYMENT_SUMMARY_KEYWORDS + CASH_TENDERED_KEYWORDS + tuple(PAYMENT_METHOD_KEYWORDS.keys())):
            summary_start = record["index"]
            break

    item_start: int | None = None
    for record in records:
        if _looks_like_item_line(record):
            item_start = record["index"]
            break

    for position, record in enumerate(records):
        idx = record["index"]
        layout_entry = block_map.get(idx)
        if layout_entry is not None:
            zone = layout_entry["zone"]
            zone_map[idx] = zone
            record["layout_block_index"] = layout_entry.get("index")
            record["layout_block_label"] = layout_entry.get("label")
            if zone == "header":
                header_indices.append(idx)
            elif zone == "metadata":
                metadata_indices.append(idx)
            elif zone == "item_table":
                item_indices.append(idx)
            elif zone == "payment_summary":
                summary_indices.append(idx)
            else:
                footer_indices.append(idx)
            continue
        folded = record["folded"]
        if position < 3 and idx < (item_start if item_start is not None else 9999):
            zone = "header"
        elif any(hint in folded for hint in METADATA_HINTS) or DATE_PATTERN.search(record["text"]) or TIME_PATTERN.search(record["text"]) or ADDRESS_HINT_PATTERN.search(record["text"]):
            zone = "metadata"
        elif summary_start is not None and idx >= summary_start:
            zone = "payment_summary"
        elif _looks_like_item_line(record):
            zone = "item_table"
        else:
            zone = "metadata" if idx < (summary_start if summary_start is not None else idx + 1) else "footer"

        if zone == "payment_summary" and any(hint in folded for hint in PROMO_HINTS + ("www", "follow us")):
            zone = "footer"

        zone_map[idx] = zone
        if zone == "header":
            header_indices.append(idx)
        elif zone == "metadata":
            metadata_indices.append(idx)
        elif zone == "item_table":
            item_indices.append(idx)
        elif zone == "payment_summary":
            summary_indices.append(idx)
        else:
            footer_indices.append(idx)

    if not footer_indices and summary_indices:
        trailing = [record["index"] for record in records if record["index"] > summary_indices[-1]]
        footer_indices.extend(trailing)
        for idx in trailing:
            zone_map[idx] = "footer"

    return {
        "line_zones": zone_map,
        "header": header_indices,
        "metadata": metadata_indices,
        "item_table": item_indices,
        "payment_summary": summary_indices,
        "footer": footer_indices,
        "layout_line_map": block_map,
    }


def _build_normalized_payload(
    lines: list[str],
    raw_text: str,
    layout_blocks: list[dict[str, Any]] | None = None,
) -> tuple[list[dict[str, Any]], dict[str, Any], dict[str, Any]]:
    records = _build_line_records(lines)
    zones = _build_zones(records, layout_blocks)
    normalized_lines = [record["text"] for record in records]
    payload = {
        "raw_text": raw_text,
        "normalized_text": "\n".join(normalized_lines),
        "normalized_lines": normalized_lines,
    }
    zone_payload = {
        "line_zones": zones["line_zones"],
        "header": [record["text"] for record in records if zones["line_zones"].get(record["index"]) == "header"],
        "metadata": [record["text"] for record in records if zones["line_zones"].get(record["index"]) == "metadata"],
        "item_table": [record["text"] for record in records if zones["line_zones"].get(record["index"]) == "item_table"],
        "payment_summary": [record["text"] for record in records if zones["line_zones"].get(record["index"]) == "payment_summary"],
        "footer": [record["text"] for record in records if zones["line_zones"].get(record["index"]) == "footer"],
        "layout_line_map": zones["layout_line_map"],
    }
    return records, payload, zone_payload


def _build_field_provenance(source_lines: dict[str, Any], layout_line_map: dict[int, dict[str, Any]]) -> dict[str, Any]:
    provenance: dict[str, Any] = {}
    for field_name, trace in source_lines.items():
        if not isinstance(trace, dict):
            continue
        for line_index in trace.get("source_lines") or []:
            layout_entry = layout_line_map.get(int(line_index))
            if not layout_entry:
                continue
            provenance[field_name] = {
                "layout_block_index": layout_entry.get("index"),
                "layout_block_label": layout_entry.get("label"),
                "zone": layout_entry.get("zone"),
            }
            break
    return provenance


def _merchant_candidates(records: list[dict[str, Any]], zones: dict[str, Any]) -> list[Candidate]:
    candidates: list[Candidate] = []
    for record in records[:8]:
        zone = zones["line_zones"].get(record["index"], "metadata")
        folded = record["folded"]
        if any(hint in folded for hint in HEADER_EXCLUDE_HINTS):
            continue
        if any(token in folded for token in PAYMENT_METHOD_KEYWORDS.keys()):
            continue
        if any(keyword in folded for keyword in PAYMENT_SUMMARY_KEYWORDS + CASH_TENDERED_KEYWORDS):
            continue
        if any(hint in folded for hint in METADATA_HINTS) or DATE_PATTERN.search(record["text"]):
            continue
        if zone == "item_table" or _looks_like_item_line(record):
            continue
        if any(slogan in folded for slogan in GENERIC_SLOGANS):
            continue
        if PHONE_PATTERN.search(record["text"]):
            continue
        letters_only = re.sub(r"[^A-Za-z]", "", record["text"])
        if len(letters_only) < 3:
            continue

        score = 0.36
        if zone == "header":
            score += 0.2
        if record["index"] == 0:
            score += 0.08
        if record["text"] == record["text"].upper():
            score += 0.08
        if any(ch.isdigit() for ch in record["text"]):
            score -= 0.16
        if ADDRESS_HINT_PATTERN.search(record["text"]):
            score -= 0.18
        if any(hint in folded for hint in PROMO_HINTS):
            score -= 0.18
        candidates.append(
            Candidate(record["text"], _clamp_confidence(score), [record["index"]], [record["text"]], "merchant_candidate", zone)
        )
    return candidates


def _date_candidates(records: list[dict[str, Any]], raw_text: str, zones: dict[str, Any]) -> list[Candidate]:
    candidates: list[Candidate] = []
    for record in records:
        for match in DATE_PATTERN.finditer(record["text"]):
            parsed = _parse_date(match.group(1))
            if parsed is None:
                continue
            score = 0.5
            if zones["line_zones"].get(record["index"]) == "metadata":
                score += 0.08
            if any(hint in record["folded"] for hint in ("date", "issued", "time")):
                score += 0.1
            candidates.append(
                Candidate(parsed.isoformat(), _clamp_confidence(score), [record["index"]], [record["text"]], "date_candidate", zones["line_zones"].get(record["index"], "metadata"))
            )

    if not candidates:
        for match in DATE_PATTERN.finditer(raw_text):
            parsed = _parse_date(match.group(1))
            if parsed is None:
                continue
            candidates.append(Candidate(parsed.isoformat(), 0.42, [], [match.group(1)], "raw_text_date_candidate", "raw"))
    return candidates


def _currency_candidates(records: list[dict[str, Any]], zones: dict[str, Any]) -> list[Candidate]:
    candidates: list[Candidate] = []
    for record in records:
        zone = zones["line_zones"].get(record["index"], "metadata")
        for token, currency in CURRENCY_KEYWORDS.items():
            if token in record["folded"] or token in record["text"]:
                score = 0.44
                if zone == "payment_summary":
                    score += 0.15
                if record["amounts"]:
                    score += 0.08
                candidates.append(
                    Candidate(currency, _clamp_confidence(score), [record["index"]], [record["text"]], "currency_candidate", zone)
                )
    return candidates


def _amount_candidates(records: list[dict[str, Any]], zones: dict[str, Any]) -> dict[str, list[Candidate]]:
    buckets: dict[str, list[Candidate]] = {
        "total_amount": [],
        "subtotal_amount": [],
        "tax_amount": [],
        "discount_amount": [],
        "service_charge": [],
    }
    for record in records:
        zone = zones["line_zones"].get(record["index"], "metadata")
        folded = record["folded"]
        amounts = record["amounts"]
        if not amounts:
            continue

        target = "total_amount"
        score = 0.22 if zone == "item_table" else 0.35
        if any(keyword in folded for keyword in SUBTOTAL_KEYWORDS):
            target = "subtotal_amount"
            score = 0.72
        elif any(keyword in folded for keyword in TOTAL_KEYWORDS):
            target = "total_amount"
            score = 0.82
        elif any(keyword in folded for keyword in TAX_KEYWORDS):
            target = "tax_amount"
            score = 0.72
        elif any(keyword in folded for keyword in DISCOUNT_KEYWORDS):
            target = "discount_amount"
            score = 0.68
        elif any(keyword in folded for keyword in SERVICE_KEYWORDS):
            target = "service_charge"
            score = 0.68
        elif any(keyword in folded for keyword in CASH_TENDERED_KEYWORDS):
            score = 0.08

        if zone == "payment_summary":
            score += 0.08
        if any(keyword in folded for keyword in ("change", "received")) and target == "total_amount":
            score -= 0.18

        for amount in amounts:
            amount_score = score
            if amount <= 0:
                amount_score -= 0.4
            buckets[target].append(
                Candidate(
                    float(amount),
                    _clamp_confidence(amount_score),
                    [record["index"]],
                    [record["text"]],
                    f"{target}_candidate",
                    zone,
                )
            )

        if target == "total_amount" and any(keyword in folded for keyword in TOTAL_KEYWORDS):
            for offset in (1, 2):
                neighbor_index = record["index"] + offset
                neighbor = next((item for item in records if item["index"] == neighbor_index), None)
                if neighbor is None:
                    break
                for amount in neighbor["amounts"]:
                    buckets["total_amount"].append(
                        Candidate(
                            float(amount),
                            0.6 - (offset * 0.05),
                            [record["index"], neighbor_index],
                            [record["text"], neighbor["text"]],
                            "total_neighbor_candidate",
                            zone,
                        )
                    )
    return buckets


def _payment_method_candidates(records: list[dict[str, Any]], zones: dict[str, Any]) -> list[Candidate]:
    candidates: list[Candidate] = []
    for record in records:
        zone = zones["line_zones"].get(record["index"], "metadata")
        for token, label in PAYMENT_METHOD_KEYWORDS.items():
            if token in record["folded"]:
                score = 0.52
                if any(keyword in record["folded"] for keyword in ("payment", "paid", "method")):
                    score += 0.16
                if zone == "payment_summary":
                    score += 0.08
                candidates.append(
                    Candidate(label, _clamp_confidence(score), [record["index"]], [record["text"]], "payment_method_candidate", zone)
                )
                break
    return candidates


def _labeled_field_candidates(records: list[dict[str, Any]], zones: dict[str, Any]) -> dict[str, list[Candidate]]:
    fields: dict[str, list[Candidate]] = {
        "receipt_number": [],
        "merchant_phone": [],
        "merchant_address": [],
        "cashier_name": [],
        "table_number": [],
        "guest_count": [],
        "time_in": [],
        "time_out": [],
    }
    for record in records:
        zone = zones["line_zones"].get(record["index"], "metadata")
        if match := RECEIPT_NUMBER_PATTERN.search(record["text"]):
            fields["receipt_number"].append(Candidate(match.group(1), 0.74, [record["index"]], [record["text"]], "receipt_number_candidate", zone))
        if match := PHONE_PATTERN.search(record["text"]):
            digits_only = re.sub(r"\D", "", match.group(1))
            if len(digits_only) >= 9 and not DATE_PATTERN.search(record["text"]) and _looks_like_phone_line(record["text"], match.group(1)):
                fields["merchant_phone"].append(
                    Candidate(_normalize_whitespace(match.group(1)), 0.58, [record["index"]], [record["text"]], "merchant_phone_candidate", zone)
                )
        if ADDRESS_HINT_PATTERN.search(record["text"]):
            fields["merchant_address"].append(Candidate(record["text"], 0.58, [record["index"]], [record["text"]], "merchant_address_candidate", zone))
        if match := CASHIER_PATTERN.search(record["text"]):
            fields["cashier_name"].append(
                Candidate(_normalize_whitespace(match.group(1)), 0.66, [record["index"]], [record["text"]], "cashier_name_candidate", zone)
            )
        if match := TABLE_PATTERN.search(record["text"]):
            fields["table_number"].append(Candidate(match.group(1), 0.62, [record["index"]], [record["text"]], "table_number_candidate", zone))
        if match := GUEST_PATTERN.search(record["text"]):
            fields["guest_count"].append(Candidate(int(match.group(1)), 0.62, [record["index"]], [record["text"]], "guest_count_candidate", zone))

        if "time in" in record["folded"] or record["folded"].startswith("in "):
            for match in TIME_PATTERN.finditer(record["text"]):
                parsed = _parse_time(match.group(1))
                if parsed:
                    fields["time_in"].append(Candidate(parsed, 0.62, [record["index"]], [record["text"]], "time_in_candidate", zone))
        if "time out" in record["folded"] or record["folded"].startswith("out "):
            for match in TIME_PATTERN.finditer(record["text"]):
                parsed = _parse_time(match.group(1))
                if parsed:
                    fields["time_out"].append(Candidate(parsed, 0.62, [record["index"]], [record["text"]], "time_out_candidate", zone))
    return fields


def _item_candidates(records: list[dict[str, Any]], zones: dict[str, Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for record in records:
        if zones["line_zones"].get(record["index"]) != "item_table":
            continue
        if not _looks_like_item_line(record):
            continue
        amount_texts = NUMBER_PATTERN.findall(record["text"])
        if not amount_texts:
            continue
        line_total = _parse_decimal(amount_texts[-1])
        if line_total is None:
            continue

        name_part = record["text"]
        for amount_text in amount_texts:
            name_part = name_part.replace(amount_text, " ", 1)
        name_part = _normalize_whitespace(re.sub(r"\b\d+(?:[.,]\d+)?\s*x\b", " ", name_part, flags=re.I))
        name_part = _normalize_whitespace(re.sub(r"\bx\b$", " ", name_part, flags=re.I))
        if len(name_part) < 3 or not re.search(r"[A-Za-z]", name_part):
            continue

        quantity = None
        unit_price = None
        qty_match = re.search(r"(\d+(?:[.,]\d+)?)\s*x", record["text"], re.I)
        if qty_match:
            quantity = _parse_decimal(qty_match.group(1))
        if quantity is not None and len(record["amounts"]) >= 2:
            unit_price = record["amounts"][-2]

        items.append(
            {
                "name": name_part,
                "quantity": float(quantity) if quantity is not None else None,
                "unit_price": float(unit_price) if unit_price is not None else None,
                "line_total": float(line_total),
                "confidence": 0.72 if quantity is not None or unit_price is not None else 0.58,
                "source_lines": [record["index"]],
            }
        )
    return items


def _validate_merchant(candidate: Candidate | None, notes: list[str]) -> Candidate | None:
    if candidate is None:
        notes.append("merchant missing or weak")
        return None
    cleaned = str(candidate.value).strip()
    if not cleaned or not re.search(r"[A-Za-z]", cleaned):
        notes.append("merchant candidate rejected as non-text")
        return None
    return candidate


def _validate_total(candidate: Candidate | None, notes: list[str]) -> Candidate | None:
    if candidate is None:
        notes.append("total missing or weak")
        return None
    try:
        if float(candidate.value) <= 0:
            notes.append("total rejected because it is not positive")
            return None
    except (TypeError, ValueError):
        notes.append("total rejected because it is invalid")
        return None
    return candidate


def _validate_supporting_totals(
    total: Candidate | None,
    subtotal: Candidate | None,
    tax: Candidate | None,
    discount: Candidate | None,
    service_charge: Candidate | None,
    notes: list[str],
) -> tuple[Candidate | None, list[str]]:
    review_hints: list[str] = []
    if total is None:
        return total, review_hints

    subtotal_value = float(subtotal.value) if subtotal else None
    tax_value = float(tax.value) if tax else 0.0
    discount_value = float(discount.value) if discount else 0.0
    service_value = float(service_charge.value) if service_charge else 0.0
    if subtotal_value is None:
        return total, review_hints

    expected_total = subtotal_value + tax_value + service_value - discount_value
    if abs(expected_total - float(total.value)) > max(1.0, float(total.value) * 0.1):
        notes.append("supporting totals do not align with total amount")
        review_hints.extend(["subtotal_amount", "total_amount"])
    return total, review_hints


def _build_trace(candidate: Candidate | None) -> dict[str, Any] | None:
    if candidate is None:
        return None
    return {
        "confidence": round(candidate.confidence, 4),
        "source_lines": candidate.source_lines,
        "source_text": candidate.source_text,
        "reason": candidate.reason,
        "zone": candidate.zone,
    }


def extract_all(lines: list[str], raw_text: str, layout_blocks: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    records, normalized_payload, zone_payload = _build_normalized_payload(lines, raw_text, layout_blocks)
    notes: list[str] = []

    merchant = _validate_merchant(_select_best(_merchant_candidates(records, zone_payload)), notes)
    date_candidate = _select_best(_date_candidates(records, raw_text, zone_payload))
    amount_groups = _amount_candidates(records, zone_payload)
    total_amount = _validate_total(_select_best_amount(amount_groups["total_amount"]), notes)
    subtotal_amount = _select_best_amount(amount_groups["subtotal_amount"])
    tax_amount = _select_best_amount(amount_groups["tax_amount"])
    discount_amount = _select_best_amount(amount_groups["discount_amount"])
    service_charge = _select_best_amount(amount_groups["service_charge"])
    total_amount, support_review_hints = _validate_supporting_totals(
        total_amount,
        subtotal_amount,
        tax_amount,
        discount_amount,
        service_charge,
        notes,
    )
    payment_method = _select_best(_payment_method_candidates(records, zone_payload))
    currency = _select_best(_currency_candidates(records, zone_payload))
    labeled_fields = _labeled_field_candidates(records, zone_payload)
    items = _item_candidates(records, zone_payload)

    field_confidence: dict[str, float | None] = {
        "merchant_name": round(merchant.confidence, 4) if merchant else None,
        "transaction_date": round(date_candidate.confidence, 4) if date_candidate else None,
        "total_amount": round(total_amount.confidence, 4) if total_amount else None,
        "currency": round(currency.confidence, 4) if currency else None,
        "payment_method": round(payment_method.confidence, 4) if payment_method else None,
        "subtotal_amount": round(subtotal_amount.confidence, 4) if subtotal_amount else None,
        "tax_amount": round(tax_amount.confidence, 4) if tax_amount else None,
        "discount_amount": round(discount_amount.confidence, 4) if discount_amount else None,
        "service_charge": round(service_charge.confidence, 4) if service_charge else None,
        "receipt_number": round(_select_best(labeled_fields["receipt_number"]).confidence, 4) if _select_best(labeled_fields["receipt_number"]) else None,
        "merchant_phone": round(_select_best(labeled_fields["merchant_phone"]).confidence, 4) if _select_best(labeled_fields["merchant_phone"]) else None,
        "merchant_address": round(_select_best(labeled_fields["merchant_address"]).confidence, 4) if _select_best(labeled_fields["merchant_address"]) else None,
        "cashier_name": round(_select_best(labeled_fields["cashier_name"]).confidence, 4) if _select_best(labeled_fields["cashier_name"]) else None,
        "table_number": round(_select_best(labeled_fields["table_number"]).confidence, 4) if _select_best(labeled_fields["table_number"]) else None,
        "guest_count": round(_select_best(labeled_fields["guest_count"]).confidence, 4) if _select_best(labeled_fields["guest_count"]) else None,
        "time_in": round(_select_best(labeled_fields["time_in"]).confidence, 4) if _select_best(labeled_fields["time_in"]) else None,
        "time_out": round(_select_best(labeled_fields["time_out"]).confidence, 4) if _select_best(labeled_fields["time_out"]) else None,
    }

    selected_fields = {
        "merchant_name": str(merchant.value) if merchant else None,
        "transaction_date": str(date_candidate.value) if date_candidate else None,
        "total_amount": float(total_amount.value) if total_amount else None,
        "currency": str(currency.value) if currency and currency.confidence >= 0.5 else None,
        "subtotal_amount": float(subtotal_amount.value) if subtotal_amount and subtotal_amount.confidence >= 0.55 else None,
        "tax_amount": float(tax_amount.value) if tax_amount and tax_amount.confidence >= 0.55 else None,
        "discount_amount": float(discount_amount.value) if discount_amount and discount_amount.confidence >= 0.55 else None,
        "service_charge": float(service_charge.value) if service_charge and service_charge.confidence >= 0.55 else None,
        "payment_method": str(payment_method.value) if payment_method and payment_method.confidence >= 0.5 else None,
        "receipt_number": str(_select_best(labeled_fields["receipt_number"]).value) if _select_best(labeled_fields["receipt_number"]) else None,
        "merchant_address": str(_select_best(labeled_fields["merchant_address"]).value) if _select_best(labeled_fields["merchant_address"]) else None,
        "merchant_phone": str(_select_best(labeled_fields["merchant_phone"]).value) if _select_best(labeled_fields["merchant_phone"]) else None,
        "cashier_name": str(_select_best(labeled_fields["cashier_name"]).value) if _select_best(labeled_fields["cashier_name"]) else None,
        "table_number": str(_select_best(labeled_fields["table_number"]).value) if _select_best(labeled_fields["table_number"]) else None,
        "guest_count": int(_select_best(labeled_fields["guest_count"]).value) if _select_best(labeled_fields["guest_count"]) else None,
        "time_in": str(_select_best(labeled_fields["time_in"]).value) if _select_best(labeled_fields["time_in"]) else None,
        "time_out": str(_select_best(labeled_fields["time_out"]).value) if _select_best(labeled_fields["time_out"]) else None,
    }

    source_lines = {
        "merchant_name": _build_trace(merchant),
        "transaction_date": _build_trace(date_candidate),
        "total_amount": _build_trace(total_amount),
        "currency": _build_trace(currency),
        "subtotal_amount": _build_trace(subtotal_amount),
        "tax_amount": _build_trace(tax_amount),
        "discount_amount": _build_trace(discount_amount),
        "service_charge": _build_trace(service_charge),
        "payment_method": _build_trace(payment_method),
        "receipt_number": _build_trace(_select_best(labeled_fields["receipt_number"])),
        "merchant_phone": _build_trace(_select_best(labeled_fields["merchant_phone"])),
        "merchant_address": _build_trace(_select_best(labeled_fields["merchant_address"])),
        "cashier_name": _build_trace(_select_best(labeled_fields["cashier_name"])),
        "table_number": _build_trace(_select_best(labeled_fields["table_number"])),
        "guest_count": _build_trace(_select_best(labeled_fields["guest_count"])),
        "time_in": _build_trace(_select_best(labeled_fields["time_in"])),
        "time_out": _build_trace(_select_best(labeled_fields["time_out"])),
    }
    field_provenance = _build_field_provenance(source_lines, zone_payload.get("layout_line_map") or {})

    needs_review_fields = [
        field_name
        for field_name, confidence in field_confidence.items()
        if field_name in {"merchant_name", "transaction_date", "total_amount", "currency", "payment_method"} and (confidence is None or confidence < 0.65)
    ]
    if selected_fields["merchant_name"] is None:
        needs_review_fields.append("merchant_name")
    if selected_fields["transaction_date"] is None:
        needs_review_fields.append("transaction_date")
    if selected_fields["total_amount"] is None:
        needs_review_fields.append("total_amount")
    needs_review_fields.extend(support_review_hints)

    description_text = " | ".join(item["name"] for item in items[:5]) if items else " ".join(zone_payload["item_table"][:3] or zone_payload["metadata"][:2])
    extracted_json = {
        "normalized_text": normalized_payload,
        "zones": {key: value for key, value in zone_payload.items() if key != "line_zones"},
        "fields": selected_fields,
        "items": items,
        "field_confidence": field_confidence,
        "source_lines": source_lines,
        "field_provenance": field_provenance,
        "needs_review_fields": sorted(set(needs_review_fields)),
        "description_text": description_text or None,
        "extraction_version": EXTRACTION_VERSION,
        "extraction_notes": notes,
    }

    top_level_confidences = [
        confidence
        for key, confidence in field_confidence.items()
        if key in {"merchant_name", "transaction_date", "total_amount", "currency", "payment_method"} and confidence is not None
    ]
    overall_confidence = sum(top_level_confidences) / len(top_level_confidences) if top_level_confidences else 0.0

    return {
        "merchant_name": selected_fields["merchant_name"],
        "transaction_date": selected_fields["transaction_date"],
        "total_amount": selected_fields["total_amount"],
        "tax_amount": selected_fields["tax_amount"],
        "currency": selected_fields["currency"],
        "confidence_score": round(overall_confidence, 4),
        "extracted_json": extracted_json,
    }
