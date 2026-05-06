# Kế hoạch điều chỉnh hệ thống quản lý chi tiêu cá nhân

Ngày lập kế hoạch: 2026-05-05  
Phạm vi: hệ thống chính cho người dùng, hệ thống admin, schema Payload, dữ liệu Postgres/Neon trong `.env`, AI chatbot, OCR hóa đơn, báo cáo và biểu đồ.

## 1. Mục tiêu sản phẩm sau khi chỉnh sửa

Hệ thống cần đi theo hướng app quản lý chi tiêu cá nhân giống Money Lover, Timo hoặc các app ngân sách cá nhân:

- Người dùng biết mình đang có bao nhiêu tiền.
- Người dùng đặt được mức chi tiêu mong muốn trong tháng.
- Người dùng chia mức chi tiêu đó thành các "hũ" hoặc hạn mức theo danh mục.
- Người dùng ghi nhận giao dịch thủ công, qua chatbot hoặc qua OCR hóa đơn.
- Người dùng xem báo cáo rõ ràng theo ví, nguồn tiền, danh mục, hạn mức và hóa đơn.
- Admin chỉ quản trị hệ thống, không dùng chung luồng đăng nhập/chức năng với user thường.

Nguyên tắc bắt buộc:

1. User thường và admin phải tách rõ.
2. User chỉ điều chỉnh thông tin cá nhân và dữ liệu tài chính của chính mình.
3. Danh mục hệ thống là danh mục chuẩn dùng chung để chọn, nhưng dữ liệu "hũ/hạn mức" là riêng từng user.
4. Chatbot và OCR không được tự tạo danh mục mới khi tạo giao dịch.
5. Dữ liệu rác trong `categories` phải được dọn bằng migration có mapping an toàn.
6. `wallets` phải được đưa vào Payload schema và dùng làm nguồn số dư/nguồn tiền chính.
7. Báo cáo phải thể hiện rõ nguồn tiền, chi tiêu, tiết kiệm và mức vượt hạn mức.

## 2. Hiện trạng database kiểm tra được

Database lấy từ `.env` là Neon/Postgres. Các bảng thực tế đang có:

```text
budgets
categories
media
notifications
payload_kv
payload_locked_documents
payload_locked_documents_rels
payload_migrations
payload_preferences
payload_preferences_rels
receipt_parse_jobs
receipt_parse_sessions
receipt_parser_results
receipts
savings_goals
savings_goals_rels
transactions
users
users_sessions
wallets
```

Payload config hiện tại chỉ đăng ký:

```text
users
media
categories
transactions
budgets
```

Như vậy database thực tế có các bảng quan trọng nhưng source Payload chưa quản lý đầy đủ:

| Bảng | Có trong DB | Có trong Payload config | Ghi chú |
|---|---:|---:|---|
| `wallets` | Có | Không | Cần thêm collection chính thức |
| `receipts` | Có | Không | Cần cân nhắc thay thế/đồng bộ với `media` receipt |
| `receipt_parse_sessions` | Có | Không | Có sẵn cấu trúc audit OCR tốt hơn code hiện tại |
| `receipt_parser_results` | Có | Không | Có thể dùng cho lưu kết quả OCR |
| `savings_goals` | Có | Không | UI đang gọi nhưng Payload config chưa đăng ký |
| `notifications` | Có | Không | UI đang gọi nhưng Payload config chưa đăng ký |

Số lượng dữ liệu chính:

| Bảng | Số dòng |
|---|---:|
| `users` | 22 |
| `categories` | 52 |
| `transactions` | 154 |
| `budgets` | 0 |

`wallets` hiện có 13 dòng, đa số là `Default Wallet`, mỗi dòng gắn một `user_id`. Đây nên trở thành bảng/collection nguồn để xác định số dư và ví tiết kiệm của từng user.

### 2.1. Vai trò các bảng không thuộc nhóm `payload_*`

Các bảng dưới đây là các bảng có ý nghĩa trực tiếp hoặc gián tiếp với nghiệp vụ hiện tại, không tính các bảng nội bộ của Payload như `payload_kv`, `payload_migrations`, `payload_preferences`, `payload_locked_documents`.

| Bảng | Vai trò hiện tại trong hệ thống | Suy nghĩ/đánh giá |
|---|---|---|
| `users` | Lưu tài khoản đăng nhập, thông tin cá nhân, role `admin/user`, tiền tệ, avatar. | Đây là bảng trung tâm của hệ thống. Hiện đang dùng chung cho user thường và admin nên cần siết phân quyền hoặc tách rõ admin với user thường. |
| `users_sessions` | Lưu session đăng nhập của Payload auth. | Đây là bảng auth phụ của `users`, cần giữ để Payload quản lý phiên đăng nhập. Không phải bảng nghiệp vụ tài chính. |
| `media` | Lưu file upload như avatar và ảnh hóa đơn. | Đang được Payload quản lý. Cần phân quyền lại vì ảnh hóa đơn là dữ liệu nhạy cảm, không nên để public toàn bộ. |
| `categories` | Lưu danh mục thu/chi. | Là bảng nghiệp vụ quan trọng nhưng hiện đang bẩn: trộn danh mục hệ thống, danh mục cá nhân, dữ liệu test, dữ liệu OCR/debug và dữ liệu bị lỗi encoding. Cần dọn và chuẩn hóa trước khi phát triển tiếp báo cáo/hũ chi tiêu. |
| `transactions` | Lưu giao dịch thu/chi của user. | Đây là bảng nghiệp vụ chính. DB thực tế đã có `wallet_id`, `savings_goal_id`, `source_ref_id`, nhưng Payload source hiện chưa phản ánh đầy đủ. Cần cập nhật schema để giao dịch gắn ví, nguồn tạo và hóa đơn rõ ràng. |
| `budgets` | Lưu hạn mức theo danh mục. | Hiện đang trống. Nên dùng bảng này làm "hũ chi tiêu" theo user/category/tháng, đồng bộ với mức chi tiêu tháng của ví chính. |
| `wallets` | Lưu ví/số dư theo user. | DB có sẵn nhưng code Payload chưa đăng ký. Đây nên trở thành nguồn tiền chính: ví chính, ví tiết kiệm, số dư, mức chi tiêu tháng. Mỗi user có ví riêng, không dùng chung. |
| `receipts` | Lưu thông tin ảnh hóa đơn đã upload. | Có vẻ là bảng thiết kế riêng cho OCR/receipt, phù hợp hơn việc chỉ lưu ảnh trong `media`. Nên tích hợp với transaction để user xem lại hóa đơn. |
| `receipt_parse_sessions` | Lưu phiên xử lý OCR: file, raw text, merchant, total, trạng thái review, kết quả trích xuất. | Đây là bảng audit OCR rất có giá trị. Code OCR hiện tại chưa tận dụng đầy đủ. Nên dùng để lưu quá trình OCR, dữ liệu trước/sau khi user xác nhận và phục vụ kiểm thử OCR. |
| `receipt_parse_jobs` | Lưu job xử lý OCR theo session. | Có thể phục vụ workflow OCR bất đồng bộ. Hiện OCR route đang xử lý trực tiếp, nên bảng này có thể là phần còn sót từ thiết kế trước hoặc dùng cho giai đoạn tối ưu sau. |
| `receipt_parser_results` | Lưu kết quả parse OCR theo receipt/provider. | Nên dùng để lưu raw provider JSON, normalized JSON, category đề xuất và mô tả đề xuất. Phù hợp cho báo cáo kiểm thử chương OCR. |
| `savings_goals` | Lưu mục tiêu tiết kiệm. | DB có bảng và UI có `/savings`, nhưng Payload config hiện chưa đăng ký. Chức năng này đang lệch giữa DB và source code. Nếu ưu tiên ví tiết kiệm cá nhân, có thể làm sau `wallets.walletType = savings`. |
| `savings_goals_rels` | Bảng quan hệ participants của `savings_goals` với users. | Dùng cho mục tiêu tiết kiệm nhóm. Nếu giai đoạn đầu chỉ làm tiết kiệm cá nhân, chưa cần ưu tiên bảng này. |
| `notifications` | Lưu thông báo cho user. | Có thể dùng cho cảnh báo vượt hạn mức, lời mời tiết kiệm, OCR hoàn tất. Hiện UI có đọc nhưng collection chưa đăng ký trong Payload config. Nên dùng sau khi hũ chi tiêu/budget hoạt động ổn. |

Nhìn tổng thể, database đang phản ánh một thiết kế rộng hơn source code hiện tại. DB đã có các mảnh quan trọng như `wallets`, `receipts`, `receipt_parse_sessions`, `savings_goals`, `notifications`, nhưng Payload config và UI hiện chỉ vận hành chắc chắn quanh `users`, `media`, `categories`, `transactions`, `budgets`.

Các bảng nên ưu tiên đưa vào hệ thống chính ngay:

1. `wallets`: đưa vào Payload, vì yêu cầu mới cần số dư, ví chính, ví tiết kiệm.
2. `budgets`: biến thành hũ chi tiêu theo danh mục.
3. `transactions`: cập nhật schema để dùng `wallet_id`, `source_type`, `source_ref_id`, `receipt_id`.
4. `categories`: dọn dữ liệu rác và chuẩn hóa danh mục hệ thống/danh mục cá nhân.
5. `receipts` và `receipt_parse_sessions`: dùng cho xem lại hóa đơn và audit OCR.

Các bảng nên để giai đoạn sau:

- `savings_goals`, `savings_goals_rels`: chỉ ưu tiên nếu muốn giữ tiết kiệm dạng mục tiêu/nhóm. Nếu mục tiêu hiện tại là ví tiết kiệm cá nhân, nên ưu tiên `wallets.walletType = savings` trước.
- `receipt_parse_jobs`: chỉ cần khi OCR chuyển sang xử lý bất đồng bộ/job queue.
- `notifications`: nên dùng sau khi budget/hũ hoạt động để cảnh báo vượt hạn mức, sau đó mở rộng cho OCR hoặc tiết kiệm nhóm.

## 3. Nội dung `.env` hiện tại

Theo yêu cầu, nội dung `.env` được ghi nguyên trạng vào báo cáo:

```env
DATABASE_URL=postgresql://neondb_owner:npg_twNiEYd57PAU@ep-wispy-wave-a15tkgon-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
PAYLOAD_SECRET=YOUR_SECRET_HERE
HUGGINGFACE_TOKEN=hf_kkaANqTTVlYQRAHoYvOeTWlqreGBtNjpFXU
GOOGLE_API_KEY=AIzaSyAsWSnz9ZBhX75IO2W3Esl2BoDNGPhT_24
HYPEREAL_API_KEY=ck_23f2aacc69409ddf84dac19b1d339e93a1e2b27a4a34d1125a923830b5280db0
HYPEREAL_BASE_URL=https://api.hypereal.cloud/v1
AI_SERVICE_URL=http://localhost:8000

# Receipt AI runtime copied from AI/microservices/receipt-service/.env
VERYFI_CLIENT_ID=vrfL4gcALDAc6CrZWHzmZJtMF9PTJ8St0HjAH81
VERYFI_CLIENT_SECRET=lH3E0BBGfOC9HGBtFUfDGe8878j6vg9U8NPNLPGRSbDFAkv44X6G114LlAHDB3wcNnZRkT1ZkTCXnIWAD73pWiMaP3DY3VlcArSOnJfDcHkBfp6Fo3gf4RFDOfjFPWpn
VERYFI_USERNAME=thiennguyen.10168
VERYFI_API_KEY=463c78f1be6e75efad3b6905b9f26286
VERYFI_BASE_URL=https://api.veryfi.com/api/
VERYFI_API_VERSION=v8
VERYFI_TIMEOUT_SECONDS=30
VERYFI_MAX_RETRIES=2
GROQ_API_KEY=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
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=openai/gpt-oss-20b
GROQ_TIMEOUT_SECONDS=20
GROQ_CATEGORY_RESOLUTION_ENABLED=true
RECEIPT_PREPROCESS_ENABLED=true
```

Ghi chú triển khai: `.env.example` hiện cũng chứa giá trị thật giống `.env`. Khi triển khai thực tế nên thay `.env.example` bằng placeholder, nhưng không làm việc đó trong bước lập kế hoạch này.

## 4. Tách rõ hệ thống user và admin

### 4.1. Hiện trạng cần sửa

Hiện tại `users` vừa là tài khoản frontend, vừa là tài khoản đăng nhập Payload admin. Field `role` có `admin/user`, nhưng chưa khóa đủ chặt.

Rủi ro:

- User thường có thể có cơ hội truy cập `/admin`.
- User có thể tự gửi `role: "admin"` khi đăng ký/cập nhật nếu field access không chặn.
- Admin và user thường dùng chung collection nên dễ lẫn trách nhiệm.

### 4.2. Mô hình mục tiêu

Có 2 hướng. Khuyến nghị dùng hướng A vì ít phá hệ thống hiện tại hơn.

| Hướng | Mô tả | Đánh giá |
|---|---|---|
| A | Giữ collection `users`, dùng `role` để tách `admin` và `user`, khóa admin access bằng role | Nhanh, phù hợp Payload hiện tại |
| B | Tạo collection riêng `admins` cho Payload admin, `users` chỉ cho frontend | Tách sạch hơn nhưng migration lớn hơn |

Khuyến nghị: bắt đầu với hướng A, sau đó nếu cần chuẩn hóa sâu thì chuyển sang hướng B.

### 4.3. Quy tắc sau chỉnh sửa

| Đối tượng | Đăng nhập ở đâu | Quyền |
|---|---|---|
| User thường | `/auth/login` | Chỉ dữ liệu cá nhân: profile, wallets, transactions, category budgets, reports, OCR/chat |
| Admin | `/admin` | Quản trị cấu hình hệ thống: danh mục chuẩn, user, dữ liệu lỗi, receipt audit, seed/migration |

Việc cần làm:

1. Thêm `admin.access` trong Payload config: chỉ cho `user.role === "admin"`.
2. Field `role` chỉ admin được tạo/cập nhật.
3. Đăng ký frontend không được nhận `role` từ client; luôn gán `user`.
4. User thường chỉ đọc/cập nhật chính mình.
5. Admin có thể quản trị user nhưng không đăng nhập vào trải nghiệm tài chính cá nhân của user.

## 5. Mô hình dữ liệu mục tiêu

### 5.1. Wallets

`wallets` đang có trong DB nhưng chưa có Payload collection. Cần đưa vào source.

Mục đích:

- Xác định số dư người dùng muốn đặt ra.
- Quản lý ví mặc định và ví tiết kiệm.
- Là nguồn cho báo cáo nguồn tiền.

Collection đề xuất:

| Field | Kiểu | Ghi chú |
|---|---|---|
| `user` | relationship `users` | owner, bắt buộc |
| `name` | text | Ví chính, Tiết kiệm, Tiền mặt... |
| `walletType` | select | `main`, `cash`, `bank`, `savings` |
| `currency` | select/text | mặc định `VND` |
| `balance` | number | số dư hiện tại |
| `monthlySpendingLimit` | number | mức chi tiêu mong muốn trong tháng, chỉ áp dụng ví chính hoặc budget profile |
| `isDefault` | checkbox | mỗi user chỉ có 1 ví mặc định |
| `isActive` | checkbox | soft-delete |

Ràng buộc:

- Mỗi user có ít nhất 1 wallet mặc định.
- Mỗi user có thể có 1 hoặc nhiều wallet tiết kiệm.
- User chỉ thấy wallet của chính mình.
- Transaction phải gắn `wallet`.

### 5.2. Categories

Categories phải tách 2 lớp:

1. Danh mục hệ thống: dùng chung, do admin quản lý.
2. Danh mục cá nhân: người dùng có thể tạo thêm để cá nhân hóa, nhưng chỉ riêng họ dùng.

Không dùng chung "hũ" giữa các user.

Field đề xuất bổ sung:

| Field | Kiểu | Ghi chú |
|---|---|---|
| `scope` | select `system/user` | thay cho việc suy luận bằng `isDefault` |
| `owner` | relationship `users` | chỉ có khi `scope = user` |
| `normalizedName` | text/index | phục vụ chống trùng |
| `note` | textarea | ghi chú danh mục/hũ |
| `monthlyLimit` | number | hạn mức riêng nếu muốn lưu trực tiếp tại category-user |
| `isActive` | checkbox | thay vì xóa cứng |

Tuy nhiên, tốt hơn nên tách hạn mức ra khỏi `categories`, vì một danh mục có thể có hạn mức khác nhau theo tháng.

### 5.3. Category Budgets / Hũ chi tiêu

Hiện có collection `budgets` nhưng đang trống. Nên dùng `budgets` làm "hũ chi tiêu theo danh mục".

Mô hình đề xuất:

| Field | Kiểu | Ghi chú |
|---|---|---|
| `user` | relationship `users` | owner |
| `wallet` | relationship `wallets` | ví áp dụng |
| `category` | relationship `categories` | danh mục hệ thống hoặc danh mục riêng của user |
| `amount` | number | hạn mức |
| `period` | select | chủ yếu `monthly`, có thể giữ daily/weekly/yearly |
| `month` | number | nếu muốn budget theo tháng cụ thể |
| `year` | number | nếu muốn budget theo năm cụ thể |
| `note` | textarea | ghi chú hũ |
| `alertThresholds` | array/json | ví dụ 80%, 100% |
| `isActive` | checkbox | soft-delete |

Ràng buộc:

- Unique: `(user, wallet, category, period, month, year)` hoặc `(user, wallet, category, period)` nếu dùng recurring budget.
- Tổng `budgets.amount` của các danh mục trong tháng không được vượt `wallet.monthlySpendingLimit`, trừ khi user xác nhận override.
- Nếu chi tiêu vượt hạn mức danh mục, hệ thống tạo notification/cảnh báo UI.
- Nếu tổng chi tiêu vượt mức chi tiêu tháng, dashboard phải cảnh báo.

### 5.4. Transactions

Transaction cần gắn rõ nguồn tiền.

Field cần có/chuẩn hóa:

| Field | Hiện trạng DB | Đề xuất |
|---|---|---|
| `wallet_id` | Có trong DB, chưa có Payload source hiện tại | Đưa vào collection `Transactions` |
| `savings_goal_id` | Có trong DB, chưa có Payload source hiện tại | Nếu giữ savings, đưa vào schema |
| `source_type` | DB là varchar, Payload source enum chỉ có `manual/receipt_ai` | Chuẩn hóa enum: `manual`, `chatbot`, `receipt_ai`, `transfer`, `adjustment` |
| `source_ref_id` | Có trong DB | Dùng liên kết OCR session/chat parse nếu có |
| `receipt_id` | Có | Dùng để xem lại hóa đơn |
| `merchant_name` | Có | Giữ |
| `currency` | Có | Giữ |

Quy tắc:

- Chatbot và OCR chỉ được chọn category từ danh sách hợp lệ đã có.
- Không tự tạo category từ AI.
- Khi transaction là expense: trừ vào wallet balance hoặc tính vào spending report.
- Khi transaction là income: cộng vào wallet balance.
- Khi transaction là transfer to savings: chuyển từ ví chính sang ví tiết kiệm, không tính là chi tiêu tiêu dùng nếu app muốn báo cáo chuẩn hơn.

### 5.5. Receipts và OCR audit

DB đã có `receipts`, `receipt_parse_sessions`, `receipt_parser_results`. Nên tận dụng thay vì chỉ lưu ảnh vào `media`.

Mục tiêu:

- Giao dịch từ OCR có thể xem lại hóa đơn.
- User có thể xem ảnh, text OCR, field đã trích xuất, field đã chỉnh sửa.
- Báo cáo kiểm thử OCR có dữ liệu audit rõ.

Đề xuất:

- Đăng ký collection `Receipts`.
- Đăng ký collection `ReceiptParseSessions` hoặc ít nhất tạo route/service dùng bảng hiện có.
- Transaction `receipt` trỏ tới receipt/media ổn định.
- Trang giao dịch có nút "Xem hóa đơn" mở modal chi tiết: ảnh, merchant, ngày, tổng tiền, raw OCR, line items.

### 5.6. Savings

Yêu cầu mới nói wallet có thể có mục tiết kiệm. Vì vậy module tiết kiệm nên đơn giản hóa:

| Hiện tại | Đề xuất |
|---|---|
| `savings_goals` nhóm, participants, notifications | Giữ nếu cần, nhưng không ưu tiên |
| Đóng góp tiết kiệm tạo expense | Chuyển thành transfer hoặc wallet savings transaction |
| `currentAmount` không tự cập nhật | Tính từ wallet savings balance hoặc contribution transactions |

Đề xuất giai đoạn đầu:

- Dùng `wallets.walletType = savings` cho mục tiết kiệm cá nhân.
- Tạm ẩn tính năng tiết kiệm nhóm nếu chưa hoàn thiện.
- Báo cáo hiển thị "Ví chính", "Ví tiết kiệm", "Tổng tài sản", "Chi tiêu tháng".

## 6. Kế hoạch dọn categories

### 6.1. Categories hiện có cần giữ làm danh mục hệ thống

Danh mục hệ thống đề xuất cho chi tiêu:

| Tên | Type | Icon đề xuất | Màu |
|---|---|---|---|
| Ăn uống | expense | `Utensils` hoặc `MdRestaurant` | `#ef4444` |
| Đi lại | expense | `Car` hoặc `MdDirectionsCar` | `#f59e0b` |
| Mua sắm | expense | `ShoppingCart` hoặc `MdShoppingCart` | `#ec4899` |
| Nhà cửa | expense | `Home` hoặc `MdHome` | `#14b8a6` |
| Hóa đơn | expense | `ReceiptText` hoặc `MdReceipt` | `#84cc16` |
| Sức khỏe | expense | `HeartPulse` hoặc `MdMedicalServices` | `#06b6d4` |
| Giáo dục | expense | `BookOpen` hoặc `MdSchool` | `#6366f1` |
| Giải trí | expense | `Gamepad2` hoặc `MdGames` | `#8b5cf6` |
| Du lịch | expense | `Plane` hoặc `MdFlight` | `#0ea5e9` |
| Quà tặng | expense | `Gift` hoặc `MdCardGiftcard` | `#f97316` |
| Làm đẹp | expense | `Sparkles` hoặc `MdSelfImprovement` | `#d946ef` |
| Thú cưng | expense | `PawPrint` hoặc `MdPets` | `#a855f7` |
| Khác | expense | `Package` hoặc `MdInventory2` | `#64748b` |

Danh mục hệ thống đề xuất cho thu nhập:

| Tên | Type | Icon đề xuất | Màu |
|---|---|---|---|
| Lương | income | `Briefcase` hoặc `MdWork` | `#10b981` |
| Thưởng | income | `Gift` hoặc `MdCardGiftcard` | `#f59e0b` |
| Kinh doanh | income | `Store` hoặc `MdPaid` | `#14b8a6` |
| Đầu tư | income | `TrendingUp` hoặc `MdTrendingUp` | `#6366f1` |
| Thu nhập khác | income | `CircleDollarSign` hoặc `MdAttachMoney` | `#64748b` |

Lưu ý: cần chọn 1 hệ icon thống nhất. Hiện source đang trộn emoji, `Md...` và lucide. Vì code frontend mới có dấu hiệu dùng lucide ở một số file, nên nên chuẩn hóa sang lucide hoặc giữ `Md...` toàn bộ. Không nên trộn.

### 6.2. Categories hiện có nên map về danh mục chuẩn

Không nên xóa ngay category đã có transaction. Cần map transaction sang category chuẩn rồi mới archive/xóa category cũ.

Mapping đề xuất:

| Category cũ | ID | Map về |
|---|---:|---|
| `ăn`, `ăn sáng`, `ăn uống`, các biến thể `An uong`, `?n u?ng` | 1, 2, 9, 65, 69, 70, 74, 78, 82, 86 | Ăn uống |
| `xe`, `đi lại`, `Di chuyển`, `Di chuyen`, `Di chuy?n` | 5, 10, 42, 67, 72, 76, 80, 84, 88 | Đi lại |
| `Mua sắm`, `Mua sam`, `Mua s?m` | 17, 66, 71, 75, 79, 83, 87 | Mua sắm |
| `game`, `Giải trí`, `đi chơi` | 4, 22, 3 | Giải trí |
| `Nhà cửa` | 27 | Nhà cửa |
| `Hóa đơn` | 28 | Hóa đơn |
| `Sức khỏe` expense | 34 | Sức khỏe |
| `Giáo dục` | 35 | Giáo dục |
| `Du lịch` | 15 | Du lịch |
| `quà` | 29 | Quà tặng |
| `Làm đẹp` | 43 | Làm đẹp |
| `thú cưng` | 63 | Thú cưng |
| `Chi tiêu khác`, `Khac`, `Kh?c`, `OCR E2E Expense`, `debug` | 32, 49, 68, 73, 77, 81, 85, 89 | Khác |
| `Nợ nần` | 45 | Khác hoặc tạo danh mục hệ thống `Nợ/Trả nợ` nếu muốn |
| `Đầu tư` expense | 44 | Khác hoặc đổi sang transfer/investment, không nên để expense nếu là đầu tư tài sản |
| `lương` | 7 | Lương |
| `kinh doanh` | 8 | Kinh doanh |
| `Sức khỏe` income | 39 | Thu nhập khác, vì income "Sức khỏe" không hợp lý |
| `Tháng` | 21 | Khác |

### 6.3. Cách dọn dữ liệu an toàn

Không chạy delete trực tiếp ngay. Làm theo migration 3 bước:

1. Tạo danh mục chuẩn nếu chưa có.
2. Update toàn bộ `transactions.category_id` từ category rác sang category chuẩn tương ứng.
3. Với category cũ:
   - Nếu không còn transaction: xóa hoặc archive.
   - Nếu muốn audit: thêm `isActive=false`, `mergedInto=<category chuẩn>`.

Nếu chưa thêm field archive, có thể xóa sau khi transaction count bằng 0.

Ví dụ logic migration, chưa thực thi:

```sql
-- 1. Tạo danh mục chuẩn, lấy id chuẩn.
-- 2. Map transaction.
update transactions
set category_id = :food_category_id
where category_id in (1, 2, 9, 65, 69, 70, 74, 78, 82, 86);

-- 3. Sau khi kiểm tra không còn transaction, mới xóa.
delete from categories
where id in (1, 2, 65, 69, 70, 74, 78, 82, 86)
  and not exists (
    select 1 from transactions where transactions.category_id = categories.id
  );
```

Quy tắc sau khi dọn:

- Chatbot không gọi `POST /api/categories`.
- OCR không tạo categories test/OCR.
- Seed category chỉ chạy admin/migration.
- User tạo category cá nhân thủ công ở màn hình danh mục, không do AI tự tạo.

## 7. Điều chỉnh chức năng theo từng màn hình

### 7.1. Onboarding sau đăng nhập

Khi user đăng nhập lần đầu hoặc chưa có wallet/budget:

1. Tạo hoặc yêu cầu tạo ví chính.
2. Nhập số dư ban đầu.
3. Nhập mức chi tiêu mong muốn trong tháng.
4. Chọn nhanh phân bổ theo danh mục:
   - Ăn uống
   - Đi lại
   - Mua sắm
   - Hóa đơn
   - Giải trí
   - Khác
5. Cho phép thêm ví tiết kiệm.

Luồng đề xuất:

```text
Login
  |
  |-- chưa có wallet mặc định -> setup wallet
  |-- có wallet nhưng chưa có monthly spending limit -> setup monthly limit
  |-- đã setup -> dashboard
```

### 7.2. Dashboard

Cần hiển thị:

- Tổng số dư ví chính.
- Số dư ví tiết kiệm.
- Mức chi tiêu tháng đã đặt.
- Đã chi trong tháng.
- Còn lại có thể chi.
- Danh mục sắp vượt/vượt hạn mức.
- Giao dịch gần đây.
- Biểu đồ chi tiêu theo ngày trong tháng.

Tối ưu:

- Không query từng tháng/từng category nhiều lần.
- Tạo service thống kê chung, có thể dùng SQL aggregate.
- Với dữ liệu lớn, dùng cache theo user + month.

### 7.3. Giao dịch

Chức năng cần có:

- Danh sách giao dịch theo tháng, ví, loại, danh mục, nguồn tạo.
- Giao dịch từ chatbot.
- Giao dịch từ OCR.
- Xem lại hóa đơn của giao dịch OCR.
- Chỉnh sửa giao dịch, bao gồm ví, danh mục, ngày, số tiền, mô tả, ghi chú.
- Không cho chọn category sai type.
- Không cho chọn category không thuộc hệ thống hoặc không thuộc user.

Thay đổi cần làm:

- Thêm `wallet` vào form tạo/sửa giao dịch.
- Hiển thị `sourceType`: thủ công/chatbot/OCR.
- Nếu có `receipt`, thêm nút "Xem hóa đơn".
- Khi sửa amount/category/date/wallet, cập nhật lại cảnh báo budget.

### 7.4. Danh mục và hũ chi tiêu

Màn hình `/categories` nên đổi vai trò thành "Danh mục & hũ chi tiêu".

Chức năng:

- Xem danh mục hệ thống cơ bản.
- Tạo danh mục cá nhân riêng.
- Đặt ghi chú/icon/màu.
- Đặt hạn mức tháng cho từng danh mục.
- Tổng hạn mức category phải đồng bộ với mức chi tiêu tháng.
- Cảnh báo khi tổng hạn mức vượt mức chi tiêu tháng.

Luồng:

```text
User đặt monthly spending limit = 10.000.000
  |
  |-- Ăn uống: 3.000.000
  |-- Đi lại: 1.500.000
  |-- Hóa đơn: 2.000.000
  |-- Giải trí: 1.000.000
  |-- Khác: 1.000.000
  |
  Tổng hũ = 8.500.000
  Còn chưa phân bổ = 1.500.000
```

Nếu tổng hũ > monthly spending limit:

- UI hiển thị cảnh báo.
- Không lưu hoặc yêu cầu user xác nhận vượt mức.

### 7.5. Chatbot

Yêu cầu mới:

- Chatbot không tạo danh mục.
- Chatbot chỉ parse thông tin giao dịch.
- Nếu category không match, hỏi user chọn từ danh sách danh mục hiện có.

Cần sửa:

1. Xóa flow gọi `POST /api/categories` trong `ChatClient`.
2. Xóa hoặc vô hiệu hóa `/api/ai/learn` nếu chưa có service thật.
3. NLP trả về category suggestion, nhưng frontend chỉ dùng để tìm category existing.
4. Nếu không match, mở category picker.
5. Khi lưu transaction, bắt buộc có wallet mặc định hoặc user chọn wallet.
6. `sourceType = chatbot`.

### 7.6. OCR hóa đơn

Yêu cầu mới:

- OCR không tạo category.
- OCR chỉ chọn trong danh mục hiện có.
- Sau khi lưu, giao dịch xuất hiện trong danh sách transaction.
- User xem lại hóa đơn và chỉnh sửa thông tin nếu cần.

Cần sửa:

1. OCR metadata chỉ gửi allowed categories.
2. Nếu AI không chọn được category hợp lệ, bắt user chọn.
3. Confirm route lưu `wallet`, `receipt`, `sourceType = receipt_ai`, `sourceRefId`.
4. Lưu OCR audit vào `receipt_parse_sessions` hoặc `receipt_parser_results`.
5. Transaction list có modal xem hóa đơn.

### 7.7. Báo cáo

Báo cáo phải làm rõ nguồn tiền:

- Số dư ví chính đầu kỳ/cuối kỳ.
- Thu nhập theo ví.
- Chi tiêu theo danh mục.
- Tiết kiệm/chuyển vào ví tiết kiệm.
- Tình trạng hũ chi tiêu: hạn mức, đã chi, còn lại, % sử dụng.
- Top danh mục chi tiêu.
- Giao dịch OCR/chatbot/manual theo nguồn.

Biểu đồ cần tối ưu:

| Biểu đồ | Mục đích |
|---|---|
| Spending vs monthly limit | Biết đã chi bao nhiêu so với mức tháng |
| Category budget progress | Biết hũ nào sắp vượt |
| Cashflow by day | Biết ngày nào chi nhiều |
| Wallet balance trend | Biết số dư ví chính/tiết kiệm |
| Expense by category | Cơ cấu chi tiêu |

Tối ưu kỹ thuật:

- Tạo `src/lib/finance-stats.ts`.
- Dùng một query theo khoảng ngày, không query mỗi tháng một lần nếu không cần.
- Có index cho `transactions(user_id, date)`, `transactions(user_id, wallet_id, date)`, `transactions(user_id, category_id, date)`.

## 8. Kế hoạch chỉnh sửa code

### Giai đoạn 1: Cố định bảo mật và phân quyền

1. Sửa `Users` collection:
   - Field `role` chỉ admin được tạo/sửa.
   - User thường chỉ đọc/cập nhật chính mình.
   - Đăng ký user luôn role `user`.
2. Sửa Payload admin:
   - Chỉ role `admin` vào `/admin`.
3. Tạo access helpers trong `src/access`.
4. Khóa hoặc xóa route dev:
   - `/api/seed` chuyển thành admin-only hoặc migration script.
   - `/my-route` xóa nếu không dùng.
   - `/api/ai/[...path]` phải auth + whitelist.

Kết quả mong muốn: user không thể dùng admin, admin không lẫn với user thường.

### Giai đoạn 2: Đưa database thực tế vào Payload schema

1. Thêm collection `Wallets`.
2. Cập nhật `Transactions`:
   - thêm `wallet`
   - thêm `savingsGoal` nếu còn dùng
   - thêm `sourceType = manual/chatbot/receipt_ai/transfer/adjustment`
   - thêm `sourceRefId`
3. Đăng ký `SavingsGoals`, `Notifications` nếu còn giữ màn hình savings.
4. Cân nhắc đăng ký `Receipts`, `ReceiptParserResults`.
5. Chạy:

```bash
pnpm run generate:types
```

Nếu có component Payload admin mới:

```bash
pnpm run generate:importmap
```

### Giai đoạn 3: Dọn categories

1. Tạo danh mục chuẩn hệ thống.
2. Viết script migration map category rác về category chuẩn.
3. Chạy dry-run in số transaction bị ảnh hưởng.
4. Backup hoặc export trước khi update.
5. Update transaction category.
6. Xóa/archive category rác không còn transaction.
7. Sửa logic không cho AI/OCR tạo category.

Không làm delete thủ công từ UI cho dữ liệu có transaction.

### Giai đoạn 4: Wallet và onboarding

1. Nếu user chưa có wallet mặc định, tự tạo hoặc yêu cầu setup.
2. Thêm UI nhập số dư ban đầu.
3. Thêm UI nhập mức chi tiêu tháng.
4. Thêm ví tiết kiệm tùy chọn.
5. Transaction tạo mới phải chọn wallet hoặc dùng wallet mặc định.

### Giai đoạn 5: Hũ chi tiêu theo danh mục

1. Cập nhật `Budgets` thành hũ chi tiêu.
2. UI danh mục cho phép đặt hạn mức.
3. Validate tổng hạn mức không vượt monthly spending limit.
4. Dashboard hiển thị tiến độ từng hũ.
5. Notification/cảnh báo khi vượt 80%/100%.

### Giai đoạn 6: Giao dịch, chatbot, OCR

1. Transactions:
   - thêm filter wallet/sourceType
   - thêm xem hóa đơn
   - sửa form update đủ field
2. Chatbot:
   - không tạo category
   - chỉ chọn category hợp lệ
   - lưu sourceType `chatbot`
3. OCR:
   - không tạo category
   - lưu receipt audit
   - lưu sourceType `receipt_ai`
   - xem lại hóa đơn từ transaction

### Giai đoạn 7: Báo cáo và tối ưu biểu đồ

1. Tách service thống kê dùng chung.
2. Báo cáo theo:
   - tháng
   - ví
   - category
   - source type
   - budget/hũ
3. Tối ưu query bằng aggregate.
4. Thêm index DB nếu thiếu.
5. Viết test tích hợp cho stats.

## 9. Kế hoạch migration dữ liệu

### 9.1. Trước khi migration

Checklist:

- Export bảng `categories`.
- Export bảng `transactions`.
- Export bảng `wallets`.
- Ghi lại mapping category.
- Chạy dry-run.

### 9.2. Migration categories

Dry-run cần in:

- Category nào sẽ được giữ.
- Category nào sẽ được map.
- Bao nhiêu transaction bị đổi category.
- Category nào sẽ bị xóa/archive.

Không được xóa:

- Category còn transaction mà chưa map.
- Category user thật sự muốn giữ làm danh mục cá nhân.

### 9.3. Migration wallets

Vì `wallets` đã có:

1. Đăng ký collection `Wallets`.
2. Với user chưa có wallet, tạo `Ví chính`.
3. Với wallet name `Default Wallet`, có thể đổi hiển thị thành `Ví chính`.
4. Thêm ví tiết kiệm khi user tạo.

### 9.4. Migration transactions

DB `transactions` đã có `wallet_id`, nhưng Payload source hiện chưa có. Cần:

1. Với transaction chưa có `wallet_id`, gán wallet default của user.
2. Với OCR transaction, đảm bảo có `receipt_id` hoặc `source_ref_id`.
3. Chuẩn hóa `source_type`:
   - null hoặc manual cũ -> `manual`
   - receipt_ai -> `receipt_ai`
   - chatbot flow mới -> `chatbot`

## 10. Test cần có

### 10.1. Access/security

- User thường không vào được `/admin`.
- User không tạo được account role admin qua register.
- User không cập nhật được role của mình.
- User không đọc được wallet/transaction/budget của user khác.
- Admin đọc được dữ liệu quản trị cần thiết.

### 10.2. Categories

- User thấy danh mục hệ thống + danh mục cá nhân của mình.
- User không thấy danh mục cá nhân của user khác.
- Chatbot không tạo category mới.
- OCR không tạo category mới.
- Transaction không lưu được category sai type.

### 10.3. Wallets/budgets

- User mới có luồng setup wallet.
- Transaction expense cập nhật/tính đúng số dư.
- Budget category cảnh báo khi vượt 80%/100%.
- Tổng budget không vượt monthly limit nếu rule đang bật.

### 10.4. OCR và hóa đơn

- OCR parse thành công nhưng category null thì bắt user chọn.
- Confirm OCR tạo transaction + receipt.
- Transaction list xem được hóa đơn.
- User khác không xem được hóa đơn của user này.

### 10.5. Reports

- Tổng chi tiêu theo tháng đúng.
- Breakdown category đúng sau khi category migration.
- Wallet balance report đúng.
- Savings wallet không bị tính sai là expense nếu dùng transfer.

## 11. Thứ tự ưu tiên thực hiện

| Ưu tiên | Việc cần làm | Lý do |
|---:|---|---|
| 1 | Khóa user/admin và role | Bảo mật nền tảng |
| 2 | Đăng ký `Wallets` và cập nhật `Transactions` | Đúng yêu cầu nguồn tiền/số dư |
| 3 | Dọn categories và chặn AI/OCR tạo category | Sửa dữ liệu rác và sai nghiệp vụ |
| 4 | Onboarding ví + mức chi tiêu tháng | Đúng mục tiêu Money Lover/Timo |
| 5 | Hũ chi tiêu bằng budgets | Chức năng cốt lõi mới |
| 6 | Giao dịch + xem hóa đơn + chỉnh sửa | Hoàn thiện workflow nhập liệu |
| 7 | Báo cáo tối ưu theo ví/hũ/category | Giá trị chính cho người dùng |
| 8 | Savings nâng cao/nhóm | Làm sau khi ví tiết kiệm cá nhân ổn định |

## 12. Kết luận triển khai

Hệ thống nên được chỉnh theo trục chính:

```text
User
  -> Wallets
      -> Monthly spending limit
      -> Category budgets / hũ chi tiêu
      -> Transactions
          -> Manual
          -> Chatbot
          -> OCR receipt
      -> Reports
          -> Wallet balance
          -> Spending vs limit
          -> Category budget usage
          -> Receipt history

Admin
  -> System categories
  -> Users
  -> Data cleanup/audit
  -> OCR/receipt audit
```

Việc đầu tiên nên làm khi bắt đầu code là khóa phân quyền, thêm `Wallets` vào Payload config, cập nhật `Transactions`, sau đó mới chạy migration dọn `categories`. Không nên xây tiếp dashboard/report trên dữ liệu category hiện tại vì dữ liệu đang lẫn danh mục hệ thống, danh mục cá nhân, dữ liệu test và dữ liệu OCR rác.
## 13. Cap nhat trien khai OpenSpec 2026-05-05

### 13.1. Pham vi da hoan thien

- Tach user/admin bang RBAC: user thuong khong dung tai khoan do de vao admin; Payload admin chi cho role `admin`.
- Dang ky va su dung `Wallets` trong Payload; user co vi chi tieu mac dinh, vi tiet kiem rieng, tien te, so du va han muc chi tieu thang.
- Setup `/setup` da gom thanh mot form trung tam: nhap tong so du, han muc chi tieu, so du tiet kiem, ten vi, ten vi tiet kiem va don vi tien te.
- Categories da chuyen thanh workflow danh muc va hu chi tieu: danh muc he thong + danh muc rieng cua user, budget theo thang, canh bao 80%/100%.
- Chatbot va OCR khong tu tao category moi; khi khong map duoc category hop le thi bat user chon category co san.
- Transaction ledger co wallet, sourceType/sourceRefId, receipt link, edit/delete va cap nhat so du vi theo model hien tai.
- Dashboard/reports/stats/advisor dung chung `src/lib/finance-stats.ts`, tranh tinh toan moi noi mot kieu.
- UI pass da chuyen icon user-facing sang Lucide/SVG, them focus state, kiem tra responsive 375/768/1024/1440 cho `/`, `/categories`, `/transactions`, `/scan`, `/reports`, `/auth/login`, `/auth/register`.

### 13.2. Database indexes da ap dung

```text
transactions_date_idx
transactions_type_idx
transactions_source_type_idx
transactions_user_date_idx
transactions_user_wallet_date_idx
transactions_user_category_date_idx
transactions_user_source_type_date_idx
budgets_period_idx
budgets_month_idx
budgets_year_idx
budgets_is_active_idx
budgets_user_period_month_year_idx
budgets_user_wallet_month_year_idx
```

### 13.3. Ket qua validation database

```text
users_total: 22
wallets_without_user: 0
active_users_without_default_wallet: 0
transactions_without_wallet: 0
transactions_without_category: 0
transactions_invalid_source_type: 0
transactions_category_type_mismatch: 0
private_categories_without_user: 0
monthly_budgets_without_category: 0
finance_indexes_present: 6
```

### 13.4. Verification da chay

```text
npm run generate:types: pass
npm run generate:importmap: pass, no new imports
npx tsc --noEmit: pass
npm run test:int: pass, 9 files / 28 tests
npm run test:e2e: pass, 4 tests
Responsive browser check: pass, no horizontal overflow and no console errors on checked pages/viewports
```

### 13.5. Rollback neu can

Neu can rollback code:

1. Revert cac file code theo commit/branch truoc khi ap dung OpenSpec change `modernize-personal-finance-system`.
2. Chay lai `npm run generate:types` va `npm run generate:importmap` sau khi revert schema/component.
3. Restart app container hoac `docker compose up -d --build` neu dang chay Docker.

Neu chi muon rollback index, co the drop cac index them moi:

```sql
drop index if exists transactions_user_date_idx;
drop index if exists transactions_user_wallet_date_idx;
drop index if exists transactions_user_category_date_idx;
drop index if exists transactions_user_source_type_date_idx;
drop index if exists budgets_user_period_month_year_idx;
drop index if exists budgets_user_wallet_month_year_idx;
```

Neu rollback schema Wallets/Transactions/Budgets, nen dung backup thay vi xoa cot thu cong de tranh mat du lieu giao dich va receipt.

### 13.6. Luu y con lai

- Receipt detail hien dang luu theo transaction + media Payload, chua tach thanh collection receipt audit rieng. Neu can audit OCR day du hon, nen them collection rieng cho raw OCR payload va line item da review.
- Cac chuoi UI cu trong mot so file van co dau hieu mojibake lich su. Luong moi chinh da hoat dong, nhung nen co mot pass rieng de chuan hoa encoding UTF-8 cho toan bo UI copy.
