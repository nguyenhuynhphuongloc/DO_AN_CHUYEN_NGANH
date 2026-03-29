# Personal Finance MVP

This repository contains a capstone MVP for a personal finance management platform with four applications under `microservices/`:

- `microservices/frontend`: Next.js App Router client
- `microservices/auth-service`: NestJS + Prisma service for JWT auth
- `microservices/finance-service`: NestJS + Prisma service for categories, wallets, transactions, and summaries
- `microservices/receipt-service`: FastAPI + SQLAlchemy service for receipt upload, PaddleOCR parsing, review, and confirmation

## Prerequisites

- Node.js 20+ and `npm`
- Python 3.11+
- PostgreSQL databases already provisioned in the cloud:
  - `auth_db`
  - `finance_db`
  - `receipt_db`

## Setup

1. Copy each `.env.example` file to `.env` in the same service directory.
2. Fill in the PostgreSQL connection strings and service URLs.
3. Install dependencies for each app:

```bash
cd microservices/auth-service && npm install
cd ../finance-service && npm install
cd ../frontend && npm install
cd ../receipt-service && pip install -r requirements.txt
```

Receipt OCR runtime notes:

- The first PaddleOCR-backed parse may take longer because model assets are downloaded and initialized.
- Local Docker builds for `receipt-service` install additional native libraries required by PaddleOCR and OpenCV.
- Keep `receipt-service` running between parse requests so the OCR model stays warm in memory.

4. Run Prisma generation and migrations for the NestJS services:

```bash
cd microservices/auth-service
npx prisma generate
npx prisma migrate dev
npm run seed

cd ../finance-service
npx prisma generate
npx prisma migrate dev
npm run seed
```

5. Start the applications in separate terminals:

```bash
cd microservices/auth-service && npm run start:dev
cd microservices/finance-service && npm run start:dev
cd microservices/receipt-service && python -m uvicorn app.main:app --reload --port 8003
cd microservices/frontend && npm run dev
```

## Docker startup

You can start the full stack with Docker Compose from the repository root:

```bash
docker compose up --build
```

By default, the Docker services do not run `prisma db push` or seed scripts automatically. This avoids destructive schema changes against existing cloud databases. If you want a one-time schema sync for an empty dedicated database, enable it explicitly:

```bash
docker compose run --rm -e RUN_DB_PUSH=true -e RUN_SEED=true auth-service
docker compose run --rm -e RUN_DB_PUSH=true -e RUN_SEED=true finance-service
```

Startup order is enforced with health checks and dependencies:

1. `auth-service`
2. `finance-service`
3. `receipt-service`
4. `frontend`

## Default local URLs

- Frontend: `http://localhost:3000`
- Auth service: `http://localhost:8001`
- Finance service: `http://localhost:8002`
- Receipt service: `http://localhost:8003`

## Development seed user

The auth seed creates this development-only user:

- Email: `testuser@example.com`
- Password: `123456`
- Role: `user`

The password is intentionally plain text for the MVP seed flow only. Do not reuse this approach outside development.

## Suggested startup order

1. `auth-service`
2. `finance-service`
3. `receipt-service`
4. `frontend`

## Verification checklist

- Log in from the frontend with the seeded test user.
- Create a wallet and a manual transaction through the API or UI.
- Upload a receipt, run the PaddleOCR parse flow, edit the extracted fields, and confirm it.
- Confirm the created receipt generates a transaction in `finance-service`.

## Build verification completed in this repository

The scaffold was validated with:

- `npx prisma generate` in `microservices/auth-service`
- `npx prisma generate` in `microservices/finance-service`
- `npm run build` in `microservices/auth-service`
- `npm run build` in `microservices/finance-service`
- `npm run build` in `microservices/frontend`
- `python -m compileall app` in `microservices/receipt-service`

Runtime startup and full end-to-end verification still require valid cloud PostgreSQL connection strings in each `.env` file.
