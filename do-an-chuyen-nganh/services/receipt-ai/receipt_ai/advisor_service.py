from __future__ import annotations

from typing import Any


def _format_vnd(value: float | int) -> str:
    return f"{value:,.0f}".replace(",", ".")


def get_financial_advice(query: str, context: dict[str, Any]) -> dict[str, str]:
    total_income = float(context.get("totalIncome", 0) or 0)
    total_expense = float(context.get("totalExpense", 0) or 0)
    balance = float(context.get("balance", 0) or 0)
    breakdown = context.get("categoryBreakdown", []) or []

    if balance < 0:
        headline = "Số dư hiện đang âm, bạn nên ưu tiên siết chi tiêu ngắn hạn."
    elif total_income > 0 and total_expense / max(total_income, 1) > 0.8:
        headline = "Tỷ lệ chi tiêu đang khá cao so với thu nhập, nên rà lại các khoản chi lớn."
    else:
        headline = "Tình hình tài chính hiện tương đối ổn, có thể tiếp tục theo dõi để tối ưu thêm."

    top_category = ""
    if breakdown:
        top = breakdown[0]
        top_category = f"Khoản chi nổi bật là {top.get('name', 'không rõ')} với khoảng {_format_vnd(float(top.get('total', 0) or 0))} VND."

    question_line = ""
    if query.strip():
        question_line = f"Câu hỏi của bạn: {query.strip()}."

    advice = " ".join(
        part
        for part in [
            headline,
            f"Tổng thu {_format_vnd(total_income)} VND, tổng chi {_format_vnd(total_expense)} VND, số dư {_format_vnd(balance)} VND.",
            top_category,
            question_line,
        ]
        if part
    )
    return {"advice": advice}
