# 6.3. Bộ test case của chức năng OCR hóa đơn

## 6.3.1. Mục tiêu kiểm thử

Chức năng OCR hóa đơn được xây dựng nhằm hỗ trợ người dùng chuyển ảnh hóa đơn thành giao dịch chi tiêu có cấu trúc. Vì vậy, quá trình kiểm thử không chỉ đánh giá khả năng đọc chữ từ ảnh, mà còn cần đánh giá toàn bộ luồng nghiệp vụ từ lúc người dùng tải ảnh lên đến khi giao dịch được xác nhận và lưu vào hệ thống.

Mục tiêu của bộ test case OCR gồm:

- Kiểm tra khả năng trích xuất các thông tin quan trọng từ ảnh hóa đơn, bao gồm tên cửa hàng, ngày giao dịch, tổng tiền, đơn vị tiền tệ và danh sách mặt hàng nếu có.
- Kiểm tra khả năng gợi ý danh mục chi tiêu dựa trên nội dung hóa đơn và danh sách danh mục hợp lệ của người dùng.
- Kiểm tra giao diện review để bảo đảm người dùng có thể xem lại, chỉnh sửa và xác nhận dữ liệu trước khi lưu.
- Kiểm tra hệ thống chỉ tạo giao dịch và lưu ảnh hóa đơn sau khi người dùng xác nhận.
- Kiểm tra khả năng xử lý các trường hợp đầu vào không lý tưởng như ảnh mờ, thiếu sáng, nghiêng, bị cắt góc hoặc không phải hóa đơn.
- Kiểm tra khả năng xử lý lỗi khi file đầu vào không hợp lệ hoặc dịch vụ OCR/AI bên ngoài gặp sự cố.

Các tiêu chí này phù hợp với đặc thù của chức năng OCR trong hệ thống, vì kết quả nhận diện ảnh có thể sai hoặc thiếu trong một số trường hợp thực tế. Do đó, cơ chế review-confirm đóng vai trò quan trọng để hạn chế việc lưu dữ liệu sai vào cơ sở dữ liệu.

## 6.3.2. Phạm vi kiểm thử

Phạm vi kiểm thử tập trung vào luồng xử lý chính của chức năng OCR hóa đơn:

```text
Người dùng tải ảnh lên
-> Hệ thống gửi ảnh đến API OCR
-> OCR trích xuất dữ liệu hóa đơn
-> AI gợi ý danh mục chi tiêu
-> Hệ thống hiển thị form review
-> Người dùng chỉnh sửa nếu cần
-> Người dùng xác nhận
-> Hệ thống lưu transaction và ảnh hóa đơn
```

Trong quy trình này, bước OCR chỉ có nhiệm vụ phân tích ảnh và tạo dữ liệu nháp để hiển thị trên form review. Hệ thống không được tự động tạo transaction sau khi OCR thành công. Transaction và media hóa đơn chỉ được tạo sau khi người dùng bấm xác nhận lưu. Nếu lỗi xảy ra ở bước OCR, hệ thống chỉ hiển thị thông báo lỗi và không tạo form lưu giao dịch; nếu lỗi xảy ra ở bước xác nhận lưu, hệ thống trả lỗi tại thời điểm người dùng bấm xác nhận và không được lưu dữ liệu không hoàn chỉnh.

Các thành phần được kiểm thử gồm:

| Thành phần                | Nội dung kiểm thử                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| Giao diện quét hóa đơn | Upload ảnh, hiển thị trạng thái xử lý, hiển thị kết quả OCR                   |
| API OCR trung gian          | Nhận ảnh, xác thực người dùng, gửi dữ liệu sang service OCR                    |
| Service OCR/AI              | Trích xuất dữ liệu hóa đơn và gợi ý danh mục chi tiêu                        |
| Form review                 | Hiển thị dữ liệu nhận diện, cho phép chỉnh sửa trước khi lưu                 |
| API xác nhận              | Kiểm tra dữ liệu sau review, lưu ảnh vào media, tạo transaction                   |
| Cơ sở dữ liệu           | Kiểm tra transaction được tạo đúng và không tạo dữ liệu khi chưa xác nhận |

## 6.3.3. Bộ dữ liệu kiểm thử

Bộ dữ liệu kiểm thử gồm 10 ảnh đầu vào, được chia thành nhiều nhóm để mô phỏng các tình huống sử dụng thực tế. Việc chia nhóm như vậy giúp đánh giá chức năng OCR ở cả trường hợp thuận lợi và trường hợp có rủi ro.

| Nhóm dữ liệu                                     | Số lượng | Mục đích kiểm thử                                                 |
| --------------------------------------------------- | ----------: | ---------------------------------------------------------------------- |
| Hóa đơn rõ nét                                 |           3 | Kiểm tra khả năng nhận diện trong điều kiện ảnh tốt          |
| Hóa đơn hơi mờ hoặc thiếu sáng              |           2 | Kiểm tra khả năng xử lý ảnh chất lượng thấp                  |
| Hóa đơn bị nghiêng hoặc bị cắt góc         |           1 | Kiểm tra khả năng xử lý bố cục ảnh không chuẩn               |
| Hóa đơn dài, nhiều dòng hàng                 |           1 | Kiểm tra khả năng nhận diện tổng tiền và danh sách mặt hàng |
| Ảnh không phải hóa đơn                        |           2 | Kiểm tra hệ thống có từ chối hoặc không tạo giao dịch sai    |
| File lỗi, sai định dạng hoặc dung lượng lớn |           1 | Kiểm tra validate file upload và xử lý lỗi                        |

Danh sách dữ liệu kiểm thử đề xuất:

| Mã dữ liệu | Loại dữ liệu               | Mô tả đầu vào                                                                      | Kết quả mong đợi                                                                              |
| ------------- | ----------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| IMG01         | Hóa đơn rõ nét           | Hóa đơn cửa hàng tiện lợi, ảnh đủ sáng, không bị nghiêng                  | Nhận diện đúng các trường chính                                                           |
| IMG02         | Hóa đơn rõ nét           | Hóa đơn siêu thị, bố cục rõ ràng                                               | Nhận diện đúng tổng tiền, ngày và gợi ý danh mục phù hợp                             |
| IMG03         | Hóa đơn rõ nét           | Hóa đơn quán ăn hoặc quán cà phê                                               | Nhận diện đúng thông tin hóa đơn và gợi ý danh mục ăn uống                          |
| IMG04         | Hóa đơn hơi mờ           | Ảnh chụp không thật nét nhưng vẫn đọc được bằng mắt thường              | Hệ thống không lỗi, nhận diện được một phần hoặc toàn bộ thông tin                 |
| IMG05         | Hóa đơn thiếu sáng       | Ảnh chụp trong điều kiện ánh sáng yếu                                           | Hệ thống xử lý được hoặc trả lỗi rõ ràng                                              |
| IMG06         | Hóa đơn nghiêng/cắt góc | Ảnh hóa đơn bị nghiêng hoặc mất một phần viền                                | Không tự động lưu dữ liệu sai, cho phép người dùng chỉnh sửa                         |
| IMG07         | Hóa đơn dài               | Hóa đơn có nhiều dòng mặt hàng                                                  | Nhận diện đúng tổng tiền, có thể nhận diện danh sách item nếu OCR hỗ trợ            |
| IMG08         | Không phải hóa đơn       | Ảnh đồ vật, ảnh màn hình hoặc ảnh không chứa thông tin hóa đơn           | Hệ thống thông báo đây không phải là ảnh hóa đơn hợp lệ và không tạo giao dịch |
| IMG09         | Không phải hóa đơn       | Ảnh văn bản thông thường không liên quan đến chi tiêu                        | Hệ thống thông báo đây không phải là ảnh hóa đơn hợp lệ và không tạo giao dịch |
| IMG10         | File không hợp lệ          | File `.txt` được tải lên với tên `IMG10.txt`, không phải định dạng ảnh | Hệ thống từ chối file, hiển thị thông báo file không hợp lệ và không gọi OCR        |

## 6.3.4. Tiêu chí đánh giá

Chức năng OCR được đánh giá theo nhiều tiêu chí, trong đó có cả độ chính xác dữ liệu, tính đúng đắn của nghiệp vụ và khả năng xử lý lỗi.

| Tiêu chí                              | Cách đánh giá                                                                         |
| --------------------------------------- | ----------------------------------------------------------------------------------------- |
| Độ chính xác tên cửa hàng        | So sánh tên cửa hàng OCR trả về với thông tin trên hóa đơn gốc               |
| Độ chính xác ngày giao dịch       | So sánh ngày nhận diện với ngày in trên hóa đơn                                 |
| Độ chính xác tổng tiền            | So sánh tổng tiền nhận diện với tổng tiền thực tế                               |
| Độ chính xác đơn vị tiền tệ    | Kiểm tra hệ thống nhận đúng hoặc gán đúng đơn vị tiền tệ mặc định       |
| Độ phù hợp của danh mục           | Kiểm tra danh mục AI gợi ý có phù hợp với nội dung hóa đơn hay không         |
| Khả năng hiển thị form review       | Kiểm tra dữ liệu OCR có được hiển thị để người dùng xem lại hay không     |
| Khả năng chỉnh sửa                  | Kiểm tra người dùng có thể sửa thông tin trước khi lưu hay không              |
| Tính an toàn dữ liệu                | Kiểm tra hệ thống không tạo transaction khi người dùng chưa xác nhận           |
| Khả năng xử lý ảnh không hợp lệ | Kiểm tra hệ thống không tạo giao dịch với ảnh không phải hóa đơn             |
| Thời gian phản hồi                   | Đo thời gian từ lúc upload ảnh đến lúc hiển thị kết quả OCR                   |
| Xử lý lỗi hệ thống                 | Kiểm tra thông báo lỗi khi API OCR/AI timeout, mất kết nối hoặc thiếu cấu hình |

Trong phạm vi báo cáo, có thể tập trung vào 5 trường dữ liệu quan trọng nhất:

```text
Tên cửa hàng, ngày giao dịch, tổng tiền, đơn vị tiền tệ, danh mục chi tiêu
```

Các trường này ảnh hưởng trực tiếp đến chất lượng giao dịch được tạo sau khi người dùng xác nhận.

## 6.3.5. Danh sách test case

| Mã test case | Chức năng kiểm thử                  | Dữ liệu đầu vào       | Các bước thực hiện                                                         | Kết quả mong đợi                                                                                          |
| ------------- | --------------------------------------- | -------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| OCR01         | Upload hóa đơn rõ nét              | IMG01                      | Vào trang quét hóa đơn, tải ảnh lên, bấm quét hóa đơn              | Hệ thống xử lý ảnh và hiển thị form review có dữ liệu OCR                                          |
| OCR02         | Nhận diện tên cửa hàng             | IMG01, IMG02, IMG03        | Upload ảnh hóa đơn rõ nét và so sánh kết quả với hóa đơn gốc     | Tên cửa hàng được nhận diện đúng hoặc gần đúng                                                  |
| OCR03         | Nhận diện ngày giao dịch            | IMG01 đến IMG07          | Upload từng hóa đơn và kiểm tra trường ngày                            | Ngày giao dịch đúng với ngày trên hóa đơn nếu ảnh có thông tin này                             |
| OCR04         | Nhận diện tổng tiền                 | IMG01 đến IMG07          | Upload từng hóa đơn và so sánh tổng tiền                                | Tổng tiền được nhận diện đúng với hóa đơn gốc                                                   |
| OCR05         | Nhận diện đơn vị tiền tệ         | IMG01 đến IMG07          | Kiểm tra trường currency sau khi OCR                                         | Đơn vị tiền tệ được nhận diện đúng hoặc dùng giá trị mặc định phù hợp                    |
| OCR06         | Gợi ý danh mục chi tiêu             | IMG01, IMG02, IMG03, IMG07 | Upload hóa đơn thuộc nhiều loại chi tiêu khác nhau                      | Danh mục gợi ý phù hợp với nội dung hóa đơn và thuộc danh sách hợp lệ                          |
| OCR07         | Xử lý hóa đơn hơi mờ             | IMG04                      | Upload ảnh hóa đơn hơi mờ                                                 | Nếu OCR đọc được, hệ thống hiển thị form review để người dùng chỉnh sửa/xác nhận; nếu lỗi, hiển thị thông báo và không tạo transaction |
| OCR08         | Xử lý hóa đơn thiếu sáng         | IMG05                      | Upload ảnh hóa đơn thiếu sáng                                             | Nếu OCR đọc được, hệ thống hiển thị form review để người dùng chỉnh sửa/xác nhận; nếu lỗi, hiển thị thông báo và không tạo transaction |
| OCR09         | Xử lý hóa đơn nghiêng/cắt góc   | IMG06                      | Upload ảnh hóa đơn không thẳng hoặc bị mất một phần                  | Hệ thống không tự lưu dữ liệu sau OCR; người dùng phải kiểm tra, chỉnh sửa và xác nhận trước khi transaction được tạo |
| OCR10         | Xử lý hóa đơn dài                 | IMG07                      | Upload hóa đơn có nhiều mặt hàng                                         | Hệ thống nhận diện được tổng tiền, hiển thị item nếu có dữ liệu                                |
| OCR11         | Xử lý ảnh không phải hóa đơn    | IMG08, IMG09               | Upload ảnh hợp lệ nhưng không chứa thông tin hóa đơn                  | Hệ thống hiển thị thông báo đây không phải là ảnh hóa đơn hợp lệ và không tạo transaction |
| OCR12         | Xử lý file không hợp lệ            | IMG10.txt                  | Upload file `.txt` vào chức năng OCR hóa đơn                            | Hệ thống từ chối file, hiển thị lỗi định dạng file không hợp lệ và không gọi OCR              |
| OCR13         | Chỉnh sửa dữ liệu trước khi lưu  | IMG01                      | OCR ảnh, sửa số tiền hoặc danh mục trên form review, sau đó xác nhận | Transaction được lưu theo dữ liệu người dùng đã chỉnh sửa                                        |
| OCR14         | Không xác nhận sau OCR               | IMG01                      | OCR ảnh, xem kết quả, thoát khỏi màn hình mà không xác nhận          | Hệ thống không tạo transaction và không lưu ảnh vào media                                            |
| OCR15         | Xác nhận lưu giao dịch              | IMG01                      | OCR ảnh, kiểm tra dữ liệu, bấm xác nhận                                  | Hệ thống tạo transaction loại expense và lưu ảnh hóa đơn vào media                                 |
| OCR16         | Kiểm tra quyền người dùng          | IMG01                      | Thực hiện OCR khi chưa đăng nhập hoặc phiên đăng nhập hết hạn      | Hệ thống từ chối thao tác và yêu cầu đăng nhập                                                     |
| OCR17         | Lỗi service OCR                        | IMG01                      | Mô phỏng service OCR bị timeout hoặc không phản hồi                      | Hệ thống hiển thị lỗi, không tạo transaction                                                           |
| OCR18         | Lỗi service gợi ý danh mục          | IMG01                      | Mô phỏng lỗi Groq AI hoặc tắt gợi ý danh mục                            | Hệ thống vẫn trả kết quả OCR nếu có thể, danh mục có thể để trống hoặc dùng mặc định      |
| OCR19         | Đo thời gian phản hồi               | IMG01 đến IMG07          | Ghi nhận thời gian từ lúc upload đến lúc có kết quả OCR               | Thời gian phản hồi nằm trong ngưỡng chấp nhận được                                                 |
| OCR20         | Kiểm tra dữ liệu lưu trong database | IMG01                      | OCR, xác nhận lưu, kiểm tra transaction trong database                      | Dữ liệu transaction đúng với dữ liệu đã xác nhận trên form review                                 |

## 6.3.6. Mẫu bảng ghi nhận kết quả kiểm thử

Khi thực hiện kiểm thử, kết quả từng test case có thể được ghi nhận theo mẫu sau:

| Mã test case | Mục tiêu                   | Dữ liệu test | Kết quả mong đợi                                                            | Kết quả thực tế                                                  | Trạng thái           | Ghi chú                      |
| ------------- | ---------------------------- | -------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------- | ----------------------------- |
| OCR01         | Upload hóa đơn rõ nét   | IMG01          | Hiển thị form review có dữ liệu OCR                                        | Hệ thống hiển thị đầy đủ dữ liệu                           | Đạt                  |                               |
| OCR04         | Nhận diện tổng tiền      | IMG01          | Tổng tiền đúng với hóa đơn gốc                                         | Tổng tiền nhận diện đúng                                       | Đạt                  |                               |
| OCR06         | Gợi ý danh mục            | IMG01, IMG02, IMG03, IMG07 | Gợi ý danh mục phù hợp với nội dung hóa đơn và thuộc danh sách hợp lệ | 4/4 ảnh trong nhóm test trả danh mục `ăn uống` sau khi Groq key hợp lệ | Đạt                  | Kiểm tra trực tiếp nhóm ảnh liên quan category suggestion |
| OCR07         | Ảnh hơi mờ                | IMG04          | OCR chỉ tạo form review, không tự lưu transaction                         | Nhận diện được 7-Eleven, tổng tiền 14.000 VND; transaction không tăng nếu chưa xác nhận | Đạt                  | Cần người dùng xác nhận trước khi lưu |
| OCR11         | Ảnh không phải hóa đơn | IMG08          | Hiển thị thông báo không phải ảnh hóa đơn và không tạo transaction | Hệ thống hiển thị thông báo phù hợp, không tạo transaction | Đạt                  |                               |

Trạng thái kiểm thử có thể sử dụng các giá trị:

| Trạng thái           | Ý nghĩa                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| Đạt                  | Kết quả thực tế đúng với kết quả mong đợi                                              |
| Không đạt           | Kết quả thực tế sai hoặc hệ thống gặp lỗi không mong muốn                              |
| Đạt có điều kiện | Hệ thống xử lý được nhưng cần người dùng chỉnh sửa hoặc kết quả chưa đầy đủ |
| Không áp dụng       | Test case không phù hợp với dữ liệu đang kiểm thử                                        |

## 6.3.7. Bảng đánh giá chi tiết theo ảnh

Bảng này dùng để đánh giá độ chính xác OCR trên từng ảnh hóa đơn. Với ảnh không phải hóa đơn, các trường nhận diện có thể ghi là "Không áp dụng", nhưng cần kiểm tra hệ thống có ngăn việc tạo transaction sai hay không.

| Mã ảnh  | Loại ảnh                    | Tên cửa hàng  | Ngày giao dịch | Tổng tiền      | Tiền tệ        | Danh mục        | Thời gian xử lý | Kết luận                                           |
| --------- | ----------------------------- | ---------------- | ---------------- | ---------------- | ---------------- | ---------------- | -----------------: | ---------------------------------------------------- |
| IMG01     | Hóa đơn rõ nét           | Đúng           | Đúng           | Đúng           | Đúng           | Đúng           |          ... giây | Đạt                                                |
| IMG02     | Hóa đơn rõ nét           | Đúng           | Đúng           | Đúng           | Đúng           | Đúng/Sai       |          ... giây | ...                                                  |
| IMG03     | Hóa đơn rõ nét           | Đúng           | Đúng           | Đúng           | Đúng           | Đúng/Sai       |          ... giây | ...                                                  |
| IMG04     | Hóa đơn hơi mờ           | Đúng/Sai       | Đúng/Sai       | Đúng/Sai       | Đúng/Sai       | Đúng/Sai       |          ... giây | ...                                                  |
| IMG05     | Hóa đơn thiếu sáng       | Đúng/Sai       | Đúng/Sai       | Đúng/Sai       | Đúng/Sai       | Đúng/Sai       |          ... giây | ...                                                  |
| IMG06     | Hóa đơn nghiêng/cắt góc | Đúng/Sai       | Đúng/Sai       | Đúng/Sai       | Đúng/Sai       | Đúng/Sai       |          ... giây | ...                                                  |
| IMG07     | Hóa đơn dài               | Đúng/Sai       | Đúng/Sai       | Đúng/Sai       | Đúng/Sai       | Đúng/Sai       |          ... giây | ...                                                  |
| IMG08     | Không phải hóa đơn       | Không áp dụng | Không áp dụng | Không áp dụng | Không áp dụng | Không áp dụng |          ... giây | Báo không phải hóa đơn, không tạo giao dịch |
| IMG09     | Không phải hóa đơn       | Không áp dụng | Không áp dụng | Không áp dụng | Không áp dụng | Không áp dụng |          ... giây | Báo không phải hóa đơn, không tạo giao dịch |
| IMG10.txt | File lỗi/không hợp lệ     | Không áp dụng | Không áp dụng | Không áp dụng | Không áp dụng | Không áp dụng |          ... giây | Từ chối file `.txt`, không gọi OCR             |

## 6.3.8. Bảng tổng hợp kết quả đánh giá

Sau khi kiểm thử từng ảnh, kết quả có thể được tổng hợp theo tiêu chí để dễ đưa vào báo cáo.

| Tiêu chí đánh giá                           | Số mẫu đạt | Tổng số mẫu áp dụng | Tỷ lệ đạt |
| ------------------------------------------------ | -------------: | -----------------------: | ------------: |
| Nhận diện đúng tên cửa hàng               |            ... |                        7 |          ...% |
| Nhận diện đúng ngày giao dịch              |            ... |                        7 |          ...% |
| Nhận diện đúng tổng tiền                   |            ... |                        7 |          ...% |
| Nhận diện đúng đơn vị tiền tệ           |            ... |                        7 |          ...% |
| Gợi ý đúng danh mục chi tiêu               |            ... |                        7 |          ...% |
| Hiển thị form review                           |            ... |                       10 |          ...% |
| Cho phép chỉnh sửa trước khi lưu           |            ... |                       10 |          ...% |
| Chỉ lưu transaction sau khi xác nhận         |            ... |                       10 |          ...% |
| Không tạo giao dịch với ảnh không hợp lệ |            ... |                        3 |          ...% |
| Xử lý lỗi rõ ràng                           |            ... |                        3 |          ...% |

Công thức tính tỷ lệ đạt:

```text
Tỷ lệ đạt = Số mẫu đạt / Tổng số mẫu áp dụng * 100%
```

Đối với độ chính xác OCR tổng thể, có thể tính theo số trường nhận diện đúng:

```text
Độ chính xác OCR tổng thể = Số trường nhận diện đúng / Tổng số trường cần đánh giá * 100%
```

Ví dụ, nếu kiểm thử 7 ảnh hóa đơn thật và mỗi ảnh đánh giá 5 trường chính:

```text
Tổng số trường cần đánh giá = 7 * 5 = 35 trường
```

Nếu hệ thống nhận diện đúng 29 trường:

```text
Độ chính xác OCR tổng thể = 29 / 35 * 100% = 82.86%
```

## 6.3.9. Cách thực hiện kiểm thử

Quy trình kiểm thử thủ công được thực hiện như sau:

1. Chuẩn bị 10 file ảnh theo danh sách dữ liệu kiểm thử.
2. Đăng nhập vào hệ thống bằng tài khoản người dùng hợp lệ.
3. Truy cập màn hình quét hóa đơn.
4. Tải từng ảnh lên hệ thống và thực hiện thao tác quét hóa đơn.
5. Ghi nhận thời gian xử lý từ lúc gửi ảnh đến lúc hiển thị kết quả OCR.
6. So sánh dữ liệu OCR với hóa đơn gốc theo các trường tên cửa hàng, ngày giao dịch, tổng tiền, tiền tệ và danh mục.
7. Kiểm tra form review có cho phép chỉnh sửa dữ liệu hay không.
8. Với một số ảnh, thực hiện chỉnh sửa dữ liệu rồi xác nhận lưu.
9. Kiểm tra transaction được tạo trong hệ thống có đúng với dữ liệu đã xác nhận hay không.
10. Với ảnh không phải hóa đơn hoặc file lỗi, kiểm tra hệ thống có ngăn việc tạo transaction sai hay không.

Khi cần kiểm thử lỗi từ dịch vụ bên ngoài, có thể thực hiện bằng cách tạm thời cấu hình sai URL service OCR, tắt service OCR hoặc mô phỏng timeout. Kết quả mong đợi là hệ thống hiển thị lỗi rõ ràng và không tạo transaction trong cơ sở dữ liệu.

## 6.3.10. Nhận xét kết quả kiểm thử

Sau khi hoàn thành kiểm thử, phần nhận xét có thể trình bày theo hướng sau:

> Kết quả kiểm thử cho thấy chức năng OCR hoạt động tốt với các ảnh hóa đơn rõ nét, đặc biệt ở các trường quan trọng như tổng tiền, ngày giao dịch và đơn vị tiền tệ. Với các ảnh có chất lượng thấp như ảnh mờ, thiếu sáng hoặc bị nghiêng, hệ thống vẫn có thể trả về kết quả nhưng một số trường như tên cửa hàng hoặc danh mục chi tiêu có thể cần người dùng chỉnh sửa. Điều này phù hợp với đặc thù của bài toán OCR, vì chất lượng ảnh đầu vào ảnh hưởng trực tiếp đến độ chính xác nhận diện.

> Đối với các ảnh không phải hóa đơn hoặc file không hợp lệ, hệ thống không tạo giao dịch tự động, giúp hạn chế dữ liệu sai trong cơ sở dữ liệu. Ngoài ra, cơ chế review-confirm cho phép người dùng kiểm tra và chỉnh sửa thông tin trước khi lưu, giúp tăng độ tin cậy của giao dịch được tạo từ ảnh hóa đơn.

> Nhìn chung, chức năng OCR đáp ứng được mục tiêu hỗ trợ nhập nhanh giao dịch chi tiêu từ hóa đơn. Tuy nhiên, hệ thống vẫn cần người dùng xác nhận trước khi lưu để đảm bảo tính chính xác, đặc biệt trong các trường hợp ảnh đầu vào có chất lượng không tốt hoặc hóa đơn có bố cục phức tạp.

## 6.3.11. Kết luận

Bộ test case OCR cần đánh giá cả độ chính xác nhận diện và tính đúng đắn của luồng nghiệp vụ. Nếu chỉ kiểm tra hệ thống có đọc được ảnh hay không thì chưa đủ, vì chức năng OCR trong đề tài còn liên quan đến việc gợi ý danh mục, tạo form review, xác nhận dữ liệu và lưu transaction.

Do đó, bộ test được thiết kế theo ba nhóm chính:

- Nhóm kiểm thử độ chính xác OCR với các ảnh hóa đơn thật.
- Nhóm kiểm thử trải nghiệm và nghiệp vụ review-confirm.
- Nhóm kiểm thử xử lý lỗi và an toàn dữ liệu với ảnh không hợp lệ hoặc dịch vụ bên ngoài gặp sự cố.

Cách đánh giá này giúp phản ánh đầy đủ chất lượng của chức năng OCR trong điều kiện sử dụng thực tế và phù hợp để trình bày trong chương kết quả thực nghiệm và kiểm thử của báo cáo.
