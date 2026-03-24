import re
from datetime import datetime
from underthesea import pos_tag, word_tokenize
from typing import Dict, Any, Optional

# Basic mapping from keywords to categories
CATEGORY_KEYWORDS = {
  "ăn": "Ăn uống",
  "uống": "Ăn uống",
  "cafe": "Ăn uống",
  "xe": "Di chuyển",
  "xăng": "Di chuyển",
  "grab": "Di chuyển",
  "phim": "Giải trí",
  "game": "Giải trí",
  "mua": "Mua sắm",
  "quần áo": "Mua sắm",
  "điện": "Hóa đơn",
  "nước": "Hóa đơn",
  "mạng": "Hóa đơn",
  "lương": "Lương",
  "thưởng": "Thưởng",
}

def parse_amount(text: str) -> float:
  # Support: 50k, 50.000, 50000, 1 triệu, etc.
  text = text.lower().replace(",", "").replace(".", "")
  
  # 50k -> 50000
  match_k = re.search(r'(\d+)\s*k', text)
  if match_k:
    return float(match_k.group(1)) * 1000
    
  # 1 triệu -> 1000000
  match_m = re.search(r'(\d+)\s*tr', text)
  if match_m:
    return float(match_m.group(1)) * 1000000
    
  # Direct digits
  match_digits = re.findall(r'\d+', text)
  if match_digits:
    # Get the largest number found as the amount
    return float(max(map(int, match_digits)))
    
  return 0.0

def extract_transaction_info(text: str) -> Dict[str, Any]:
  # Lower case for easier matching
  text_lower = text.lower()
  
  # Determine type
  transaction_type = "expense"
  if any(k in text_lower for k in ["thu", "lương", "nhận", "thưởng", "cộng"]):
    transaction_type = "income"
    
  # Extract amount
  amount = parse_amount(text_lower)
  
  # Extract category
  category = "Khác"
  for key, cat in CATEGORY_KEYWORDS.items():
    if key in text_lower:
      category = cat
      break
      
  # Extract date
  date = datetime.now().strftime("%Y-%m-%d")
  if "hôm qua" in text_lower:
    from datetime import timedelta
    date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
  # Use underthesea for better extraction if needed (placeholder)
  # tokens = word_tokenize(text)
  
  return {
    "amount": amount,
    "category": category,
    "type": transaction_type,
    "date": date,
    "description": text
  }
