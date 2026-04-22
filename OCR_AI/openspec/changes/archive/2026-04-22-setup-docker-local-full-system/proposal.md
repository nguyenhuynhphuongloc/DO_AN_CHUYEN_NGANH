## Why

Repository hiện có OCR backend chạy bằng Docker nhưng frontend, `auth-service`, và `finance-service` vẫn phải khởi động thủ công bằng nhiều terminal và phụ thuộc trực tiếp vào máy local. Điều đó làm local onboarding chậm, dễ lệch môi trường, và chưa có một entrypoint Docker thống nhất để khởi động toàn bộ hệ thống theo đúng kiến trúc hiện tại.

## What Changes

- Thêm một local Docker orchestration flow để khởi động frontend, `auth-service`, `finance-service`, và OCR backend từ một cấu hình `docker compose` thống nhất.
- Định nghĩa cách build hoặc chạy từng service trong container nhưng vẫn giữ đúng boundary hiện tại: `auth-service` dùng `auth_db`, `finance-service` dùng `finance_db`, OCR vẫn stateless.
- Bổ sung env template, networking, volume, dependency order, và local startup commands cho Docker-based development.
- Cập nhật tài liệu local run để ưu tiên Docker full-stack thay cho quy trình mở nhiều terminal và chạy thủ công từng service.
- **BREAKING** Đổi local developer workflow mặc định từ “chạy riêng lẻ từng service bằng lệnh tay” sang một Docker local startup path chuẩn hóa cho toàn hệ thống.

## Capabilities

### New Capabilities
- `docker-local-system-run`: Cung cấp một Docker local stack có thể dựng và chạy toàn bộ hệ thống phát triển từ một entrypoint thống nhất.

### Modified Capabilities
- `receipt-ocr-developer-docs`: Cập nhật local setup và integration docs để mô tả Docker-based startup flow cho frontend, auth-service, finance-service, và OCR backend.

## Impact

- Root-level Docker artifacts như `docker-compose.yml`, service Dockerfiles, `.dockerignore`, hoặc script bootstrap liên quan
- Env strategy cho frontend và microservices khi chạy trong container
- Tài liệu local development và startup flow trong `docs/` và các README liên quan
- Khả năng health-check, dependency startup order, và developer commands cho toàn bộ stack local
