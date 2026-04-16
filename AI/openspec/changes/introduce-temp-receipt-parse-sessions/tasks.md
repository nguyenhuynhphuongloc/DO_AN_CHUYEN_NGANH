## 1. Temp session persistence and configuration

- [x] 1.1 Add receipt-service configuration for session-first rollout, temp session expiry, cleanup grace period, and image retention policy defaults.
- [x] 1.2 Add database models and migrations for temporary parse sessions and temporary parse jobs without changing historical confirmed receipt rows.
- [x] 1.3 Add temp storage path handling and image promotion helpers for temporary upload, permanent retention after confirm, and cleanup deletion.

## 2. Session-first receipt API

- [x] 2.1 Refactor `POST /receipts/upload` to support the feature-flagged session-first flow while preserving legacy receipt-first behavior when the flag is off.
- [x] 2.2 Add session-first detail, parse, feedback, and confirm endpoints under `/receipts/sessions/{session_id}` with ownership enforcement.
- [x] 2.3 Update receipt-service schemas and serializers so transitional upload responses and session detail responses expose session state, OCR/debug payloads, extracted fields, and confirm results safely.

## 3. Temp worker flow and OCR path selection

- [x] 3.1 Add queue helpers and worker claim logic for temporary parse jobs without reusing the confirmed receipt job model.
- [x] 3.2 Refactor image preprocessing into explicit light and heavy profiles with debug metadata for applied steps and safe long-receipt handling.
- [x] 3.3 Refactor the OCR service to expose fast and recovery profiles with Vietnamese-capable PaddleOCR configuration, profile metadata, and singleton reuse.
- [x] 3.4 Update the temp parse pipeline to run fast-path-first OCR, apply the extraction-aware quality gate, optionally run one recovery attempt, and persist timings plus path-selection metadata on the temp session.

## 4. Extraction and confirm transition

- [x] 4.1 Tighten extraction handling so critical fields are confidence-aware, optional fields remain nullable, and totals/subtotals/tax/discount are distinguished by labels and context.
- [x] 4.2 Persist reviewer edits on the temp session instead of mutating an official receipt before confirmation.
- [x] 4.3 Implement a centralized confirm transition that creates the official receipt, snapshots confirmed OCR/extraction data, creates the finance transaction, links `finance_transaction_id`, and finalizes the temp session.

## 5. Frontend unified workspace migration

- [x] 5.1 Update frontend receipt API helpers and types to accept transitional upload responses and session-first receipt workflow payloads.
- [x] 5.2 Refactor the unified receipt workspace to use session ids for upload, polling, feedback, retry parse, and confirm before official receipt creation.
- [x] 5.3 Update OCR/debug and success-state rendering so the page shows session-first parse metadata before confirm and official receipt/finance references after confirm.

## 6. Cleanup and rollout safety

- [x] 6.1 Add temp session expiry and cleanup logic for abandoned sessions, including temp image and temp data deletion after the configured grace period.
- [x] 6.2 Add structured logging and debug metadata for session lifecycle, path selection, timings, cleanup actions, and compatibility-mode behavior.
- [x] 6.3 Document the staged rollout plan, feature flag behavior, rollback path, and default retention policy in env/example docs or operational notes.

## 7. Validation

- [ ] 7.1 Validate clear Vietnamese, rotated, blurry/noisy, and long receipts to confirm fast path vs recovery path behavior, nullable weak fields, and improved review readiness.
- [ ] 7.2 Validate session-first confirm behavior end to end: reviewer edits, official receipt creation only at confirm, finance transaction creation, and permanent image retention after confirm.
- [ ] 7.3 Validate abandoned temp session expiry/cleanup, ownership enforcement on all session endpoints, and compatibility-mode frontend behavior while legacy upload remains available behind the flag.
