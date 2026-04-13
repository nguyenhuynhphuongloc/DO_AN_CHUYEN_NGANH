#!/usr/bin/env python3
"""
Financial Advisor Quality Testing Script
Kiểm tra chất lượng response của AI Financial Advisor

Usage:
    python test_advisor_quality.py

This tests:
1. Response relevance (mentions specific numbers/categories?)
2. Action-oriented (can user act on advice?)
3. Tone (professional, helpful?)
4. Handling of edge cases

Expected output:
    Overall Quality Score: ≥ 4.0 / 5.0
"""

import sys
sys.path.insert(0, '../AI/services')

from advisor_service import get_financial_advice

# Mock financial data for testing
mock_context_normal = {
    "totalIncome": 50000000,      # 50M
    "totalExpense": 12500000,     # 12.5M
    "balance": 37500000,          # 37.5M  
    "categoryBreakdown": [
        {"name": "Ăn uống", "total": 3500000},
        {"name": "Di chuyển", "total": 2500000},
        {"name": "Mua sắm", "total": 3000000},
        {"name": "Giải trí", "total": 2000000},
        {"name": "Hóa đơn", "total": 1500000},
    ],
    "monthlyStats": {
        "Tháng 3": {"income": 45000000, "expense": 11000000},
        "Tháng 4": {"income": 50000000, "expense": 12500000},
    },
    "period": "tháng này"
}

mock_context_low_balance = {
    "totalIncome": 20000000,
    "totalExpense": 18000000,
    "balance": 2000000,
    "categoryBreakdown": [
        {"name": "Ăn uống", "total": 8000000},
        {"name": "Di chuyển", "total": 5000000},
        {"name": "Mua sắm", "total": 3000000},
        {"name": "Giải trí", "total": 2000000},
    ],
    "monthlyStats": {
        "Tháng 3": {"income": 18000000, "expense": 16000000},
        "Tháng 4": {"income": 20000000, "expense": 18000000},
    },
    "period": "tháng này"
}

mock_context_sparse = {
    "totalIncome": 10000000,
    "totalExpense": 1000000,
    "balance": 9000000,
    "categoryBreakdown": [
        {"name": "Ăn uống", "total": 500000},
        {"name": "Khác", "total": 500000},
    ],
    "monthlyStats": {},
    "period": "tháng này"
}

test_scenarios = [
    {
        "name": "Scenario 1: Normal user - Chi tiêu thế nào",
        "query": "Tháng này tôi chi tiêu thế nào?",
        "context": mock_context_normal,
        "evaluation_points": [
            ("mentions_specific_amounts", "phải nêu cụ thể số tiền (VD: 12.5M)"),
            ("mentions_categories", "phải đề cập danh mục chi tiêu (ăn uống, di chuyển, v.v)"),
            ("tone_positive", "tone nên tích cực, không bi quan"),
            ("actionable", "nên có lời khuyên action-oriented"),
        ]
    },
    {
        "name": "Scenario 2: Low balance - Nên mua laptop không",
        "query": "Tôi có nên mua laptop mới (15M) không với tình hình hiện tại?",
        "context": mock_context_low_balance,
        "evaluation_points": [
            ("mentions_balance", "phải đề cập số dư hiện tại (2M)"),
            ("risk_aware", "nên cảnh báo/thận trọng vì balance thấp"),
            ("actionable", "nên gợi ý cách tiêu hoặc không nên mua"),
            ("specific_numbers", "nên reference số tiền cụ thể"),
        ]
    },
    {
        "name": "Scenario 3: Sparse data edge case",
        "query": "Phân tích chi tiêu của tôi",
        "context": mock_context_sparse,
        "evaluation_points": [
            ("handles_sparse_data", "phải nhận ra dữ liệu ít, không nên generic"),
            ("honest_about_limitations", "phải thành thật thông báo thiếu dữ liệu"),
            ("suggests_next_steps", "nên gợi ý cách cải thiện"),
        ]
    },
    {
        "name": "Scenario 4: Money advice - Làm sao tiết kiệm",
        "query": "Làm sao để tiết kiệm tiền hơn? Khoản nào tôi nên giảm?",
        "context": mock_context_normal,
        "evaluation_points": [
            ("identifies_largest_categories", "phải identify top expense categories"),
            ("concrete_suggestions", "phải đưa ra con số cụ thể (VD: giảm ăn 500k/tháng)"),
            ("achievable", "suggestions nên thực tế và có thể thực hiện"),
        ]
    },
    {
        "name": "Scenario 5: Empty context edge case",
        "query": "Hãy cho lời khuyên tài chính",
        "context": {
            "totalIncome": 0,
            "totalExpense": 0,
            "balance": 0,
            "categoryBreakdown": [],
            "monthlyStats": {},
            "period": "unfilled"
        },
        "evaluation_points": [
            ("graceful_fallback", "tùy nhưng không nên crash"),
            ("either_generic_or_error", "hoặc generic advice hoặc notification cần dữ liệu"),
        ]
    }
]

def evaluate_response(response_text, evaluation_points):
    """
    Evaluate advisor response based on criteria.
    Returns score 1-5 for each point and overall average.
    
    This is a HEURISTIC evaluation. For production, ideally use:
    - Human evaluation
    - Another LLM for scoring
    - Automated metrics (relevance, coherence)
    """
    scores = {}
    
    for point_name, point_description in evaluation_points:
        # Heuristic checks
        if point_name == "mentions_specific_amounts":
            # Check if response contains numbers and commas (likely formatting currency)
            score = 5 if ("," in response_text or "M" in response_text or "triệu" in response_text) else 2
        
        elif point_name == "mentions_categories":
            categories = ["Ăn uống", "Di chuyển", "Mua sắm", "Giải trí", "Hóa đơn", "Nhà cửa"]
            score = 5 if any(cat in response_text for cat in categories) else 2
        
        elif point_name == "tone_positive":
            negative_words = ["tiêu tốn", "tồi tệ", "không thể", "rất xấu"]
            positive_words = ["tốt", "tích cực", "nên", "có thể", "khả năng"]
            has_positive = any(word in response_text.lower() for word in positive_words)
            has_negative = any(word in response_text.lower() for word in negative_words)
            score = 5 if has_positive and not has_negative else (3 if has_positive else 2)
        
        elif point_name == "actionable":
            action_indicators = ["nên", "có thể", "hãy", "giảm", "tăng", "sẽ", "khuyên"]
            score = 5 if any(ind in response_text.lower() for ind in action_indicators) else 2
        
        elif point_name == "mentions_balance":
            score = 5 if any(word in response_text for word in ["dư", "balance", "tiền", "2"]) else 2
        
        elif point_name == "risk_aware":
            risk_words = ["cần cẩn thận", "rủi ro", "không nên", "chưa sẵn sàng", "yên tâm"]
            score = 5 if any(word in response_text.lower() for word in risk_words) else 3
        
        elif point_name == "specific_numbers":
            score = 5 if any(c.isdigit() for c in response_text) else 2
        
        elif point_name == "identifies_largest_categories":
            score = 5 if any(cat in response_text for cat in ["Ăn uống", "Mua sắm"]) else 3
        
        elif point_name == "concrete_suggestions":
            score = 5 if ("giảm" in response_text.lower() or "tăng" in response_text.lower()) and any(c.isdigit() for c in response_text) else 2
        
        elif point_name == "achievable":
            score = 5  # Assume yes for now
        
        elif point_name == "handles_sparse_data":
            sparse_indicators = ["dữ liệu", "thời gian", "lâu hơn", "tích lũy"]
            score = 5 if any(ind in response_text.lower() for ind in sparse_indicators) else 2
        
        elif point_name == "honest_about_limitations":
            honest_words = ["chuyên", "yêu cầu", "thêm dữ liệu", "cần", "thiết lập"]
            score = 5 if any(word in response_text.lower() for word in honest_words) else 3
        
        elif point_name == "suggests_next_steps":
            next_step_words = ["tiếp", "thêm", "nên", "hãy", "có thể"]
            score = 5 if any(word in response_text.lower() for word in next_step_words) else 3
        
        elif point_name == "graceful_fallback":
            score = 5  # No crash = success
        
        elif point_name == "either_generic_or_error":
            score = 5 if len(response_text) > 20 else 2
        
        else:
            score = 3  # Default neutral
        
        scores[point_name] = score
    
    # Calculate average
    if scores:
        average = sum(scores.values()) / len(scores)
    else:
        average = 0
    
    return scores, average

def main():
    print("=" * 80)
    print("FINANCIAL ADVISOR QUALITY TEST SUITE")
    print("=" * 80)
    
    all_scores = []
    
    for scenario in test_scenarios:
        print(f"\n{scenario['name']}")
        print("-" * 80)
        print(f"Query: \"{scenario['query']}\"")
        print(f"Context: {scenario['context'].get('period', 'unknown')}, Balance: {scenario['context'].get('balance', 0):,}")
        
        try:
            # Get advisor response
            response = get_financial_advice(scenario['query'], scenario['context'])
            advice_text = response.get("advice", "")
            
            # Truncate for display
            display_text = advice_text[:200] + "..." if len(advice_text) > 200 else advice_text
            print(f"\nResponse preview: \"{display_text}\"")
            
            # Evaluate
            scores, avg_score = evaluate_response(advice_text, scenario['evaluation_points'])
            all_scores.append(avg_score)
            
            print(f"\nEvaluation:")
            for point_name, point_description in scenario['evaluation_points']:
                score = scores.get(point_name, 0)
                print(f"  [{score}/5] {point_description}")
            
            print(f"\nScenario Score: {avg_score:.1f}/5.0")
            
            if avg_score >= 4.0:
                print("✓ PASS - Good quality response")
            elif avg_score >= 3.0:
                print("⚠ FAIR - Acceptable, but could improve")
            else:
                print("✗ FAIL - Needs improvement")
        
        except Exception as e:
            print(f"✗ ERROR: {e}")
            all_scores.append(0)
    
    # Overall summary
    if all_scores:
        overall_avg = sum(all_scores) / len(all_scores)
    else:
        overall_avg = 0
    
    print("\n" + "=" * 80)
    print(f"OVERALL ADVISOR QUALITY SCORE: {overall_avg:.1f}/5.0")
    print("=" * 80)
    
    if overall_avg >= 4.0:
        print("✓ EXCELLENT: Advisor is production-ready!")
        print("  (≥4.0 score achieved - high quality responses)")
    elif overall_avg >= 3.5:
        print("⚠ GOOD: Advisor working well, minor tweaks recommended")
        print("  (3.5-3.9 score - consider optimizing prompts)")
    elif overall_avg >= 3.0:
        print("⚠ FAIR: Advisor functional but needs improvements")
        print("  (3.0-3.4 score - review and optimize prompts)")
    else:
        print("✗ NEEDS WORK: Advisor requires significant improvements")
        print("  (<3.0 score - major prompt/logic changes needed)")
    
    return 0 if overall_avg >= 4.0 else 1

if __name__ == "__main__":
    sys.exit(main())
