import pytesseract
from PIL import Image
import io
import re

def process_receipt_image(image_bytes: bytes) -> dict:
  # Convert bytes to PIL Image
  image = Image.open(io.BytesIO(image_bytes))
  
  # OCR
  text = pytesseract.image_to_string(image, lang='vie')
  
  # Simple regex for amount extraction (Total)
  total_patterns = [
    r'Tổng cộng:?\s*([\d,.]+)',
    r'Thành tiền:?\s*([\d,.]+)',
    r'Total:?\s*([\d,.]+)',
    r'TOTAL:?\s*([\d,.]+)',
  ]
  
  amount = 0.0
  for pattern in total_patterns:
    match = re.search(pattern, text)
    if match:
      amount_str = match.group(1).replace(",", "").replace(".", "")
      try:
        amount = float(amount_str)
        break
      except:
        continue
        
  return {
    "amount": amount,
    "raw_text": text,
    "suggested_category": "Mua sắm"
  }
