# Docker Local Full System

## Purpose

This repo provides a root Docker local stack so frontend, `auth-service`, `finance-service`, and the OCR n8n runtime can start together through one `docker compose` entrypoint while `auth-service` and `finance-service` persist directly to Neon.

## Quick start

1. Create the Docker env file:

```bash
cp .env.example .env
```

2. Create the service-local microservice env files:

```bash
cp microservices/auth-service/.env.example microservices/auth-service/.env
cp microservices/finance-service/.env.example microservices/finance-service/.env
```

3. Fill in the required values:

- root `.env`
  - `VERYFI_CLIENT_ID`
  - `VERYFI_USERNAME`
  - `VERYFI_API_KEY`
- `microservices/auth-service/.env`
  - `AUTH_DATABASE_URL`
  - `AUTH_JWT_SECRET`
  - `AUTH_REFRESH_TOKEN_SECRET`
- `microservices/finance-service/.env`
  - `FINANCE_DATABASE_URL`

4. Start the full stack:

```bash
npm run docker:up
```

5. Open the runtime surfaces:

- frontend: `http://localhost:5000`
- OCR n8n: `http://localhost:5001`
- OCR webhook: `http://localhost:5001/webhook/receipt-ocr`
- auth-service health: `http://localhost:5002/health`
- finance-service health: `http://localhost:5003/health`

## What the stack starts

- `frontend`: Vite dev server with `VITE_*` endpoints pointing to the host-exposed services
- `auth-service`: Express auth app running in Docker but loading its Neon connection string and auth secrets from `microservices/auth-service/.env`
- `finance-service`: Express finance app running in Docker but loading its Neon connection string from `microservices/finance-service/.env`
- `ocr-runtime`: n8n-based stateless OCR flow

## Env file mapping

- root `.env`: Docker orchestration ports plus OCR and frontend variables used by the root `docker-compose.yml`
- `microservices/auth-service/.env`: `AUTH_DATABASE_URL`, auth secrets, and auth runtime flags for both manual run and Docker run
- `microservices/finance-service/.env`: `FINANCE_DATABASE_URL` and finance runtime flags for both manual run and Docker run
- `backend/receipt-ocr/.env`: OCR-only Docker compose config when running `backend/receipt-ocr/docker-compose.yml` directly
- root `.env.local`: frontend-only Vite config when running `npm run dev` outside Docker

## Commands

```bash
npm run docker:up
npm run docker:ps
npm run docker:logs
npm run docker:down
```

## Database notes

- `auth-service` connects to Neon using `AUTH_DATABASE_URL` from `microservices/auth-service/.env`
- `finance-service` connects to Neon using `FINANCE_DATABASE_URL` from `microservices/finance-service/.env`
- If `AUTH_AUTO_MIGRATE=true` or `FINANCE_AUTO_MIGRATE=true` in the service-local env files, those migrations run directly against Neon on container startup
- If you want a safer default for shared databases, keep both auto-migrate flags set to `false` and run migrations intentionally
- OCR does not get its own database or persistence tables

## Troubleshooting

- If ports are already in use, stop the conflicting local processes or change the values in `.env`.
- If auth or finance exits immediately, verify the corresponding `microservices/*/.env` file exists and the Neon URL is valid.
- If Neon is unreachable from Docker, the auth and finance containers will fail to boot even if the OCR and frontend containers start.
- If containers build but the app does not respond yet, check `npm run docker:logs`.
- If you need to rebuild dependencies from scratch, run:

```bash
npm run docker:down
docker compose up -d --build --force-recreate
```
