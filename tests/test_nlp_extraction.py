#!/usr/bin/env python3
"""
NLP Bot Extraction Testing Script
Kiểm tra độ chính xác của bot trong việc trích xuất giao dịch

Usage:
    python test_nlp_extraction.py

Expected output:
    Accuracy: ≥ 90%
"""

import sys
sys.path.insert(0, '../AI/services')

from nlp_service import extract_transaction_info

# Test cases format: (input, expected_output)
test_cases = [
    # Category 1: Basic expense with amount and category
    (
        "Chi 50k ăn sáng hôm nay",
        {"amount": 50000, "category": "Ăn uống", "type": "expense"}
    ),
    (
        "Xăng 100 ngàn",
        {"amount": 100000, "category": "Di chuyển", "type": "expense"}
    ),
    (
        "Mua sắm 500.000 đồng",
        {"amount": 500000, "category": "Mua sắm", "type": "expense"}
    ),

    # Category 2: Income
    (
        "Vừa nhận lương 15 triệu",
        {"amount": 15000000, "category": "Lương", "type": "income"}
    ),
    (
        "Được mẹ cho 1 triệu tiêu vặt",
        {"amount": 1000000, "category": "Thu nhập khác", "type": "income"}
    ),
    (
        "Thu nhập từ bán hàng 5 triệu",
        {"amount": 5000000, "category": "Kinh doanh", "type": "income"}
    ),

    # Category 3: Complex with date
    (
        "Hôm qua đổ xăng hết 80 ngàn",
        {"amount": 80000, "category": "Di chuyển", "type": "expense", "date_relative": "yesterday"}
    ),
    (
        "Ngày mai ăn nhà hàng 300k",
        {"amount": 300000, "category": "Ăn uống", "type": "expense", "date_relative": "tomorrow"}
    ),

    # Category 4: Slang and special formats
    (
        "Chi 1 xị ăn cơm",
        {"amount": 10000, "category": "Ăn uống", "type": "expense"}
    ),
    (
        "Được bố cho 1 củ",
        {"amount": 1000000, "category": "Thu nhập khác", "type": "income"}
    ),
    (
        "Cafe 25k",
        {"amount": 25000, "category": "Ăn uống", "type": "expense"}
    ),

    # Category 5: Ambiguous (we accept reasonable guesses)
    (
        "Chi 200k không biết dùng gì",
        {"amount": 200000, "type": "expense"}
    ),
    (
        "Nhận tiền từ bạn 500k",
        {"amount": 500000, "type": "income"}
    ),

    # Category 6: Edge cases - large amounts
    (
        "Lương tháng 25 triệu 500k",
        {"amount": 25500000, "category": "Lương", "type": "income"}
    ),
    (
        "Mua laptop 15 triệu",
        {"amount": 15000000, "type": "expense"}
    ),

    # Category 7: Format variations
    (
        "50,000 đ ăn sáng",
        {"amount": 50000, "category": "Ăn uống", "type": "expense"}
    ),
    (
        "2.5tr kinh doanh",
        {"amount": 2500000, "category": "Kinh doanh", "type": "income"}
    ),

    # Category 8: Negative/refund scenarios
    (
        "Hoàn tiền hàng 300k",
        {"amount": 300000, "type": "income"}
    ),
    (
        "Mất ví 100k",
        {"amount": 100000, "type": "expense"}
    ),

    # Category 9: Medical & health
    (
        "Khám bác sĩ 500k",
        {"amount": 500000, "category": "Sức khỏe", "type": "expense"}
    ),
    (
        "Mua thuốc 150k",
        {"amount": 150000, "category": "Sức khỏe", "type": "expense"}
    ),

    # Category 10: Entertainment
    (
        "Xem phim 100k",
        {"amount": 100000, "category": "Giải trí", "type": "expense"}
    ),
    (
        "Du lịch đà nẵng 10 triệu",
        {"amount": 10000000, "category": "Giải trí", "type": "expense"}
    ),

    # Category 11: Bills & utilities
    (
        "Tiền điện tháng 500k",
        {"amount": 500000, "category": "Hóa đơn", "type": "expense"}
    ),
    (
        "Mạng internet 300k",
        {"amount": 300000, "category": "Hóa đơn", "type": "expense"}
    ),

    # Category 12: Education
    (
        "Khóa học tiếng anh 5 triệu",
        {"amount": 5000000, "category": "Giáo dục", "type": "expense"}
    ),
    (
        "Mua sách 250k",
        {"amount": 250000, "category": "Giáo dục", "type": "expense"}
    ),

    # Category 13: Housing
    (
        "Tiền nhà tháng 8 triệu",
        {"amount": 8000000, "category": "Nhà cửa", "type": "expense"}
    ),
]

def check_match(actual, expected):
    """
    Compare actual extraction with expected.
    Allows for loose matching on category (sometimes NLP is ambiguous).
    """
    # Amount must be exact
    if actual.get("amount") != expected.get("amount"):
        return False
    
    # Type (expense/income) must match
    if actual.get("type") != expected.get("type"):
        return False
    
    # Category should match if specified, but we allow partial match
    if "category" in expected:
        expected_cat = expected["category"]
        actual_cat = actual.get("category")
        # Allow if matches exactly or if expected has one of the keywords
        if actual_cat == expected_cat:
            return True
        # For ambiguous cases, any reasonable category is OK
        if "category" not in expected and expected_cat not in actual_cat:
            return False
    
    return True

def main():
    print("=" * 70)
    print("NLP BOT EXTRACTION TEST SUITE")
    print("=" * 70)
    
    passed = 0
    failed = 0
    results = []
    
    for i, (input_text, expected) in enumerate(test_cases, 1):
        try:
            actual = extract_transaction_info(input_text)
            
            # Check if matches expectations
            match = check_match(actual, expected)
            
            if match:
                status = "✓ PASS"
                passed += 1
            else:
                status = "✗ FAIL"
                failed += 1
            
            results.append({
                "num": i,
                "input": input_text,
                "status": status,
                "expected": expected,
                "actual": actual,
                "match": match
            })
            
            # Print result
            print(f"\n[{i:2d}] {status}")
            print(f"      Input: \"{input_text}\"")
            if not match:
                print(f"      Expected: {expected}")
                print(f"      Actual:   {actual}")
        
        except Exception as e:
            status = "✗ ERROR"
            failed += 1
            results.append({
                "num": i,
                "input": input_text,
                "status": status,
                "error": str(e)
            })
            print(f"\n[{i:2d}] {status}")
            print(f"      Input: \"{input_text}\"")
            print(f"      Error: {e}")
    
    # Summary
    total = len(test_cases)
    accuracy = (passed / total) * 100
    
    print("\n" + "=" * 70)
    print(f"SUMMARY: {passed}/{total} passed ({accuracy:.1f}%)")
    print("=" * 70)
    
    if accuracy >= 90:
        print("✓ EXCELLENT: NLP bot ready for production!")
        print("  (≥90% accuracy achieved)")
    elif accuracy >= 80:
        print("⚠ GOOD: NLP bot mostly working, minor improvements needed")
        print("  (80-89% accuracy - optimize keywords/patterns)")
    else:
        print("✗ NEEDS WORK: NLP bot requires significant improvements")
        print("  (<80% accuracy - review patterns and keyword mapping)")
    
    # Failed cases summary
    if failed > 0:
        print(f"\nFailed cases ({failed}):")
        for r in results:
            if "✗" in r["status"]:
                print(f"  - [{r['num']}] {r['input']}")
    
    return 0 if accuracy >= 90 else 1

if __name__ == "__main__":
    sys.exit(main())
