from __future__ import annotations

import re
from datetime import datetime, timedelta
from typing import Any

try:
    from underthesea import pos_tag
except Exception:  # pragma: no cover
    pos_tag = None


CATEGORY_KEYWORDS = {
    "bao hiem": "Bảo hiểm",
    "thuoc": "Sức khỏe",
    "benh vien": "Sức khỏe",
    "kham": "Sức khỏe",
    "nha khoa": "Sức khỏe",
    "an": "Ăn uống",
    "uong": "Ăn uống",
    "cafe": "Ăn uống",
    "nha hang": "Ăn uống",
    "pho": "Ăn uống",
    "com": "Ăn uống",
    "xe": "Di chuyển",
    "xang": "Di chuyển",
    "grab": "Di chuyển",
    "taxi": "Di chuyển",
    "phim": "Giải trí",
    "game": "Giải trí",
    "du lich": "Giải trí",
    "dien": "Hóa đơn",
    "nuoc": "Hóa đơn",
    "internet": "Hóa đơn",
    "wifi": "Hóa đơn",
    "tien nha": "Nhà cửa",
    "hoc": "Giáo dục",
    "sach": "Giáo dục",
    "luong": "Lương",
    "thuong": "Thưởng",
    "kinh doanh": "Kinh doanh",
    "mua sam": "Mua sắm",
    "sieu thi": "Mua sắm",
    "cho": "Mua sắm",
    "shopee": "Mua sắm",
    "tiki": "Mua sắm",
    "lazada": "Mua sắm",
}


def normalize_text(text: str) -> str:
    normalized = text.lower()
    normalized = normalized.replace("đ", "d")
    normalized = re.sub(r"[^\w\s\d.,k]", " ", normalized, flags=re.UNICODE)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    normalized = re.sub(r"(\d+)\s*xi", lambda match: str(int(match.group(1)) * 10000) + " d", normalized)
    return normalized


def parse_amount(text: str) -> float:
    match_million = re.search(r"([\d.,]+)\s*(trieu|tr)", text)
    if match_million:
        return float(match_million.group(1).replace(".", "").replace(",", ".")) * 1_000_000

    match_billion = re.search(r"([\d.,]+)\s*(ty|ti)", text)
    if match_billion:
        return float(match_billion.group(1).replace(".", "").replace(",", ".")) * 1_000_000_000

    match_thousand = re.search(r"([\d.,]+)\s*k", text)
    if match_thousand:
        return float(match_thousand.group(1).replace(".", "").replace(",", ".")) * 1_000

    cleaned_text = text.replace(".", "").replace(",", "")
    match_vnd = re.search(r"(\d+)\s*d", cleaned_text)
    if match_vnd:
        return float(match_vnd.group(1))

    all_numbers = re.findall(r"\d+", cleaned_text)
    if all_numbers:
        return float(max(int(value) for value in all_numbers))

    return 0.0


def _guess_category(normalized_text: str) -> str | None:
    for keyword, category in CATEGORY_KEYWORDS.items():
        if keyword in normalized_text:
            return category

    if pos_tag is None:
        return None

    stop_words = {
        "chi",
        "thu",
        "het",
        "khoan",
        "gia",
        "da",
        "nhan",
        "cho",
        "vao",
        "muc",
        "tien",
        "so",
        "hom",
        "qua",
        "nay",
    }
    try:
        tokens = pos_tag(normalized_text)
    except Exception:
        return None

    candidates = [word for word, tag in tokens if tag in {"N", "V", "Np"} and word not in stop_words and len(word) > 1]
    if candidates:
        return candidates[0].capitalize()
    return None


def extract_transaction_info(text: str) -> dict[str, Any]:
    normalized_text = normalize_text(text)
    income_keywords = {"thu", "luong", "nhan", "thuong", "lai", "li xi", "duoc cho"}
    transaction_type = "income" if any(keyword in normalized_text for keyword in income_keywords) else "expense"
    amount = parse_amount(normalized_text)
    category = _guess_category(normalized_text)
    if not category:
        category = "Chi tiêu khác" if transaction_type == "expense" else "Thu nhập khác"

    date = datetime.now()
    if "hom qua" in normalized_text:
        date = date - timedelta(days=1)

    return {
        "amount": amount,
        "category": category,
        "type": transaction_type,
        "date": date.strftime("%Y-%m-%d"),
        "description": text,
    }
