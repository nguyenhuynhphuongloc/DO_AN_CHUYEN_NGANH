## 1. Veryfi Parser Foundation

- [x] 1.1 Add Veryfi parser configuration fields to `microservices/receipt-service/app/core/config.py` for credentials, authentication inputs, timeout, retries, and parser debug behavior.
- [x] 1.2 Create a parser-oriented service abstraction in `microservices/receipt-service/app/services/` that resolves Veryfi as the only primary provider.
- [x] 1.3 Implement the Veryfi provider client with request signing/authentication, timeout handling, retry behavior, and safe provider error mapping.
- [x] 1.4 Update worker and application startup so runtime checks validate the Veryfi parser path instead of warming up local OCR as the primary parse engine.

## 2. Parse Pipeline Refactor

- [x] 2.1 Refactor `microservices/receipt-service/app/services/parse_pipeline.py` so the primary parse flow calls the Veryfi provider path instead of local OCR plus `extract_all`.
- [x] 2.2 Add normalization and validation logic that maps Veryfi output into stable review-safe extraction fields and nullable uncertain values.
- [x] 2.3 Repurpose parser result persistence so `receipt_ocr_results` stores parser/provider debug compatibility data without fabricating OCR-only artifacts.
- [x] 2.4 Update parse-job state handling and error paths so Veryfi request failures, malformed provider output, and unsupported files fail cleanly without local OCR fallback.

## 3. Review Data Contract And Persistence

- [x] 3.1 Update persistence mapping so `receipt_extractions` keeps the current top-level fields while `extracted_json` stores normalized parser text, structured JSON, field confidence, review hints, and parser metadata.
- [x] 3.2 Ensure parse sessions and receipt finalization preserve the existing confirm-only transaction creation rule while carrying forward the new parser result structure.
- [x] 3.3 Update backend response schemas and serializers so receipt detail responses expose parser text, structured JSON, autofill-ready fields, and parser debug metadata safely.

## 4. Frontend Review Experience

- [x] 4.1 Update frontend receipt types to reflect the Veryfi-backed parser output and parser-debug payload shape.
- [x] 4.2 Replace the OCR-centric review/debug panel with a parser-centric panel that shows readable parser text and structured JSON in read-only form.
- [x] 4.3 Keep the existing review form flow but ensure autofilled merchant/date/amount and related fields are populated from normalized parser output.
- [x] 4.4 Verify that user edits still override autofilled values and that transaction persistence happens only after explicit submit/confirm.

## 5. Validation And Rollout Readiness

- [x] 5.1 Add backend tests for provider normalization, nullable field handling, parser failure paths, and review-hint generation.
- [x] 5.2 Add integration coverage for successful Veryfi parse persistence, review-ready job transitions, and confirm-to-transaction behavior.
- [x] 5.3 Validate the end-to-end flow against representative receipts, including clean receipts, long receipts, noisy receipts, missing-field cases, and provider failure cases.
- [x] 5.4 Record rollout notes and any stabilization follow-ups in the change artifacts before implementation is considered complete.
