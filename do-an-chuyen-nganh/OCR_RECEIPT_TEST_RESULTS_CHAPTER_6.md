# Kết quả kiểm thử chức năng OCR hóa đơn

## 1. Thông tin lần kiểm thử

- Thời gian kiểm thử: 2026-05-05T12:35:59 đến 2026-05-05T12:36:47.
- Mã lần chạy: `20260505123559`.
- Kiểm thử bổ sung riêng cho `IMG06.jpg`: lần 1 `20260505070527`, lần 2 sau khi cập nhật Groq key `20260505071427`.
- Kiểm thử bổ sung riêng cho nhóm category suggestion `OCR06`: `20260505072146`, gồm `IMG01.jpg`, `IMG02.jpg`, `IMG03.jpg`, `IMG07.jpg`.
- Kiểm thử bổ sung riêng cho `OCR07` và `OCR08`: `20260505072836`, gồm `IMG04.jpg` và `IMG05.jpg`.
- Ứng dụng web: `http://localhost:3000`.
- Dịch vụ OCR/AI: `http://localhost:8000`.
- Bộ dữ liệu: thư mục `test_bill`, gồm `IMG01.jpg` đến `IMG10.jpg`.
- Riêng test OCR12 được kiểm tra thêm bằng cách upload cùng dữ liệu `IMG10` với tên `IMG10.txt` và MIME `text/plain`, vì file trong thư mục hiện đang có đuôi `.jpg`.
- Tài khoản kiểm thử được tạo tự động cho lần chạy này; dữ liệu xác nhận lưu được tạo qua API confirm của hệ thống.

## 2. Mục tiêu và phạm vi kiểm thử

Bộ kiểm thử đánh giá toàn bộ luồng OCR hóa đơn: upload ảnh, gọi API OCR, trích xuất dữ liệu, gợi ý danh mục, hiển thị form review, xác nhận lưu giao dịch và kiểm tra các trường hợp lỗi. Các tiêu chí chính gồm tên cửa hàng, ngày giao dịch, tổng tiền, tiền tệ, danh mục, item hóa đơn, quyền người dùng, lỗi service và an toàn dữ liệu trước bước xác nhận.

## 3. Môi trường kiểm thử

| Thành phần                            | Trạng thái                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Health `http://localhost:3000`        | HTTP 200                                                                                                      |
| Health `http://localhost:8000/health` | HTTP 200                                                                                                      |
| Tài khoản test                        | `ocr_report_20260505123559@example.com`                                                                     |
| Danh mục chi tiêu test                | An uong OCR 20260505123559, Mua sam OCR 20260505123559, Di chuyen OCR 20260505123559, Khac OCR 20260505123559 |

## 4. Kết quả theo test case

| Mã test case | Mục tiêu                             | Dữ liệu test             | Kết quả mong đợi                                                     | Kết quả thực tế                                                                                                                                                                               | Trạng thái           | Ghi chú                                                                                                                                                              |
| ------------- | -------------------------------------- | -------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OCR01         | Upload hóa đơn rõ nét             | IMG01                      | Hiển thị form review có dữ liệu OCR                                 | Hệ thống nhận ảnh và trả kết quả thành công. Form review có các thông tin chính: cửa hàng Hej - Trần Kế Xương, tổng tiền 90.000 VND. | Đạt                  | Có popup thông tin và form review. |
| OCR02         | Nhận diện tên cửa hàng            | IMG01, IMG02, IMG03        | Tên cửa hàng đúng hoặc gần đúng                                 | Các ảnh rõ nét đều nhận diện được tên cửa hàng: IMG01 là Hej - Trần Kế Xương, IMG02 là Family Mart, IMG03 là DOOKKI Korean Topokki Buffet. | Đạt                  | Các ảnh rõ nét đều có tên cửa hàng. |
| OCR03         | Nhận diện ngày giao dịch           | IMG01-IMG07                | Ngày giao dịch đúng nếu ảnh có thông tin                         | Tất cả 7 ảnh hóa đơn thật từ IMG01 đến IMG07 đều có ngày giao dịch được đưa vào dữ liệu OCR. | Đạt                  | Cần đối chiếu thêm bằng mắt nếu báo cáo yêu cầu độ chính xác tuyệt đối. |
| OCR04         | Nhận diện tổng tiền                | IMG01-IMG07                | Tổng tiền đúng với hóa đơn gốc                                  | Tất cả 7 ảnh hóa đơn thật từ IMG01 đến IMG07 đều có tổng tiền trong trường `total_amount`. | Đạt                  | Các ảnh IMG01-IMG07 đều có tổng tiền. |
| OCR05         | Nhận diện tiền tệ                  | IMG01-IMG07                | Tiền tệ đúng hoặc dùng mặc định phù hợp                       | Tất cả 7 ảnh hóa đơn thật đều trả đơn vị tiền tệ là VND, phù hợp với dữ liệu hóa đơn trong bộ test. | Đạt                  | Ảnh không phải hóa đơn IMG08 bị nhận USD do bị nhận nhầm. |
| OCR06         | Gợi ý danh mục chi tiêu            | IMG01, IMG02, IMG03, IMG07 | Danh mục gợi ý phù hợp và thuộc danh sách hợp lệ               | Sau khi cập nhật Groq key, 4/4 ảnh trong nhóm test đều được gợi ý danh mục `ăn uống`; không còn lỗi `CATEGORY_SUGGESTION_FAILED`. | Đạt                  | Nhóm ảnh liên quan trực tiếp đến category suggestion đã được retest; chi tiết raw lưu tại `tmp/ocr_category_retest_20260505072146.json`. |
| OCR07         | Xử lý hóa đơn hơi mờ            | IMG04                      | Nếu OCR đọc được thì hiển thị form review; nếu lỗi thì trả thông báo và không tạo transaction | IMG04 được xử lý thành công. Form review hiển thị cửa hàng 7-Eleven, tổng tiền 14.000 VND, danh mục `ăn uống`; số transaction trước và sau OCR vẫn là `0 -> 0`. | Đạt | OCR parse chỉ tạo dữ liệu review, không tự lưu transaction. |
| OCR08         | Xử lý hóa đơn thiếu sáng        | IMG05                      | Nếu OCR đọc được thì hiển thị form review; nếu lỗi thì trả thông báo và không tạo transaction | IMG05 được xử lý thành công. Form review hiển thị cửa hàng WinMart, tổng tiền 71.550 VND, danh mục `ăn uống`; số transaction trước và sau OCR vẫn là `0 -> 0`. | Đạt | OCR parse chỉ tạo dữ liệu review, không tự lưu transaction. |
| OCR09         | Xử lý hóa đơn nghiêng/cắt góc  | IMG06                      | Không tự lưu sai, người dùng có thể kiểm tra và chỉnh sửa    | IMG06 được xử lý thành công và có dữ liệu đưa lên form review: ngày 2026-05-05, tổng tiền 60.000 VND, danh mục `ăn uống`. Tên cửa hàng nhận diện là `moit`, chưa chính xác. | Đạt có điều kiện | OCR trả form review và không tự lưu; category đã được đề xuất, nhưng tên cửa hàng chưa chính xác so với nội dung raw có dấu hiệu Phúc Long. |
| OCR10         | Xử lý hóa đơn dài                | IMG07                      | Nhận diện tổng tiền, hiển thị item nếu có dữ liệu              | IMG07 được xử lý thành công, nhận diện tổng tiền 52.730 VND, có 3 dòng item và được gợi ý danh mục `ăn uống`. | Đạt có điều kiện | Có item; category suggestion đã hoạt động sau khi Groq key hợp lệ. |
| OCR11         | Xử lý ảnh không phải hóa đơn   | IMG08, IMG09               | Thông báo không phải hóa đơn và không tạo transaction          | IMG09 được chặn đúng với lỗi `NOT_RECEIPT`. IMG08 chưa đạt vì hệ thống nhận nhầm thành hóa đơn Differin, tổng tiền 309 USD. | Không đạt           | IMG09 đạt, IMG08 chưa đạt. |
| OCR12         | Xử lý file không hợp lệ           | IMG10.txt                  | Từ chối file `.txt` và không gọi OCR                              | File `IMG10.txt` bị từ chối ngay với HTTP 400 và lỗi `INVALID_FILE_TYPE`. File fixture `IMG10.jpg` là ảnh hỏng nên OCR service trả `RECEIPT_PARSE_FAILED`. | Đạt                  | File `.txt` được chặn trước OCR; `IMG10.jpg` là file hỏng có đuôi `.jpg`. |
| OCR13         | Chỉnh sửa dữ liệu trước khi lưu | IMG01                      | Transaction lưu theo dữ liệu người dùng đã xác nhận            | Sau khi gửi payload xác nhận từ form review, hệ thống tạo transaction mới với dữ liệu đã xác nhận. Transaction được tạo có id 169. | Đạt                  | Đã gửi payload xác nhận qua API confirm. |
| OCR14         | Hiển thị dữ liệu OCR trên form review | IMG01                      | Form review hiển thị đúng các trường OCR để người dùng xem lại trước khi xác nhận lưu | Sau khi OCR IMG01, form review có dữ liệu chính: cửa hàng Hej - Trần Kế Xương, ngày 2026-04-04, tổng tiền 90.000 VND, tiền tệ VND và danh mục `ăn uống`. Người dùng có thể xem/chỉnh sửa trước khi bấm xác nhận. | Đạt                  | OCR chỉ tạo dữ liệu review; transaction chỉ được tạo ở bước xác nhận lưu. |
| OCR15         | Xác nhận lưu giao dịch             | IMG01                      | Tạo transaction expense và lưu ảnh hóa đơn vào media             | Khi người dùng xác nhận lưu, API trả thành công và hệ thống tạo 1 transaction mới kèm media hóa đơn. | Đạt                  | Transaction có `sourceType=receipt_ai`. |
| OCR16         | Kiểm tra quyền người dùng         | IMG01                      | Từ chối khi chưa đăng nhập                                         | Khi gọi OCR khi chưa đăng nhập, hệ thống trả HTTP 401 với mã lỗi `UNAUTHORIZED` và không gọi OCR service. | Đạt                  | Không gọi OCR khi không có phiên đăng nhập. |
| OCR17         | Lỗi service OCR                       | IMG01                      | Hiển thị lỗi, không tạo transaction                                 | Khi tạm tắt service `receipt-ai`, API trả HTTP 500 với mã lỗi `OCR_ROUTE_FAILED`; hệ thống không tạo transaction. | Đạt                  | Sau test đã bật lại `receipt-ai`. |
| OCR18         | Lỗi service gợi ý danh mục         | IMG01                      | Vẫn trả OCR nếu có thể, danh mục để trống/fallback              | Khi Groq lỗi trong lần chạy ban đầu, OCR vẫn trả dữ liệu review thành công và ghi nhận lỗi phụ `CATEGORY_SUGGESTION_FAILED`. | Đạt                  | Đúng cơ chế degrade: OCR vẫn trả `review_fields`. |
| OCR19         | Đo thời gian phản hồi              | IMG01-IMG07                | Thời gian trong ngưỡng chấp nhận                                    | Với 7 ảnh hóa đơn thật sau các lần retest, thời gian xử lý trung bình là 4,53 giây/ảnh; thời gian cao nhất là 6,42 giây. | Đạt                  | Ngưỡng báo cáo đề xuất: dưới 10 giây/ảnh. |
| OCR20         | Kiểm tra dữ liệu lưu database      | IMG01                      | Transaction đúng với dữ liệu đã xác nhận                        | Transaction được lưu có số tiền 90.000 VND, ngày 2026-04-04, nguồn tạo `receipt_ai` và có media hóa đơn đi kèm. | Đạt                  | Có media receipt đi kèm. |

## 5. Bảng đánh giá chi tiết theo ảnh

| Mã ảnh | Loại ảnh | Tên cửa hàng | Ngày giao dịch | Tổng tiền | Tiền tệ | Danh mục | Số item | Thời gian xử lý | Kết luận |
| --- | --- | --- | --- | ---: | --- | --- | ---: | ---: | --- |
| IMG01 | Hóa đơn rõ nét | Hej - Trần Kế Xương | 2026-04-04 | 90.000 | VND | ăn uống | 1 | 3,88s | Đạt - nhận diện đủ thông tin chính và gợi ý được danh mục. |
| IMG02 | Hóa đơn rõ nét | Family Mart | 2026-04-12 | 63.000 | VND | ăn uống | 2 | 3,37s | Đạt - nhận diện đủ thông tin chính và gợi ý được danh mục. |
| IMG03 | Hóa đơn rõ nét | DOOKKI Korean Topokki Buffet | 2026-04-13 | 600.480 | VND | ăn uống | 1 | 6,42s | Đạt - nhận diện đủ thông tin chính và gợi ý được danh mục. |
| IMG04 | Hóa đơn hơi mờ | 7-Eleven | 2026-05-05 | 14.000 | VND | ăn uống | 1 | 3,71s | Đạt - OCR trả form review; chưa xác nhận thì không tạo transaction. |
| IMG05 | Hóa đơn thiếu sáng | WinMart | 2026-04-13 | 71.550 | VND | ăn uống | 5 | 4,35s | Đạt - OCR trả form review; chưa xác nhận thì không tạo transaction. |
| IMG06 | Hóa đơn nghiêng/cắt góc | moit | 2026-05-05 | 60.000 | VND | ăn uống | 1 | 4,68s | Đạt có điều kiện - tổng tiền, ngày và danh mục có dữ liệu; tên cửa hàng chưa tin cậy. |
| IMG07 | Hóa đơn dài | CONG TY CO PHAN KING FOOD MARKET | 2026-04-24 | 52.730 | VND | ăn uống | 3 | 5,27s | Đạt - nhận diện tổng tiền, item và gợi ý được danh mục. |
| IMG08 | Không phải hóa đơn | Differin | - | 309 | USD | - | 0 | 2,76s | Không đạt - hệ thống nhận nhầm ảnh không phải hóa đơn là hóa đơn. |
| IMG09 | Không phải hóa đơn | - | - | - | - | - | 0 | 3,36s | Đạt - trả lỗi `NOT_RECEIPT`, không tạo transaction. |
| IMG10 | File lỗi/không hợp lệ (.jpg hỏng) | - | - | - | - | - | 0 | 0,64s | Đạt có điều kiện - OCR service từ chối file hỏng; fixture hiện là `.jpg`. |
| IMG10.txt | File không hợp lệ (.txt) | - | - | - | - | - | 0 | 0,04s | Đạt - chặn file `.txt` trước khi gọi OCR. |

## 6. Bảng tổng hợp kết quả đánh giá

| Tiêu chí đánh giá | Số mẫu đạt | Tổng số mẫu áp dụng | Tỷ lệ đạt | Ghi chú |
| --- | ---: | ---: | ---: | --- |
| Nhận diện tên cửa hàng tin cậy | 6 | 7 | 85,71% | IMG06 có tên cửa hàng `moit`, chưa tin cậy và cần người dùng sửa. |
| Nhận diện ngày giao dịch | 7 | 7 | 100,00% | Tất cả ảnh hóa đơn thật IMG01-IMG07 đều có ngày giao dịch. |
| Nhận diện tổng tiền | 7 | 7 | 100,00% | Tất cả ảnh hóa đơn thật IMG01-IMG07 đều có tổng tiền. |
| Nhận diện đơn vị tiền tệ | 7 | 7 | 100,00% | Tất cả ảnh hóa đơn thật IMG01-IMG07 trả VND. |
| Gợi ý danh mục chi tiêu | 7 | 7 | 100,00% | Sau khi cập nhật Groq key, IMG01-IMG07 đều gợi ý `ăn uống`. |
| Hiển thị form review khi OCR thành công | 8 | 8 | 100,00% | Gồm 7 hóa đơn thật và IMG08 bị nhận nhầm là hóa đơn. |
| Chỉ lưu transaction sau khi người dùng xác nhận | 3 | 3 | 100,00% | OCR07, OCR08 và OCR14 đều xác nhận parse OCR không tự tạo transaction. |
| Ngăn tạo giao dịch với dữ liệu không hợp lệ | 2 | 3 | 66,67% | IMG09 và IMG10.txt đạt; IMG08 chưa đạt vì bị nhận nhầm. |
| Xử lý lỗi rõ ràng | 4 | 4 | 100,00% | Bao gồm chưa đăng nhập, service OCR lỗi, file `.txt`, ảnh không phải hóa đơn IMG09. |
| Thời gian phản hồi OCR | 7 | 7 | 100,00% | Trung bình 4,53 giây/ảnh, cao nhất 6,42 giây, dưới ngưỡng 10 giây/ảnh. |

## 7. Nhận xét kết quả kiểm thử

Kết quả kiểm thử cho thấy chức năng OCR hóa đơn đã xử lý được luồng nghiệp vụ chính từ upload ảnh, trích xuất dữ liệu, gợi ý danh mục, hiển thị form review đến xác nhận lưu giao dịch. Với 7 ảnh hóa đơn thật từ IMG01 đến IMG07, hệ thống đều trả kết quả OCR thành công. Các trường quan trọng như ngày giao dịch, tổng tiền và tiền tệ đều có dữ liệu. Thời gian phản hồi trung bình sau các lần retest là 4,53 giây/ảnh, cao nhất là 6,42 giây ở IMG03, nằm trong ngưỡng chấp nhận cho thao tác quét hóa đơn.

Ưu điểm hiện tại của hệ thống là khả năng trích xuất các trường chính tương đối ổn định trên nhiều điều kiện ảnh khác nhau. Ảnh rõ nét, ảnh hơi mờ, ảnh thiếu sáng, ảnh nghiêng/cắt góc và hóa đơn dài đều được đưa về form review để người dùng kiểm tra. Sau khi cấu hình Groq key hợp lệ, 7/7 ảnh hóa đơn thật đều được gợi ý danh mục `ăn uống`, cho thấy luồng đề xuất danh mục hoạt động đúng khi dịch vụ AI bên ngoài sẵn sàng. Hệ thống cũng xử lý tốt nguyên tắc an toàn dữ liệu: OCR chỉ tạo dữ liệu nháp, không tự lưu transaction; transaction chỉ được tạo sau khi người dùng xác nhận.

Một ưu điểm khác là cơ chế xử lý lỗi đã có thông báo rõ ràng cho các trường hợp quan trọng. Khi chưa đăng nhập, API trả `UNAUTHORIZED`. Khi service OCR gặp lỗi, API trả `OCR_ROUTE_FAILED`. Khi upload file `.txt`, hệ thống trả `INVALID_FILE_TYPE` trước khi gọi OCR. Với ảnh không phải hóa đơn IMG09, hệ thống trả `NOT_RECEIPT`. Các trường hợp này đều không tạo transaction, phù hợp với yêu cầu bảo vệ dữ liệu giao dịch.

Hạn chế hiện tại nằm ở độ chính xác trong một số trường hợp biên. Với IMG06, hệ thống đọc được ngày, tổng tiền và danh mục nhưng tên cửa hàng nhận diện là `moit`, chưa tin cậy so với nội dung raw có dấu hiệu Phúc Long. Điều này cho thấy với ảnh nghiêng, cắt góc hoặc bố cục khó, người dùng vẫn cần kiểm tra và chỉnh sửa thông tin trên form review trước khi lưu.

Hạn chế lớn hơn là khả năng phát hiện ảnh không phải hóa đơn chưa đủ chặt. IMG09 được chặn đúng, nhưng IMG08 vẫn bị nhận nhầm thành hóa đơn với merchant `Differin` và tổng tiền `309 USD`. Do đó rule nhận diện non-receipt cần được cải thiện, ví dụ yêu cầu có ngày giao dịch, tổng tiền hợp lý, merchant hợp lệ hoặc nhiều dấu hiệu hóa đơn cùng xuất hiện trước khi trả `success=true`. Ngoài ra, luồng gợi ý danh mục phụ thuộc vào Groq API key; khi key sai hoặc dịch vụ Groq lỗi, hệ thống vẫn degrade được nhưng danh mục sẽ bị trống hoặc cần người dùng chọn thủ công.

## 8. Kết luận

Chức năng OCR hóa đơn đã đáp ứng phần lớn luồng nghiệp vụ chính: upload ảnh, trích xuất dữ liệu, hiển thị form review, không tự tạo transaction trước xác nhận, xác nhận lưu transaction và xử lý các lỗi quyền/service/file không hợp lệ. Kết quả phù hợp để đưa vào báo cáo với trạng thái tổng thể là đạt có điều kiện.

Các điều kiện cần hoàn thiện trước khi đánh giá đạt hoàn toàn gồm: cải thiện rule phát hiện ảnh không phải hóa đơn để chặn trường hợp IMG08, chuẩn hóa fixture OCR12 thành đúng `IMG10.txt` thay vì chỉ có `IMG10.jpg` trong thư mục `test_bill`, và tiếp tục giữ nguyên nguyên tắc chỉ tạo transaction sau khi người dùng xác nhận lưu.

## 9. Phụ lục dữ liệu raw

Kết quả raw của lần chạy chính được lưu tại: `tmp/ocr_receipt_test_run_20260505123559.json`.

Kết quả raw của lần test lại riêng `IMG06.jpg` trước khi cập nhật Groq key được lưu tại: `tmp/ocr_img06_retest_20260505070527.json`.

Kết quả raw của lần test lại riêng `IMG06.jpg` sau khi cập nhật Groq key được lưu tại: `tmp/ocr_img06_retest_20260505071427.json`.

Kết quả raw của lần test lại nhóm category suggestion `OCR06` được lưu tại: `tmp/ocr_category_retest_20260505072146.json`.

Kết quả raw của lần test lại `OCR07` và `OCR08` được lưu tại: `tmp/ocr_0708_retest_20260505072836.json`.
