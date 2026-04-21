## 1. Contract Alignment

- [x] 1.1 Audit the backend OCR flow, frontend review module, and mock save API for mismatched field names, data types, and error response shapes
- [x] 1.2 Align the canonical OCR success contract so the frontend consumes `total_amount`, `currency`, `transaction_datetime`, `merchant_name`, `payment_method`, and `ai_suggested_category` without alternate mappings
- [x] 1.3 Align the reviewed save payload to preserve canonical OCR fields while adding explicit review fields such as final category and notes
- [x] 1.4 Standardize user-correctable OCR and save failures around a structured error body containing at least `error_code` and `message`

## 2. Developer Usability And Packaging

- [x] 2.1 Add local run documentation covering prerequisites, environment configuration, startup steps, and endpoint locations for the full OCR module
- [x] 2.2 Add reusable packaging and embedding guidance describing which module pieces are configurable and which parts can be replaced by a host system
- [x] 2.3 Add concrete sample OCR success/error responses and reviewed save request/response examples that match the implemented contract
- [x] 2.4 Add troubleshooting guidance for common integration issues such as OCR endpoint errors, save failures, and schema drift

## 3. Validation And Final Hardening

- [x] 3.1 Add lightweight end-to-end validation artifacts such as smoke-test steps, fixtures, or scripts for happy-path and failure-path scenarios
- [x] 3.2 Verify the successful flow from receipt upload through reviewed save and confirm expected UI loading, success, and error states
- [x] 3.3 Verify OCR failure and save failure scenarios against documented HTTP status behavior and structured error payloads
- [x] 3.4 Perform a final consistency pass so documentation, examples, and implementation all reflect the same reusable module contract
