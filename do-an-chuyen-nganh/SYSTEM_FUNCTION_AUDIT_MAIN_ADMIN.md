# Rà soát chức năng hệ thống chính và hệ thống admin

Ngày rà soát: 2026-05-05  
Phạm vi: chỉ xét code trong thư mục hiện tại, tập trung vào hệ thống chính ở `src/app/(frontend)`, API ở `src/app/api`, Payload collections ở `src/collections`, và hệ thống admin Payload ở `src/app/(payload)`.

## 1. Tổng quan kiến trúc hiện tại

Hệ thống là ứng dụng quản lý tài chính cá nhân FinTrack, xây trên Next.js App Router và Payload CMS.

```text
Người dùng
  |
  |-- Hệ thống chính: /, /transactions, /categories, /reports, /savings, /chat, /scan
  |       |
  |       |-- Payload Local API / Payload REST API
  |       |-- API trung gian Next.js: /api/stats, /api/categories, /api/ai/*
  |       |-- Dịch vụ AI Python: services/receipt-ai
  |
  |-- Hệ thống admin Payload: /admin
          |
          |-- Collections đang đăng ký: users, media, categories, transactions, budgets
```

Collections đang tồn tại trong source:

| Collection | Có trong `payload.config.ts` | Vai trò |
|---|---:|---|
| `users` | Có | Tài khoản, phân quyền `admin/user`, tiền tệ, avatar |
| `media` | Có | Lưu file upload, ảnh hóa đơn, avatar |
| `categories` | Có | Danh mục thu/chi mặc định và danh mục riêng của người dùng |
| `transactions` | Có | Giao dịch thu/chi |
| `budgets` | Có | Hạn mức chi tiêu |
| `savings-goals` | Không | Mục tiêu tiết kiệm, đang được UI gọi nhưng chưa đăng ký |
| `notifications` | Không | Thông báo tiết kiệm, đang được UI gọi nhưng chưa đăng ký |

Điểm quan trọng: `SavingsGoals` và `Notifications` có file collection riêng nhưng không được đưa vào `collections` của Payload config. Vì vậy module `/savings` gần như chắc chắn lỗi runtime khi gọi Local API hoặc REST API tới `savings-goals` và `notifications`.

## 2. Chức năng hệ thống chính

### 2.1. Xác thực người dùng

Chức năng đang có:

| Chức năng | Mô tả hiện tại |
|---|---|
| Đăng ký | Form `/auth/register` gọi `POST /api/users`, sau đó tự gọi `POST /api/users/login` |
| Đăng nhập | Form `/auth/login` gọi `POST /api/users/login` |
| Đăng xuất | Sidebar gọi `POST /api/users/logout` |
| Chặn truy cập | Các trang chính đọc `payload.auth({ headers })`, nếu không có user thì redirect `/auth/login` |

Điểm chưa hợp lý:

| Vấn đề | Tác động |
|---|---|
| `Users.access.create: () => true` cho phép tạo user công khai, nhưng collection có trường `role` mặc định `user` và không khóa field `role` khi tạo qua REST. | Người dùng có thể gửi `role: "admin"` khi đăng ký nếu Payload không bị field-level access chặn. Đây là rủi ro phân quyền nghiêm trọng. |
| `Users.access.read` trả `true` cho mọi user đã đăng nhập. | Người dùng thường có thể đọc danh sách toàn bộ tài khoản, email, tên, tiền tệ, avatar. Điều này làm lộ dữ liệu người dùng và làm module tiết kiệm lấy `allUsers` quá rộng. |
| `Users.access.update` chỉ cho user tự sửa chính mình, nhưng field `role` không có field-level access. | Người dùng có khả năng tự cập nhật role của mình nếu route update được gọi trực tiếp. |
| Role chỉ lưu field `role`, không có `saveToJWT`. | Mỗi kiểm tra access phụ thuộc doc user hiện tại; chưa tối ưu và dễ thiếu nhất quán nếu cần phân quyền rộng hơn. |

Đề xuất chỉnh sửa:

| Hạng mục | Đề xuất |
|---|---|
| Role | Thêm field-level access cho `role`: chỉ admin được tạo/cập nhật role, user thường không được ghi. Cân nhắc `saveToJWT: true`. |
| Đăng ký | Tạo endpoint đăng ký riêng chỉ nhận `email`, `password`, `name`, tự gán `role: "user"` phía server. |
| Read user | Với user thường chỉ cho đọc chính mình hoặc public profile tối thiểu; admin mới được đọc toàn bộ. |
| Update user | Chỉ cho user tự cập nhật các field profile an toàn như `name`, `currency`, `avatar`; không cho cập nhật `role`. |

### 2.2. Dashboard tổng quan

Chức năng đang có:

| Chức năng | Mô tả hiện tại |
|---|---|
| Tổng thu, tổng chi, số dư | Tính theo tháng/năm được chọn trên query string |
| Biểu đồ 6 tháng | Mỗi tháng gọi một truy vấn `payload.find` riêng |
| Phân bổ chi tiêu theo danh mục | Gom nhóm trên dữ liệu giao dịch đã load |
| Giao dịch gần đây | Lấy 5 giao dịch mới nhất |

Điểm chưa hợp lý:

| Vấn đề | Tác động |
|---|---|
| Truy vấn thống kê lặp N lần trong vòng lặp tháng. | Dashboard và reports dễ chậm khi dữ liệu lớn. Đây là logic tổng hợp lẽ ra nên gom trong một query hoặc dùng aggregate/query raw của DB. |
| Local API được gọi với `where: { user: user.id }` nhưng không đặt `overrideAccess: false`. | Hiện tại có điều kiện user thủ công nên ít rủi ro hơn, nhưng pattern không nhất quán với Payload security rule: khi truyền `user`, phải đặt `overrideAccess: false` nếu muốn access control được thực thi. |
| Không giới hạn hoặc validate `month/year` từ query. | Query tháng/năm sai có thể tạo khoảng ngày bất thường, dữ liệu thống kê không đúng. |
| Dashboard tính toán trực tiếp trong page component. | Logic thống kê bị lặp giữa dashboard, reports, `/api/stats`, `/api/stats/chart`, khó bảo trì và dễ lệch số liệu. |

Đề xuất chỉnh sửa:

| Hạng mục | Đề xuất |
|---|---|
| Service thống kê | Tách `financeStatsService` dùng chung cho dashboard, reports, API stats. |
| Query | Query một khoảng thời gian lớn rồi gom theo tháng trong một pass, hoặc dùng aggregate SQL/Postgres. |
| Access | Khi dùng Local API với user context, truyền `user` và `overrideAccess: false`, hoặc giữ query user thủ công nhưng quy chuẩn hóa rõ ràng. |
| Validate filter | Kiểm tra `month` 1-12, `year` trong khoảng hợp lệ. |

### 2.3. Quản lý giao dịch

Chức năng đang có:

| Chức năng | Mô tả hiện tại |
|---|---|
| Xem giao dịch theo tháng/năm | Trang `/transactions` load tối đa 100 giao dịch trong tháng |
| Lọc client-side | Lọc theo loại, danh mục, tìm kiếm mô tả/danh mục |
| Thêm giao dịch | Form gọi `POST /api/transactions` của Payload REST |
| Sửa giao dịch | Form gọi `PATCH /api/transactions/:id` |
| Xóa giao dịch | Gọi `DELETE /api/transactions/:id` |
| Giao dịch từ OCR | `sourceType = receipt_ai`, có thể gắn ảnh hóa đơn |

Điểm chưa hợp lý:

| Vấn đề | Tác động |
|---|---|
| Frontend gửi `category: Number(formData.category)` và `user: Number(userData.id)` ở một số nơi. | Payload Postgres có thể dùng id dạng number, nhưng code type lại trộn `string | number`; ép số có thể làm hỏng nếu adapter/id thay đổi. |
| `Transactions.create` chỉ cần đăng nhập; hook tự gán `data.user = req.user.id`. | Tốt cho ownership, nhưng user có thể gửi category không thuộc quyền sở hữu hoặc không đúng type với transaction. |
| `category` không có filter/validation theo `type` của transaction. | Có thể tạo giao dịch `expense` với danh mục `income`, làm sai thống kê phân bổ và báo cáo. |
| `amount` có `min: 0`, frontend yêu cầu `> 0`, nhưng schema vẫn cho 0. | Dữ liệu 0 làm sai ý nghĩa giao dịch, thống kê và tỉ lệ tiết kiệm. |
| Không có pagination thật cho danh sách giao dịch, chỉ lấy `limit: 100`. | Khi người dùng có hơn 100 giao dịch trong tháng, phần còn lại biến mất khỏi UI. |
| Module tiết kiệm gửi field `savingsGoal` vào transaction, nhưng schema `transactions` không có field này. | Liên kết đóng góp tiết kiệm không được lưu, hoặc request có thể bị bỏ qua/lỗi tùy cấu hình strictness. Dữ liệu thiết kế không biểu diễn được quan hệ đóng góp. |

Đề xuất chỉnh sửa:

| Hạng mục | Đề xuất |
|---|---|
| Ràng buộc danh mục | Thêm validation/hook kiểm tra category thuộc user hoặc default, và `category.type === transaction.type`. |
| Amount | Đổi `min` thành giá trị lớn hơn 0 bằng validate custom nếu Payload không hỗ trợ exclusive min. |
| Pagination | Thêm phân trang server-side hoặc infinite scroll, không chỉ client filter 100 bản ghi. |
| Savings link | Nếu giữ module tiết kiệm, thêm field `savingsGoal` hoặc tốt hơn tạo collection `savings-contributions`. |
| Kiểu id | Không ép `Number(...)`; dùng id như string từ Payload trả về. |

### 2.4. Quản lý danh mục

Chức năng đang có:

| Chức năng | Mô tả hiện tại |
|---|---|
| Xem danh mục | Hiển thị danh mục mặc định và danh mục riêng |
| Thêm danh mục | `POST /api/categories` route custom, có normalize/clean tên |
| Sửa danh mục | `PATCH /api/categories/:id` qua Payload REST |
| Xóa danh mục | `DELETE /api/categories/:id`, hook chuyển giao giao dịch sang danh mục khác |
| Seed danh mục mặc định | `GET /api/seed` tạo danh mục mặc định nếu chưa có |

Điểm chưa hợp lý:

| Vấn đề | Tác động |
|---|---|
| API tạo danh mục tìm trùng trên toàn hệ thống theo `type`, `overrideAccess: true`. Nếu trùng với danh mục riêng của user khác, route cập nhật danh mục đó thành `isDefault: true`, `user: null`. | Dữ liệu cá nhân của một user có thể bị biến thành danh mục mặc định toàn hệ thống. Đây là lỗi thiết kế dữ liệu nghiêm trọng: dữ liệu tenant cá nhân bị promote sang global vì hành động của user khác. |
| Hook `beforeValidate` của collection cũng kiểm tra trùng trên toàn hệ thống theo `type`, không xét `user`/`isDefault`. | Người dùng A có thể chặn người dùng B tạo danh mục cùng tên, dù đáng ra danh mục riêng nên độc lập theo user. |
| `beforeDelete` cập nhật transaction liên quan nhưng không truyền `req` vào nested `findByID`, `find`, `update`. | Vi phạm transaction safety của Payload hook; có thể gây cập nhật ngoài transaction, dữ liệu chuyển giao nửa chừng nếu delete lỗi. |
| `beforeDelete` không set `overrideAccess: false` khi cần thực thi quyền, và cũng không truyền `req`. | Logic có thể chạy với quyền admin của Local API trong hook, làm thay đổi transaction ngoài phạm vi user. |
| Khi xóa danh mục, tự động chuyển toàn bộ giao dịch sang fallback category. | Làm mất lịch sử phân loại gốc; báo cáo quá khứ bị thay đổi. Đây là tác động dữ liệu không mong muốn. |
| `GET /api/seed` công khai, không yêu cầu admin. | Bất kỳ ai gọi cũng có thể khởi tạo dữ liệu hệ thống; nếu mở internet sẽ là endpoint quản trị không bảo vệ. |
| Mã icon không nhất quán: seed dùng emoji, UI danh mục dùng tên icon React như `MdRestaurant`. | Hiển thị icon có thể sai hoặc không đồng nhất giữa danh mục seed, OCR, chat và UI. |

Đề xuất chỉnh sửa:

| Hạng mục | Đề xuất |
|---|---|
| Mô hình danh mục | Tách rõ `scope`: `system` hoặc `user`; unique key nên là `(scope, user, type, normalizedName)` thay vì toàn hệ thống theo type. |
| Trùng tên | Chỉ chống trùng trong cùng scope: default-global hoặc cùng user. Không promote danh mục user khác thành default. |
| Xóa danh mục | Không tự đổi lịch sử giao dịch. Có thể dùng soft-delete/archived cho category, hoặc chỉ chặn xóa nếu đã có transaction. |
| Hook transaction safety | Trong hook, mọi nested operation phải truyền `req`; nếu cần bypass admin thì ghi rõ `overrideAccess: true` và giới hạn dữ liệu theo id/type. |
| Seed | Chỉ cho admin hoặc chạy qua migration/seed script nội bộ, không public GET. |
| Icon | Chuẩn hóa một dạng icon duy nhất, ví dụ lưu `Md...` name hoặc emoji, không trộn. |

### 2.5. Báo cáo và thống kê

Chức năng đang có:

| Chức năng | Mô tả hiện tại |
|---|---|
| Báo cáo 12 tháng | Tính tổng thu/chi từng tháng |
| Tỉ lệ tiết kiệm | `(income - expense) / income` |
| Biểu đồ xu hướng | Area chart và bar chart |
| Phân bổ chi tiêu tháng hiện tại | Pie chart và bảng theo danh mục |

Điểm chưa hợp lý:

| Vấn đề | Tác động |
|---|---|
| Reports luôn dùng 12 tháng gần nhất và tháng hiện tại, không có filter thời gian. | Người dùng không xem được báo cáo tùy kỳ; khó đối chiếu với dashboard đang có filter tháng. |
| Lặp logic thống kê với dashboard và API stats. | Dễ sai lệch định nghĩa "thu", "chi", "tiết kiệm" giữa các màn hình. |
| Tỉ lệ tiết kiệm âm vẫn hiển thị như phần trăm đơn giản. | Có thể gây hiểu nhầm khi thu nhập bằng 0 hoặc chi vượt thu. |
| Không có budget trong báo cáo dù collection `budgets` tồn tại. | Thiết kế hệ thống có dữ liệu hạn mức nhưng không tác động vào chức năng phân tích. |

Đề xuất chỉnh sửa:

| Hạng mục | Đề xuất |
|---|---|
| Filter báo cáo | Thêm filter kỳ báo cáo: tháng, quý, năm, custom range. |
| Dùng chung stats | Dùng service thống kê chung. |
| Budget integration | So sánh chi tiêu theo danh mục với budget cùng kỳ. |
| Định nghĩa metric | Chuẩn hóa công thức savings rate, xử lý rõ income = 0 và net âm. |

### 2.6. Mục tiêu tiết kiệm

Chức năng đang có theo UI/source:

| Chức năng | Mô tả hiện tại |
|---|---|
| Xem mục tiêu | Trang `/savings` lấy `savings-goals` do user sở hữu hoặc tham gia |
| Tạo mục tiêu | Form tạo title, target amount, icon, participants |
| Mục tiêu nhóm | Có participants và hiển thị avatar thành viên |
| Thông báo | Lấy notifications chưa đọc |
| Đóng góp | Tạo một transaction expense với mô tả "Đóng góp tích lũy..." |

Điểm chưa hợp lý:

| Vấn đề | Tác động |
|---|---|
| `SavingsGoals` và `Notifications` không được đăng ký trong Payload config. | Chức năng `/savings` không hoạt động đúng ở runtime. |
| Transaction schema không có field `savingsGoal`. | Đóng góp không liên kết được với mục tiêu; `currentAmount` không có cơ chế tăng. |
| `currentAmount` là field readOnly nhưng không có hook nào cập nhật. | Mục tiêu sẽ không phản ánh đóng góp thực tế. |
| Đóng góp được mô hình hóa là `expense`. | Về dữ liệu tài chính, chuyển tiền vào tiết kiệm không luôn là chi tiêu tiêu dùng. Nếu tính là expense, báo cáo chi tiêu bị phóng đại và savings rate bị giảm sai. |
| User tham gia chỉ có quyền read; update/delete chỉ owner. | Thành viên có thể bấm đóng góp qua UI, nhưng không có cơ chế cập nhật goal nếu collection tồn tại. |
| Notifications collection không có `create` access. | Hệ thống không có đường rõ ràng để tạo lời mời/thông báo, trừ khi dùng Local API bypass. |
| Lấy `allUsers` từ collection users rộng. | Nếu `Users.read` đang cho mọi user đọc tất cả, chức năng mời thành viên làm lộ danh sách user. |

Đề xuất chỉnh sửa:

| Hạng mục | Đề xuất |
|---|---|
| Đăng ký collection | Nếu giữ tính năng, thêm `SavingsGoals` và `Notifications` vào `payload.config.ts`, chạy `generate:types`. |
| Mô hình đóng góp | Tạo collection `savings-contributions` gồm `goal`, `user`, `amount`, `date`, `sourceTransaction?`, `status`. |
| Tác động tài chính | Phân biệt `transfer_to_savings` với `expense`; báo cáo nên có mục "tiết kiệm/chuyển quỹ" riêng. |
| Cập nhật currentAmount | Tính động từ contributions hoặc cập nhật bằng hook transaction-safe có truyền `req` và context flag. |
| Lời mời nhóm | Thêm trạng thái participant: `pending/accepted/declined`; notification chỉ là view của invitation, không là nguồn dữ liệu chính. |
| Privacy user | Endpoint tìm user chỉ trả kết quả tối thiểu và có rate limit/search query, không load toàn bộ user. |

### 2.7. Trợ lý AI nhập liệu và tư vấn

Chức năng đang có:

| Chức năng | Mô tả hiện tại |
|---|---|
| Parse ngôn ngữ tự nhiên | Chat gọi `/api/ai/nlp/parse`, proxy sang service Python |
| Xác nhận giao dịch | Bot đề xuất amount/category/type/date, user xác nhận để lưu transaction |
| Tự tạo danh mục | Nếu không match danh mục, frontend gọi `POST /api/categories` để tạo |
| Học mẫu câu | Frontend gọi `/api/ai/learn` sau khi xác nhận hoặc chọn category |
| Tư vấn tài chính | Chat gọi `/api/ai/advisor`, Next API gom dữ liệu 3 tháng gần nhất rồi gọi AI service |

Điểm chưa hợp lý:

| Vấn đề | Tác động |
|---|---|
| Route `/api/ai/[...path]` là proxy mở, không kiểm tra đăng nhập. | Bất kỳ client nào cũng có thể gọi service AI qua Next app nếu biết path. |
| Frontend gọi `/api/ai/learn`, nhưng service Python hiện không khai báo endpoint `/api/learn`. | Chức năng "học" có thể luôn lỗi ngầm, tạo kỳ vọng sai. |
| NLP service là rule-based, category keyword không đồng bộ với categories thực tế. | Dễ tạo danh mục trùng/sai, kéo theo lỗi dữ liệu category đã nêu. |
| Tự tạo danh mục từ kết quả AI ngay trong flow xác nhận. | AI có thể sinh category rác; dữ liệu danh mục sẽ phình và không chuẩn hóa. |
| Advisor chỉ dùng rule cố định, không phải LLM thật; endpoint vẫn được gọi là AI advisor. | Người dùng có thể hiểu nhầm mức độ thông minh/chất lượng tư vấn. |
| Dữ liệu tài chính gửi sang service AI không có lớp kiểm soát quyền ở proxy catch-all. | Nếu sau này mở rộng path khác, rủi ro lộ hoặc thao tác dữ liệu tăng. |

Đề xuất chỉnh sửa:

| Hạng mục | Đề xuất |
|---|---|
| Proxy AI | Tất cả `/api/ai/*` cần auth trừ health-check nội bộ; whitelist path được phép. |
| Learn endpoint | Hoặc implement `/api/learn` có lưu dữ liệu học rõ ràng, hoặc bỏ call học để tránh lỗi ngầm. |
| Category suggestion | AI chỉ đề xuất category trong allowed categories; nếu cần tạo mới, user phải xác nhận qua modal riêng. |
| Data contract | Định nghĩa schema response cho NLP/advisor, validate phía Next trước khi dùng. |
| Tên chức năng | Nếu chỉ rule-based, gọi là "gợi ý" thay vì "AI tư vấn" hoặc tích hợp LLM thật với guardrail. |

### 2.8. Quét hóa đơn OCR

Chức năng đang có:

| Chức năng | Mô tả hiện tại |
|---|---|
| Upload ảnh hóa đơn | Chỉ nhận JPG/PNG/WEBP theo MIME và extension |
| OCR | Next route gửi ảnh và allowed categories sang service Python `/api/ocr/receipt` |
| Review | User chỉnh merchant, ngày, tổng tiền, currency, category, note |
| Confirm | Route tạo media lưu ảnh, sau đó tạo transaction `sourceType: receipt_ai` |
| Cleanup | Nếu tạo transaction lỗi sau khi upload media, route xóa media vừa tạo |

Điểm chưa hợp lý:

| Vấn đề | Tác động |
|---|---|
| Khi `payload.create` media/transaction có truyền `user` nhưng không đặt `overrideAccess: false`. | Theo rule Payload, Local API có thể bypass access. Trong confirm route đã tự validate category/user, nhưng pattern vẫn không chuẩn. |
| Không giới hạn kích thước file. | Có thể gây tốn bộ nhớ vì `Buffer.from(await file.arrayBuffer())`. |
| Không kiểm tra lại MIME bằng nội dung file. | MIME/extension có thể giả mạo. |
| Transaction OCR chỉ là expense. | Hợp lý với hóa đơn mua hàng, nhưng cần ghi rõ contract; không nên dùng cho hoàn tiền/thu nhập. |
| OCR raw text không được lưu cùng transaction. | Mất khả năng audit vì chỉ lưu ảnh và fields đã review. |
| Không có trạng thái OCR review/audit. | Nếu người dùng sửa dữ liệu OCR trước khi lưu, hệ thống không biết field nào do AI đề xuất, field nào do user sửa. |

Đề xuất chỉnh sửa:

| Hạng mục | Đề xuất |
|---|---|
| File safety | Thêm giới hạn size, kiểm tra magic bytes hoặc dùng thư viện image metadata. |
| Access | Truyền `overrideAccess: false` khi thao tác theo user, hoặc dùng `req.payload` trong custom endpoint nếu có request Payload. |
| Audit OCR | Thêm field `receiptOcr` hoặc collection riêng lưu provider, raw_text, confidence, original fields, reviewed fields. |
| Transaction create | Validate category type expense và ownership ở schema/hook, không chỉ ở route OCR. |

### 2.9. Budget/hạn mức chi tiêu

Chức năng đang có:

| Chức năng | Mô tả hiện tại |
|---|---|
| Collection `budgets` | Có category, amount, period, user |
| Admin quản lý budget | Vì collection đăng ký trong Payload config |

Điểm chưa hợp lý:

| Vấn đề | Tác động |
|---|---|
| Không có route/page frontend cho budgets. | Người dùng chính không dùng được chức năng dù dữ liệu tồn tại. |
| Budget không được dùng trong dashboard/reports/advisor. | Collection không tác động vào hành vi hệ thống. |
| Không ràng buộc category thuộc user/default và type expense. | Có thể tạo budget cho danh mục income hoặc danh mục không thuộc user. |
| Không unique theo `(user, category, period)`. | Người dùng có thể tạo nhiều budget trùng, báo cáo sau này khó xác định hạn mức đúng. |
| Admin access của Budgets không cho admin đọc toàn bộ như các collection khác. | Không nhất quán với vai trò admin hệ thống. |

Đề xuất chỉnh sửa:

| Hạng mục | Đề xuất |
|---|---|
| Product decision | Hoặc hoàn thiện UI budget, hoặc bỏ collection khỏi config nếu chưa dùng. |
| Validation | Budget chỉ cho expense category thuộc user/default. |
| Unique rule | Chặn trùng budget cùng user/category/period. |
| Reporting | Tích hợp cảnh báo vượt hạn mức vào dashboard/reports/advisor. |

## 3. Chức năng hệ thống admin Payload

### 3.1. Chức năng admin đang có

Admin Payload được cấu hình ở `src/payload.config.ts`, sử dụng `Users.slug` làm collection đăng nhập admin. Các collection admin đang thấy:

| Admin module | Chức năng hiện có |
|---|---|
| Users | CRUD user, auth, role, name, currency, avatar |
| Media | Quản lý upload media |
| Categories | CRUD danh mục, xem default/user, type/icon/color |
| Transactions | CRUD giao dịch, receipt, sourceType, user |
| Budgets | CRUD hạn mức |

Ngoài ra Payload tự cung cấp:

| Route | Vai trò |
|---|---|
| `/admin` | Giao diện quản trị Payload |
| `/api/[...slug]` | REST API Payload cho collections/auth |
| `/api/graphql` | GraphQL |
| `/api/graphql-playground` | GraphQL playground |

### 3.2. Điểm chưa hợp lý của admin

| Vấn đề | Tác động |
|---|---|
| `admin.user = users`, nhưng không có access rule chặn user thường vào admin theo role. | User thường có tài khoản auth có thể truy cập admin UI nếu Payload không được cấu hình `admin` access riêng. |
| Collections dùng access không nhất quán cho admin: categories/transactions cho admin full, budgets không có admin bypass, notifications update/delete không cho admin. | Vai trò admin bị thiếu rõ ràng; một số dữ liệu admin không quản trị được, một số lại quá rộng. |
| `SavingsGoals` và `Notifications` không đăng ký admin dù UI chính dùng. | Admin không thể quản trị hoặc debug dữ liệu tiết kiệm/thông báo. |
| Labels tiếng Việt trong source bị mojibake ở nhiều file. | Admin UI và frontend có thể hiển thị lỗi encoding, ảnh hưởng trải nghiệm và báo cáo đồ án. |
| `Media.read: () => true`. | Ảnh hóa đơn/avatar có thể public nếu biết URL. Với hóa đơn tài chính, đây là dữ liệu nhạy cảm. |
| `secret: process.env.PAYLOAD_SECRET || ''`. | Nếu thiếu env, app vẫn build/run với secret rỗng, không an toàn. |
| GraphQL playground có thể đang bật theo route mặc định. | Nếu production không khóa, tăng bề mặt tấn công và lộ schema. |

Đề xuất chỉnh sửa:

| Hạng mục | Đề xuất |
|---|---|
| Admin access | Cấu hình admin chỉ cho `user.role === "admin"` truy cập. |
| Role model | Bảo vệ field `role`; chỉ admin được gán/sửa. |
| Access consistency | Tạo helper access dùng chung: `adminOnly`, `authenticated`, `adminOrOwner`, `ownOrDefaultCategory`. |
| Media privacy | Hóa đơn nên chỉ owner/admin đọc được; avatar có thể tách riêng hoặc public theo field/type. |
| Missing collections | Nếu giữ savings, đăng ký `SavingsGoals`, `Notifications`, thêm access chuẩn và type generation. |
| Env validation | Không cho app chạy nếu thiếu `PAYLOAD_SECRET` hoặc `DATABASE_URL`. |
| Production hardening | Tắt/giới hạn GraphQL playground và endpoint dev như `/api/seed`, `/my-route`. |

## 4. Các vấn đề thiết kế dữ liệu nổi bật

### 4.1. Multi-tenant category đang sai ranh giới

Hiện tại danh mục vừa có `isDefault`, vừa có `user`, nhưng logic chống trùng và tạo danh mục lại quét toàn hệ thống. Điều này làm mờ ranh giới:

```text
Đúng mong muốn:
  default categories: dùng chung, quản trị bởi admin
  user categories: riêng từng user

Hiện tại:
  user A tạo "Cafe"
  user B tạo "Cafe"
  -> logic có thể coi là trùng toàn hệ thống
  -> hoặc promote category của A thành default
```

Tác động:

- Dữ liệu cá nhân có thể thành dữ liệu hệ thống.
- Người dùng chặn nhau tạo danh mục cùng tên.
- Báo cáo theo category có thể lẫn nghĩa giữa default và custom.

Đề xuất mô hình:

| Field | Ý nghĩa |
|---|---|
| `scope` | `system` hoặc `user` |
| `owner` | user id, chỉ có khi `scope = user` |
| `normalizedName` | dùng để unique/search |
| `type` | income/expense |
| unique | `(scope, owner, type, normalizedName)` |

### 4.2. Tiết kiệm đang bị mô hình hóa như chi tiêu

Đóng góp tiết kiệm hiện tạo transaction `expense`. Điều này có thể sai về nghiệp vụ:

```text
Lương: +20.000.000
Chuyển vào mục tiêu mua laptop: -5.000.000 expense

Báo cáo hiện tại hiểu:
  Chi tiêu tăng thêm 5.000.000
  Savings rate giảm

Thực tế có thể là:
  Tài sản chuyển từ tiền mặt sang quỹ tiết kiệm
  Không phải tiêu dùng
```

Đề xuất:

- Nếu app chỉ theo dõi dòng tiền tiêu dùng đơn giản: ghi rõ "đóng góp tiết kiệm được tính là chi tiêu".
- Nếu app theo dõi tài chính cá nhân chuẩn hơn: thêm loại transaction `transfer` hoặc collection `accounts`, `savings-contributions`.

### 4.3. OCR transaction thiếu dữ liệu audit

Hiện tại sau khi OCR, transaction chỉ lưu ảnh, merchant, currency, note, sourceType. Không lưu:

- raw OCR text
- provider document id
- confidence
- field gốc trước khi user sửa
- category reason

Tác động:

- Không đánh giá được chất lượng OCR.
- Không truy vết được vì sao giao dịch có số tiền/danh mục đó.
- Khó viết chương kiểm thử/đánh giá AI một cách thuyết phục.

Đề xuất:

- Thêm collection `receipt-ocr-results` hoặc field group `ocr` trong transaction.
- Lưu `rawText`, `provider`, `providerDocumentId`, `suggestedFields`, `reviewedFields`, `confidence`, `errors`.

### 4.4. Access control chưa được chuẩn hóa

Các collection tự viết access riêng, có nơi admin bypass, có nơi không. Local API nhiều chỗ truyền `user` nhưng thiếu `overrideAccess: false`.

Đề xuất helper:

| Helper | Mục đích |
|---|---|
| `isAdmin(user)` | Kiểm tra role admin |
| `authenticated` | Yêu cầu đăng nhập |
| `adminOnly` | Chỉ admin |
| `adminOrOwner(field)` | Admin hoặc owner |
| `ownCategoryOrDefault` | Category default hoặc của user |

Sau đó dùng thống nhất trong collections và API.

## 5. Các vấn đề thiết kế hệ thống nổi bật

| Nhóm vấn đề | Hiện trạng | Đề xuất |
|---|---|---|
| Logic thống kê | Lặp trong page và API | Tách service/domain layer |
| API AI | Proxy catch-all mở | Whitelist path + auth + schema validation |
| Seed/default data | Public GET `/api/seed` | Migration/seed script hoặc admin-only endpoint |
| Module chưa hoàn chỉnh | Savings/notifications có UI nhưng chưa đăng ký collection | Hoàn thiện hoặc ẩn khỏi sidebar |
| Encoding | Text tiếng Việt mojibake trong source/output | Chuẩn hóa UTF-8, sửa file bị lỗi encoding |
| Type safety | Nhiều `as any`, ép id `Number(...)` | Dùng generated `payload-types`, không ép id tùy tiện |
| Transaction safety | Hook nested operations thiếu `req` | Luôn truyền `req` trong hook |
| Media privacy | Media public read | Phân quyền theo loại media/owner |

## 6. Thứ tự ưu tiên chỉnh sửa

### Ưu tiên 1: Sửa lỗi bảo mật và lỗi runtime

1. Khóa quyền admin: chỉ `role = admin` được vào Payload admin.
2. Bảo vệ field `role` trong Users, không cho user tự set/sửa role.
3. Sửa `Users.read` để user thường không đọc toàn bộ user.
4. Quyết định module `/savings`: hoặc đăng ký `SavingsGoals`/`Notifications`, hoặc tạm ẩn khỏi sidebar.
5. Khóa `/api/seed`, `/my-route`, GraphQL playground/dev endpoint ở production.
6. Thêm auth/whitelist cho `/api/ai/[...path]`.

### Ưu tiên 2: Sửa thiết kế dữ liệu gây sai lệch

1. Thiết kế lại category scope và logic unique.
2. Không promote danh mục user khác thành default.
3. Không tự chuyển lịch sử transaction khi xóa category; dùng archive hoặc chặn xóa.
4. Validate transaction category đúng owner/default và đúng type.
5. Thiết kế lại tiết kiệm: contribution/transfer thay vì expense thuần.

### Ưu tiên 3: Chuẩn hóa vận hành và bảo trì

1. Tách service thống kê dùng chung.
2. Thêm pagination cho transactions.
3. Tích hợp budgets vào frontend hoặc loại bỏ nếu chưa dùng.
4. Thêm OCR audit data.
5. Chuẩn hóa UTF-8 và sửa mojibake.
6. Giảm `as any`, dùng `payload-types.ts` sau khi schema ổn định.

## 7. Kết luận

Hệ thống chính đã có khung chức năng khá đầy đủ cho quản lý tài chính cá nhân: xác thực, dashboard, giao dịch, danh mục, báo cáo, AI nhập liệu/tư vấn, OCR hóa đơn và một phần tiết kiệm. Hệ thống admin Payload đã có CRUD cho các collection cốt lõi.

Tuy nhiên, các vấn đề lớn hiện tại không nằm ở giao diện mà nằm ở ranh giới dữ liệu và quyền:

- User thường có nguy cơ leo quyền admin qua field `role`.
- Danh mục cá nhân và danh mục hệ thống bị trộn logic.
- Module tiết kiệm đang được UI sử dụng nhưng schema chưa được đăng ký và mô hình đóng góp chưa đúng.
- Local API/access control và transaction safety chưa nhất quán.
- Một số endpoint quản trị/proxy có bề mặt tấn công rộng.

Hướng chỉnh sửa nên bắt đầu từ bảo mật và runtime trước, sau đó mới chuẩn hóa mô hình dữ liệu category/transaction/savings, cuối cùng mới tối ưu thống kê và trải nghiệm báo cáo.
