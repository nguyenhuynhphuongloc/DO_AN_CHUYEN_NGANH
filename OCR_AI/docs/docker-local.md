# Docker Local Full System

## Purpose

This repo provides a root Docker local stack so frontend, `auth-service`, `finance-service`, the OCR n8n runtime, and local PostgreSQL can start together through one `docker compose` entrypoint.

## Quick start

1. Create the Docker env file:

```bash
cp .env.example .env
```

2. Fill in the required secrets:

- `AUTH_JWT_SECRET`
- `AUTH_REFRESH_TOKEN_SECRET`
- `VERYFI_CLIENT_ID`
- `VERYFI_USERNAME`
- `VERYFI_API_KEY`

3. Start the full stack:

```bash
npm run docker:up
```

4. Open the runtime surfaces:

- frontend: `http://localhost:5000`
- OCR n8n: `http://localhost:5001`
- OCR webhook: `http://localhost:5001/webhook/receipt-ocr`
- auth-service health: `http://localhost:5002/health`
- finance-service health: `http://localhost:5003/health`

## What the stack starts

- `frontend`: Vite dev server with `VITE_*` endpoints pointing to the host-exposed services
- `auth-service`: Express auth app with auto-migrations enabled against local `auth_db`
- `finance-service`: Express finance app with auto-migrations enabled against local `finance_db`
- `ocr-runtime`: n8n-based stateless OCR flow
- `postgres`: local PostgreSQL server that boots both `auth_db` and `finance_db`

## Commands

```bash
npm run docker:up
npm run docker:ps
npm run docker:logs
npm run docker:down
```

## Database notes

- PostgreSQL is exposed on `localhost:5432`
- `auth-service` connects to `auth_db`
- `finance-service` connects to `finance_db`
- OCR does not get its own database or persistence tables

## Troubleshooting

- If ports are already in use, stop the conflicting local processes or change the values in `.env`.
- If containers build but the app does not respond yet, check `npm run docker:logs`.
- If you need to rebuild dependencies from scratch, run:

```bash
npm run docker:down
docker compose up -d --build --force-recreate
```
