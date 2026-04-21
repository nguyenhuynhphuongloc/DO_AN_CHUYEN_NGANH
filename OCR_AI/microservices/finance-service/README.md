# Finance Service

Neon-backed finance microservice for `finance_db`.

## Responsibilities

- create, update, and list wallets
- create, update, and list categories
- create, update, and list budget profiles
- create, update, and list category allocation rules
- create and list transactions
- accept confirmed OCR results and persist them directly into `transactions`

## Run

```bash
npm run migrate:finance
npm run service:finance
```

## Required env

- `FINANCE_DATABASE_URL`

Optional:

- `HOST`
- `PORT`
- `FINANCE_AUTO_MIGRATE`

## Endpoints

- `GET /health`
- `GET|POST|PUT /wallets`
- `GET|POST|PUT /categories`
- `GET|POST|PUT /budget-profiles`
- `GET|POST|PUT /category-allocation-rules`
- `GET|POST /transactions`
- `POST /transactions/confirmed-ocr`

## Request context

Finance routes expect the authenticated application layer to pass the current user identifier in the `x-user-id` header. Confirmed OCR creation can also receive `x-wallet-id` when the host UI already knows which wallet should receive the expense.
