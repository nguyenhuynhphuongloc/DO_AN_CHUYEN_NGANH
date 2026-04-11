# Tài liệu Kỹ thuật Dự án FinTrack AI

Tài liệu này ghi lại các đặc điểm chính, kiến trúc kỹ thuật và hướng dẫn sử dụng cho hệ thống AI của ứng dụng quản lý tài chính cá nhân FinTrack.

## 1. Các Đặc Điểm Chính (Key Features)

*   **Ghi chép giao dịch bằng ngôn ngữ tự nhiên:** Chatbot có khả năng hiểu và trích xuất thông tin (số tiền, danh mục, loại giao dịch) từ câu nói của người dùng.
*   **Cố vấn tài chính AI (AI Financial Advisor):** Phân tích dữ liệu chi tiêu cá nhân để đưa ra lời khuyên, nhận xét và giải đáp các thắc mắc về tài chính.
*   **Quét hóa đơn (OCR Service):** Nhận diện văn bản từ ảnh chụp hóa đơn để tự động đề xuất số tiền chi tiêu.
*   **Dự báo chi tiêu (Spending Prediction):** Sử dụng thuật toán thống kê để dự đoán xu hướng chi tiêu trong tương lai và cảnh báo các giao dịch bất thường.

## 2. Kỹ Thuật Xử Lý Chatbot (Chatbot Processing Techniques)

Hệ thống sử dụng kết hợp nhiều kỹ thuật từ cơ bản đến nâng cao:

### A. Phân tích ngôn ngữ (NLP Service)
*   **Regex (Regular Expression):** Sử dụng để trích xuất số tiền một cách chính xác (xử lý các định dạng như "50k", "1.5tr", "500.000đ").
*   **Keyword Mapping:** Ánh xạ các từ khóa phổ biến ("ăn", "cafe", "xăng") vào các danh mục mặc định.
*   **POS Tagging & Tokenization (underthesea):** Đối với các câu phức tạp không chứa từ khóa định sẵn, hệ thống sử dụng thư viện `underthesea` để phân tích ngữ pháp, xác định danh từ/động từ chính để "đoán" danh mục.

### B. AI Cố vấn (Advisor Service)
*   **Context Injection:** Hệ thống không chỉ gửi câu hỏi của người dùng cho AI mà còn đính kèm ngữ cảnh tài chính thực tế (tổng thu, tổng chi, số dư, top danh mục chi tiêu) để AI có câu trả lời sát thực tế nhất.
*   **Prompt Engineering:** Sử dụng "System Prompt" để định hình tính cách chuyên gia cho AI.

### C. Thị giác máy tính (OCR Service)
*   **Tesseract OCR:** Sử dụng engine Tesseract (với ngôn ngữ tiếng Việt) để chuyển đổi hình ảnh thành văn bản thô, sau đó dùng Regex để tìm kiếm các mẫu số tiền (Tổng cộng, Thành tiền, Total).

## 3. Ưu Điểm và Nhược Điểm

### Ưu điểm:
*   **Riêng tư & Bảo mật:** Với mô hình Qwen 2.5 chạy Local, dữ liệu tài chính không cần gửi lên các Cloud API bên thứ ba (như GPT-4 hay Gemini), đảm bảo tính riêng tư tuyệt đối cho người dùng.
*   **Tối ưu tiếng Việt:** Sử dụng các thư viện chuyên dụng cho tiếng Việt (`underthesea`) giúp xử lý tốt đặc thù ngôn ngữ.
*   **Trọng lượng nhẹ:** Mô hình được lượng tử hóa (Quantized 4-bit) nên chỉ tốn khoảng 2.5GB VRAM, có thể chạy mượt mà trên các máy tính tầm trung.
*   **Linh hoạt:** Người dùng có thể nhập liệu theo cách họ nói chuyện hàng ngày thay vì phải điền form khô khan.

### Nhược điểm:
*   **Giới hạn phần cứng:** Việc chạy Local yêu cầu máy tính có GPU hỗ trợ CUDA (NVIDIA) để đạt tốc độ xử lý nhanh nhất.
*   **Độ chính xác OCR:** Phụ thuộc nhiều vào chất lượng ảnh chụp và độ rõ nét của chữ trên hóa đơn. Các hóa đơn có layout phức tạp có thể bị nhận diện sai số tiền.
*   **Xử lý ngữ cảnh:** Đôi khi mô hình AI có thể đưa ra lời khuyên chung chung nếu dữ liệu lịch sử chi tiêu của người dùng quá ít.

## 4. Mô Hình Sử Dụng (Models Used)

1.  **AI Model:** `Qwen/Qwen2.5-3B-Instruct` (Mô hình ngôn ngữ lớn từ Alibaba, hỗ trợ tiếng Việt cực tốt, được chạy ở chế độ 4-bit quantization).
2.  **NLP Library:** `underthesea` (Thư viện xử lý ngôn ngữ tự nhiên cho tiếng Việt).
3.  **OCR Engine:** `pytesseract` (Wrapper của Google Tesseract OCR).
4.  **Backend Framework:** FastAPI (Mạnh mẽ, tốc độ cao, hỗ trợ asynchronous).

## 5. Mẫu Câu Có Thể Làm Với Chatbot

### Nhập liệu giao dịch:
- "Chi 50k ăn sáng sáng nay" (Hệ thống tự nhận diện: 50.000, Danh mục: Ăn uống, Loại: Chi tiêu)
- "Vừa nhận lương 15 triệu" (Hệ thống tự nhận diện: 15.000.000, Danh mục: Lương, Loại: Thu nhập)
- "Hôm qua đi đổ xăng hết 80 ngàn" (Tự động lùi ngày về hôm qua, Số tiền: 80.000, Danh mục: Di chuyển)
- "Được mẹ cho 1 củ tiêu vặt" (Nhận diện "1 củ" = 1.000.000, Loại: Thu nhập)

### Hỏi đáp cố vấn:
- "Tháng này tôi chi tiêu thế nào?"
- "Tôi có nên mua iPhone mới lúc này không với số dư hiện tại?"
- "Làm sao để tiết kiệm tiền điện nước?"
- "Hãy phân tích các khoản chi lớn nhất của tôi."
