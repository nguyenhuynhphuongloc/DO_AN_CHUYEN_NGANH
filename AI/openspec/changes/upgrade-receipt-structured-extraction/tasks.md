## 1. Extraction pipeline refactor

- [x] 1.1 Refactor `microservices/receipt-service/app/services/extraction_service.py` into staged helpers for normalization, candidate generation, scoring, validation, and final output shaping
- [x] 1.2 Add safe OCR text normalization for whitespace, separators, amount formatting, date/time separators, and common payment-method strings without locale-specific spell correction
- [x] 1.3 Replace first-line merchant detection with header-focused merchant candidate scoring that excludes obvious promo, website, phone, and invoice-label lines
- [x] 1.4 Improve date and amount candidate extraction to support more practical separators, OCR-corrupted patterns, supporting totals, and stronger total-selection rules
- [x] 1.5 Add optional field extraction for subtotal, discount, service charge, payment method, receipt number, merchant contact info, cashier, time fields, and conservative `items[]` parsing
- [x] 1.6 Add business validation so invalid merchants, non-positive totals, and unparseable dates fall back to `null` or review hints instead of invalid persisted values

## 2. Persistence and extraction output

- [x] 2.1 Update extraction result shaping so top-level `receipt_extractions` columns remain stable while richer optional output is stored in `extracted_json`
- [x] 2.2 Extend `extracted_json` with `normalized_text`, optional extracted fields, `items`, `field_confidence`, `source_lines` or trace metadata, and `needs_review_fields`
- [x] 2.3 Update `microservices/receipt-service/app/services/parse_pipeline.py` so richer extraction output and field-level confidence are persisted without breaking async parse status handling
- [x] 2.4 Update receipt-service schemas or response models only where needed to expose richer extraction output in a backward-compatible way

## 3. Frontend compatibility

- [x] 3.1 Update `microservices/frontend/lib/types.ts` and related API handling for richer `extracted_json` structure and optional extracted fields
- [x] 3.2 Update the receipt review flow to remain null-safe with richer extraction payloads while keeping the existing edit-and-confirm contract unchanged
- [x] 3.3 Surface optional extracted fields only when available and keep missing values hidden or harmlessly nullable
- [x] 3.4 Prepare frontend data access for future suggestion features by preserving access to merchant name, items, payment method, and description-like text

## 4. Validation coverage

- [x] 4.1 Add or organize validation inputs for clear, blurry, long, subtotal/tax/discount, payment-method, and noisy promo/footer receipts
- [x] 4.2 Validate that merchant, date, and total extraction improve over the current baseline on representative receipts
- [x] 4.3 Validate that optional fields stay `null` or omitted when confidence is weak and that `items[]` only appears for practical row-like receipts
- [x] 4.4 Validate that async parse queueing, worker execution, OCR debug persistence, and confirm-to-finance flow do not regress

## 5. Completion and acceptance

- [x] 5.1 Record the updated extraction output shape and field-confidence behavior in system review or validation notes
- [x] 5.2 Capture commands run, sample outcomes, and pass/fail results for the richer extraction validation set
- [x] 5.3 Apply minimal follow-up fixes for any extraction or contract regressions discovered during validation
- [x] 5.4 Confirm the final implementation meets acceptance criteria for richer review-safe extraction without breaking the current async OCR workflow
