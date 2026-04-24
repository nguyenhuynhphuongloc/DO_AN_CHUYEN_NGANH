import pytesseract
from PIL import Image
import io
import re

def process_receipt_image(image_bytes: bytes) -> dict:
  # Convert bytes to PIL Image
  image = Image.open(io.BytesIO(image_bytes))
  
  # OCR
  text = pytesseract.image_to_string(image, lang='vie')
  
  # Preprocess text for better matching
  text = text.replace('\n', ' ').replace('\r', ' ')
  text = re.sub(r'\s+', ' ', text).strip()
  
  # Compile patterns for efficiency
  total_patterns = [
    re.compile(r'Tổng cộng:?\s*([\d,.]+)', re.IGNORECASE),
    re.compile(r'Thành tiền:?\s*([\d,.]+)', re.IGNORECASE),
    re.compile(r'Total:?\s*([\d,.]+)', re.IGNORECASE),
    re.compile(r'TOTAL:?\s*([\d,.]+)', re.IGNORECASE),
  ]
  
  amount = 0.0
  for pattern in total_patterns:
    match = pattern.search(text)
    if match:
      amount_str = match.group(1).replace(",", "").replace(".", "")
      try:
        amount = float(amount_str)
        break
      except ValueError:
        continue
        
  return {
    "amount": amount,
    "raw_text": text,
    "suggested_category": "Mua sắm"
  }
