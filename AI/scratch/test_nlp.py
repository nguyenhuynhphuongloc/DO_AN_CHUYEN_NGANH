print("Starting script...")
import sys
import os

print(f"CWD: {os.getcwd()}")
sys.path.append(os.getcwd())

try:
    print("Importing services.nlp_service...")
    from services.nlp_service import extract_transaction_info
    print("Import successful.")
except Exception as e:
    print(f"Import failed: {e}")
    sys.exit(1)

test_texts = [
    "trám răng 200k",
    "mừng đầy tháng 500k"
]

for text in test_texts:
    try:
        result = extract_transaction_info(text)
        print(f"Input: {text} => Result: {result}")
    except Exception as e:
        print(f"Error for '{text}': {e}")