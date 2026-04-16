## 1. Parser Abstraction And Configuration

- [x] 1.1 Add parser configuration fields to `microservices/receipt-service/app/core/config.py` for provider selection, Gemini API keys, Gemini model, timeout, retries, image limits, and debug mode.
- [x] 1.2 Create a parser provider interface and parser service module under `microservices/receipt-service/app/services/` that isolates vendor-specific request and response handling.
- [x] 1.3 Implement the Gemini Vision parser client with strict JSON response handling and normalized provider error mapping.
- [x] 1.4 Add service construction helpers so the worker pipeline resolves Gemini as the default parser provider without changing queue orchestration.

## 2. Receipt Parse Pipeline Refactor

- [x] 2.1 Refactor `microservices/receipt-service/app/services/parse_pipeline.py` to replace PaddleOCR plus `extract_all` with the Gemini parser flow on the primary parsing path.
- [x] 2.2 Add a normalization and validation layer for provider output that enforces nullable uncertain fields, valid dates, positive totals, and non-numeric merchant names.
- [x] 2.3 Update parse persistence so `receipt_extractions` keeps existing top-level columns while `extracted_json` stores optional fields, items, confidence, review hints, parser metadata, and normalized parser output.
- [x] 2.4 Define how `receipt_ocr_results` is populated for Gemini parser debug compatibility without fabricating OCR line output when Gemini does not return it.
- [x] 2.5 Preserve clean status transitions and failure behavior for Gemini timeouts, malformed JSON, provider auth failures, unsupported images, and temporary provider outages.

## 3. API And Frontend Contract Updates

- [x] 3.1 Update `microservices/receipt-service/app/schemas/receipt.py` and `microservices/receipt-service/app/api/receipts.py` so receipt detail responses expose the new parser/debug metadata safely.
- [x] 3.2 Update `microservices/frontend/lib/types.ts` to reflect the new extraction payload fields and parser debug metadata contract.
- [x] 3.3 Update `microservices/frontend/app/receipts/[id]/review/page.tsx` and related debug components only as needed to keep the current review page flow intact with the new parser output.
- [x] 3.4 Verify that feedback and confirm flows still work against the persisted extraction contract without changing their business behavior.

## 4. Provider Safety, Observability, And Compatibility

- [x] 4.1 Add structured logging and safe error messages around provider requests, retries, parse failures, and normalization failures in the worker path.
- [x] 4.2 Add request-size or image-size guards before provider calls so unsupported or oversized inputs fail predictably.
- [x] 4.3 Ensure ownership checks, queue semantics, worker polling, and finance confirmation behavior remain unchanged by the parser replacement.
- [x] 4.4 Add or update environment examples and service documentation for Gemini parser configuration and operational behavior.

## 5. Validation And Rollout Readiness

- [x] 5.1 Add backend tests for normalization and validation rules covering valid payloads, malformed JSON, invalid dates, weak totals, and numeric-only merchant names.
- [x] 5.2 Add worker or integration tests covering successful AI parse persistence, parse-job failure states, and review-ready state transitions.
- [ ] 5.3 Validate the new parser flow against these receipt scenarios: clear retail, restaurant subtotal/service/VAT/total, blurry receipt, long receipt, multilingual/layout-heavy receipt, visible payment method, noisy promo footer, provider failure, and invalid image.
- [ ] 5.4 Record a pass/fail validation report for the receipt scenarios in the change artifacts and capture minimal follow-up fixes required to stabilize the rollout.
