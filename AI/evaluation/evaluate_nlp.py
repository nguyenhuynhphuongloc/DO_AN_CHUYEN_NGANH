import os
import sys
import time
import pandas as pd
import matplotlib.pyplot as plt
from tabulate import tabulate

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.nlp_service import extract_transaction_info
from evaluation.test_dataset import NLP_TEST_DATA

def run_nlp_evaluation():
    print("=== BẮT ĐẦU ĐÁNH GIÁ MÔ HÌNH NLP (TRANSACTION EXTRACTION) ===")
    results = []
    total_samples = len(NLP_TEST_DATA)

    detailed_scores = {
        "amount": 0,
        "category": 0,
        "type": 0
    }

    start_time = time.time()

    for idx, item in enumerate(NLP_TEST_DATA):
        text = item["text"]
        expected = item["expected"]

        actual = extract_transaction_info(text)

        is_amount_correct = actual["amount"] == expected["amount"]
        is_category_correct = actual["category"] == expected["category"]
        is_type_correct = actual["type"] == expected["type"]

        if is_amount_correct: detailed_scores["amount"] += 1
        if is_category_correct: detailed_scores["category"] += 1
        if is_type_correct: detailed_scores["type"] += 1

        all_correct = is_amount_correct and is_category_correct and is_type_correct

        results.append({
            "Mẫu câu": text,
            "Số tiền": f"{actual['amount']:,.0f} vs {expected['amount']:,.0f}",
            "Danh mục": f"{actual['category']} vs {expected['category']}",
            "Loại": f"{actual['type']} vs {expected['type']}",
            "Đúng hết": "✅" if all_correct else "❌",
            "Lỗi": " | ".join([
                "" if is_amount_correct else "Sai số tiền",
                "" if is_category_correct else "Sai danh mục",
                "" if is_type_correct else "Sai loại"
            ]).strip(" | ")
        })

    end_time = time.time()
    latency = (end_time - start_time) / total_samples

    accuracy_data = {
        "Trường dữ liệu": ["Tổng hợp", "Số tiền (Amount)", "Danh mục (Category)", "Loại (Type)"],
        "Số lượng đúng": [
            sum(1 for r in results if r["Đúng hết"] == "✅"),
            detailed_scores["amount"],
            detailed_scores["category"],
            detailed_scores["type"]
        ]
    }

    df_acc = pd.DataFrame(accuracy_data)
    df_acc["Tỉ lệ chính xác (%)"] = (df_acc["Số lượng đúng"] / total_samples) * 100

    print("\nBáo cáo chi tiết:")
    print(tabulate(results, headers="keys", tablefmt="grid"))

    print("\nThống kê hiệu suất:")
    print(tabulate(df_acc, headers="keys", tablefmt="pretty", showindex=False))
    print(f"\nThời gian phản hồi trung bình: {latency:.4f} giây/mẫu câu")

    plt.figure(figsize=(10, 6))
    colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444']
    bars = plt.bar(df_acc["Trường dữ liệu"], df_acc["Tỉ lệ chính xác (%)"], color=colors)

    plt.title("Độ chính xác của mô hình NLP FinTrack AI", fontsize=14, fontweight='bold', pad=20)
    plt.ylabel("Tỉ lệ (%)", fontsize=12)
    plt.ylim(0, 110)

    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 2, f"{yval:.1f}%", ha='center', va='bottom', fontweight='bold')

    plt.grid(axis='y', linestyle='--', alpha=0.7)

    report_dir = os.path.join(os.path.dirname(__file__), "reports")
    if not os.path.exists(report_dir):
        os.makedirs(report_dir)

    chart_path = os.path.join(report_dir, "nlp_accuracy.png")
    plt.savefig(chart_path)
    print(f"\n[+] Đã lưu biểu đồ đánh giá tại: {chart_path}")

    return df_acc, results

if __name__ == "__main__":
    run_nlp_evaluation()