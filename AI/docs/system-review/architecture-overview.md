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

- Technology: Next.js 15.0.3 App Router + TypeScript 5.7.x + Tailwind CSS 3.4.x
- Main responsibility: user-facing screens for login, dashboard, transactions, and the unified receipt OCR workspace
- Main integration file: `microservices/frontend/lib/api.ts`
- Auth behavior: stores JWT after login and attaches `Authorization: Bearer <access_token>` to protected finance and receipt requests

Routes:

- `/login`
- `/dashboard`
- `/transactions`
- `/receipts/upload`
- `/receipts/[id]/review` -> redirect into the unified workspace

### auth-service

- Technology: NestJS 10.4.x + Prisma 5.21.x
- Main responsibility: register, login, refresh token, profile
- Main endpoints:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `GET /auth/profile`

### finance-service

- Technology: NestJS 10.4.x + Prisma 5.21.x
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

- Technology: FastAPI 0.115.6 + SQLAlchemy 2.0.36 + PostgreSQL via psycopg 3.2.3
- Main responsibility: session-first receipt upload/retrieval APIs, OCR/debug payload serving, feedback, confirm-to-finance flow, and parse job enqueueing
- Auth behavior: validates JWT locally, enforces receipt ownership, and forwards the caller bearer token to `finance-service` during confirm
- Main endpoints:
  - `POST /receipts/upload`
  - `GET /receipts/{id}`
  - `POST /receipts/{id}/parse`
  - `POST /receipts/{id}/feedback`
  - `POST /receipts/{id}/confirm`
  - `GET /receipts/sessions/{id}`
  - `POST /receipts/sessions/{id}/parse`
  - `POST /receipts/sessions/{id}/feedback`
  - `POST /receipts/sessions/{id}/confirm`

### receipt-worker

- Technology: Python process in the same `receipt-service` codebase
- Main responsibility: claim queued parse jobs, preprocess images, run Paddle detection plus configurable recognition, persist OCR output, run extraction, and mark sessions/receipts ready for review or failed
- Main entrypoint: `microservices/receipt-service/app/worker.py`
- Runtime behavior: keeps warm OCR adapters in memory and uses CPU or GPU based on runtime configuration

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
2. When `RECEIPT_SESSION_FIRST_ENABLED=true`, `receipt-service` stores a temp file, creates a `receipt_parse_session`, queues a `receipt_parse_job`, and returns immediately
3. `receipt-worker` claims the queued session job and moves it through `preprocessing`, `ocr_running`, and `extracting`
4. OCR currently runs as:
   - Paddle detection
   - VietOCR recognition by default
   - Paddle recognition fallback when configured or selected
5. `receipt-worker` stores OCR/debug JSON and extracted fields on the parse session
6. Frontend workspace polls session status until extraction is ready
7. User edits extracted fields and optionally saves feedback
8. Frontend confirms the parsed session
9. `receipt-service` finalizes the session into an official `Receipt`, persists OCR/extraction snapshots, and calls `finance-service` with the same bearer token
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
- Frontend review flow now uses a unified receipt workspace with async polling.
- OCR is now split into detector and recognizer layers with a switchable recognizer backend.

### What is still fragile

- Receipt storage still depends on local filesystem paths.
- Frontend protected data loading depends on browser-side session storage rather than an SSR-friendly session mechanism.
- receipt-service still uses startup `create_all()` in the worker in addition to explicit DB migration files.
- GPU OCR depends on host/runtime support and `docker-compose.gpu.yml`.
