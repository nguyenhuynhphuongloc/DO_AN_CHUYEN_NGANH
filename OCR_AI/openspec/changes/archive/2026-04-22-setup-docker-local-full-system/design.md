## Context

Repo hiện có một stack cục bộ không đồng đều:

- OCR backend đã có `backend/receipt-ocr/docker-compose.yml` riêng cho n8n
- frontend chạy bằng `npm run dev`
- `auth-service` và `finance-service` chạy bằng Node trực tiếp
- database URLs hiện được cấu hình qua env của từng service và thường trỏ ra ngoài Docker

Điều đó khiến local setup cần nhiều terminal, nhiều bước thủ công, và không có một contract vận hành duy nhất cho developer mới. Với mục tiêu “Docker khởi động toàn bộ hệ thống”, change này là thay đổi cross-cutting vì chạm vào frontend, OCR runtime, hai microservice, local database strategy, env wiring, và tài liệu vận hành.

Ràng buộc kiến trúc vẫn giữ nguyên:

- `auth-service` vẫn sở hữu `auth_db`
- `finance-service` vẫn sở hữu `finance_db`
- OCR vẫn stateless, không thêm persistence riêng
- confirmed invoice fields vẫn được lưu vào `finance_db.transactions`

## Goals / Non-Goals

**Goals:**

- Cung cấp một Docker local stack có thể dựng toàn bộ hệ thống bằng một entrypoint thống nhất.
- Đóng gói frontend, `auth-service`, `finance-service`, OCR n8n, và local PostgreSQL networking trong cùng một development workflow.
- Giữ nguyên service boundaries và database ownership của kiến trúc hiện tại khi chuyển sang Docker local.
- Chuẩn hóa env, ports, startup order, health-checks, và local docs cho Docker-based development.

**Non-Goals:**

- Thay đổi business logic của frontend, OCR flow, auth-service, hoặc finance-service.
- Thêm OCR persistence, receipt tables, hoặc bất kỳ database/service mới ngoài nhu cầu local orchestration.
- Thay đổi schema domain đã cố định của `auth_db` và `finance_db`.
- Thiết kế production deployment stack; change này chỉ nhắm vào local development.

## Decisions

### 1. Dùng một `docker-compose.yml` ở root làm local entrypoint chuẩn

Thay vì giữ Docker chỉ riêng cho OCR backend, hệ thống sẽ có một root compose file để đưa toàn bộ stack local lên bằng một lệnh. Đây là điểm vào chuẩn cho developer workflow.

Alternative considered: tiếp tục giữ compose riêng cho OCR và viết script shell để chạy các process còn lại.
Rejected vì cách đó vẫn phân mảnh orchestration và không thật sự tạo ra một Docker local system-wide workflow.

### 2. Dùng PostgreSQL local trong Docker và tạo riêng `auth_db` + `finance_db`

Để “khởi động toàn bộ hệ thống” không còn phụ thuộc vào Neon hoặc database ngoài máy local, stack sẽ chạy một PostgreSQL container cục bộ. Logical database separation vẫn được giữ bằng cách tạo hai database `auth_db` và `finance_db` bên trong local PostgreSQL server.

Alternative considered: giữ `AUTH_DATABASE_URL` và `FINANCE_DATABASE_URL` trỏ Neon từ bên trong containers.
Rejected vì vẫn phụ thuộc hạ tầng ngoài và không đáp ứng tốt use case local full-system startup.

### 3. Mỗi Node-based service có Dockerfile riêng cho development

Frontend, `auth-service`, và `finance-service` sẽ có Dockerfile dev-focused để cài dependency, mount source code, và chạy lệnh phù hợp trong container. Điều này tách biệt rõ build/runtime concerns cho từng app thay vì nhồi mọi thứ vào một container.

Alternative considered: một container Node chung chạy nhiều process.
Rejected vì làm mờ service boundaries, khó debug, và đi ngược kiến trúc microservice hiện có.

### 4. OCR n8n được đưa vào root compose thay vì buộc developer khởi động compose lồng nhau

Root stack cần kiểm soát OCR runtime để developer chỉ cần một lệnh. Về implementation có thể reuse cùng env/volumes/workflow import logic hiện tại, nhưng orchestration surface cho developer phải là một compose root duy nhất.

Alternative considered: dùng `docker compose` thứ hai cho OCR rồi tài liệu hóa 2 lệnh.
Rejected vì trái với mục tiêu “khởi động toàn bộ hệ thống” bằng một local entrypoint.

### 5. Docker docs trở thành local workflow mặc định, nhưng vẫn phân biệt local DB với production-style env

Docs sẽ mô tả rõ Docker local dùng PostgreSQL container để phục vụ development, còn service ownership vẫn là `auth_db` và `finance_db`. Tài liệu phải tránh ngôn ngữ nhập nhằng giữa application service, database server, và logical database.

Alternative considered: chỉ thêm compose file và giữ docs manual run làm chính.
Rejected vì onboarding vẫn dễ lệch hướng và developer khó biết workflow nào là chuẩn.

## Risks / Trade-offs

- [Docker local env khác với Neon env hiện tại] → Mitigation: tách rõ local Docker env templates và giải thích mapping sang `AUTH_DATABASE_URL` / `FINANCE_DATABASE_URL`.
- [Hot reload hoặc file watching trong container có thể chậm trên Windows] → Mitigation: design tasks cần chọn volume mount và dev commands phù hợp, kèm docs troubleshooting.
- [Compose root có thể trùng port với local services đang chạy tay] → Mitigation: cố định port strategy và tài liệu hóa rõ các cổng mặc định.
- [PostgreSQL container phải tạo đúng cả `auth_db` lẫn `finance_db`] → Mitigation: thêm init scripts hoặc bootstrap step rõ ràng và có task xác minh migration flow cho từng service.

## Migration Plan

1. Thêm root Docker artifacts cho local stack và Dockerfiles cho các service cần container hóa.
2. Thêm local PostgreSQL bootstrap để tạo `auth_db` và `finance_db`.
3. Wire env cho frontend, `auth-service`, `finance-service`, và OCR runtime trong Docker network.
4. Cập nhật docs để local startup mặc định dùng `docker compose up`.
5. Xác minh toàn bộ flow local: login/register, OCR upload, confirmed transaction save.

Rollback strategy: nếu Docker stack chưa ổn định, developer vẫn có thể quay lại manual startup path hiện có cho tới khi change được hoàn thiện; rollback chủ yếu là file-level removal của Docker artifacts mới.

## Open Questions

- Không có blocker ở mức proposal. Chi tiết implementation như exact service names, volume strategy, và live-reload command có thể được chốt trong phase áp dụng change.
