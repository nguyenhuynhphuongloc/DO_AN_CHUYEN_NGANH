# Architecture Overview

## High-Level Diagram

```text
Browser
  -> Frontend (Next.js, :3000)
    -> auth-service (:8001)
    -> finance-service (:8002)
    -> receipt-service (:8003)

receipt-service
  -> finance-service (:8002) during receipt confirmation

auth-service
  -> auth_db

finance-service
  -> finance_db

receipt-service
  -> receipt_db
  -> local uploads directory
```

## Services

### Frontend

- Technology: Next.js App Router + TypeScript + Tailwind CSS
- Main responsibility: user-facing screens for login, dashboard, transactions, receipt upload, and receipt review
- Main integration file: `microservices/frontend/lib/api.ts`

Routes:

- `/login`
- `/dashboard`
- `/transactions`
- `/receipts/upload`
- `/receipts/[id]/review`

### auth-service

- Technology: NestJS + Prisma
- Main responsibility: register, login, refresh token, profile
- Main endpoints:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `GET /auth/profile`

### finance-service

- Technology: NestJS + Prisma
- Main responsibility: wallets, categories, transactions, dashboard summary
- Main endpoints:
  - `GET /wallets`
  - `POST /wallets`
  - `GET /categories`
  - `GET /transactions`
  - `POST /transactions`
  - `GET /dashboard/summary`

### receipt-service

- Technology: FastAPI + SQLAlchemy
- Main responsibility: receipt upload, OCR, extraction, feedback, confirm-to-finance flow
- Main endpoints:
  - `POST /receipts/upload`
  - `GET /receipts/{id}`
  - `POST /receipts/{id}/parse`
  - `POST /receipts/{id}/feedback`
  - `POST /receipts/{id}/confirm`

## Communication Model

### Frontend to backend

- Browser calls services over REST.
- Public browser URLs use `NEXT_PUBLIC_*` variables.
- Server-side Next.js uses `INTERNAL_*` service URLs inside Docker.

### Service-to-service

- `receipt-service` calls `finance-service` via REST when a reviewed receipt is confirmed.

## Current Data Flow

### Authentication flow

1. Frontend sends login request to `auth-service`
2. `auth-service` validates user and returns access token + refresh token
3. Frontend stores tokens in local storage

Important note:

- JWT exists, but downstream services are not yet protected by user-aware auth middleware.
- `finance-service` and `receipt-service` still rely on default user IDs or shared data assumptions.

### Receipt-to-transaction flow

1. Frontend uploads a receipt image to `receipt-service`
2. `receipt-service` stores file metadata and local file path
3. Frontend triggers parse
4. `receipt-service` preprocesses image, runs PaddleOCR, stores OCR result, extracts structured fields, stores extraction
5. Frontend review page allows user edits and feedback
6. Frontend confirms receipt
7. `receipt-service` calls `finance-service` to create a transaction
8. `finance-service` updates wallet balance and stores transaction

## Operational Shape

Docker Compose startup order:

1. `auth-service`
2. `finance-service`
3. `receipt-service`
4. `frontend`

Health endpoints:

- `GET /health` on all three backend services

## Architectural Observations

### What is working

- Service boundaries are clear.
- Receipt flow is end-to-end functional.
- Each service owns its own database.
- Docker startup order is explicit and practical.

### What is still fragile

- Cross-service authentication is not enforced.
- Frontend stores auth tokens but does not use them for finance or receipt calls.
- Receipt parsing is synchronous and CPU-heavy.
- Receipt storage depends on local filesystem paths.
