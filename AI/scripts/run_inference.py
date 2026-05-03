import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import os

# Đường dẫn tới thư mục chứa trọng số LoRA bạn đã tải về từ Colab
LORA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "fin_advisor_lora")
BASE_MODEL = "Qwen/Qwen2.5-3B-Instruct"

def load_model():
    print("⏳ Đang tải mô hình gốc và tokenizer...")
    # Tải tokenizer
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    
    # Tải model gốc
    # Nếu máy bạn không có GPU mạnh, hãy cài đặt device_map="auto" và load_in_8bit=True hoặc load_in_4bit=True
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float16,
        device_map="auto" 
    )
    
    print("⏳ Đang tích hợp trọng số LoRA đã huấn luyện...")
    if os.path.exists(LORA_PATH):
        model = PeftModel.from_pretrained(model, LORA_PATH)
        print("Đã load mô hình thành công!")
    else:
        print(f"KHÔNG TÌM THẤY thư mục {LORA_PATH}. Vui lòng kiểm tra lại xem bạn đã bỏ file tải từ Colab vào đúng chỗ chưa.")
        return None, None
        
    return model, tokenizer

def generate_advice(model, tokenizer, stats_txt, query):
    system_prompt = (
        "Bạn là đại diện chăm sóc khách hàng và chuyên gia tài chính từ công ty FinTrack.\n"
        "Hãy phân tích dữ liệu thực tế được cung cấp và tư vấn cho khách hàng với văn phong doanh nghiệp, lịch sự và chuyên nghiệp (sử dụng danh xưng 'FinTrack' hoặc 'chúng tôi' và 'Quý khách').\n"
        "QUY TẮC TƯ VẤN (Chain-of-Thought):\n"
        "1. Chào hỏi và Đánh giá tổng quan: Lời chào từ FinTrack và nhận định tình hình tài chính hiện tại (thu nhập, chi tiêu, số dư).\n"
        "2. Phân tích chi tiết: Sử dụng các con số từ [GỢI Ý TÍNH TOÁN CHO AI] để chỉ ra hạng mục đang vượt hạn mức.\n"
        "3. Đề xuất KẾ HOẠCH CẮT GIẢM CỤ THỂ: Nêu rõ số tiền cần cắt giảm dựa vào phần CẢNH BÁO.\n"
        "4. Giải pháp thực tiễn: Đưa ra các gợi ý mang tính ứng dụng cao để hỗ trợ Quý khách.\n"
    )

    user_content = f"Dữ liệu tài chính thực tế của tôi:\n{stats_txt}\n\nCâu hỏi: {query}"
    
    # Định dạng chat cho Qwen
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content}
    ]
    
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )
    
    model_inputs = tokenizer([text], return_tensors="pt").to(model.device)
    
    print(" AI đang suy nghĩ...")
    generated_ids = model.generate(
        **model_inputs,
        max_new_tokens=512,
        temperature=0.3, # Để nhiệt độ thấp giúp câu trả lời logic, bám sát dữ liệu hơn
        top_p=0.9
    )
    
    # Chỉ lấy phần output được generate ra, bỏ qua phần prompt ban đầu
    generated_ids = [
        output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
    ]
    
    response = tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
    return response

if __name__ == "__main__":
    model, tokenizer = load_model()
    if model:
        # Dữ liệu mẫu để test
        sample_stats = """Dữ liệu tài chính (tháng này):
- Tổng Thu nhập: 15,000,000 VND
- Tổng Chi tiêu: 16,000,000 VND
- Số dư hiện tại: -1,000,000 VND
- Các khoản chi chính: Mua sắm (7,000,000), Ăn uống (5,000,000)

[GỢI Ý TÍNH TOÁN CHO AI]:
- Tổng chi tiêu chiếm 106.7% thu nhập.
- Mục 'Mua sắm' chiếm 46.7% thu nhập.
  -> CẢNH BÁO: Mục 'Mua sắm' đang vượt quá mức an toàn. Cần cắt giảm khoảng 3,250,000 VND."""
        
        sample_query = "Tình hình tôi sao rồi? Cứu tôi với."
        
        print("\n--- TEST FINTRACK ADVISOR AI ---")
        answer = generate_advice(model, tokenizer, sample_stats, sample_query)
        print("\n[AI TRẢ LỜI]:\n")
        print(answer)
