## Why

Root Docker stack hiện tại khởi động được toàn hệ thống nhưng ép `auth-service` và `finance-service` lưu dữ liệu vào PostgreSQL container local thay vì Neon. Điều đó lệch với môi trường dữ liệu mà nhóm đang muốn dùng và tạo ra hai mô hình database khác nhau giữa Docker run và manual service run.

## What Changes

- Thay đổi Docker local orchestration để `auth-service` và `finance-service` chạy trong container nhưng kết nối trực tiếp tới Neon thay vì PostgreSQL container local.
- Chuẩn hóa việc lấy `AUTH_DATABASE_URL` từ `microservices/auth-service/.env` và `FINANCE_DATABASE_URL` từ `microservices/finance-service/.env` khi khởi động root Docker stack.
- Cập nhật Docker env wiring để secrets và connection strings của từng microservice tiếp tục nằm trong service-local env files thay vì phải copy lên root `.env`.
- Cập nhật tài liệu local run để phân biệt rõ root Docker env, service-local env, và biến nào là bắt buộc cho Docker + Neon.
- **BREAKING** Root Docker local stack không còn đảm bảo một local PostgreSQL dependency mặc định cho `auth-service` và `finance-service`; network access tới Neon và service-local database env trở thành điều kiện khởi động chuẩn.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `docker-local-system-run`: Thay đổi contract của root Docker local stack từ local PostgreSQL bootstrap sang Neon-backed runtime cho `auth-service` và `finance-service`, với database URLs lấy từ `.env` của từng service.
- `receipt-ocr-developer-docs`: Thay đổi tài liệu để mô tả Docker local flow dùng Neon-backed microservices, service-local env files, và các prerequisite tương ứng.

## Impact

- Root [docker-compose.yml](/d:/School_Proj/DO_AN_CHUYEN_NGANH/OCR_AI/docker-compose.yml) và Docker wiring của `auth-service` và `finance-service`
- Service-local env strategy trong `microservices/auth-service/.env` và `microservices/finance-service/.env`
- Root `.env` / `.env.example` và cách tài liệu phân vai các file env
- Tài liệu local run trong `docs/` và README liên quan tới Docker startup
