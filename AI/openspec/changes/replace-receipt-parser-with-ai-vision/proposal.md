## Why

The current receipt parsing layer depends on PaddleOCR plus handwritten extraction heuristics, which is too brittle for varied real-world receipt layouts and is producing too many field errors in review. We need to replace that primary path with a Gemini-based vision parser without disrupting the existing upload, async worker, review, feedback, and confirm workflow that already works well operationally.

## What Changes

- Replace PaddleOCR plus local heuristic parsing on the primary path with Gemini Vision parsing that reads the receipt image directly and returns structured receipt JSON.
- Preserve the current `receipt-service` flow: upload creates `receipts`, async parse jobs run through `receipt_jobs`, a worker performs parsing, users review editable extracted fields, and confirm creates the final finance transaction.
- Add a parser provider abstraction with Gemini as the default and primary provider so the parsing layer remains swappable without changing worker orchestration.
- Add a validation and normalization layer between provider output and persistence so invalid, weak, or malformed fields are null-safe and review-safe.
- Persist parser metadata, review hints, optional fields, and structured items in `receipt_extractions.extracted_json` while preserving the existing top-level extraction columns used by the current review and confirm flow.
- Modify OCR/debug behavior so response metadata reflects Gemini parser output accurately instead of assuming traditional OCR line output where it does not exist.

## Capabilities

### New Capabilities
- `ai-receipt-parsing`: Parse receipt images through Gemini Vision as the primary provider and persist normalized structured extraction output for the existing async review-first workflow.

### Modified Capabilities
- `receipt-ocr-debug-panel`: Change debug payload behavior so the review page can safely display Gemini parser debug metadata under the new AI vision parsing architecture.

## Impact

- Affected backend modules in `microservices/receipt-service`: parser service layer, worker parse pipeline, configuration, persistence contract, error handling, and receipt API serialization.
- Affected frontend modules in `microservices/frontend`: receipt types and review page debug/extraction rendering where parser metadata changes shape.
- New external dependency on the Gemini Vision API and related credentials, model, timeout, and retry configuration, with provider abstraction retained for future swaps.
- No intended redesign of `finance-service`, `auth-service`, receipt ownership checks, review flow, or confirm-to-transaction behavior.
