import re

def parse_amount(text: str) -> float:
  # Support: 50k, 50.000, 50000, 1 triệu, 1.5tr, 1,5 triệu, etc.
  text = text.lower().replace("vnđ", "đ").replace("vnd", "đ")
  
  # 1. Handle "triệu" / "tr" (Millions)
  match_m = re.search(r'([\d.,]+)\s*(triệu|tr)', text)
  if match_m:
    val_str = match_m.group(1).replace(".", "").replace(",", ".")
    try:
      return float(val_str) * 1000000
    except ValueError:
      pass
      
  # 2. Handle "tỷ" (Billions)
  match_b = re.search(r'([\d.,]+)\s*(tỷ|tỉ)', text)
  if match_b:
    val_str = match_b.group(1).replace(".", "").replace(",", ".")
    try:
      return float(val_str) * 1000000000
    except ValueError:
      pass

  # 3. Handle "k" (Thousands)
  match_k = re.search(r'([\d.,]+)\s*k', text)
  if match_k:
    val_str = match_k.group(1).replace(".", "").replace(",", ".")
    try:
      return float(val_str) * 1000
    except ValueError:
      pass
    
  # 4. Handle Direct digits with potential currency marker "đ"
  # Remove all separators to extract the pure number
  clean_text = text.replace(".", "").replace(",", "")
  
  # If there's a number followed by 'đ'
  match_vnd = re.search(r'(\d+)\s*đ', clean_text)
  if match_vnd:
    return float(match_vnd.group(1))

  # 5. Direct digits (get the largest one that looks like an amount, e.g. < 10 billion)
  match_digits = re.findall(r'\d+', clean_text)
  if match_digits:
    nums = [int(n) for n in match_digits]
    return float(max(nums))
    
  return 0.0

# Test cases
tests = [
    "chi 50k ăn sáng",
    "50000 cà phê",
    "nhận lương 20 triệu",
    "hôm qua chi 1.500.000 vnđ",
    "mua 2 bát phở 100k",
    "trả tiền điện 1,5tr",
    "thắng giải 2 tỷ"
]

for t in tests:
    print(f"'{t}' -> {parse_amount(t)}")
