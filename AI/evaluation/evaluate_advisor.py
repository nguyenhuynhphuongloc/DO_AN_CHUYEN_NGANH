import os
import sys
import json
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.advisor_service import get_financial_advice
from evaluation.test_dataset import ADVISOR_TEST_SCENARIOS

def run_advisor_evaluation():
    print("=== BẮT ĐẦU ĐÁNH GIÁ AI ADVISOR (QWEN 2.5) ===")

    report_dir = os.path.join(os.path.dirname(__file__), "reports")
    if not os.path.exists(report_dir):
        os.makedirs(report_dir)

    report_path = os.path.join(report_dir, "advisor_examples.md")

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Báo cáo đánh giá Phản hồi của AI Advisor\n\n")
        f.write(f"Ngày đánh giá: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
        f.write("Mô hình: Qwen 2.5 - 3B Instruct (Quantized 4-bit)\n\n")
        f.write("---\n\n")

        for idx, scenario in enumerate(ADVISOR_TEST_SCENARIOS):
            print(f"Đang xử lý kịch bản {idx + 1}: {scenario['name']}...")

            query = scenario["query"]
            context = scenario["context"]

            context["period"] = "tháng này"

            start_t = datetime.now()
            result = get_financial_advice(query, context)
            end_t = datetime.now()
            duration = (end_t - start_t).total_seconds()

            advice = result["advice"]

            f.write(f"#
            f.write(f"- **Câu hỏi của người dùng:** *\"{query}\"* \n")
            f.write(f"- **Ngữ cảnh tài chính:** \n")
            f.write(f"  - Số dư: {context['balance']:,.0f} VND\n")
            f.write(f"  - Thu nhập: {context['totalIncome']:,.0f} VND\n")
            f.write(f"  - Chi tiêu: {context['totalExpense']:,.0f} VND\n")
            f.write(f"- **Thời gian phản hồi:** {duration:.2f}s\n\n")
            f.write(f"#
            f.write(f"> {advice}\n\n")
            f.write("---\n\n")

    print(f"\n[+] Đã hoàn thành đánh giá Advisor. Kết quả tại: {report_path}")

if __name__ == "__main__":
    run_advisor_evaluation()