## Why

The repository still contains runnable code, tests, contracts, scripts, and docs built around a legacy receipt-persistence model even though the project architecture is now fixed around `auth_db`, `finance_db`, and stateless OCR. Those stale assumptions are now actively misleading because they suggest unsupported services, tables, and environment variables that conflict with the actual target implementation.

## What Changes

- Add a repo-wide architecture-alignment cleanup capability that identifies and replaces stale references to `receipt-save-service`, `receipt_reviews`, `receipt_db`, `ocr-audit-service`, OCR persistence tables, and single-DB `NEON_DATABASE_URL` assumptions.
- Update runtime, test, script, and contract guidance so confirmed OCR data is treated as temporary UI input that becomes a finance transaction only after user confirmation.
- Rewrite developer docs and setup docs to distinguish application services from databases and tables, and to consistently use `AUTH_DATABASE_URL` and `FINANCE_DATABASE_URL`.
- Remove or deprecate legacy receipt-persistence code paths, naming, and documentation that imply OCR is DB-backed or that receipt lifecycle state is persisted.
- **BREAKING** Retire the old receipt-centric persistence direction as an incorrect architecture for this project, including `receipt-save-service`, `receipt_reviews`, `receipt_db`, `ocr-audit-service`, raw OCR storage, OCR job storage, OCR feedback storage, and reviewed-receipt persistence targets.

## Capabilities

### New Capabilities
- `legacy-architecture-cleanup`: Define the repository-wide requirement that code, scripts, docs, and naming align to `auth-service` + `finance-service` with stateless OCR and no receipt persistence.

### Modified Capabilities
- `receipt-ocr-client-integration`: Replace save-target language that still implies reviewed-receipt or mock-save persistence with confirmed transaction creation in `finance-service`.
- `receipt-ocr-review-ui`: Update the review flow semantics so OCR output is temporary editable input and the final action creates a finance transaction, not a persisted receipt record.
- `receipt-ocr-developer-docs`: Rewrite local setup and architecture docs so they reference only the supported services, databases, env vars, and transaction persistence flow.
- `receipt-ocr-e2e-consistency`: Update the end-to-end contract so it no longer allows receipt identifiers or receipt-save semantics as the canonical success path.
- `receipt-ocr-validation-scenarios`: Update validation artifacts to verify the stateless OCR to finance transaction flow rather than OCR-to-receipt persistence.
- `receipt-ocr-mock-save`: Remove the obsolete mock reviewed-receipt save capability from the intended architecture and migration guidance.

## Impact

- Legacy runtime surface under `services/receipt-save-service`, related tests, package scripts, SQL, and env examples
- OCR docs and setup docs under `docs/`, root architecture notes, and any service README or compose guidance that still implies receipt persistence
- Contracts and fixtures that still expose reviewed-receipt or `receipt_id` semantics
- OpenSpec base specs that still describe mock save or reviewed-receipt persistence as supported behavior
- Follow-on implementation work to delete, rename, or deprecate stale folders and files after the rewrite is applied
