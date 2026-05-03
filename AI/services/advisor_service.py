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

        # KIỂM TRA VÀ TẢI BỘ NÃO PHỤ (LORA) NẾU CÓ
        lora_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "fin_advisor_lora")
        if os.path.exists(lora_path):
            try:
                from peft import PeftModel
                print(f"🔄 Đang ghép nối bộ não huấn luyện (LoRA) từ: {lora_path}")
                _model = PeftModel.from_pretrained(_model, lora_path)
                print("✅ Ghép nối LoRA thành công!")
            except Exception as e:
                print(f"❌ Lỗi khi tải LoRA: {e}")

    return _tokenizer, _model


def get_financial_advice(query: str, context: dict):
    try:
        tokenizer, model = _get_model()

        total_income = context.get('totalIncome', 0)
        total_expense = context.get('totalExpense', 0)
        balance = context.get('balance', 0)
        breakdown = context.get('categoryBreakdown', [])
        monthly_stats = context.get('monthlyStats', {})
        period = context.get('period', 'tháng này')

        # TÌM TỪ KHÓA TRONG CÂU HỎI
        query_lower = query.lower() if query else ""
        targeted_category = None
        for c in breakdown:
            if c['name'].lower() in query_lower:
                targeted_category = c
                break

        # Phân loại ý định của người dùng (Intent Detection)
        is_asking_tips = any(kw in query_lower for kw in ['cách', 'làm sao', 'mẹo', 'giảm', 'tiết kiệm', 'giúp tôi', 'tư vấn'])
        is_general_evaluation = any(kw in query_lower for kw in ['tình hình', 'đánh giá', 'nhận xét', 'sao rồi', 'thế nào', 'tổng quan', 'báo cáo'])

        trend_txt = ""
        if monthly_stats:
            trend_txt = "\nXu hướng chi tiêu các tháng gần đây:\n"
            for month, stats in sorted(monthly_stats.items()):
                trend_txt += f"- Tháng {month}: Thu {stats['income']:,.0f} | Chi {stats['expense']:,.0f}\n"

        if targeted_category:
            stats_txt = (
                f"Dữ liệu tài chính ({period}):\n"
                f"- Tổng Thu nhập: {total_income:,.0f} VND\n"
                f"- Số dư hiện tại: {balance:,.0f} VND\n"
                f"- MỤC ĐANG ĐƯỢC QUAN TÂM: {targeted_category['name']} ({targeted_category['total']:,.0f} VND)\n"
                + trend_txt
            )
        elif is_asking_tips and not is_general_evaluation:
            stats_txt = (
                f"Dữ liệu tài chính ({period}):\n"
                f"- Tổng Thu nhập: {total_income:,.0f} VND\n"
                f"- Số dư hiện tại: {balance:,.0f} VND\n"
            )
        else:
            stats_txt = (
                f"Dữ liệu tài chính ({period}):\n"
                f"- Tổng Thu nhập: {total_income:,.0f} VND\n"
                f"- Tổng Chi tiêu: {total_expense:,.0f} VND\n"
                f"- Số dư hiện tại: {balance:,.0f} VND\n"
                f"- Các khoản chi chính: " + ", ".join([f"{c['name']} ({c['total']:,.0f})" for c in breakdown[:5]])
                + trend_txt
            )

        # TIỀN XỬ LÝ: Bỏ hoàn toàn các cảnh báo tự động của Backend
        analysis_txt = ""

        system_prompt = (
            "Bạn là chuyên gia tư vấn tài chính từ FinTrack.\n"
            "Nhiệm vụ của bạn là tư vấn cho khách hàng một cách linh hoạt.\n"
            "QUY TẮC TƯ VẤN TÙY THEO NGỮ CẢNH:\n"
            "1. NẾU NGƯỜI DÙNG HỎI MỘT VẤN ĐỀ CỤ THỂ (VD: xin mẹo giảm chi ăn uống, hỏi cách tiết kiệm): HÃY TRẢ LỜI THẲNG VÀO CÂU HỎI. Đưa ra mẹo thực tế, giải pháp cụ thể. TUYỆT ĐỐI KHÔNG liệt kê hay báo cáo lại các con số tài chính dài dòng.\n"
            "2. NẾU NGƯỜI DÙNG YÊU CẦU ĐÁNH GIÁ (VD: Tình hình tôi sao rồi?): Hãy phân tích tổng quan, chỉ ra mục vượt hạn mức và đề xuất kế hoạch cắt giảm.\n\n"
            "LƯU Ý CỰC KỲ QUAN TRỌNG:\n"
            "- Trả lời 100% bằng tiếng Việt tự nhiên, thân thiện.\n"
            "- KHÔNG lặp lại các thẻ hệ thống.\n"
            "- BẮT BUỘC mở đầu bằng một lời chào đa dạng và thân thiện. Hãy sáng tạo nhiều kiểu chào khác nhau (Ví dụ: 'Xin chào!', 'FinTrack rất vui được hỗ trợ bạn,', 'Chào bạn nhé,', 'Chào bạn, hy vọng bạn đang có một ngày tốt lành!'). Tuyệt đối không viết dấu phẩy ngay sau dấu chấm than.\n"
            "- TUYỆT ĐỐI KHÔNG dùng câu 'Dựa trên dữ liệu tài chính của bạn...' để mở đầu."
        )

        user_content_prompt = (
            f"[DỮ LIỆU HỆ THỐNG]\n{stats_txt}\n{analysis_txt}\n\n"
            f"[CÂU HỎI CỦA NGƯỜI DÙNG]: {query or 'Hãy nhận xét tình hình chi tiêu của tôi.'}\n\n"
            "MỆNH LỆNH TỐI CAO: BỎ QUA CÁC DỮ LIỆU KHÔNG LIÊN QUAN. HÃY TRẢ LỜI ĐÚNG TRỌNG TÂM CÂU HỎI CỦA NGƯỜI DÙNG! KHÔNG DÙNG TIẾNG NGA/TRUNG."
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content_prompt}
        ]

        full_prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = tokenizer(full_prompt, return_tensors='pt').to(model.device)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=512,
                do_sample=True,
                temperature=0.4,
                top_p=0.85,
                pad_token_id=tokenizer.pad_token_id,
                repetition_penalty=1.05
            )

        advice = tokenizer.decode(outputs[0][len(inputs["input_ids"][0]):], skip_special_tokens=True)

        cleaned_advice = advice.strip()

        # [GIẢI PHÁP TRIỆT ĐỂ]: Xóa toàn bộ ký tự tiếng Trung, Nhật, Hàn và dấu câu của chúng
        import re
        cleaned_advice = re.sub(r'[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]', '', cleaned_advice)
        cleaned_advice = cleaned_advice.replace('Reasoning:', '').replace('Define:', '')

        if "Câu hỏi:" in cleaned_advice:
            cleaned_advice = cleaned_advice.split("Câu hỏi:")[0].strip()

        if "YÊU CẦU:" in cleaned_advice:
            cleaned_advice = cleaned_advice.split("YÊU CẦU:")[0].strip()

        if len(cleaned_advice) < 10:
            cleaned_advice = (
                "Tôi đã phân tích dữ liệu nhưng chưa thể đưa ra lời khuyên cụ thể ngay lúc này. "
                "Vui lòng thử hỏi khác đi một chút."
            )

        return {"advice": cleaned_advice.strip()}

    except Exception:
        return {
            "advice": (
                f"Dữ liệu: Thu {context.get('totalIncome', 0):,.0f} | "
                f"Chi {context.get('totalExpense', 0):,.0f} | "
                f"Dư {context.get('balance', 0):,.0f} VND. "
                "Chatbot đang nạp bộ não AI (Qwen 3B), vui lòng đợi một chút."
            )
        }

def parse_transaction_with_ai(text: str):

    try:
        tokenizer, model = _get_model()

        prompt = (
            "<|im_start|>system\n"
            "Bạn là chuyên gia bóc tách dữ liệu tài chính. Hãy trích xuất thông tin từ câu nói của người dùng thành định dạng JSON.\n"
            "Yêu cầu quan trọng:\n"
            "1. Chỉ trả về duy nhất 1 đối tượng JSON.\n"
            "2. Các trường: amount (number), category (string), type ('income' hoặc 'expense'), date ('YYYY-MM-DD').\n"
            "3. Nếu không tìm thấy số tiền rõ ràng trong câu, hãy đặt amount là 0. TUYỆT ĐỐI không lấy năm (vd: 2026) hoặc ngày (vd: 18) làm số tiền.\n"
            "4. Nếu không biết ngày, hãy để trống hoặc dùng ngày hiện tại nếu có từ khóa 'hôm nay'.\n"
            "5. Danh mục (category) phải là tiếng Việt có dấu, súc tích.\n"
            "<|im_end|>\n"
            f"<|im_start|>user\nCâu: '{text}'\nJSON:<|im_end|>\n"
            "<|im_start|>assistant\n"
        )

        inputs = tokenizer(prompt, return_tensors='pt').to(model.device)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=128,
                temperature=0.1,
                do_sample=False,
                pad_token_id=tokenizer.pad_token_id
            )

        result_text = tokenizer.decode(outputs[0][len(inputs["input_ids"][0]):], skip_special_tokens=True)

        import json
        import re
        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
        return None
    except Exception as e:
        print(f"Lỗi AI Parsing: {e}")
        return None
