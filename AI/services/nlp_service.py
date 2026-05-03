import re
from datetime import datetime
from underthesea import pos_tag, word_tokenize
from typing import Dict, Any, Optional
from services.advisor_service import parse_transaction_with_ai
from services.embedding_service import get_embedding_service

def normalize_text(text: str) -> str:
  text = text.lower()
  text = re.sub(r'[^\w\s\dđ.,k/-]', ' ', text, flags=re.UNICODE)
  text = re.sub(r'\s+', ' ', text).strip()

  text = re.sub(r'(\d+)\s*xị', lambda m: str(int(m.group(1)) * 10000) + " đ", text)
  text = re.sub(r'(\d+)\s*(lít|lốp)', lambda m: str(int(m.group(1)) * 100000) + " đ", text)
  text = re.sub(r'(\d+)\s*(củ|mâm|quả)', lambda m: str(int(m.group(1)) * 1000000) + " đ", text)

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

def extract_transaction_info(text: str) -> Dict[str, Any]:

  normalized_text = normalize_text(text)

  transaction_type = "expense"

  income_keywords = ["thu", "lương", "nhận", "thưởng", "cộng", "lãi", "lì xì", "được cho", "biếu", "tặng"]
  for k in income_keywords:
    if re.search(rf"(?<!\w){re.escape(k)}(?!\w)", normalized_text):
      transaction_type = "income"
      break

  if transaction_type != "income":
    if re.search(r'(được|nhận)\s+.*cho', normalized_text) or re.search(r'(ba|mẹ|anh|chị|em)\s+cho', normalized_text):
      transaction_type = "income"

  amount = parse_amount(normalized_text)

  category = None

  # SỬ DỤNG AI ĐỂ PHÂN LOẠI (Dựa trên độ tương đồng ngữ nghĩa)
  try:
    embed_service = get_embedding_service()
    ai_category, score = embed_service.classify(normalized_text)
    if ai_category:
        category = ai_category
        print(f"AI Classify: '{normalized_text}' -> {category} (score: {score:.2f})")
  except Exception as e:
    print(f"Embedding error: {e}")

  if not category:
    category = "Khác" # Mặc định nếu không tìm thấy

  date = datetime.now().strftime("%Y-%m-%d")
  current_now = datetime.now()

  match_date_full = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})', normalized_text)
  match_date_short = re.search(r'(\d{1,2})[/-](\d{1,2})', normalized_text)
  match_day_only = re.search(r'ngày\s+(\d{1,2})', normalized_text)
  match_month_year = re.search(r'tháng\s+(\d{1,2})\s+(?:năm\s+)?(\d{4})', normalized_text)
  match_month_only = re.search(r'tháng\s+(\d{1,2})', normalized_text)

  if match_date_full:
    d, m, y = match_date_full.groups()
    if len(y) == 2: y = "20" + y
    try:
        from datetime import date as py_date
        date = py_date(int(y), int(m), int(d)).strftime("%Y-%m-%d")
    except: pass
  elif match_month_year:
    m, y = match_month_year.groups()
    try:
        from datetime import date as py_date
        date = py_date(int(y), int(m), 1).strftime("%Y-%m-%d")
    except: pass
  elif match_date_short:
    d, m = match_date_short.groups()
    try:
        from datetime import date as py_date
        date = py_date(current_now.year, int(m), int(d)).strftime("%Y-%m-%d")
    except: pass
  elif match_day_only:
    d = match_day_only.group(1)
    try:
        from datetime import date as py_date
        date = py_date(current_now.year, current_now.month, int(d)).strftime("%Y-%m-%d")
    except: pass
  elif match_month_only:
    m = match_month_only.group(1)
    try:
        from datetime import date as py_date
        date = py_date(current_now.year, int(m), 1).strftime("%Y-%m-%d")
    except: pass
  elif "hôm qua" in normalized_text:
    from datetime import timedelta
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
