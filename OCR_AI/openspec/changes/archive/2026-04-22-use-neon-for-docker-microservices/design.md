## Context

Repo hiện có hai chế độ database khác nhau:

- manual microservice run: `auth-service` và `finance-service` tự load `.env` riêng trong thư mục service và có thể trỏ tới Neon
- root Docker run: `docker-compose.yml` inject database URLs nội bộ trỏ tới service `postgres` local

Điều này làm cùng một application behavior nhưng khác persistence target tùy cách khởi động. Với yêu cầu mới, Docker local không còn là môi trường database riêng biệt mà phải phản chiếu database topology đang dùng thực tế: `auth-service` và `finance-service` cùng chạy trong container nhưng tiếp tục sở hữu connection string riêng từ env của chính chúng.

Ràng buộc cần giữ:

- root Docker stack vẫn là entrypoint khởi động thống nhất cho frontend, OCR runtime, auth, và finance
- `auth-service` vẫn chỉ dùng `AUTH_DATABASE_URL`
- `finance-service` vẫn chỉ dùng `FINANCE_DATABASE_URL`
- root `.env` không trở thành nơi duplicate Neon connection strings của từng service
- thay đổi chỉ chạm orchestration và docs, không đổi business logic hay schema ownership

## Goals / Non-Goals

**Goals:**

- Làm cho root Docker stack lưu dữ liệu của auth và finance trực tiếp vào Neon.
- Giữ service-local ownership của database connection strings bằng cách dùng `.env` riêng của từng service.
- Loại bỏ giả định bắt buộc rằng Docker local stack phải bootstrap local PostgreSQL cho auth và finance.
- Làm rõ tài liệu về file env nào phục vụ command nào.

**Non-Goals:**

- Thay đổi endpoint contract, migration logic, hay domain schema của `auth-service` hoặc `finance-service`.
- Thay OCR runtime sang lưu dữ liệu vào database.
- Thiết kế production deployment mới ngoài phạm vi local Docker orchestration.
- Gộp toàn bộ env files thành một file duy nhất cho mọi runtime.

## Decisions

### 1. Root compose sẽ nạp service-local env files cho auth và finance

Root Docker stack nên dùng `env_file` hoặc wiring tương đương để container `auth-service` đọc `microservices/auth-service/.env` và `finance-service` đọc `microservices/finance-service/.env`. Điều này giữ source of truth cho database URLs nằm cùng service đang tiêu thụ chúng.

Alternative considered: copy `AUTH_DATABASE_URL` và `FINANCE_DATABASE_URL` lên root `.env`.
Rejected vì tạo duplicate secrets, tăng nguy cơ drift, và đi ngược cấu trúc loader hiện có của từng microservice.

### 2. Docker local contract sẽ chuyển từ local Postgres dependency sang external Neon dependency

`auth-service` và `finance-service` trong root stack sẽ dùng Neon URLs như manual mode thay vì URLs nội bộ `@postgres:5432/...`. Root Docker stack vì thế không còn cần PostgreSQL container để phục vụ hai service này.

Alternative considered: giữ local Postgres container làm default và thêm một mode Neon tùy chọn.
Rejected vì người dùng đã xác định rõ Docker runtime phải lưu lên Neon, nên dual-mode trong cùng stack sẽ làm contract mơ hồ hơn.

### 3. Root `.env` chỉ giữ orchestrator-level variables

Root `.env` nên tiếp tục chứa các biến orchestration như ports, frontend `VITE_*`, OCR secrets, và flags chung; nó không nên chứa lại connection strings của auth/finance nếu chính các service đã có env files riêng.

Alternative considered: root `.env` trở thành nguồn env duy nhất cho toàn bộ stack.
Rejected vì frontend Docker runtime, OCR runtime, và microservices có phạm vi env khác nhau; ép một file duy nhất sẽ làm tăng coupling và rủi ro lộ secrets.

### 4. Docs phải coi service-local env files là prerequisite của Docker startup

Vì root `docker compose up` sẽ phụ thuộc vào `microservices/auth-service/.env` và `microservices/finance-service/.env`, tài liệu phải nêu rõ điều này thay vì chỉ yêu cầu root `.env`.

Alternative considered: giữ docs hiện tại và xem service env files như chi tiết implementation.
Rejected vì sẽ dẫn tới container fail-to-start khó hiểu khi developer chỉ cấu hình root `.env`.

## Risks / Trade-offs

- [Docker startup giờ phụ thuộc network tới Neon] -> Mitigation: tài liệu hóa prerequisite mạng và failure modes khi Neon unreachable.
- [Service-local `.env` thiếu hoặc sai giá trị sẽ làm container fail sớm] -> Mitigation: bổ sung docs và env examples rõ ràng, ưu tiên startup errors dễ hiểu.
- [Nếu `AUTH_AUTO_MIGRATE` hoặc `FINANCE_AUTO_MIGRATE` bật trong Docker, migrations sẽ chạy trực tiếp lên Neon] -> Mitigation: làm rõ default flags và khuyến nghị sử dụng trong docs.
- [Một số artifact cũ vẫn giả định local PostgreSQL trong Docker stack] -> Mitigation: cập nhật đồng bộ spec và docs để contract mới nhất chỉ còn Neon-backed Docker flow.

## Migration Plan

1. Cập nhật proposal/spec contract để Docker local stack chính thức dùng Neon cho auth và finance.
2. Chỉnh Docker compose wiring để auth/finance containers đọc env từ thư mục service và không còn dùng local `postgres` URLs.
3. Xác định số phận của `postgres` service trong root compose: bỏ hẳn nếu không còn consumer, hoặc giữ chỉ khi còn phục vụ mục đích khác đã được tài liệu hóa.
4. Cập nhật `.env.example`, service `.env.example`, và docs để phản ánh source of truth mới.
5. Xác minh root Docker startup lưu dữ liệu auth/finance lên Neon theo connection strings của từng service.

Rollback strategy: khôi phục root compose về wiring local PostgreSQL trước đây và trả Docker docs về local-DB contract cũ.

## Open Questions

- Root `postgres` service có còn consumer nào sau khi auth/finance chuyển sang Neon, hay nên xóa hoàn toàn khỏi stack?
- Docker startup có nên fail cứng nếu service-local `.env` thiếu file, hay có nên giữ fallback behavior rõ ràng cho developer?
