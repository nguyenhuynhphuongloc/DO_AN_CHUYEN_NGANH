## Why

The async OCR flow is now in place, but the extraction layer is still too shallow to reliably turn OCR text into structured receipt data. Improving extraction now is the highest-leverage next step because it raises review quality, reduces manual correction, and prepares the system for later suggestion features without redesigning the existing async parse workflow.

## What Changes

- Refactor receipt extraction into a staged pipeline that normalizes OCR text, generates field candidates, scores candidates, validates selected values, and persists richer extraction metadata.
- Improve extraction quality for `merchant_name`, `transaction_date`, `total_amount`, and `currency` while keeping uncertain values nullable.
- Add optional extracted fields such as `subtotal_amount`, `discount_amount`, `service_charge`, `payment_method`, `receipt_number`, `merchant_address`, `merchant_phone`, `cashier_name`, `time_in`, `time_out`, and `items`.
- Extend `extracted_json` with normalized text, optional fields, field-level confidence, trace metadata, item rows, and review hints while preserving current top-level columns and review flow.
- Update receipt-service persistence and frontend types only as needed so richer extraction data remains review-safe and backward-compatible with the current edit-and-confirm flow.
- Add validation coverage for clear, blurry, long, subtotal/tax/discount, payment-method, and noisy/promo-heavy receipts.

## Capabilities

### New Capabilities
- `receipt-structured-extraction-upgrade`: Produce richer, more reliable, traceable receipt extraction output on top of the existing async OCR pipeline while preserving nullable safety and the current review workflow.

### Modified Capabilities
- None.

## Impact

- Affected code: `microservices/receipt-service/app/services/extraction_service.py`, parse persistence in `app/services/parse_pipeline.py`, receipt schemas and types, and review-page data handling in `microservices/frontend`.
- Affected APIs: receipt detail and parse responses may carry richer `extracted_json` content and optional extraction fields while preserving the current top-level contract.
- Dependencies: no OCR engine replacement; changes stay within the current receipt-service and frontend stack.
- Systems: receipt extraction quality, review ergonomics, and future category/wallet suggestion readiness.
