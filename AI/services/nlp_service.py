import re
from datetime import datetime
from underthesea import pos_tag, word_tokenize
from typing import Dict, Any, Optional

CATEGORY_KEYWORDS = {
  "bảo hiểm": "Bảo hiểm",
  "thuốc": "Sức khỏe", "bệnh viện": "Sức khỏe", "khám": "Sức khỏe", "nha khoa": "Sức khỏe", "y tế": "Sức khỏe", "sức khỏe": "Sức khỏe",
  "ăn": "Ăn uống", "uống": "Ăn uống", "cafe": "Ăn uống", "nhà hàng": "Ăn uống", "phở": "Ăn uống", "cơm": "Ăn uống",
  "xe": "Di chuyển", "xăng": "Di chuyển", "grab": "Di chuyển", "taxi": "Di chuyển", "vé xe": "Di chuyển",
  "phim": "Giải trí", "game": "Giải trí", "karaoke": "Giải trí", "du lịch": "Giải trí", "phượt": "Giải trí", "tour": "Giải trí", "đi chơi": "Giải trí",
  "điện": "Hóa đơn", "nước": "Hóa đơn", "mạng": "Hóa đơn", "internet": "Hóa đơn", "wifi": "Hóa đơn", "điện thoại": "Hóa đơn",
  "tiền nhà": "Nhà cửa", "tiền trọ": "Nhà cửa", "nội thất": "Nhà cửa", "sửa nhà": "Nhà cửa",
  "học": "Giáo dục", "sách": "Giáo dục", "khóa học": "Giáo dục", "trường": "Giáo dục",
  "lương": "Lương", "thưởng": "Thưởng", "kinh doanh": "Kinh doanh", "bán hàng": "Kinh doanh", "buôn bán": "Kinh doanh", "chốt đơn": "Kinh doanh", "giao dịch": "Kinh doanh",
  "lì xì": "Lì xì", "quà": "Lì xì", "biếu": "Lì xì", "tặng": "Lì xì",
  "mua sắm": "Mua sắm", "quần áo": "Mua sắm", "siêu thị": "Mua sắm", "chợ": "Mua sắm", "shopee": "Mua sắm", "tiki": "Mua sắm", "lazada": "Mua sắm", "mua": "Mua sắm",
}

def normalize_text(text: str) -> str:
  text = text.lower()
  text = re.sub(r'[^\w\s\dđ.,k]', ' ', text, flags=re.UNICODE)
  text = re.sub(r'\s+', ' ', text).strip()
  
  # Replace currency abbreviations
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
    
  clean_text = text.replace(".", "").replace(",", "")
  
  match_vnd = re.search(r'(\d+)\s*đ', clean_text)
  if match_vnd:
    return float(match_vnd.group(1))

  match_digits = re.findall(r'\d+', clean_text)
  if match_digits:
    nums = [int(n) for n in match_digits]
    amounts = [n for n in nums if n > 100 or n < 1000000000]
    if amounts:
        return float(max(amounts))
    if nums:
        return float(max(nums))
    
  return 0.0

def extract_transaction_info(text: str) -> Dict[str, Any]:
  normalized_text = normalize_text(text)
  
  transaction_type = "expense"
  
  income_keywords = {"thu", "lương", "nhận", "thưởng", "cộng", "lãi", "lì xì", "được cho", "biếu", "tặng"}
  if any(k in normalized_text for k in income_keywords):
    transaction_type = "income"
  elif re.search(r'(được|nhận)\s+.*cho', normalized_text) or re.search(r'(ba|mẹ|anh|chị|em)\s+cho', normalized_text):
    transaction_type = "income"
    
  amount = parse_amount(normalized_text)
  
  category = None
  for key, cat in CATEGORY_KEYWORDS.items():
    if key in normalized_text:
      category = cat
      break
      
  if not category:
    try:
      tokens = pos_tag(text) 
      stop_words = {
        "chi", "thu", "hết", "khoản", "giá", "mất", "đã", "nhận", "cho", "vào", "mục", "tiền", "số", 
        "hôm", "qua", "nay", "với", "từ", "cho", "khoảng", "tầm", "cỡ",
        "tháng", "ngày", "năm", "tuần", "lần", "đợt", "triệu", "ngàn", "tỷ", "tr", "k",
        "được", "bị", "là", "vừa", "mới", "phải", "của", "tới", "đến", "tui", "mình", "em", "anh",
        "ba", "mẹ", "ông", "bà", "chú", "bác", "cô", "dì", "con", "cháu"
      }
      
      candidates = [word for word, tag in tokens if tag in ['N', 'V', 'Np'] and word.lower() not in stop_words and len(word) > 1 and not re.match(r'^[\d.,]+$', word.lower())]
      
      if candidates:
        guessed_cat = candidates[0].capitalize()
        if len(candidates[0]) > 2:
          category = guessed_cat
    except Exception as e:
      print(f"Lỗi POS tagging: {e}")
  
  if not category:
    category = "Chi tiêu khác" if transaction_type == "expense" else "Thu nhập khác"
  elif category in ["Ba", "Mẹ", "Anh", "Chị", "Em"] or any(k in normalized_text for k in ["ba mẹ", "bố mẹ"]):
    if transaction_type == "income":
        category = "Thu nhập khác"

  date = datetime.now().strftime("%Y-%m-%d")
  if "hôm qua" in normalized_text:
    from datetime import timedelta
    date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
  return {
    "amount": amount,
    "category": category,
    "type": transaction_type,
    "date": date,
    "description": text
  }
