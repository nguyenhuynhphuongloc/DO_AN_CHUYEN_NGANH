## Why

The async OCR worker flow is already stable, but extraction quality is still too fragile across diverse receipt layouts. A hybrid extraction engine is needed now to improve merchant/date/total reliability, add richer nullable structure, and reduce review friction without replacing PaddleOCR or changing the queue-backed parse pipeline.

## What Changes

- Refactor receipt extraction into a layered hybrid pipeline with OCR normalization, soft zoning, candidate generation, heuristic scoring, business validation, and structured output shaping.
- Improve extraction reliability for `merchant_name`, `transaction_date`, `total_amount`, and `currency` while keeping uncertain values nullable instead of guessed.
- Add broader optional receipt fields such as `subtotal_amount`, `tax_amount`, `discount_amount`, `service_charge`, `payment_method`, `receipt_number`, `merchant_address`, `merchant_phone`, `cashier_name`, `table_number`, `guest_count`, `time_in`, `time_out`, and safer `items[]` support.
- Extend `extracted_json` with normalized text, optional fields, field-level confidence, source-line trace metadata, review-needed hints, extraction versioning, and extraction notes when useful.
- Preserve the existing async parse worker flow, OCR debug persistence, authentication and ownership checks, and confirm-to-finance review workflow.
- Update receipt-service and frontend types only where needed so richer extraction output remains review-safe and forward-compatible with later category and wallet suggestion features.
- Add validation coverage across clear, restaurant, blurry, long, payment-method, footer-heavy, missing-merchant, and OCR-corrupted receipts.

## Capabilities

### New Capabilities
- `receipt-hybrid-extraction-engine`: Produce layered, traceable, nullable receipt extraction output on top of the current async OCR pipeline without changing the OCR engine or worker architecture.

### Modified Capabilities
- None.

## Impact

- Affected code: `microservices/receipt-service/app/services/extraction_service.py`, parse persistence in receipt-service, receipt schemas and API models, frontend extraction types, and review-page data access.
- Affected APIs: receipt parse/detail responses may carry richer `extracted_json` content, optional fields, field confidence, and trace metadata while preserving current top-level extraction columns.
- Dependencies: no OCR engine replacement and no queue redesign; changes remain inside the current FastAPI, SQLAlchemy, and Next.js stack.
- Systems: extraction quality, review safety, validation coverage, and readiness for downstream category or wallet suggestion logic.
