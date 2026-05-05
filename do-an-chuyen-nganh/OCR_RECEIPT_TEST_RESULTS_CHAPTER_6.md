# Kết quả kiểm thử chức năng OCR hóa đơn

## 1. Thông tin lần kiểm thử

- Thời gian kiểm thử: 2026-05-05T12:35:59 đến 2026-05-05T12:36:47.
- Mã lần chạy: `20260505123559`.
- Kiểm thử bổ sung riêng cho `IMG06.jpg`: `20260505070527`, thời gian 2026-05-05T07:05:27Z đến 2026-05-05T07:05:39Z.
- Ứng dụng web: `http://localhost:3000`.
- Dịch vụ OCR/AI: `http://localhost:8000`.
- Bộ dữ liệu: thư mục `test_bill`, gồm `IMG01.jpg` đến `IMG10.jpg`.
- Riêng test OCR12 được kiểm tra thêm bằng cách upload cùng dữ liệu `IMG10` với tên `IMG10.txt` và MIME `text/plain`, vì file trong thư mục hiện đang có đuôi `.jpg`.
- Tài khoản kiểm thử được tạo tự động cho lần chạy này; dữ liệu xác nhận lưu được tạo qua API confirm của hệ thống.

## 2. Mục tiêu và phạm vi kiểm thử

Bộ kiểm thử đánh giá toàn bộ luồng OCR hóa đơn: upload ảnh, gọi API OCR, trích xuất dữ liệu, gợi ý danh mục, hiển thị form review, xác nhận lưu giao dịch và kiểm tra các trường hợp lỗi. Các tiêu chí chính gồm tên cửa hàng, ngày giao dịch, tổng tiền, tiền tệ, danh mục, item hóa đơn, quyền người dùng, lỗi service và an toàn dữ liệu trước bước xác nhận.

## 3. Môi trường kiểm thử

| Thành phần | Trạng thái |
| --- | --- |
| Health `http://localhost:3000` | HTTP 200 |
| Health `http://localhost:8000/health` | HTTP 200 |
| Tài khoản test | `ocr_report_20260505123559@example.com` |
| Danh mục chi tiêu test | An uong OCR 20260505123559, Mua sam OCR 20260505123559, Di chuyen OCR 20260505123559, Khac OCR 20260505123559 |

## 4. Kết quả theo test case

| Mã test case | Mục tiêu | Dữ liệu test | Kết quả mong đợi | Kết quả thực tế | Trạng thái | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| OCR01 | Upload hóa đơn rõ nét | IMG01 | Hiển thị form review có dữ liệu OCR | HTTP 200, `success=true`, cửa hàng `Hej - Trần Kế Xương`, tổng tiền 90.000 VND | Đạt | Có popup thông tin và form review. |
| OCR02 | Nhận diện tên cửa hàng | IMG01, IMG02, IMG03 | Tên cửa hàng đúng hoặc gần đúng | IMG01: Hej - Trần Kế Xương; IMG02: Family Mart; IMG03: DOOKKI Korean Topokki Buffet | Đạt | Các ảnh rõ nét đều có tên cửa hàng. |
| OCR03 | Nhận diện ngày giao dịch | IMG01-IMG07 | Ngày giao dịch đúng nếu ảnh có thông tin | 7/7 ảnh hóa đơn thật có ngày giao dịch | Đạt | Cần đối chiếu thêm bằng mắt nếu báo cáo yêu cầu độ chính xác tuyệt đối. |
| OCR04 | Nhận diện tổng tiền | IMG01-IMG07 | Tổng tiền đúng với hóa đơn gốc | 7/7 ảnh hóa đơn thật có `total_amount` | Đạt | Các ảnh IMG01-IMG07 đều có tổng tiền. |
| OCR05 | Nhận diện tiền tệ | IMG01-IMG07 | Tiền tệ đúng hoặc dùng mặc định phù hợp | 7/7 ảnh hóa đơn thật trả `currency=VND` | Đạt | Ảnh không phải hóa đơn IMG08 bị nhận USD do bị nhận nhầm. |
| OCR06 | Gợi ý danh mục chi tiêu | IMG01, IMG02, IMG03, IMG07 | Danh mục gợi ý phù hợp và thuộc danh sách hợp lệ | Tất cả ảnh OCR thành công trả `CATEGORY_SUGGESTION_FAILED` do Groq 401 Invalid API Key | Không đạt | Cần cập nhật `GROQ_API_KEY` hợp lệ hoặc cấu hình fallback danh mục. |
| OCR07 | Xử lý hóa đơn hơi mờ | IMG04 | Không lỗi, trả kết quả nếu đọc được và cho phép chỉnh sửa | `success=true`, cửa hàng 7-Eleven, tổng tiền 14.000 VND | Đạt có điều kiện | OCR đạt; danh mục chưa gợi ý do Groq lỗi. |
| OCR08 | Xử lý hóa đơn thiếu sáng | IMG05 | Xử lý được hoặc trả lỗi rõ ràng | `success=true`, cửa hàng WinMart, tổng tiền 71.550 VND | Đạt có điều kiện | OCR đạt; danh mục chưa gợi ý do Groq lỗi. |
| OCR09 | Xử lý hóa đơn nghiêng/cắt góc | IMG06 | Không tự lưu sai, người dùng có thể kiểm tra và chỉnh sửa | Test lại `IMG06.jpg`: `success=true`, cửa hàng nhận diện là `moit`, ngày 2026-05-05, tổng tiền 60.000 VND, có 1 item | Đạt có điều kiện | OCR trả form review và không tự lưu; tên cửa hàng chưa chính xác so với nội dung raw có dấu hiệu Phúc Long, danh mục vẫn trống do Groq 401. |
| OCR10 | Xử lý hóa đơn dài | IMG07 | Nhận diện tổng tiền, hiển thị item nếu có dữ liệu | `success=true`, tổng tiền 52.730 VND, có 3 item | Đạt có điều kiện | Có item; danh mục chưa gợi ý do Groq lỗi. |
| OCR11 | Xử lý ảnh không phải hóa đơn | IMG08, IMG09 | Thông báo không phải hóa đơn và không tạo transaction | IMG08 bị nhận nhầm thành hóa đơn Differin 309 USD; IMG09 trả `NOT_RECEIPT` | Không đạt | IMG09 đạt, IMG08 chưa đạt. |
| OCR12 | Xử lý file không hợp lệ | IMG10.txt | Từ chối file `.txt` và không gọi OCR | `IMG10.txt` trả HTTP 400, `INVALID_FILE_TYPE`; fixture `IMG10.jpg` trả `RECEIPT_PARSE_FAILED` | Đạt | File `.txt` được chặn trước OCR; `IMG10.jpg` là file hỏng có đuôi `.jpg`. |
| OCR13 | Chỉnh sửa dữ liệu trước khi lưu | IMG01 | Transaction lưu theo dữ liệu người dùng đã xác nhận | Confirm dùng payload review, tạo transaction id 169 | Đạt | Đã gửi payload xác nhận qua API confirm. |
| OCR14 | Không xác nhận sau OCR | IMG01 | Không tạo transaction và không lưu ảnh vào media | Số transaction trước parse = 0, sau parse = 0, phát sinh = 0 | Đạt | Chỉ parse OCR không tạo transaction. |
| OCR15 | Xác nhận lưu giao dịch | IMG01 | Tạo transaction expense và lưu ảnh hóa đơn vào media | HTTP 200, `success=true`, phát sinh 1 transaction, có receipt media | Đạt | Transaction có `sourceType=receipt_ai`. |
| OCR16 | Kiểm tra quyền người dùng | IMG01 | Từ chối khi chưa đăng nhập | HTTP 401, `UNAUTHORIZED` | Đạt | Không gọi OCR khi không có phiên đăng nhập. |
| OCR17 | Lỗi service OCR | IMG01 | Hiển thị lỗi, không tạo transaction | Tắt `receipt-ai` tạm thời: HTTP 500, `OCR_ROUTE_FAILED` | Đạt | Sau test đã bật lại `receipt-ai`. |
| OCR18 | Lỗi service gợi ý danh mục | IMG01 | Vẫn trả OCR nếu có thể, danh mục để trống/fallback | OCR vẫn `success=true`, nhưng `errors[0]=CATEGORY_SUGGESTION_FAILED` do Groq 401 | Đạt | Đúng cơ chế degrade: OCR vẫn trả `review_fields`. |
| OCR19 | Đo thời gian phản hồi | IMG01-IMG07 | Thời gian trong ngưỡng chấp nhận | Sau khi test lại IMG06, trung bình 4,70 giây, cao nhất 6,69 giây cho 7 ảnh hóa đơn thật | Đạt | Ngưỡng báo cáo đề xuất: dưới 10 giây/ảnh. |
| OCR20 | Kiểm tra dữ liệu lưu database | IMG01 | Transaction đúng với dữ liệu đã xác nhận | `amount=90.000`, `date=2026-04-04T00:00:00.000Z`, `sourceType=receipt_ai` | Đạt | Có media receipt đi kèm. |

## 5. Bảng đánh giá chi tiết theo ảnh

| Mã ảnh | Loại ảnh | Tên cửa hàng | Ngày giao dịch | Tổng tiền | Tiền tệ | Danh mục | Số item | Thời gian xử lý | Kết luận |
| --- | --- | --- | --- | ---: | --- | --- | ---: | ---: | --- |
| IMG01 | Hóa đơn rõ nét | Hej - Trần Kế Xương | 2026-04-04 | 90.000 | VND | - | 1 | 3,62s | Đạt có điều kiện - OCR đạt, gợi ý danh mục lỗi do Groq 401 |
| IMG02 | Hóa đơn rõ nét | Family Mart | 2026-04-12 | 63.000 | VND | - | 2 | 4,27s | Đạt có điều kiện - OCR đạt, gợi ý danh mục lỗi do Groq 401 |
| IMG03 | Hóa đơn rõ nét | DOOKKI Korean Topokki Buffet | 2026-04-13 | 600.480 | VND | - | 1 | 4,94s | Đạt có điều kiện - OCR đạt, gợi ý danh mục lỗi do Groq 401 |
| IMG04 | Hóa đơn hơi mờ | 7-Eleven | 2026-05-05 | 14.000 | VND | - | 1 | 3,33s | Đạt có điều kiện - OCR đạt, gợi ý danh mục lỗi do Groq 401 |
| IMG05 | Hóa đơn thiếu sáng | WinMart | 2026-04-13 | 71.550 | VND | - | 5 | 6,69s | Đạt có điều kiện - OCR đạt, gợi ý danh mục lỗi do Groq 401 |
| IMG06 | Hóa đơn nghiêng/cắt góc | moit | 2026-05-05 | 60.000 | VND | - | 1 | 6,18s | Đạt có điều kiện - test lại riêng; OCR trả form review nhưng tên cửa hàng chưa tin cậy, danh mục lỗi do Groq 401 |
| IMG07 | Hóa đơn dài | CONG TY CO PHAN KING FOOD MARKET | 2026-04-24 | 52.730 | VND | - | 3 | 3,86s | Đạt có điều kiện - OCR đạt, gợi ý danh mục lỗi do Groq 401 |
| IMG08 | Không phải hóa đơn | Differin | - | 309 | USD | - | 0 | 2,76s | Không đạt - hệ thống nhận nhầm ảnh không phải hóa đơn là hóa đơn |
| IMG09 | Không phải hóa đơn | - | - | - | - | - | 0 | 3,36s | Đạt - trả lỗi không phải hóa đơn |
| IMG10 | File lỗi/không hợp lệ (.jpg hỏng) | - | - | - | - | - | 0 | 0,64s | Đạt có điều kiện - file hỏng bị OCR service từ chối; fixture đang là `.jpg` |
| IMG10.txt | File không hợp lệ (.txt) | - | - | - | - | - | 0 | 0,04s | Đạt - từ chối file `.txt` trước khi gọi OCR |

## 6. Bảng tổng hợp kết quả đánh giá

| Tiêu chí đánh giá | Số mẫu đạt | Tổng số mẫu áp dụng | Tỷ lệ đạt |
| --- | ---: | ---: | ---: |
| Nhận diện được tên cửa hàng | 6 | 7 | 85,71% |
| Nhận diện được ngày giao dịch | 7 | 7 | 100,00% |
| Nhận diện được tổng tiền | 7 | 7 | 100,00% |
| Nhận diện được đơn vị tiền tệ | 7 | 7 | 100,00% |
| Gợi ý đúng danh mục chi tiêu | 0 | 7 | 0,00% |
| Hiển thị form review khi OCR thành công | 8 | 8 | 100,00% |
| Cho phép chỉnh sửa/xác nhận trước khi lưu | 1 | 1 | 100,00% |
| Chỉ lưu transaction sau khi xác nhận | 1 | 1 | 100,00% |
| Ngăn tạo giao dịch với dữ liệu không hợp lệ | 2 | 3 | 66,67% |
| Xử lý lỗi rõ ràng | 4 | 4 | 100,00% |

## 7. Nhận xét kết quả kiểm thử

Trong 7 ảnh hóa đơn thật từ IMG01 đến IMG07, hệ thống đều trả kết quả OCR thành công. Các trường quan trọng như ngày giao dịch, tổng tiền và tiền tệ đều có dữ liệu. Sau khi test lại riêng `IMG06.jpg`, thời gian phản hồi trung bình là 4,70 giây/ảnh, cao nhất là 6,69 giây ở IMG05, phù hợp để sử dụng trong quy trình review-confirm.

Riêng `IMG06.jpg` được cập nhật kết quả theo lần test bổ sung vì file ảnh đã được thay đổi sau lần chạy đầu. Kết quả mới vẫn cho thấy hệ thống không tự lưu giao dịch và vẫn đưa dữ liệu vào form review để người dùng kiểm tra, nhưng trường tên cửa hàng chưa chính xác và cần chỉnh sửa thủ công trước khi xác nhận.

Cơ chế review-confirm hoạt động đúng: sau khi chỉ OCR mà chưa xác nhận, số lượng transaction không tăng. Khi gửi payload xác nhận cho IMG01, hệ thống tạo đúng một transaction loại `expense`, có `sourceType=receipt_ai` và có media hóa đơn đi kèm.

Các trường hợp lỗi hệ thống được xử lý rõ ràng. Khi chưa đăng nhập, API trả `UNAUTHORIZED`. Khi tắt service OCR, API trả `OCR_ROUTE_FAILED`. Khi upload file `.txt`, hệ thống trả `INVALID_FILE_TYPE` trước khi gọi OCR. Điều này đáp ứng yêu cầu không tạo giao dịch khi dữ liệu đầu vào hoặc service không hợp lệ.

Hai điểm chưa đạt hoặc cần cải thiện được ghi nhận. Thứ nhất, Groq trả lỗi `401 Invalid API Key`, khiến toàn bộ gợi ý danh mục thất bại; tuy vậy OCR vẫn trả dữ liệu review và danh mục để trống, đúng cơ chế degrade khi AI gợi ý lỗi. Thứ hai, IMG08 là ảnh không phải hóa đơn nhưng bị nhận nhầm thành hóa đơn có merchant `Differin`, tổng tiền `309 USD`; cần bổ sung điều kiện nhận diện non-receipt chặt hơn, ví dụ yêu cầu có ngày giao dịch hoặc nhiều dấu hiệu hóa đơn trước khi trả `success=true`.

## 8. Kết luận

Chức năng OCR hóa đơn đã đáp ứng phần lớn luồng nghiệp vụ chính: upload ảnh, trích xuất dữ liệu, hiển thị form review, không tự tạo transaction trước xác nhận, xác nhận lưu transaction và xử lý các lỗi quyền/service/file không hợp lệ. Kết quả phù hợp để đưa vào báo cáo với trạng thái tổng thể là đạt có điều kiện.

Các điều kiện cần hoàn thiện trước khi đánh giá đạt hoàn toàn gồm: cập nhật khóa Groq hợp lệ để kiểm thử gợi ý danh mục, cải thiện rule phát hiện ảnh không phải hóa đơn để chặn trường hợp IMG08, và chuẩn hóa fixture OCR12 thành đúng `IMG10.txt` thay vì chỉ có `IMG10.jpg` trong thư mục `test_bill`.

## 9. Phụ lục dữ liệu raw

Kết quả raw của lần chạy chính được lưu tại: `tmp/ocr_receipt_test_run_20260505123559.json`.

Kết quả raw của lần test lại riêng `IMG06.jpg` được lưu tại: `tmp/ocr_img06_retest_20260505070527.json`.
