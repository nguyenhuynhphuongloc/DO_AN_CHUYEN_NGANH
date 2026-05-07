# FinTrack Admin UI Rebuild Spec

Tài liệu này là bản đặc tả UI admin để chỉnh sửa trước khi implement. Admin phải đúng logic của hệ thống quản lý tài chính cá nhân: dữ liệu ví, giao dịch, danh mục, hũ chi, tiết kiệm, hóa đơn, thông báo và AI/chat là dữ liệu riêng của từng người dùng.

Admin không xem các bảng tài chính riêng tư theo kiểu global. Admin chọn một người dùng trước, sau đó workspace của người dùng đó hiển thị ở bên phải.

```text
Admin tổng quan
  |
  +-- Danh sách người dùng
        |
        +-- Chọn một người dùng
              |
              +-- Danh sách người dùng chuyển thành sidebar trái kiểu khung chat
              +-- Workspace người dùng hiển thị bên phải
                    |
                    +-- Tổng quan
                    +-- Ví tiền
                    +-- Giao dịch
                    +-- Danh mục
                    +-- Hũ chi
                    +-- Tiết kiệm
                    +-- Hóa đơn/OCR
                    +-- AI/chat
                    +-- Thông báo
```

## 1. Nguyên Tắc UI Chung

### 1.1 Không Dùng Subtitle

Toàn bộ admin không dùng subtitle/mô tả dài dưới tiêu đề trang. Header chỉ giữ:

- Label trang.
- Label chức năng.
- Button/action cần thiết.
- Badge trạng thái nếu cần.

Ví dụ đúng:

```text
Tổng quan
[Chọn người dùng] [Chất lượng dữ liệu] [Đăng xuất]
```

Ví dụ không dùng:

```text
Tổng quan
Theo dõi sức khỏe dữ liệu FinTrack và bắt đầu hỗ trợ...
```

### 1.2 Theme

Admin dùng theme sáng giống trang chính.

| Token | Giá trị |
| --- | --- |
| Background | `#F6F8FB` |
| Surface | `#FFFFFF` |
| Text chính | `#111827` |
| Text phụ | `#64748B` |
| Border | `#DBE3EF` |
| Border mạnh | `#CBD5E1` |
| Primary | `#2563EB` |
| Accent | `#0F766E` |
| Warning | `#D97706` |
| Danger | `#DC2626` |

Không dùng:

- Dark theme toàn trang.
- Gradient lớn.
- Decorative orb/blob.
- Emoji làm icon.
- Card lồng card.
- Bảng global chứa dữ liệu riêng tư của nhiều user.

### 1.3 Layout Chung

Admin shell:

```text
┌──────────────────────────────────────────────┐
│ Header: label trang + actions                │
├──────────────────────────────────────────────┤
│ Nav: Tổng quan | Người dùng | Cảnh báo dữ liệu│
├──────────────────────────────────────────────┤
│ Content                                      │
└──────────────────────────────────────────────┘
```

Khi đã chọn user:

```text
┌─────────────────────────────────────────────────────────────┐
│ Header: Người dùng + actions                                │
├───────────────────┬─────────────────────────────────────────┤
│ User sidebar      │ User workspace                          │
│ kiểu khung chat   │ Header user + tabs + nội dung           │
└───────────────────┴─────────────────────────────────────────┘
```

### 1.4 Component Chuẩn

| Component | Mục đích |
| --- | --- |
| `AdminShell` | layout toàn admin |
| `AdminHeader` | label trang + actions |
| `AdminPrimaryNav` | Tổng quan, Người dùng, Cảnh báo dữ liệu |
| `AdminKpiCard` | chỉ số tổng hợp |
| `AdminPanel` | khối nội dung độc lập |
| `AdminFilterBar` | search/select/date/reset |
| `AdminDataTable` | table có loading/empty/error |
| `AdminStatusBadge` | trạng thái |
| `UserListSidebar` | danh sách user bên trái kiểu khung chat |
| `UserWorkspaceHeader` | thông tin user đang chọn |
| `UserWorkspaceTabs` | tab trong workspace |
| `AdminEmptyState` | trạng thái rỗng rõ phạm vi |
| `AdminErrorState` | lỗi có `role="alert"` |

### 1.5 CSS/UI Polish Bắt Buộc

UI admin phải gọn, tinh tế, cân hàng và không bị lem chữ ra ngoài box.

Typography:

- Page label: 22-24px, không lớn hơn 28px.
- Section label: 15-17px.
- Table/body text: 13-14px.
- Badge/button text: 12-14px.
- Không dùng chữ quá lớn trong panel nhỏ.
- Không dùng chữ quá nhỏ dưới 12px cho nội dung chính.
- Line-height mặc định 1.35-1.5 để chữ dễ đọc.

Box sizing:

- Tất cả component dùng `box-sizing: border-box`.
- Panel/card/table/filter phải có width ổn định, không bị lệch hàng.
- Không dùng margin âm.
- Không để card con lồng trong card cha nếu không cần.
- Border radius thống nhất 6-8px.
- Khoảng cách giữa các box thống nhất 12px hoặc 16px.

Text containment:

- Text trong box không được tràn ra ngoài.
- Email, ID, route, merchant name dài phải dùng `overflow-wrap: anywhere`, `text-overflow: ellipsis`, hoặc `max-width` rõ ràng.
- Button label dài phải xuống dòng hợp lý hoặc rút gọn, không tràn khỏi button.
- Table cell dài phải ellipsis hoặc wrap có kiểm soát.

Alignment:

- Các box cùng hàng phải cao/căn đều bằng grid/flex ổn định.
- KPI card cùng một row không được lệch bất thường.
- Header actions phải wrap gọn khi thiếu chỗ.
- Sidebar user và workspace phải cùng top alignment.
- Tabs không được làm nhảy layout khi active.

Overflow:

- Table luôn nằm trong wrapper có `overflow-x: auto`.
- Workspace không tạo horizontal scroll toàn trang ở 375px.
- Sidebar user scroll độc lập, không kéo cả trang nếu danh sách dài.
- Panel nội dung dài dùng scroll hoặc pagination, không phá layout.

Responsive:

- 375px: không có chữ đè nhau, không có box tràn ngang toàn trang.
- 768px: sidebar có thể chuyển lên trên hoặc thành drawer.
- 1024px: sidebar trái + workspace phải phải cân hàng.
- 1440px: nội dung không bị kéo quá rộng làm khó đọc.

Visual quality:

- Không dùng shadow quá đậm.
- Không dùng quá nhiều border màu xanh.
- Primary blue chỉ dùng cho action chính, active tab, focus.
- Warning/danger chỉ dùng khi thật sự cảnh báo/lỗi.

### 1.6 Interaction Test Bắt Buộc

Khi implement UI, phải test tất cả nút chuyển chức năng và tab. Nếu bấm xong UI chuyển sai, route sai, state sai hoặc console/API báo lỗi thì phải sửa trước khi hoàn tất.

Các nút/link bắt buộc test:

| Khu vực | Test |
| --- | --- |
| Primary nav | Bấm `Tổng quan`, `Người dùng`, `Cảnh báo dữ liệu`, `Dữ liệu gốc` |
| Tổng quan | Bấm `Chọn người dùng`, `Cảnh báo dữ liệu`, `Đăng xuất` |
| User full list | Bấm từng user row và nút `Mở` |
| User sidebar | Bấm qua lại nhiều user khác nhau |
| Workspace tabs | Bấm tất cả tab: Tổng quan, Ví tiền, Giao dịch, Danh mục, Hũ chi, Tiết kiệm, Hóa đơn/OCR, AI/chat, Thông báo |
| Filters | Nhập filter, submit, reset |
| Pagination nếu có | Next/previous page |
| Role action | Mở confirm đổi role, cancel/submit/error state |
| Global-block page | Bấm `Chọn người dùng`, `Về tổng quan` |

Điều kiện pass:

- URL đúng với chức năng vừa bấm.
- Active state đúng.
- Không mất selected user khi đổi tab.
- Sidebar vẫn highlight đúng user.
- Không có console error.
- Không có API 500.
- Loading/empty/error state không làm layout nhảy mạnh.
- Text vẫn nằm trong box sau khi data dài.
- Không xuất hiện horizontal scroll toàn trang ở mobile.

## 2. Navigation Admin

Primary navigation chỉ gồm:

```text
Tổng quan
Người dùng
Cảnh báo dữ liệu
Dữ liệu gốc
```

`Dữ liệu gốc` là link phụ tới Payload collections, không phải workflow chính.

Không có primary nav cho:

- Ví tiền global.
- Giao dịch global.
- Danh mục global.
- Hũ chi global.
- Tiết kiệm global.
- Hóa đơn global.
- AI global.
- Thông báo global.

Nếu admin mở route global cũ, hiển thị block page:

```text
Cần chọn người dùng trước
[Chọn người dùng] [Về tổng quan]
```

Không hiển thị đoạn mô tả dài.

## 3. Trang `/admin` - Tổng Quan

### 3.1 Header

Chỉ hiển thị:

- Label: `Tổng quan`
- Actions:
  - `Chọn người dùng`
  - `Cảnh báo dữ liệu`
  - `Đăng xuất`

Không có subtitle.

### 3.2 KPI Hiển Thị

| KPI | Ý nghĩa |
| --- | --- |
| Người dùng | tổng số user |
| Thiếu ví mặc định | số user chưa có ví mặc định |
| Ví tiền | tổng số ví |
| Giao dịch tháng này | số giao dịch tháng hiện tại |
| Hóa đơn OCR | tổng hóa đơn xử lý qua OCR |
| AI/chat | tổng log AI/chat |
| Cảnh báo dữ liệu | tổng cảnh báo đang mở |

Không hiển thị:

- Recent transactions global.
- Danh sách ví global.
- Nội dung chat/prompt AI.
- Danh sách hóa đơn của nhiều user.
- Panel `Luồng hỗ trợ đúng`.

### 3.3 Cảnh Báo Dữ Liệu Trên Tổng Quan

Panel duy nhất bên dưới KPI:

```text
Cảnh báo dữ liệu
```

Mục đích:

- Giúp admin phát hiện dữ liệu có thể làm người dùng thấy sai số dư, sai giao dịch, sai hũ chi hoặc thiếu hóa đơn.
- Không phải chức năng cho người dùng cuối tự dùng.
- Đây là công cụ vận hành để admin biết user nào đang có dữ liệu cần kiểm tra.
- Khi cảnh báo có `userId`, action mở workspace user đó.
- Khi cảnh báo không có `userId`, action mở trang `Cảnh báo dữ liệu`.

Ví dụ tác dụng thực tế:

| Cảnh báo | Ảnh hưởng tới người dùng |
| --- | --- |
| Thiếu ví mặc định | user có thể không tạo được giao dịch đúng ví |
| Giao dịch thiếu category | báo cáo/danh mục chi tiêu bị sai |
| Hũ chi trùng scope | số tiền đã dùng/còn lại có thể sai |
| Receipt OCR thiếu media | user không xem lại được hóa đơn |
| Savings lệch contribution | mục tiêu tiết kiệm hiển thị sai tiến độ |
| AI/chat lỗi | user có thể không nhận được tư vấn hoặc log hỗ trợ |

### 3.4 Cảnh Báo Dữ Liệu UI

Hiển thị dạng list/table compact:

| Field | Hiển thị |
| --- | --- |
| Mức độ | badge warning/danger |
| Khu vực | wallets, transactions, budgets, receipts, savings, ai |
| Vấn đề | label ngắn |
| User | email hoặc `Không xác định` |
| Action | `Mở workspace` hoặc `Xem cảnh báo` |

States:

- Loading: skeleton KPI + skeleton warning list.
- Empty: `Không có cảnh báo dữ liệu.`
- Error: `Không tải được cảnh báo dữ liệu.`

## 4. Trang `/admin/finance/users` - Người Dùng

### 4.1 Mục Tiêu

Trang này là trung tâm admin. Khi chưa chọn user, hiển thị danh sách người dùng toàn trang. Khi chọn user, danh sách chuyển sang sidebar trái kiểu khung chat và workspace user mở bên phải.

### 4.2 Header

Chỉ hiển thị:

- Label: `Người dùng`
- Actions:
  - `Tải lại`
  - `Đăng xuất`

Không có subtitle.

### 4.3 Trạng Thái Chưa Chọn User

Layout:

```text
┌──────────────────────────────────────────────┐
│ Người dùng                         Actions   │
├──────────────────────────────────────────────┤
│ Filter bar                                    │
├──────────────────────────────────────────────┤
│ User table/list full width                    │
└──────────────────────────────────────────────┘
```

Filter:

| Field | Type |
| --- | --- |
| Tìm kiếm | search email/tên |
| Vai trò | all/user/admin |
| Thiết lập ví | all/hoàn tất/thiếu ví |
| Hoạt động | all/có giao dịch/chưa có |
| Ngày tạo | date range |

User row/card:

| Field | Hiển thị |
| --- | --- |
| Avatar initials | 2 ký tự đầu email/tên |
| Email | primary label |
| Tên | secondary label nếu có |
| Role | badge |
| Ví | count |
| Giao dịch | count |
| Thiết lập | badge |
| Hoạt động gần nhất | date |
| Action | `Mở` |

Click row hoặc `Mở`:

- Route tới `/admin/finance/users/:userId`.
- UI chuyển sang layout có sidebar user list bên trái.

### 4.4 Trạng Thái Đã Chọn User

Layout:

```text
┌───────────────────────────────────────────────────────────────┐
│ Người dùng                                           Actions  │
├──────────────────────┬────────────────────────────────────────┤
│ UserListSidebar      │ UserWorkspace                          │
│ - Search             │ - Workspace header                     │
│ - User rows          │ - Tabs                                 │
│ - Active selected    │ - Tab content                          │
└──────────────────────┴────────────────────────────────────────┘
```

Sidebar trái kiểu khung chat:

- Width desktop: 300-360px.
- Có search ở đầu.
- Danh sách user dạng compact row.
- Row active có border/indicator màu primary.
- Row hiển thị:
  - avatar initials.
  - email.
  - role badge nhỏ.
  - trạng thái ví nhỏ.
  - latest activity.
- Scroll độc lập.

Mobile:

- Sidebar thành drawer hoặc full-width list phía trên.
- Có button `Danh sách người dùng` để mở/đóng list.

## 5. User Workspace Chung

Route gốc:

```text
/admin/finance/users/:userId
```

### 5.1 Workspace Header

Hiển thị label chức năng, không subtitle:

```text
user@example.com
[Người dùng] [VND] [3 ví] [120 giao dịch] [Đã có ví mặc định]
```

Actions:

- `Quay lại`
- `Tải lại`

Không có:

- Impersonate.
- Xóa user.
- Sửa trực tiếp dữ liệu tài chính.

### 5.2 Tabs

| Label | Route |
| --- | --- |
| Tổng quan | `/admin/finance/users/:userId` |
| Ví tiền | `/admin/finance/users/:userId/wallets` |
| Giao dịch | `/admin/finance/users/:userId/transactions` |
| Danh mục | `/admin/finance/users/:userId/categories` |
| Hũ chi | `/admin/finance/users/:userId/budgets` |
| Tiết kiệm | `/admin/finance/users/:userId/savings` |
| Hóa đơn/OCR | `/admin/finance/users/:userId/receipts` |
| AI/chat | `/admin/finance/users/:userId/ai` |
| Thông báo | `/admin/finance/users/:userId/notifications` |

Tabs luôn nằm trong workspace bên phải.

## 6. Tab Tổng Quan User

### 6.1 KPI

| KPI | Hiển thị |
| --- | --- |
| Tổng số dư | currency |
| Số dư chi tiêu | currency |
| Số dư tiết kiệm | currency |
| Thu nhập tháng này | currency |
| Chi tiêu tháng này | currency |
| Dòng tiền ròng | currency + badge |
| Hũ chi cảnh báo | count |
| Hóa đơn OCR | count |
| AI/chat | count |

### 6.2 Panels

Panel `Thông tin`:

- Email.
- Tên.
- Role.
- Currency.
- Ngày tạo.
- Thiết lập ví.

Panel `Cảnh báo của người dùng này`:

- Thiếu ví mặc định.
- Hũ chi vượt hạn mức.
- Giao dịch thiếu category/wallet.
- Receipt OCR thiếu media.
- Savings lệch contribution.
- AI/chat error.

States:

- Empty wallet: `Người dùng này chưa có ví.`
- Empty transaction: `Người dùng này chưa có giao dịch.`

## 7. Tab Ví Tiền

Filter:

- Loại ví.
- Mặc định.
- Trạng thái.

Table columns:

- Tên ví.
- Loại ví.
- Số dư.
- Tiền tệ.
- Hạn mức tháng.
- Mặc định.
- Đang hoạt động.
- Cập nhật gần nhất.

Empty:

```text
Người dùng này chưa tạo ví tiền nào.
```

## 8. Tab Giao Dịch

Filter:

- Tìm kiếm.
- Ví.
- Loại.
- Danh mục.
- Nguồn.
- Từ ngày.
- Đến ngày.
- Min amount.
- Max amount.

Table columns:

- Ngày.
- Mô tả/merchant.
- Ví.
- Loại.
- Số tiền.
- Danh mục.
- Nguồn.
- Hóa đơn.
- Mục tiêu tiết kiệm.

Detail drawer:

- ID.
- Ngày.
- Số tiền.
- Ví.
- Danh mục.
- Source type.
- Receipt link.
- Savings goal.
- Audit metadata.

Empty:

```text
Người dùng này chưa có giao dịch nào theo bộ lọc hiện tại.
```

## 9. Tab Danh Mục

Filter:

- Tìm kiếm.
- Type: income/expense.
- Scope: hệ thống/người dùng này.

Table columns:

- Tên.
- Loại.
- Icon.
- Color swatch.
- Phạm vi.
- Duplicate warning.
- Số giao dịch dùng danh mục.

Empty:

```text
Người dùng này chưa có danh mục riêng.
```

## 10. Tab Hũ Chi

Filter:

- Tháng.
- Năm.
- Danh mục.
- Ví.
- Trạng thái.
- Usage: all/near limit/exceeded.

Table columns:

- Danh mục.
- Ví.
- Kỳ.
- Hạn mức.
- Đã dùng.
- Còn lại.
- % sử dụng.
- Trạng thái.

Usage:

```text
0-79%: tốt
80-99%: cảnh báo
>=100%: vượt hạn mức
```

Empty:

```text
Người dùng này chưa tạo hũ chi nào.
```

## 11. Tab Tiết Kiệm

Filter:

- Tìm kiếm.
- Status.
- Vai trò: owner/participant.
- Target date.

Table columns:

- Mục tiêu.
- Vai trò user.
- Target amount.
- Current amount.
- Contribution total.
- Progress.
- Deadline.
- Status.
- Consistency warning.

Detail drawer:

- Contributions.
- Transaction liên quan.
- Warning nếu current amount lệch contribution total.

Empty:

```text
Người dùng này chưa có mục tiêu tiết kiệm nào.
```

## 12. Tab Hóa Đơn/OCR

Filter:

- Date range.
- Merchant.
- Status: linked/missing_media.
- Amount range.
- Category.

Table columns:

- Ngày.
- Merchant.
- Số tiền.
- Ví.
- Danh mục.
- Receipt status.
- Media filename.
- Transaction detail.

Detail drawer:

- Receipt image thumbnail.
- Transaction created by OCR.
- Merchant/date/amount reviewed.
- Source ref id.
- Missing fields warning.

Empty:

```text
Người dùng này chưa có hóa đơn/OCR nào.
```

## 13. Tab AI/Chat

Mục tiêu: chỉ hiển thị log đã redact của selected user.

Filter:

- Kind: advisor/transaction_chat/receipt_ocr.
- Direction: incoming/outgoing/system.
- Status: success/error/pending.
- Date range.

Table columns:

- Thời gian.
- Kind.
- Direction.
- Status.
- Intent.
- Nội dung đã làm sạch.
- Linked transaction.
- Error message.

Không hiển thị:

- `rawText`.
- full financial context.
- unredacted prompt.

Empty:

```text
Người dùng này chưa có nhật ký AI/chat nào.
```

## 14. Tab Thông Báo

Filter:

- Type.
- Read status.
- Date range.

Table columns:

- Thời gian tạo.
- Type.
- Message.
- Link.
- Đã đọc.

Empty:

```text
Người dùng này chưa có thông báo nào.
```

## 15. Trang `/admin/finance/data-quality` - Cảnh Báo Dữ Liệu

### 15.1 Header

Chỉ hiển thị:

- Label: `Cảnh báo dữ liệu`
- Actions:
  - `Chạy kiểm tra lại`
  - `Chọn người dùng`
  - `Đăng xuất`

Không có subtitle.

### 15.2 Tác Dụng Với Người Dùng

Trang này không dành cho người dùng cuối, nhưng ảnh hưởng trực tiếp đến trải nghiệm của họ. Nó giúp admin phát hiện nguyên nhân khiến user thấy dữ liệu sai hoặc thiếu.

| Loại cảnh báo | Người dùng bị ảnh hưởng thế nào |
| --- | --- |
| User thiếu ví mặc định | không thể tạo giao dịch đúng ví mặc định |
| Transaction thiếu wallet | số dư ví và báo cáo có thể sai |
| Transaction thiếu category | báo cáo danh mục và hũ chi sai |
| Category type mismatch | thu/chi bị phân loại sai |
| Budget trùng scope | hũ chi tính sai hạn mức |
| Receipt thiếu media | user không xem lại được hóa đơn |
| Savings inconsistent | tiến độ tiết kiệm hiển thị sai |
| AI/chat error | tư vấn hoặc tạo giao dịch bằng AI thất bại |

### 15.3 Filter

- Area.
- Severity.
- Có user liên quan.

### 15.4 Table

Columns:

- Severity.
- Area.
- Vấn đề.
- Chi tiết.
- User liên quan.
- Record ID.
- Bước tiếp theo.
- Action.

Action:

- Có `userId`: `Mở workspace`.
- Không có `userId`: `Xem dữ liệu gốc`.

Empty:

```text
Không có cảnh báo dữ liệu.
```

## 16. Trang Chặn Global Detail Cũ

Các route này không render bảng global:

- `/admin/finance/wallets`
- `/admin/finance/transactions`
- `/admin/finance/categories`
- `/admin/finance/budgets`
- `/admin/finance/savings`
- `/admin/finance/receipts`
- `/admin/finance/ai`
- `/admin/finance/notifications`

UI:

```text
Cần chọn người dùng trước
[Chọn người dùng] [Về tổng quan]
```

Không có mô tả dài.

## 17. API Mapping

| UI | API |
| --- | --- |
| `/admin` | `/api/admin/overview`, `/api/admin/data-quality` |
| `/admin/finance/users` | `/api/admin/users` |
| Role change | `POST /api/admin/users/:id/role` |
| User profile | `/api/admin/users/:id/profile` |
| User overview | `/api/admin/users/:id/finance-summary` |
| User wallets | `/api/admin/users/:id/wallets` |
| User transactions | `/api/admin/users/:id/transactions` |
| User categories | `/api/admin/users/:id/categories` |
| User budgets | `/api/admin/users/:id/budgets` |
| User savings | `/api/admin/users/:id/savings` |
| User receipts | `/api/admin/users/:id/receipts` |
| User AI/chat | `/api/admin/users/:id/ai-logs` |
| User notifications | `/api/admin/users/:id/notifications` |
| Data quality | `/api/admin/data-quality` |

## 18. Responsive Rules

### 375px

- Header actions wrap.
- KPI grid 1 column.
- User sidebar mở như drawer hoặc nằm trên workspace.
- Tabs horizontal scroll.
- Tables horizontal scroll.
- Filter fields 1 column.

### 768px

- KPI grid 2 columns.
- User list có thể nằm trên workspace hoặc sidebar hẹp.
- Tables vẫn có horizontal scroll nếu cần.

### 1024px

- User sidebar trái 300-340px.
- Workspace phải chiếm phần còn lại.
- KPI grid 3-4 columns.

### 1440px

- User sidebar trái 340-360px.
- Workspace phải hiển thị table rộng.
- KPI grid 4-6 columns.

## 19. Accessibility Checklist

- [ ] Internal navigation dùng Next `Link`.
- [ ] Input có label.
- [ ] Error block dùng `role="alert"`.
- [ ] Focus state rõ.
- [ ] Status có text + màu, không chỉ dùng màu.
- [ ] Table không vỡ mobile viewport.
- [ ] Motion tôn trọng `prefers-reduced-motion`.
- [ ] Icon-only control có aria-label hoặc tooltip.

## 20. Implementation Order

1. Viết lại admin shell/header/nav, bỏ subtitle.
2. Viết layout `/admin` chỉ còn KPI + cảnh báo dữ liệu.
3. Bỏ panel `Luồng hỗ trợ đúng`.
4. Viết `/admin/finance/users` trạng thái full list.
5. Viết selected-user layout: sidebar trái kiểu khung chat + workspace phải.
6. Viết workspace header + tabs.
7. Implement từng tab.
8. Implement trang `Cảnh báo dữ liệu`.
9. Implement global-block page cho route cũ.
10. Chạy `generate:importmap` nếu đổi Payload component path.
11. Chạy `tsc --noEmit`.
12. Smoke test các viewport 375px, 768px, 1024px, 1440px.
13. Test từng nút chuyển chức năng và từng tab workspace.
14. Kiểm tra console browser và network request, không được có console error hoặc API 500.
15. Kiểm tra dữ liệu dài: email dài, tên ví dài, merchant dài, nội dung AI/chat dài, tất cả phải nằm gọn trong box.
16. Kiểm tra các box cùng hàng không lệch, không đè nhau, không làm vỡ layout.
