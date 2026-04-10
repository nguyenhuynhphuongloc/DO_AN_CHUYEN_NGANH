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
  -> receipt-worker (same codebase, separate process) for async parsing

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
- Auth behavior: stores JWT after login and attaches `Authorization: Bearer <access_token>` to protected finance and receipt requests

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
- Auth behavior: validates JWT locally and scopes protected reads and writes by authenticated user
- Main endpoints:
  - `GET /wallets`
  - `POST /wallets`
  - `GET /categories`
  - `GET /transactions`
  - `POST /transactions`
  - `GET /dashboard/summary`

### receipt-service

- Technology: FastAPI + SQLAlchemy
- Main responsibility: receipt upload API, receipt retrieval, feedback, confirm-to-finance flow, and parse job enqueueing
- Auth behavior: validates JWT locally, enforces receipt ownership, and forwards the caller bearer token to `finance-service` during confirm
- Main endpoints:
  - `POST /receipts/upload`
  - `GET /receipts/{id}`
  - `POST /receipts/{id}/parse`
  - `POST /receipts/{id}/feedback`
  - `POST /receipts/{id}/confirm`

### receipt-worker

- Technology: Python process in the same `receipt-service` codebase
- Main responsibility: claim queued parse jobs, preprocess images, run PaddleOCR, persist OCR output, run extraction, and mark receipts ready for review or failed
- Main entrypoint: `microservices/receipt-service/app/worker.py`
- Runtime behavior: keeps a warm OCR model in memory and uses CPU or GPU based on runtime configuration

## Communication Model

### Frontend to backend

- Browser calls services over REST.
- Public browser URLs use `NEXT_PUBLIC_*` variables.
- Protected finance and receipt calls are made from client-side authenticated flows because the active session is stored in browser local storage.

### Service-to-service

- `receipt-service` calls `finance-service` via REST when a reviewed receipt is confirmed.
- The original caller bearer token is forwarded during receipt confirmation so `finance-service` can validate the same user context.

## Current Data Flow

### Authentication flow

1. Frontend sends login request to `auth-service`
2. `auth-service` validates user and returns access token + refresh token
3. Frontend stores tokens in local storage
4. Frontend attaches the access token to protected finance and receipt requests
5. `finance-service` and `receipt-service` validate JWT locally and derive the acting user from `sub`

Important note:

- Downstream services now enforce JWT-based user context for protected operations.
- Dashboard, wallets, transactions, receipts, receipt feedback, and receipt confirmation are now scoped by authenticated ownership.
- Finance and receipt services must keep `JWT_ACCESS_SECRET` aligned with `auth-service`.

### Receipt-to-transaction flow

1. Frontend uploads a receipt image to `receipt-service`
2. `receipt-service` stores file metadata and local file path, creates a queued parse job, and returns immediately
3. `receipt-worker` claims the queued job and moves it through `preprocessing`, `ocr_running`, and `extracting`
4. `receipt-worker` stores OCR output in `receipt_ocr_results` and extracted fields in `receipt_extractions`
5. `receipt-worker` marks the receipt `ready_for_review` or `failed`
6. Frontend review page polls receipt status until extraction is ready
7. Frontend review page allows user edits and feedback
8. Frontend confirms receipt
9. `receipt-service` verifies ownership and calls `finance-service` with the same bearer token to create a transaction
10. `finance-service` updates wallet balance and stores transaction

## Operational Shape

Docker Compose startup order:

1. `auth-service`
2. `finance-service`
3. `receipt-service`
4. `receipt-worker`
5. `frontend`

Health endpoints:

- `GET /health` on all three backend services

## Architectural Observations

### What is working

- Service boundaries are clear.
- Receipt flow is end-to-end functional.
- Each service owns its own database.
- Docker startup order is explicit and practical.
- JWT-based user context is enforced across frontend, finance-service, and receipt-service.
- Receipt confirmation preserves authenticated user context into finance-service.
- Receipt parse requests now return immediately and heavy OCR work runs outside the HTTP request path.
- Frontend review flow now reflects async parse state through polling.

### What is still fragile

- Receipt storage depends on local filesystem paths.
- Frontend protected data loading depends on browser-side session storage rather than an SSR-friendly session mechanism.
- receipt-service still uses startup `create_all()` instead of managed migrations.
- GPU OCR depends on host/runtime support and environment configuration.
