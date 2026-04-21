# Receipt OCR Backend Foundation

## Purpose

This backend module provides a reusable local OCR integration based on Docker Compose, local n8n, and the Veryfi API. It exposes one synchronous webhook that accepts a receipt image and returns either:

- HTTP 200 with normalized OCR JSON
- HTTP 400 with a structured error body

## Module structure

- [backend/receipt-ocr/docker-compose.yml](../backend/receipt-ocr/docker-compose.yml): local n8n runtime
- [backend/receipt-ocr/.env.example](../backend/receipt-ocr/.env.example): runtime and Veryfi configuration template
- [backend/receipt-ocr/workflows/receipt-ocr-workflow.json](../backend/receipt-ocr/workflows/receipt-ocr-workflow.json): exported n8n workflow
- [backend/receipt-ocr/fixtures](../backend/receipt-ocr/fixtures): success and error examples
- [backend/receipt-ocr/scripts/smoke-test.mjs](../backend/receipt-ocr/scripts/smoke-test.mjs): schema and workflow smoke check

## Local setup

1. Copy the env template:

```bash
cp backend/receipt-ocr/.env.example backend/receipt-ocr/.env
```

2. Fill in the Veryfi credentials in `backend/receipt-ocr/.env`.

3. Start the local n8n stack:

```bash
docker compose -f backend/receipt-ocr/docker-compose.yml up -d
```

4. Open n8n at `http://localhost:5001`.

The compose command imports the workflow export on startup and then starts n8n with persisted data under `backend/receipt-ocr/storage/n8n`.

## Webhook contract

### Request

- Method: `POST`
- Content-Type: `multipart/form-data`
- File field name: `receipt`

Example:

```bash
curl -X POST "http://localhost:5001/webhook/receipt-ocr" \
  -u admin:admin123 \
  -F "receipt=@./sample-receipt.jpg"
```

### Success response

See [contracts/ocr-success.json](../contracts/ocr-success.json).

### Error response

See [contracts/ocr-error.json](../contracts/ocr-error.json) for the canonical error shape, and [backend/receipt-ocr/fixtures/ocr-insufficient-data-error.json](../backend/receipt-ocr/fixtures/ocr-insufficient-data-error.json) for the insufficient-data variant with `details.missing_fields`.

Possible error codes:

- `INVALID_INPUT`
- `OCR_FAILED`
- `BLURRY_IMAGE`
- `INSUFFICIENT_DATA`

## Normalization rules

- `total_amount`: sourced from Veryfi total or grand total
- `currency`: sourced from `currency_code`, fallback `OCR_DEFAULT_CURRENCY`
- `transaction_datetime`: normalized to ISO 8601; date-only values become `T00:00:00Z`
- `merchant_name`: sourced from cleaned vendor data when available
- `payment_method`: fallback `Unknown`
- `ai_suggested_category`: deterministic rule-based mapping with fallback `Khác`

## Confidence and failure handling

- The workflow requests `confidence_details=true` from Veryfi.
- Blur is detected from either `blurry=true` or confidence values below `OCR_REQUIRED_CONFIDENCE`.
- Required fields for a successful response are:
  - `total_amount`
  - `currency`
  - `merchant_name`
  - `transaction_datetime`

If any required field is missing, the workflow returns `INSUFFICIENT_DATA`.

## Smoke checks

Run the backend smoke test:

```bash
node backend/receipt-ocr/scripts/smoke-test.mjs
```

The smoke check validates:

- workflow export presence and expected nodes
- success response schema
- blurry-image error schema
- insufficient-data error schema

## Frontend and persistence integration notes

- OCR endpoint: `http://localhost:5001/webhook/receipt-ocr`
- Confirmed OCR transaction endpoint: `http://localhost:5003/transactions/confirmed-ocr`

The frontend expects the OCR success payload to use the exact canonical field names documented above, then posts only the user-confirmed business fields to `finance-service` so it can create a transaction in `finance_db.transactions`. OCR itself remains stateless and does not store receipt drafts, raw OCR JSON, or receipt lifecycle data.

For the full end-to-end run flow and Neon microservice setup, see [docs/receipt-ocr-e2e.md](receipt-ocr-e2e.md).
