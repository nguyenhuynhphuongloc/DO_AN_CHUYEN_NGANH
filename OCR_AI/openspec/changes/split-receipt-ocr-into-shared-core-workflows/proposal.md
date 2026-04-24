## Why

The current n8n receipt OCR flow is a single webhook built around one UI path, which makes the OCR contract brittle for both the review form and the chatbot workspace. The system now needs a shared OCR core that can serve both entry points consistently, use caller-provided category context, and guarantee a safer normalized payload that does not break the frontend when optional fields are missing.

## What Changes

- Replace the current single `receipt-ocr` flow with a shared-core architecture composed of three workflows: a reusable OCR core, an OCR form endpoint, and a chatbot-facing endpoint.
- Change OCR normalization so the structured OCR result always includes `merchant_name`, `transaction_datetime`, `total_amount`, `tax_amount`, `currency`, `payment_method`, `ai_suggested_category`, `ai_suggested_category_id`, `warnings`, and `needs_review`.
- Move category suggestion from hardcoded regex-only mapping to matching against caller-supplied `categories_json`, with deterministic fallback behavior when matching is weak or unavailable.
- Split endpoint responsibilities so the OCR form endpoint returns a review-form payload while the chatbot endpoint can shape the same core OCR result for conversational consumption without duplicating OCR logic.
- Keep OCR stateless: no DB persistence, no raw OCR payload persistence, no finance-service write, and no receipt lifecycle storage inside n8n.
- **BREAKING**: Replace the single public OCR webhook contract with dedicated OCR-form and chatbot workflows built on top of a sub-workflow core.

## Capabilities

### New Capabilities
- `receipt-ocr-shared-core`: Defines the reusable sub-workflow contract, validation, provider call, normalized structured OCR output, and category matching against provided categories.
- `receipt-ocr-chatbot-endpoint`: Defines the chatbot-oriented OCR entry point that delegates to the shared core and returns chatbot-safe OCR data.

### Modified Capabilities
- `receipt-ocr-webhook`: Replace the single generic webhook model with separate OCR-form and chatbot entry points that both delegate to the shared core.
- `receipt-ocr-normalization`: Expand the normalized OCR schema to include tax, category id, warnings, and review flags, and require stable field presence even when some values are unavailable.
- `receipt-ocr-client-integration`: Change the frontend-facing OCR form integration to call the dedicated form endpoint and consume the new `mode: "ocr_form"` response shape.

## Impact

- Affected code: `backend/receipt-ocr/workflows/receipt-ocr-workflow.json`, any new workflow JSON files under `backend/receipt-ocr/workflows/`, OCR frontend endpoint configuration, and OCR response parsing in the frontend.
- Affected APIs: public n8n OCR webhook paths and the normalized OCR response contract.
- Dependencies: n8n sub-workflow execution, Veryfi OCR, caller-provided `categories_json`, and frontend OCR consumers that currently assume the older response schema.
