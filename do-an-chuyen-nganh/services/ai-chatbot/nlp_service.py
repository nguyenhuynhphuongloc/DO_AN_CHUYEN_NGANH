import re
import os
from datetime import datetime, timedelta
from unidecode import unidecode
from typing import Dict, Any


def _to_ascii(text: str) -> str:
    """Convert Vietnamese text to ASCII lowercase for reliable keyword matching."""
    return unidecode(text).lower()


CATEGORY_KEYWORDS = {
    # Sức khỏe
    "bao hiem": "Bảo hiểm",
    "thuoc": "Sức khỏe",
    "benh vien": "Sức khỏe",
    "kham": "Sức khỏe",
    "nha khoa": "Sức khỏe",
    "bac si": "Sức khỏe",
    "nha thuoc": "Sức khỏe",
    # Ăn uống
    "an": "Ăn uống",
    "uong": "Ăn uống",
    "cafe": "Ăn uống",
    "ca phe": "Ăn uống",
    "nha hang": "Ăn uống",
    "pho": "Ăn uống",
    "bun": "Ăn uống",
    "com": "Ăn uống",
    "banh mi": "Ăn uống",
    "tra sua": "Ăn uống",
    "family mart": "Ăn uống",
    "winmart": "Ăn uống",
    "circle k": "Ăn uống",
    "gs25": "Ăn uống",
    "grabfood": "Ăn uống",
    "shopeefood": "Ăn uống",
    "baemin": "Ăn uống",
    # Di chuyển
    "xe": "Di chuyển",
    "xang": "Di chuyển",
    "grab": "Di chuyển",
    "taxi": "Di chuyển",
    "may bay": "Di chuyển",
    "xe buyt": "Di chuyển",
    "bus": "Di chuyển",
    "uber": "Di chuyển",
    "be": "Di chuyển",
    # Giải trí
    "phim": "Giải trí",
    "rap chieu": "Giải trí",
    "game": "Giải trí",
    "netflix": "Giải trí",
    "spotify": "Giải trí",
    "karaoke": "Giải trí",
    # Hóa đơn
    "dien": "Hóa đơn",
    "nuoc": "Hóa đơn",
    "internet": "Hóa đơn",
    "wifi": "Hóa đơn",
    "vien thong": "Hóa đơn",
    # Nhà cửa
    "thue nha": "Nhà cửa",
    "tien nha": "Nhà cửa",
    "thue nha": "Nhà cửa",
    "noi that": "Nhà cửa",
    # Giáo dục
    "hoc": "Giáo dục",
    "sach": "Giáo dục",
    "hoc phi": "Giáo dục",
    "khoa hoc": "Giáo dục",
    # Thu nhập
    "luong": "Lương",
    "thuong": "Thưởng",
    "kinh doanh": "Kinh doanh",
    "lai": "Lãi",
    # Mua sắm
    "mua sam": "Mua sắm",
    "quan ao": "Mua sắm",
    "ao quan": "Mua sắm",
    "giay dep": "Mua sắm",
    "tui xach": "Mua sắm",
    "shopee": "Mua sắm",
    "tiki": "Mua sắm",
    "lazada": "Mua sắm",
    "sieu thi": "Mua sắm",
    "the gioi di dong": "Mua sắm",
}


def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^\w\s\dđ.,k/-]', ' ', text, flags=re.UNICODE)
    text = re.sub(r'\s+', ' ', text).strip()

    text = re.sub(r'(\d+)\s*xị', lambda m: str(int(m.group(1)) * 10000) + " đ", text)
    text = re.sub(r'(\d+)\s*(lít|lốp)', lambda m: str(int(m.group(1)) * 100000) + " đ", text)
    text = re.sub(r'(\d+)\s*(củ|mâm|quả)', lambda m: str(int(m.group(1)) * 1000000) + " đ", text)

    return text


def clean_text_for_ai(text: str) -> str:
    text = re.sub(r'\d+[\.,\d]*\s*(k|đ|vnđ|vnd|triệu|tr|tỷ|tỉ|củ|mâm|quả|xị|lít|lốp)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'(?<![0-9a-zA-Z])\d{3,}(?![0-9a-zA-Z])', '', text)
    text = re.sub(r'\d{1,2}[/-]\d{1,2}([/-]\d{2,4})?', '', text)
    text = re.sub(r'\b(ngày|tháng|năm)\s+\d+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(hết|giá|tầm|khoảng|chi|tổng)\b', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def parse_amount(text: str) -> float:
    text = text.replace("vnđ", "đ").replace("vnd", "đ")

    match_m = re.search(r'([\d.,]+)\s*(triệu|tr)', text)
    if match_m:
        val_str = match_m.group(1).replace(".", "").replace(",", ".")
        try:
            return float(val_str) * 1000000
        except ValueError:
            pass

    match_b = re.search(r'([\d.,]+)\s*(tỷ|tỉ)', text)
    if match_b:
        val_str = match_b.group(1).replace(".", "").replace(",", ".")
        try:
            return float(val_str) * 1000000000
        except ValueError:
            pass

    match_k = re.search(r'([\d.,]+)\s*k', text)
    if match_k:
        val_str = match_k.group(1).replace(".", "").replace(",", ".")
        try:
            return float(val_str) * 1000
        except ValueError:
            pass

    match_vnd = re.search(r'(\d+)\s*đ', text)
    if match_vnd:
        return float(match_vnd.group(1))

    text_no_dates = re.sub(r'\d{1,4}[/-]\d{1,2}[/-]\d{2,4}', ' ', text)
    if "ngày" in text or "tháng" in text:
        text_no_dates = re.sub(r'(ngày|tháng)\s+\d{1,2}', ' ', text_no_dates)

    clean_text = text_no_dates.replace(".", "").replace(",", "")
    match_digits = re.findall(r'\d+', clean_text)

    if match_digits:
        nums = [int(n) for n in match_digits]
        amounts = [n for n in nums if not (1990 <= n <= 2100) and n > 100]

        if amounts:
            return float(max(amounts))
        if nums:
            valid_nums = [n for n in nums if n > 31 and not (1990 <= n <= 2100)]
            if valid_nums:
                return float(max(valid_nums))

    return 0.0


def _keyword_match_category(normalized_text: str) -> str | None:
    """
    Match category using ASCII-normalized keywords.
    Sort by length descending so multi-word phrases match before single words
    to avoid false positives (e.g. "quan ao" before "an").
    """
    ascii_text = _to_ascii(normalized_text)
    sorted_keywords = sorted(CATEGORY_KEYWORDS.items(), key=lambda x: -len(x[0]))
    for keyword, cat_name in sorted_keywords:
        ascii_kw = _to_ascii(keyword)
        if re.search(rf"(?<!\w){re.escape(ascii_kw)}(?!\w)", ascii_text):
            return cat_name
    return None


def extract_transaction_info(text: str) -> Dict[str, Any]:

    normalized_text = normalize_text(text)

    # Detect income vs expense using ASCII-normalized matching
    ascii_text = _to_ascii(normalized_text)
    income_keywords = ["thu", "luong", "nhan", "thuong", "cong", "lai", "li xi", "duoc cho", "bieu", "tang"]
    transaction_type = "expense"
    for k in income_keywords:
        if re.search(rf"(?<!\w){re.escape(k)}(?!\w)", ascii_text):
            transaction_type = "income"
            break

    if transaction_type != "income":
        if re.search(r'(duoc|nhan)\s+.*cho', ascii_text) or re.search(r'(ba|me|anh|chi|em)\s+cho', ascii_text):
            transaction_type = "income"

    amount = parse_amount(normalized_text)

    # 1. Keyword matching (ASCII, deterministic, no AI needed)
    category = _keyword_match_category(normalized_text)

    # 2. Embedding AI fallback (if enabled)
    if not category and os.getenv("AI_CHATBOT_ENABLE_EMBEDDINGS") == "1":
        try:
            from embedding_service import get_embedding_service
            embed_service = get_embedding_service()
            ai_ready_text = clean_text_for_ai(normalized_text)

            if ai_ready_text:
                ai_category, score = embed_service.classify(ai_ready_text)
                if ai_category:
                    category = ai_category
                    print(f"AI Classify: '{ai_ready_text}' -> {category} (score: {score:.2f})")
            else:
                ai_category, score = embed_service.classify(normalized_text)
                if ai_category:
                    category = ai_category
        except Exception as e:
            print(f"Embedding error: {e}")

    # 3. Last resort: Khác
    if not category:
        category = "Khác"

    date = datetime.now().strftime("%Y-%m-%d")
    current_now = datetime.now()

    match_date_full = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})', normalized_text)
    match_date_short = re.search(r'(\d{1,2})[/-](\d{1,2})', normalized_text)
    match_day_only = re.search(r'ngày\s+(\d{1,2})', normalized_text)
    match_month_year = re.search(r'tháng\s+(\d{1,2})\s+(?:năm\s+)?(\d{4})', normalized_text)
    match_month_only = re.search(r'tháng\s+(\d{1,2})', normalized_text)

    if match_date_full:
        d, m, y = match_date_full.groups()
        if len(y) == 2:
            y = "20" + y
        try:
            date = datetime(int(y), int(m), int(d)).strftime("%Y-%m-%d")
        except Exception:
            pass
    elif match_month_year:
        m, y = match_month_year.groups()
        try:
            date = datetime(int(y), int(m), 1).strftime("%Y-%m-%d")
        except Exception:
            pass
    elif match_date_short:
        d, m = match_date_short.groups()
        try:
            date = datetime(current_now.year, int(m), int(d)).strftime("%Y-%m-%d")
        except Exception:
            pass
    elif match_day_only:
        d = match_day_only.group(1)
        try:
            date = datetime(current_now.year, current_now.month, int(d)).strftime("%Y-%m-%d")
        except Exception:
            pass
    elif match_month_only:
        m = match_month_only.group(1)
        try:
            date = datetime(current_now.year, int(m), 1).strftime("%Y-%m-%d")
        except Exception:
            pass
    elif "hôm qua" in normalized_text:
        date = (current_now - timedelta(days=1)).strftime("%Y-%m-%d")
    elif "hôm nay" in normalized_text:
        date = current_now.strftime("%Y-%m-%d")

    return {
        "amount": amount,
        "category": category,
        "type": transaction_type,
        "date": date,
        "description": text
    }
