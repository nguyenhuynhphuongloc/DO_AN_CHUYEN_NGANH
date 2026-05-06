## Why

Luồng ví, tiết kiệm, danh mục và thêm giao dịch hiện còn lẫn vai trò nên trải nghiệm nhập liệu và theo dõi số dư chưa tự nhiên. Cần chốt lại mô hình 1 ví chính + nhiều ví tiết kiệm, làm rõ cách trừ số dư khi chi tiêu, và nâng cấp giao diện tổng quan cùng màn tiết kiệm để người dùng thao tác nhanh hơn.

## What Changes

- Giữ mô hình hiện tại theo hướng không tạo thêm thực thể “hũ” mới, nhưng tối ưu màn danh mục để tiếp tục quản lý phần phân bổ/giới hạn chi tiêu ngay trong ngữ cảnh danh mục.
- Chốt quy tắc mọi giao dịch chi tiêu mặc định trừ từ ví chính; ví tiết kiệm không được dùng trực tiếp để thanh toán chi tiêu.
- Khi ví chính không đủ số dư, hiển thị lựa chọn nạp bù từ ví tiết kiệm nếu có ví tiết kiệm còn tiền; nếu người dùng từ chối hoặc không có tiền tiết kiệm phù hợp thì cho phép số dư ví chính âm và yêu cầu kiểm tra.
- Đơn giản hóa form thêm giao dịch: trường nguồn nhập tay mặc định là “Thủ công”, không yêu cầu chọn từ danh sách; chỉ cho phép ví chi tiêu hợp lệ trong luồng thanh toán giao dịch.
- Nâng cấp trang tổng quan với các hành động nhanh: nạp tiền, lịch sử giao dịch, báo cáo thu chi, quản lý ví; đồng thời đổi lại các nhãn số dư để phản ánh đúng từng ví.
- Chốt mô hình người dùng có đúng 1 ví chính nhưng có thể có nhiều ví tiết kiệm.
- Chuyển trọng tâm trang tiết kiệm sang quản lý nhiều ví tiết kiệm và quản lý mục tiêu tiết kiệm: xem danh sách ví, chuyển nhanh giữa các ví, xem số dư, nạp vào mục tiêu từ ví được chọn, và xem lịch sử nạp của từng mục tiêu.
- Cập nhật UX/UI theo hướng gọn hơn, không hiển thị ghi chú mô tả bên dưới label.

## Capabilities

### New Capabilities
- `category-budget-overview`: quản lý phần phân bổ hoặc giới hạn chi tiêu ngay trong màn danh mục mà không tạo thêm mô hình hũ riêng.
- `transaction-settlement-and-funding`: xác định quy tắc thanh toán giao dịch từ ví chính, xử lý thiếu số dư và nạp bù từ ví tiết kiệm.
- `transaction-entry-experience`: đơn giản hóa form thêm giao dịch, loại bỏ lựa chọn nguồn thủ công và chặn ví tiết kiệm khỏi luồng chi tiêu.
- `dashboard-wallet-actions`: thêm hành động nhanh và đổi cách hiển thị số dư trên trang tổng quan.
- `savings-wallet-management`: quản lý 1 ví chính và nhiều ví tiết kiệm, bao gồm xem danh sách, chuyển ngữ cảnh và hiển thị số dư.
- `savings-goal-funding-history`: quản lý mục tiêu tiết kiệm, chọn ví nguồn để nạp và xem lịch sử nạp của từng mục tiêu.

### Modified Capabilities
- None.

## Impact

- Ảnh hưởng tới collections và API của wallets, transactions, budgets, savings-goals và có thể bổ sung lịch sử nạp mục tiêu tiết kiệm.
- Ảnh hưởng tới các màn Dashboard, Categories, Transactions, Savings và các luồng AI/OCR khi lưu giao dịch để bảo đảm luôn dùng ví chính cho chi tiêu.
- Có thể cần cập nhật quy tắc số dư, điều chuyển tiền giữa ví và dữ liệu lịch sử liên quan tới tiết kiệm.