## Validation Summary

### Environment Variables

The integrated receipt OCR workflow requires these variables:

- `do-an-chuyen-nganh/.env`
  - `DATABASE_URL`
  - `PAYLOAD_SECRET`
  - `AI_SERVICE_URL` (defaults to `http://localhost:8000` if omitted)
- `AI/.env`
  - `VERYFI_CLIENT_ID`
  - `VERYFI_USERNAME`
  - `VERYFI_API_KEY`
  - `VERYFI_CLIENT_SECRET`
  - `VERYFI_BASE_URL` (optional override)
  - `VERYFI_API_VERSION` (optional override)
  - `VERYFI_TIMEOUT_SECONDS` (optional override)
  - `VERYFI_MAX_RETRIES` (optional override)
  - `GROQ_API_KEY`
  - `GROQ_BASE_URL` (optional override)
  - `GROQ_MODEL` (optional override)
  - `GROQ_TIMEOUT_SECONDS` (optional override)
  - `GROQ_CATEGORY_RESOLUTION_ENABLED`
  - `RECEIPT_PREPROCESS_ENABLED` (optional)

### Local Run Steps

1. Start the Python AI service from `AI/`:
   - `py -m uvicorn main:app --host 127.0.0.1 --port 8000`
2. Start the main app from `do-an-chuyen-nganh/`:
   - `npm run dev`
3. Open `/scan` in the main app.
4. Upload a receipt image, review the editable OCR fields, and confirm.

### Validation Evidence

#### 1. Python AI route representative validation

Validated `AI/main.py:/api/ocr/receipt` with a representative mocked Veryfi result via `fastapi.testclient.TestClient` and patched:

- `VeryfiReceiptParser.parse_document`
- `ReceiptCategoryResolutionService.resolve_category`

Observed:

- `success = true`
- `provider = "veryfi"`
- mapped `merchant_name = "Circle K"`
- constrained `category_id = "12"`

#### 2. Main app parse route de-duplication

Validated `/api/ai/ocr/receipt` against a temporary mock AI server on `127.0.0.1:8000`.

Observed:

- only user-visible `expense` categories were forwarded
- exact duplicate `expense` names were de-duplicated
- `income` categories were excluded
- the route preferred the latest user-owned duplicate category

Observed candidate set:

- `An uong`
- `Di chuyen`

#### 3. Confirm success path

Validated end-to-end against the running main app on `127.0.0.1:3100` with a freshly registered user:

- created user through `POST /api/users`
- logged in through `POST /api/users/login`
- created duplicate expense categories and one income category
- parsed a mock receipt through `POST /api/ai/ocr/receipt`
- confirmed through `POST /api/ai/ocr/receipt/confirm`

Observed:

- media upload succeeded
- expense transaction creation succeeded
- `merchantName`, `currency`, and `sourceType` persisted
- stats changed as expected:
  - `totalExpense` increased by `100000`
  - `balance` decreased by `100000`

#### 4. Confirm and provider failure paths

Validated:

- invalid category returns `404` with `success = false`
- invalid confirm payload returns `400` with `success = false`
- parse route returns `500` with safe `OCR_ROUTE_FAILED` error payload when the AI service is unavailable
- confirm route cleanup path is covered by `tests/int/receipt-ocr-confirm-route.int.spec.ts`

### Runtime Notes

- The live `transactions` table initially lacked the `currency` column required by the new `Transactions` collection schema.
- Added `public.transactions.currency varchar default 'VND'` on the shared Neon database and backfilled existing rows before running confirm validation.
