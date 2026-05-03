import json
import random

def format_prompt(stats_txt, query, output):
    system_prompt = (
        "Bạn là đại diện chăm sóc khách hàng và chuyên gia tài chính từ công ty FinTrack.\n"
        "Hãy phân tích dữ liệu thực tế được cung cấp và tư vấn cho khách hàng với văn phong doanh nghiệp, lịch sự và chuyên nghiệp (sử dụng danh xưng 'FinTrack' hoặc 'chúng tôi' và 'Quý khách').\n"
        "QUY TẮC TƯ VẤN (Chain-of-Thought):\n"
        "1. Chào hỏi và Đánh giá tổng quan: Lời chào từ FinTrack và nhận định tình hình tài chính hiện tại (thu nhập, chi tiêu, số dư).\n"
        "2. Phân tích chi tiết: Sử dụng các con số từ [GỢI Ý TÍNH TOÁN CHO AI] để chỉ ra hạng mục đang vượt hạn mức.\n"
        "3. Đề xuất KẾ HOẠCH CẮT GIẢM CỤ THỂ: Nêu rõ số tiền cần cắt giảm dựa vào phần CẢNH BÁO.\n"
        "4. Giải pháp thực tiễn: Đưa ra các gợi ý mang tính ứng dụng cao để hỗ trợ Quý khách.\n\n"
        "VÍ DỤ MẪU:\n"
        "Khách hàng: 'Làm sao để giảm tiền ăn uống xuống?'\n"
        "FinTrack: 'Kính chào Quý khách, FinTrack xin phép phân tích tình hình hiện tại: Hạng mục Ăn uống đang chiếm 50% thu nhập của Quý khách. Để đảm bảo an toàn tài chính, Quý khách cần cắt giảm khoảng 4,000,000 VND. FinTrack đề xuất các giải pháp sau:\n"
        "- Tự chuẩn bị bữa trưa mang đi làm (tiết kiệm khoảng 2 triệu VND).\n"
        "- Giảm tần suất sử dụng dịch vụ ăn uống bên ngoài (tiết kiệm khoảng 1 triệu VND).\n"
        "- Cắt giảm các khoản ăn vặt không thiết yếu (tiết kiệm khoảng 1 triệu VND).' \n\n"
        "LƯU Ý: Trả lời bằng tiếng Việt, chuẩn mực, mang đậm phong cách dịch vụ khách hàng. Tuyệt đối tuân thủ số liệu trong Context."
    )

    user_content = f"Dữ liệu tài chính thực tế của tôi:\n{stats_txt}\n\nCâu hỏi: {query}"
    text = f"<|im_start|>system\n{system_prompt}<|im_end|>\n<|im_start|>user\n{user_content}<|im_end|>\n<|im_start|>assistant\n{output}<|im_end|>\n"
    return {"text": text}

def generate_dynamic_samples():
    dataset = []
    
    # Danh sách các danh mục và gợi ý tiết kiệm tương ứng
    categories = {
        "Ăn uống": [
            "Tự nấu cơm mang đi làm thay vì ăn ngoài hàng ngày",
            "Giảm tần suất uống trà sữa, cà phê xuống 1 lần/tuần",
            "Hạn chế sử dụng app giao đồ ăn để tiết kiệm phí ship"
        ],
        "Mua sắm": [
            "Gỡ cài đặt các ứng dụng thương mại điện tử (Shopee, Lazada)",
            "Áp dụng quy tắc chờ 48 giờ trước khi mua một món đồ không thiết yếu",
            "Săn sale hoặc mua đồ cũ (second-hand) đối với các vật dụng ít xài"
        ],
        "Giải trí": [
            "Hủy gia hạn các dịch vụ trực tuyến không dùng đến (Netflix, Spotify)",
            "Tổ chức các buổi gặp mặt tại nhà thay vì đi xem phim, bar/pub",
            "Tìm kiếm các hoạt động giải trí miễn phí cuối tuần ở công viên"
        ],
        "Di chuyển": [
            "Sử dụng phương tiện công cộng (xe buýt) thay vì đi taxi/grab",
            "Gom các chuyến đi lại với nhau để tiết kiệm xăng",
            "Tìm bạn đi chung (carpool) nếu quãng đường đi làm xa"
        ]
    }
    
    tones = ["professional", "friendly", "urgent", "encouraging", "direct"]
    
    # Tạo 50 mẫu
    for i in range(50):
        # Chọn ngẫu nhiên 1 tone và 1 category
        tone = random.choice(tones)
        cat_name = random.choice(list(categories.keys()))
        tips = categories[cat_name]
        
        # Tạo số liệu ngẫu nhiên
        income = random.randint(8, 40) * 1000000
        
        if tone == "encouraging":
            # Dư dả
            expense = int(income * random.uniform(0.4, 0.7))
            cat_expense = int(income * random.uniform(0.1, 0.2))
        elif tone == "urgent":
            # Thâm hụt nặng
            expense = int(income * random.uniform(1.1, 1.5))
            cat_expense = int(income * random.uniform(0.5, 0.8))
        else:
            # Nguy hiểm hoặc hơi quá tay
            expense = int(income * random.uniform(0.8, 1.1))
            cat_expense = int(income * random.uniform(0.3, 0.5))
            
        balance = income - expense
        expense_ratio = (expense / income) * 100
        cat_ratio = (cat_expense / income) * 100
        excess = cat_expense - (income * 0.25) if cat_ratio > 25 else 0
        
        # Build Stats Text
        stats_txt = f"""Dữ liệu tài chính (tháng này):
- Tổng Thu nhập: {income:,} VND
- Tổng Chi tiêu: {expense:,} VND
- Số dư hiện tại: {balance:,} VND
- Các khoản chi chính: {cat_name} ({cat_expense:,})

[GỢI Ý TÍNH TOÁN CHO AI]:
- Tổng chi tiêu chiếm {expense_ratio:.1f}% thu nhập.
- Mục '{cat_name}' chiếm {cat_ratio:.1f}% thu nhập."""

        if excess > 0:
            stats_txt += f"\n  -> CẢNH BÁO: Mục '{cat_name}' đang vượt quá mức an toàn. Cần cắt giảm khoảng {excess:,.0f} VND."
        else:
            stats_txt += f"\n  -> Không có cảnh báo vượt mức. Tình hình rất tốt."
            
        # Build Query & Output based on Tone
        if tone == "professional":
            query = random.choice(["Xin chào, tình hình tài chính của tôi tháng này ra sao?", "Tôi cần tư vấn về chi tiêu tháng này.", "Phân tích giúp tôi dữ liệu tài chính nhé."])
            if excess > 0:
                output = f"""Kính chào Quý khách, FinTrack xin gửi đến Quý khách bản báo cáo tài chính chi tiết.

Hiện tại, hệ thống ghi nhận tổng chi tiêu của Quý khách là {expense:,} VND, chiếm {expense_ratio:.1f}% thu nhập. Số dư hiện tại đang ở mức {balance:,} VND.

Qua phân tích, hạng mục **{cat_name}** đang chiếm tỷ trọng rất cao với {cat_ratio:.1f}% (tương đương {cat_expense:,} VND). Đây là nguyên nhân chính gây ảnh hưởng đến sự an toàn tài chính.

Để tối ưu hóa ngân sách, FinTrack đề xuất Quý khách cần cắt giảm khoảng {excess:,.0f} VND từ hạng mục này. Dưới đây là các giải pháp cụ thể:
- {tips[0]}.
- {tips[1]}.
- {tips[2]}.

FinTrack luôn đồng hành cùng Quý khách trong việc quản lý chi tiêu hiệu quả."""
            else:
                output = f"""Kính chào Quý khách, FinTrack rất vui khi được thông báo tình hình tài chính của Quý khách đang ở trạng thái rất tốt.

Tổng chi tiêu chỉ chiếm {expense_ratio:.1f}% thu nhập, giúp Quý khách duy trì số dư dương {balance:,} VND. Các hạng mục, đặc biệt là {cat_name}, đều nằm trong mức an toàn.

FinTrack khuyến nghị Quý khách tiếp tục duy trì thói quen chi tiêu này và cân nhắc đưa phần tiền dư vào các quỹ đầu tư hoặc tiết kiệm sinh lời. Chúc Quý khách một ngày tốt lành!"""

        elif tone == "friendly":
            query = random.choice(["Tháng này tui xài tiền sao rồi bạn tư vấn giúp tui với.", "Check ví tiền giùm mình xem có ổn không nha.", "Bạn xem thử tháng này mình tiêu xài có lố không?"])
            if excess > 0:
                output = f"""Chào bạn! Mình đã xem qua sổ thu chi của bạn tháng này rồi đây.

Tháng này bạn chi tổng cộng {expense:,} VND, làm số dư hiện tại còn {balance:,} VND. Nhìn chung là bạn tiêu xài hơi thoáng tay một chút ở khoản **{cat_name}** đó. Khoản này đang chiếm tới {cat_ratio:.1f}% thu nhập luôn!

Để tháng sau rủng rỉnh hơn, bạn thử cắt giảm khoảng {excess:,.0f} VND từ khoản {cat_name} xem sao nhé. Gợi ý vài mẹo nhỏ cho bạn nè:
- {tips[0]}.
- {tips[1]}.
- {tips[2]}.

Cứ thử áp dụng từng chút một nha, chắc chắn tháng sau ví tiền của bạn sẽ "mập" lên đáng kể đó!"""
            else:
                output = f"""Chào bạn! Tin vui đây, tháng này bạn quản lý tiền bạc cực kỳ xuất sắc luôn!

Bạn chỉ xài có {expense_ratio:.1f}% thu nhập thôi, để dành ra được hẳn {balance:,} VND. Khoản {cat_name} cũng được bạn kiểm soát rất khéo.

Không có gì phải lo lắng cả, bạn cứ giữ vững phong độ này nhé. Nếu có thể, hãy đem số tiền dư đi gửi tiết kiệm nha!"""

        elif tone == "urgent":
            query = random.choice(["Trời ơi tôi lỡ vung tay quá trán rồi, cứu tôi!", "Tháng này âm nợ rồi, làm sao để gỡ lại đây?", "Tình hình nguy cấp quá, phân tích gấp giúp tôi."])
            if excess > 0:
                output = f"""CẢNH BÁO ĐỎ! FinTrack nhận thấy tình hình tài chính của bạn đang đối mặt với rủi ro cực kỳ lớn.

Bạn đã chi tiêu lố giới hạn, tổng chi lên tới {expense:,} VND, dẫn đến việc thâm hụt {balance:,} VND. Nguyên nhân lớn nhất là do bạn đã đổ quá nhiều tiền vào hạng mục **{cat_name}** (chiếm {cat_ratio:.1f}% thu nhập).

Để lập tức "cầm máu" cho ví tiền, bạn BẮT BUỘC phải hành động ngay lập tức bằng cách cắt giảm {excess:,.0f} VND từ khoản này. Các giải pháp khẩn cấp:
- {tips[0]}.
- {tips[1]}.
- {tips[2]}.

FinTrack khuyên bạn nên đóng băng ngay các khoản chi không thiết yếu từ bây giờ cho đến hết tháng để vượt qua giai đoạn này!"""
            else:
                output = f"""Tình hình không quá tệ như bạn nghĩ đâu! Tuy bạn cảm thấy lo lắng nhưng hệ thống ghi nhận bạn vẫn kiểm soát tốt. Số dư đang là {balance:,} VND. Hãy bình tĩnh duy trì các hạn mức hiện tại nhé."""

        elif tone == "direct":
            query = random.choice(["Báo cáo ngắn gọn cho tôi.", "Nói nhanh xem tôi cần cắt giảm khoản nào.", "Đưa ra con số cụ thể."])
            if excess > 0:
                output = f"""Chào bạn, FinTrack xin thông báo nhanh kết quả phân tích tháng này:

- Tổng chi tiêu: {expense_ratio:.1f}% thu nhập.
- Số dư: {balance:,} VND.
- Hạng mục vi phạm: **{cat_name}** (chiếm {cat_ratio:.1f}%).

Kế hoạch hành động: Bạn cần cắt giảm ngay {excess:,.0f} VND từ hạng mục {cat_name}. 
Cách thực hiện:
1. {tips[0]}.
2. {tips[1]}.
3. {tips[2]}.

Vui lòng tuân thủ chặt chẽ để đảm bảo an toàn tài chính."""
            else:
                output = f"""Chào bạn, tình hình tháng này rất ổn định.
- Chi tiêu: {expense_ratio:.1f}% thu nhập.
- Số dư: {balance:,} VND dương.
Không có hạng mục nào vi phạm hạn mức. Chúc bạn tiếp tục phát huy!"""

        else: # encouraging
            query = random.choice(["Tôi có đang làm tốt không?", "Đánh giá sự tiến bộ của tôi.", "Tháng này tôi tiết kiệm được nhiều chưa?"])
            output = f"""Tuyệt vời! FinTrack xin nhiệt liệt biểu dương khả năng quản lý tài chính xuất sắc của bạn trong tháng này.

Bạn đã kiểm soát tổng chi tiêu ở mức {expense:,} VND, bỏ ống heo được {balance:,} VND. Hạng mục {cat_name} cũng nằm gọn trong vùng an toàn với {cat_ratio:.1f}%.

Không có gì phải chê trách cả. Để tiền đẻ ra tiền, FinTrack khuyên bạn:
- Mang {balance:,} VND đi gửi tiết kiệm online kỳ hạn 1 tháng.
- Tự thưởng cho bản thân một món quà nhỏ vì đã rất kỷ luật.

Bạn đang làm cực kỳ tốt, cứ thế phát huy nhé!"""

        dataset.append(format_prompt(stats_txt, query, output))
        
    # Ghi ra file JSONL
    with open('financial_training_data.jsonl', 'w', encoding='utf-8') as f:
        for item in dataset:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
            
    print(f" Đã tạo thành công file 'financial_training_data.jsonl' với {len(dataset)} mẫu dữ liệu đa dạng.")
    print(" Hãy upload file này lên Google Colab để huấn luyện lại LoRA!")

if __name__ == "__main__":
    generate_dynamic_samples()
