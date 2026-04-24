# OCR AI Module

Reusable local-development OCR + finance backend workspace. The repo now contains:

- a Docker Compose + n8n + Veryfi backend foundation
- a root Docker local stack for frontend + auth-service + finance-service + OCR
- a React + TypeScript OCR frontend with `/register`, `/login`, and protected `/ocr`
- a reusable `ReceiptOcrModule` component
- a Neon-backed `auth-service` for `auth_db`
- a Neon-backed `finance-service` for `finance_db`
- OCR and frontend client helpers
- contract validation and backend/frontend checks

## Install

```bash
npm install
```

## Run full system with Docker

```bash
cp .env.example .env
npm run docker:up
```

This starts:

- frontend on `http://localhost:5000`
- OCR n8n runtime on `http://localhost:5001`
- `auth-service` on `http://localhost:5002`
- `finance-service` on `http://localhost:5003`
- Neon-backed auth and finance persistence using the service-local `.env` files

## Run frontend only

```bash
cp .env.example .env.local
npm run dev
```

## Run validation

```bash
npm run test:backend
npm run test:e2e
npm test
npm run build
```

## Microservice commands

```bash
npm run migrate:auth
npm run migrate:finance
npm run service:auth
npm run service:finance
```

## Runtime surfaces

- Frontend app: `/register`, `/login`, `/ocr`
- OCR webhook: `backend/receipt-ocr`
- Review UI module: `src/receipt-ocr`
- Microservices: `microservices/auth-service` and `microservices/finance-service`
- Shared request/response examples: `contracts`

Detailed usage and contract examples are in:

- [docs/receipt-ocr-module.md](docs/receipt-ocr-module.md)
- [docs/receipt-ocr-backend.md](docs/receipt-ocr-backend.md)
- [docs/receipt-ocr-e2e.md](docs/receipt-ocr-e2e.md)
- [docs/docker-local.md](docs/docker-local.md)
- [microservices/README.md](microservices/README.md)
