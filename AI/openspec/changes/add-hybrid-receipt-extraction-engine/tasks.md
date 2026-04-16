## 1. Hybrid extraction pipeline

- [x] 1.1 Refactor `microservices/receipt-service/app/services/extraction_service.py` into explicit hybrid stages for normalization, zoning, candidate generation, scoring, validation, and output shaping
- [x] 1.2 Add safe OCR normalization helpers for whitespace, amount separators, date/time separators, punctuation corruption, and common payment strings while preserving original OCR payloads
- [x] 1.3 Implement heuristic soft zones for header, metadata, item table, payment summary, and footer/promo without making zoning a hard parse dependency
- [x] 1.4 Replace first-line and largest-number fallbacks with field-specific candidate scoring for merchant, date, total, and currency
- [x] 1.5 Add optional field candidate generation for subtotal, tax, discount, service charge, payment method, receipt number, address, phone, cashier, table number, guest count, and time fields
- [x] 1.6 Strengthen conservative `items[]` parsing so rows are emitted only when line structure is plausible
- [x] 1.7 Add business validation so invalid merchants, invalid totals, weak dates, and incoherent support totals fall back to null and review hints

## 2. Persistence and contract safety

- [x] 2.1 Preserve existing top-level `receipt_extractions` columns while extending `extracted_json` with hybrid fields, field confidence, source-line traces, `needs_review_fields`, `extraction_version`, and optional notes
- [x] 2.2 Update `microservices/receipt-service/app/services/parse_pipeline.py` so hybrid extraction output persists cleanly inside the existing async worker flow
- [x] 2.3 Update receipt-service schemas and API models only where needed to expose richer hybrid extraction output in a backward-compatible way
- [x] 2.4 Ensure reviewed or confirmed user edits merge back into structured extraction payloads without flattening or losing hybrid metadata

## 3. Frontend compatibility

- [x] 3.1 Update frontend extraction types and API handling for the richer `extracted_json` shape and nullable optional fields
- [x] 3.2 Keep the existing review page editable and null-safe while exposing any additive hybrid extraction data needed by the current flow
- [x] 3.3 Preserve access to merchant, payment method, item data, review-needed fields, and description-like text for later suggestion features without redesigning the UI

## 4. Validation and hardening

- [x] 4.1 Prepare or extend validation fixtures covering clear retail, restaurant subtotal/SVC/VAT, blurry, long, payment-method, footer-heavy, missing-merchant, and OCR-corrupted receipts
- [x] 4.2 Validate that merchant, date, and total extraction outperform the current first-line and max-number baseline across the varied receipt set
- [x] 4.3 Validate that optional fields remain null when weak and that `items[]` appears only for practical row-like receipts
- [x] 4.4 Validate that async parse queueing, OCR debug persistence, review flow, and confirm-to-finance behavior do not regress
- [x] 4.5 Apply the smallest practical fixes for any extraction, persistence, or contract issues discovered during validation

## 5. Documentation and completion

- [x] 5.1 Record the hybrid extraction output shape, confidence model, and trace metadata in system review or validation notes
- [x] 5.2 Capture commands run and pass/fail outcomes for each required receipt scenario in a validation report
- [x] 5.3 Confirm the final implementation improves extraction quality across multiple receipt styles without changing the current async OCR architecture
