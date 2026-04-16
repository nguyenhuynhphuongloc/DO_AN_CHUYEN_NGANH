## Why

The current receipt pipeline creates an official `Receipt` row as soon as the image is uploaded and then runs a relatively heavy OCR path for every parse job. That makes iteration slower, persists records that the user may abandon before confirmation, and couples the unified review UI to a receipt-first backend contract that no longer fits the intended workflow.

## What Changes

- Introduce a temporary parse-session lifecycle for receipt uploads so images, OCR output, reviewer edits, and parse jobs exist in a temporary store until the user confirms the final fields.
- Add a session-first async parsing flow with a dedicated temp parse job model, while keeping PaddleOCR and the existing confirm-to-finance workflow.
- Refactor OCR execution into an explicit fast path and recovery path so clear receipts use a lightweight Vietnamese-capable OCR pipeline and heavier preprocessing/retry runs only when quality gates fail.
- Add timing and debug metadata for queue delay, preprocessing, OCR, extraction, and total parse duration to support performance tuning and path selection debugging.
- **BREAKING**: change `POST /receipts/upload` toward a session-first contract, with a transitional-compatible response phase controlled by a feature flag so the existing unified frontend workspace can migrate safely.
- Keep official receipt persistence, confirmed OCR/extraction snapshots, and finance transaction creation deferred until the user confirms the extracted fields.
- Add temp-session expiration and cleanup behavior, including default deletion of expired temporary images and temp OCR/extraction data after a grace period.

## Capabilities

### New Capabilities
- `receipt-temp-parse-sessions`: Temporary upload, async parse, review, and confirm flow for receipts before official persistence.

### Modified Capabilities
- `receipt-jwt-user-enforcement`: Receipt ownership and authenticated access must apply to temporary parse sessions as well as confirmed receipts.
- `frontend-authenticated-api-calls`: The authenticated frontend receipt workflow must support session-first endpoints and transitional upload responses without duplicating auth logic.
- `receipt-ocr-debug-panel`: OCR/debug payloads and review rendering must support session-first parsing metadata, fast/recovery path details, and timing instrumentation.

## Impact

- Affected backend modules in `microservices/receipt-service`: receipt models/schemas, API routes, async queue and worker flow, OCR service, preprocessing, extraction, confirm persistence, and cleanup logic.
- Affected frontend modules in `microservices/frontend`: receipt API client, types, unified receipt workspace, polling behavior, and confirm success state.
- New temporary persistence and cleanup behavior in the receipt database and file storage layout; confirmed receipt tables remain in place for post-confirm data.
- New feature-flagged compatibility behavior for `POST /receipts/upload` and the review flow so rollout can be staged without breaking the current unified frontend immediately.
