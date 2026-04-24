# Receipt OCR End-to-End Guide

## Overview

This repository now implements the agreed workflow end to end:

1. unauthenticated user visits `/login` or `/register`
2. frontend registers or logs in through `auth-service`
3. authenticated user is redirected to `/ocr`
4. frontend loads wallets and categories from `finance-service`
5. user uploads receipt to n8n OCR webhook
6. OCR result is reviewed and corrected in the protected OCR page
7. frontend submits confirmed OCR data to `finance-service`
8. `finance-service` persists only the confirmed business fields into `finance_db.transactions` through its configured Neon connection

## Services

### Frontend app

- local dev command: `npm run dev`
- routes: `/register`, `/login`, `/ocr`

### OCR backend

- path: `backend/receipt-ocr`
- endpoint: `http://localhost:5001/webhook/receipt-ocr`

### Auth service

- path: `microservices/auth-service`
- endpoint base: `http://localhost:5002`
- health check: `http://localhost:5002/health`

### Finance service

- path: `microservices/finance-service`
- endpoint base: `http://localhost:5003`
- health check: `http://localhost:5003/health`
- confirmed OCR endpoint: `http://localhost:5003/transactions/confirmed-ocr`

## Standard local run flow

The standard local development workflow is the root Docker stack. It starts frontend, `auth-service`, `finance-service`, and OCR runtime together, while auth and finance persist to Neon using their own service-local env files.

### 1. Prepare Docker env

```bash
cp .env.example .env
```

Set at least:

- `VERYFI_CLIENT_ID`
- `VERYFI_USERNAME`
- `VERYFI_API_KEY`

### 2. Prepare microservice env

```bash
cp microservices/auth-service/.env.example microservices/auth-service/.env
cp microservices/finance-service/.env.example microservices/finance-service/.env
```

Set at least:

- `AUTH_DATABASE_URL`
- `AUTH_JWT_SECRET`
- `AUTH_REFRESH_TOKEN_SECRET`
- `FINANCE_DATABASE_URL`

`AUTH_AUTO_MIGRATE` and `FINANCE_AUTO_MIGRATE` are read from the service-local env files. If either flag is `true`, that service will run migrations directly against Neon on startup.

### 3. Start the full stack

```bash
npm run docker:up
```

### 4. Inspect or stop the stack

```bash
npm run docker:ps
npm run docker:logs
npm run docker:down
```

The Docker local stack exposes:

- frontend: `http://localhost:5000`
- OCR webhook: `http://localhost:5001/webhook/receipt-ocr`
- auth-service: `http://localhost:5002`
- finance-service: `http://localhost:5003`
- auth persistence target: `AUTH_DATABASE_URL` from `microservices/auth-service/.env`
- finance persistence target: `FINANCE_DATABASE_URL` from `microservices/finance-service/.env`

## Manual run flow

Use this only if you specifically want to run parts of the system outside Docker.

### 1. Install dependencies

```bash
npm install
```

### 2. Configure frontend

Create `.env.local` with:

- `VITE_AUTH_SERVICE_URL=http://localhost:5002`
- `VITE_FINANCE_SERVICE_URL=http://localhost:5003`
- `VITE_OCR_ENDPOINT=http://localhost:5001/webhook/receipt-ocr`

### 3. Configure OCR backend

```bash
cp backend/receipt-ocr/.env.example backend/receipt-ocr/.env
```

Fill in the Veryfi credentials.

### 4. Configure microservices

```bash
cp microservices/auth-service/.env.example microservices/auth-service/.env
cp microservices/finance-service/.env.example microservices/finance-service/.env
```

Set:

- `AUTH_DATABASE_URL`
- `AUTH_JWT_SECRET`
- `AUTH_REFRESH_TOKEN_SECRET`
- `FINANCE_DATABASE_URL`
- optional: `AUTH_AUTO_MIGRATE`, `FINANCE_AUTO_MIGRATE`

### 5. Start services

```bash
docker compose -f backend/receipt-ocr/docker-compose.yml up -d
npm run service:auth
npm run service:finance
npm run dev
```

## Frontend behavior

- `Register` posts to `auth-service /auth/register`
- `Login` posts to `auth-service /auth/login`
- successful auth stores the returned session in local storage
- route guard redirects unauthenticated access from `/ocr` to `/login`
- `/ocr` loads wallets and categories from `finance-service` using the authenticated user id
- the OCR module submits the final confirmed payload with `wallet_id`, `final_category`, `notes`, and the canonical OCR fields
- `finance-service` persists only the confirmed invoice fields in `finance_db.transactions`
- no receipt review record, OCR job record, raw OCR archive, or receipt lifecycle table is created anywhere in the flow

## Env file matrix

- root `.env`: root Docker stack ports and OCR/frontend variables
- `microservices/auth-service/.env`: auth Docker and manual-run database URL, auth secrets, and auth migration flags
- `microservices/finance-service/.env`: finance Docker and manual-run database URL plus finance migration flags
- `backend/receipt-ocr/.env`: OCR-only Docker stack config
- root `.env.local`: frontend-only Vite config for non-Docker local dev

## Canonical contracts

- OCR success: [contracts/ocr-success.json](../contracts/ocr-success.json)
- OCR error: [contracts/ocr-error.json](../contracts/ocr-error.json)
- confirmed OCR request: [contracts/confirmed-ocr-transaction-request.json](../contracts/confirmed-ocr-transaction-request.json)
- confirmed OCR response: [contracts/confirmed-ocr-transaction-response.json](../contracts/confirmed-ocr-transaction-response.json)
- service error: [contracts/service-error.json](../contracts/service-error.json)

## Validation workflow

```bash
npm run test:backend
npm run test:e2e
npm test
npm run build
```

What gets verified:

- OCR workflow export and fixtures
- login/register and protected-route behavior
- OCR happy path and OCR/save error rendering
- canonical cross-service contract alignment
- type safety and Vite frontend build
