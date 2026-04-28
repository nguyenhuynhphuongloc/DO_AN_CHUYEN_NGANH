import os

import torch
from dotenv import load_dotenv
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

load_dotenv()

HF_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
BASE_MODEL = "Qwen/Qwen2.5-3B-Instruct"

_tokenizer = None
_model = None


def _get_model():
    global _tokenizer, _model
    if _model is None:
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )

        _tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, token=HF_TOKEN, trust_remote_code=True)
        if _tokenizer.pad_token is None:
            _tokenizer.pad_token = _tokenizer.eos_token

        _model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL,
            quantization_config=bnb_config,
            device_map="auto",
            token=HF_TOKEN,
            trust_remote_code=True,
            torch_dtype=torch.float16,
        )

    return _tokenizer, _model


def get_financial_advice(query: str, context: dict):
    try:
        tokenizer, model = _get_model()

        total_income = context.get("totalIncome", 0)
        total_expense = context.get("totalExpense", 0)
        balance = context.get("balance", 0)
        breakdown = context.get("categoryBreakdown", [])
        monthly_stats = context.get("monthlyStats", {})
        period = context.get("period", "tháng này")

        trend_txt = ""
        if monthly_stats:
            trend_lines = [
                f"- Tháng {month}: Thu {stats['income']:,.0f} | Chi {stats['expense']:,.0f}"
                for month, stats in sorted(monthly_stats.items())
            ]
            trend_txt = "\nXu hướng chi tiêu các tháng gần đây:\n" + "\n".join(trend_lines) + "\n"

        breakdown_str = ", ".join([f"{category['name']} ({category['total']:,.0f})" for category in breakdown[:5]])
        stats_txt = (
            f"Dữ liệu tài chính ({period}):\n"
            f"- Tổng thu nhập: {total_income:,.0f} VND\n"
            f"- Tổng chi tiêu: {total_expense:,.0f} VND\n"
            f"- Số dư hiện tại: {balance:,.0f} VND\n"
            f"- Các khoản chi chính: {breakdown_str}"
            f"{trend_txt}"
        )

        messages = [
            {
                "role": "system",
                "content": (
                    "Bạn là chuyên gia tư vấn tài chính thông minh của ứng dụng FinTrack. "
                    "Hãy phân tích dữ liệu thực tế được cung cấp và trả lời câu hỏi của người dùng. "
                    "Yêu cầu: luôn trả lời bằng tiếng Việt có dấu đầy đủ, tự nhiên và rõ nghĩa. "
                    "Không dùng tiếng Việt không dấu, không viết kiểu ASCII hóa, và không chuyển sang tiếng Anh "
                    "trừ khi người dùng yêu cầu. "
                    "Giữ câu trả lời súc tích, chuyên nghiệp, tập trung vào con số và đưa ra lời khuyên hữu ích. "
                    "Nếu không có đủ dữ liệu để trả lời một câu hỏi cụ thể, hãy thành thật thông báo."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Dữ liệu tài chính thực tế của tôi:\n{stats_txt}\n\n"
                    f"Câu hỏi: {query or 'Hãy nhận xét tình hình tài chính của tôi.'}"
                ),
            },
        ]

        full_prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = tokenizer(full_prompt, return_tensors="pt").to(model.device)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=512,
                temperature=0.6,
                do_sample=True,
                pad_token_id=tokenizer.pad_token_id,
                repetition_penalty=1.1,
            )

        advice = tokenizer.decode(outputs[0][len(inputs["input_ids"][0]) :], skip_special_tokens=True)
        cleaned_advice = advice.strip()

        if "Câu hỏi:" in cleaned_advice:
            cleaned_advice = cleaned_advice.split("Câu hỏi:", 1)[0].strip()

        if len(cleaned_advice) < 10:
            cleaned_advice = (
                "Tôi đã phân tích dữ liệu nhưng chưa thể đưa ra lời khuyên cụ thể ngay lúc này. "
                "Vui lòng thử hỏi khác đi một chút."
            )

        return {"advice": cleaned_advice}

    except Exception:
        return {
            "advice": (
                f"Dữ liệu: Thu {context.get('totalIncome', 0):,.0f} | "
                f"Chi {context.get('totalExpense', 0):,.0f} | "
                f"Dư {context.get('balance', 0):,.0f} VND. "
                "Chatbot đang nạp bộ não AI (Qwen 3B), vui lòng đợi một chút."
            )
        }
