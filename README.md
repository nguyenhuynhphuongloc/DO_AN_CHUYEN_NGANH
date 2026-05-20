# ĐỒ ÁN CHUYÊN NGÀNH

## Hệ thống quản lý tài chính cá nhân kết hợp mô hình AI

**Giảng viên hướng dẫn:** PGS. TS. Nguyễn Tuấn Đăng

**Thành viên thực hiện:**

- Nguyễn Việt Đức - 3122411044
- Nguyễn Huỳnh Phương Lộc - 3122411117
- Nguyễn Phạm Hoàng Quân - 3122411169
- Nguyễn Trần Quốc Tiến - 3122411208

---

## 1. Tổng quan đề tài

Đồ án xây dựng một hệ thống quản lý tài chính cá nhân hỗ trợ người dùng theo dõi thu nhập, chi tiêu, ví tiền, ngân sách, mục tiêu tiết kiệm và báo cáo tài chính. Điểm nhấn của hệ thống là tích hợp các chức năng AI để giảm thao tác nhập liệu thủ công và hỗ trợ người dùng ra quyết định tài chính tốt hơn.

Hệ thống gồm ba khối chính:

- **Web app:** giao diện người dùng và CMS nội bộ, xây dựng bằng Next.js, React và Payload CMS.
- **Receipt AI service:** dịch vụ OCR hóa đơn, trích xuất thông tin từ ảnh và gợi ý danh mục chi tiêu.
- **AI chatbot service:** dịch vụ xử lý ngôn ngữ tự nhiên, tư vấn tài chính, dự đoán chi tiêu và phát hiện bất thường.

---

## 2. Các chức năng chính

### Quản lý tài khoản và dữ liệu cá nhân

- Đăng ký, đăng nhập và phân quyền người dùng.
- Tách dữ liệu theo từng người dùng.
- Hỗ trợ vai trò quản trị viên để theo dõi dữ liệu hệ thống.

### Quản lý ví tiền

- Tạo và quản lý nhiều ví.
- Phân loại ví như tiền mặt, ngân hàng, ví chính hoặc ví tiết kiệm.
- Tự động cập nhật số dư khi phát sinh giao dịch.

### Quản lý giao dịch

- Thêm giao dịch thu nhập và chi tiêu.
- Gắn giao dịch với ví, danh mục, ngày giao dịch, ghi chú và hóa đơn.
- Theo dõi nguồn tạo giao dịch: nhập tay, chatbot, OCR hóa đơn, chuyển khoản hoặc điều chỉnh.

### Quản lý danh mục và ngân sách

- Quản lý danh mục thu nhập/chi tiêu mặc định và danh mục riêng của người dùng.
- Thiết lập ngân sách theo danh mục, ví và kỳ thời gian.
- Theo dõi mức sử dụng ngân sách để cảnh báo chi tiêu vượt kế hoạch.

### Mục tiêu tiết kiệm

- Tạo mục tiêu tiết kiệm với số tiền mục tiêu và thời hạn.
- Ghi nhận các khoản đóng góp hoặc rút tiền.
- Liên kết mục tiêu tiết kiệm với ví và giao dịch.

### Báo cáo tài chính

- Tổng hợp thu nhập, chi tiêu, số dư và tỷ lệ tiết kiệm.
- Phân tích chi tiêu theo danh mục.
- Hiển thị nguồn giao dịch, bao gồm giao dịch tạo từ AI chatbot và OCR.

### Quản trị hệ thống

- Dashboard quản trị cho người dùng, ví, giao dịch, danh mục, ngân sách, tiết kiệm, hóa đơn và log AI.
- Theo dõi các tương tác AI để kiểm tra chất lượng phản hồi và truy vết lỗi.

---

## 3. Các điểm ấn tượng của đồ án

- **Tích hợp AI vào luồng nghiệp vụ thật:** AI không chỉ trả lời hội thoại mà còn tạo dữ liệu giao dịch, đọc hóa đơn, gợi ý danh mục và hỗ trợ lưu giao dịch.
- **Kiến trúc tách dịch vụ rõ ràng:** web app, OCR service và chatbot service được tách thành các service riêng, dễ triển khai bằng Docker Compose.
- **OCR hóa đơn có bước kiểm duyệt:** hệ thống không tự động lưu ngay kết quả AI, mà hiển thị form xác nhận để người dùng kiểm tra và chỉnh sửa trước khi lưu.
- **Gợi ý danh mục có kiểm soát:** AI chỉ được chọn trong danh sách danh mục hợp lệ của người dùng hoặc danh mục mặc định, tránh sinh danh mục không tồn tại.
- **Có fallback khi AI không chắc chắn:** phân loại danh mục dùng keyword matching trước, sau đó mới dùng Groq nếu được bật.
- **Dữ liệu tài chính được cập nhật đồng bộ:** khi tạo giao dịch, hệ thống tự động cập nhật số dư ví và liên kết hóa đơn với giao dịch.
- **Có logging cho AI:** các tương tác advisor/chatbot được lưu lại để phục vụ quản trị, debug và đánh giá chất lượng.

---

## 4. Cách xử lý chức năng AI

### 4.1. OCR hóa đơn

Luồng xử lý OCR:

1. Người dùng chọn ảnh hóa đơn ở trang quét hóa đơn.
2. Frontend gửi ảnh đến API `POST /api/ai/ocr/receipt`.
3. API kiểm tra đăng nhập, định dạng file và lấy danh sách danh mục chi tiêu hợp lệ.
4. Ảnh và metadata được chuyển sang service Python `receipt-ai`.
5. Service OCR lưu ảnh tạm, gửi ảnh sang Veryfi để nhận dữ liệu OCR và dữ liệu hóa đơn có cấu trúc.
6. Kết quả Veryfi được chuẩn hóa thành JSON nội bộ:
   - tên cửa hàng
   - ngày giao dịch
   - tổng tiền
   - tiền tệ
   - danh sách mặt hàng
   - raw OCR text
7. Hệ thống kiểm tra ảnh có giống hóa đơn hợp lệ không.
8. Hệ thống gợi ý danh mục chi tiêu.
9. Frontend nhận `review_fields` và điền vào form để người dùng xác nhận.
10. Khi người dùng bấm lưu, hệ thống tạo media hóa đơn, tạo giao dịch và cập nhật số dư ví.

Các file chính:

- `do-an-chuyen-nganh/src/app/(frontend)/scan/ScanClient.tsx`
- `do-an-chuyen-nganh/src/app/api/ai/ocr/receipt/route.ts`
- `do-an-chuyen-nganh/src/app/api/ai/ocr/receipt/confirm/route.ts`
- `do-an-chuyen-nganh/services/receipt-ai/app.py`
- `do-an-chuyen-nganh/services/receipt-ai/receipt_core/receipt_intelligence/service.py`
- `do-an-chuyen-nganh/services/receipt-ai/receipt_core/receipt_intelligence/veryfi_parser.py`
- `do-an-chuyen-nganh/services/receipt-ai/receipt_core/receipt_intelligence/normalizer.py`

### 4.2. Yếu tố quyết định thông tin được lấy ra JSON

Các trường JSON của hóa đơn phụ thuộc chủ yếu vào dữ liệu Veryfi trả về:

- `vendor.name` hoặc `vendor_name` được chuẩn hóa thành `merchant_name`.
- `date` được chuẩn hóa thành `transaction_date` và `transaction_datetime`.
- `total` được chuẩn hóa thành `total_amount`.
- `currency_code` hoặc `currency` được chuẩn hóa thành `currency`.
- `line_items` được chuẩn hóa thành danh sách mặt hàng gồm tên, số lượng, đơn giá và thành tiền.
- `ocr_text` được lưu làm raw text để người dùng hoặc admin kiểm tra lại.

Sau khi chuẩn hóa, service tạo `review_fields` để frontend điền vào form xác nhận. Nhờ đó người dùng vẫn có quyền chỉnh sửa nếu OCR đọc sai.

### 4.3. Xác định ảnh có phải hóa đơn hợp lệ

Service kiểm tra kết quả OCR trước khi trả thành công. Một ảnh được xem là hóa đơn khi:

- Loại tài liệu từ provider thuộc nhóm `receipt`, `invoice`, `bill` hoặc `order`.
- Có tổng tiền.
- Có thêm ít nhất một tín hiệu như tên cửa hàng, ngày giao dịch, danh sách mặt hàng hoặc raw text chứa từ khóa hóa đơn.

Nếu không đạt điều kiện, hệ thống trả lỗi `NOT_RECEIPT` thay vì tạo dữ liệu sai.

### 4.4. Xác định danh mục tương thích với hóa đơn

Danh mục được xử lý theo hai lớp:

**Lớp 1: keyword fallback**

Hệ thống tạo chuỗi tìm kiếm từ tên cửa hàng, danh mục provider, phương thức thanh toán và tên mặt hàng. Sau đó so khớp với bộ alias:

- Family Mart, Circle K, GS25, WinMart, cafe, nhà hàng -> Ăn uống
- Shopee, Lazada, quần áo, giày dép -> Mua sắm
- Grab, taxi, xăng, xe buýt -> Di chuyển
- điện, nước, internet, Viettel, FPT -> Hóa đơn
- nhà thuốc, bệnh viện, khám bệnh -> Sức khỏe

**Lớp 2: Groq AI**

Nếu cấu hình Groq được bật, hệ thống gửi tên cửa hàng, tổng tiền, danh sách mặt hàng và danh sách category hợp lệ sang Groq. Groq phải trả JSON theo schema cố định, trong đó `category_id` và `category_name` chỉ được chọn từ danh sách cho phép.

Sau khi nhận kết quả, hệ thống kiểm tra lại `category_id` và `category_name`. Nếu AI trả danh mục không hợp lệ, hệ thống bỏ kết quả đó và dùng fallback.

File chính:

- `do-an-chuyen-nganh/services/receipt-ai/receipt_core/receipt_intelligence/category_resolver.py`

### 4.5. Chatbot nhập giao dịch bằng ngôn ngữ tự nhiên

AI chatbot service hỗ trợ phân tích câu nhập tự nhiên, ví dụ người dùng có thể nhập nội dung chi tiêu bằng tiếng Việt. Service trích xuất:

- số tiền
- loại giao dịch
- danh mục
- ngày giao dịch
- mô tả

Endpoint chính:

- `POST /api/nlp/parse`

Cách xử lý:

- Làm sạch câu nhập.
- Dùng keyword matching để nhận diện danh mục.
- Có thể kết hợp embedding classification nếu bật cấu hình liên quan.
- Trả dữ liệu có cấu trúc để web app tạo giao dịch.

File chính:

- `do-an-chuyen-nganh/services/ai-chatbot/main.py`
- `do-an-chuyen-nganh/services/ai-chatbot/nlp_service.py`
- `do-an-chuyen-nganh/services/ai-chatbot/embedding_service.py`

### 4.6. Tư vấn tài chính bằng AI

Chức năng advisor nhận câu hỏi của người dùng cùng bối cảnh tài chính hiện tại, sau đó gọi Groq để tạo lời khuyên. Bối cảnh có thể bao gồm tổng thu, tổng chi, phân bổ danh mục, ngân sách và các chỉ số tài chính.

Endpoint chính:

- Web API: `POST /api/ai/advisor`
- AI service: `POST /api/ai/advisor`

Các tương tác advisor được ghi vào `AIChatLogs` để quản trị viên có thể theo dõi.

File chính:

- `do-an-chuyen-nganh/src/app/api/ai/advisor/route.ts`
- `do-an-chuyen-nganh/services/ai-chatbot/advisor_service.py`
- `do-an-chuyen-nganh/src/collections/AIChatLogs.ts`

### 4.7. Dự đoán chi tiêu và phát hiện bất thường

AI chatbot service còn có endpoint hỗ trợ:

- `POST /api/predict`: dự đoán xu hướng chi tiêu tương lai.
- `POST /api/anomaly`: phát hiện giao dịch bất thường.
- `POST /api/learn`: bổ sung mẫu học cho phân loại danh mục.

Nhóm chức năng này giúp hệ thống tiến gần hơn đến một trợ lý tài chính cá nhân thay vì chỉ là ứng dụng nhập liệu.

---

## 5. Kiến trúc tổng quát

```text
Người dùng
   |
   v
Next.js Web App + Payload CMS
   |
   |-- PostgreSQL: user, wallet, transaction, budget, saving, log AI
   |
   |-- receipt-ai service: OCR hóa đơn, Veryfi, chuẩn hóa JSON, gợi ý danh mục
   |
   |-- ai-chatbot service: NLP transaction parser, advisor, prediction, anomaly
```

Triển khai Docker Compose:

- `web`: Next.js + Payload CMS, port `3000`
- `ai-chatbot`: FastAPI chatbot service, port `8000`
- `receipt-ai`: FastAPI OCR service, port `8001`

---

## 6. Công nghệ sử dụng

- **Frontend:** Next.js 15, React 19, TypeScript
- **Backend/CMS:** Payload CMS 3
- **Database:** PostgreSQL
- **AI service:** Python, FastAPI
- **OCR provider:** Veryfi
- **LLM provider:** Groq API
- **Biểu đồ và báo cáo:** Recharts
- **Icon/UI:** Lucide React, React Icons
- **Kiểm thử:** Vitest, Playwright
- **Triển khai local:** Docker Compose

---

## 7. Cấu hình môi trường

Các biến môi trường quan trọng:

```env
DATABASE_URI=
PAYLOAD_SECRET=
AI_SERVICE_URL=http://localhost:8001
AI_CHATBOT_SERVICE_URL=http://localhost:8000

VERYFI_CLIENT_ID=
VERYFI_CLIENT_SECRET=
VERYFI_USERNAME=
VERYFI_API_KEY=
VERYFI_BASE_URL=https://api.veryfi.com/api/
VERYFI_API_VERSION=v8

GROQ_API_KEY=
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=openai/gpt-oss-120b
GROQ_CATEGORY_RESOLUTION_ENABLED=true
```

Không nên commit file `.env` chứa khóa thật lên repository.

---

## 8. Cách chạy dự án

Di chuyển vào thư mục ứng dụng:

```bash
cd do-an-chuyen-nganh
```

Chạy bằng Docker Compose:

```bash
docker compose up --build
```

Các service sau khi chạy:

- Web app: `http://localhost:3000`
- AI chatbot service: `http://localhost:8000`
- Receipt OCR service: `http://localhost:8001`

Chạy web app ở môi trường local:

```bash
pnpm install
pnpm dev
```

Chạy kiểm thử:

```bash
pnpm test
```

---

## 9. Kết luận

Đồ án tập trung xây dựng một hệ thống quản lý tài chính cá nhân có khả năng ứng dụng AI vào các thao tác thường gặp: đọc hóa đơn, tự động trích xuất thông tin, gợi ý danh mục, nhập giao dịch bằng ngôn ngữ tự nhiên và tư vấn tài chính. Kiến trúc tách service giúp hệ thống dễ mở rộng, dễ thay thế mô hình AI/OCR và phù hợp với hướng phát triển thành một trợ lý tài chính cá nhân hoàn chỉnh.
