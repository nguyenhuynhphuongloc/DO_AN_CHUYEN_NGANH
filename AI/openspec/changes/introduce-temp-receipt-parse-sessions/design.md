## Context

The current receipt pipeline in `receipt-service` persists an official `Receipt` record at upload time, stores the image directly in the main uploads area, enqueues a `ReceiptJob`, and lets the worker run preprocessing, PaddleOCR, extraction, feedback, and confirmation against that official record. The frontend has already been consolidated into a single receipt workspace, but that workspace still assumes a receipt id exists immediately after upload because the backend contract is receipt-first.

This change introduces two architectural shifts at once: a temporary parse-session lifecycle before confirmation and an OCR fast-path/recovery-path split that preserves PaddleOCR while reducing unnecessary heavy work. The change touches backend data model, worker orchestration, OCR/preprocess services, frontend API handling, and rollout safety. It also overlaps in domain with the in-progress AI Vision proposal, so this design explicitly remains PaddleOCR-based and must not depend on Gemini or other external OCR providers.

Stakeholders are the receipt-service maintainers, the frontend receipt workflow owner, and anyone profiling OCR latency or debugging parse quality for Vietnamese receipts.

## Goals / Non-Goals

**Goals:**
- Allow users to upload, parse, review, edit, and confirm a receipt without creating an official receipt record before confirmation.
- Keep PaddleOCR as the OCR engine while making the default path faster and more stable for clear Vietnamese receipts.
- Run heavier preprocessing and OCR retry only when fast-path quality is insufficient.
- Preserve the current authenticated unified workspace experience and confirm-to-finance behavior.
- Record debug and timing metadata that makes path selection, OCR quality, and latency observable.
- Provide a compatibility rollout path so session-first behavior can be enabled behind a flag before legacy receipt-first upload is removed.

**Non-Goals:**
- Replacing PaddleOCR with Gemini, Tesseract, or a managed OCR provider.
- Redesigning finance-service contracts or receipt ownership rules.
- Migrating historical confirmed receipts into temporary parse sessions.
- Rewriting the frontend UX away from the existing unified receipt workspace.
- Introducing a distributed queue or new infrastructure beyond the current receipt-service worker model.

## Decisions

### 1. Use dedicated temp parse session and temp parse job models
The system will add a new temporary persistence layer rather than overloading `Receipt` and `ReceiptJob` with pre-confirm semantics.

Rationale:
- Temporary uploads, OCR attempts, reviewer edits, expiry, and cleanup have different lifecycle rules from confirmed receipts.
- Separate models make cleanup straightforward and avoid nullable overload or confusing state transitions in the confirmed tables.
- Existing confirmed receipt logic can remain stable for historical data and post-confirm flows.

Alternatives considered:
- Reusing `Receipt` with a pre-confirm status was rejected because it keeps the current persistence-at-upload problem and makes cleanup/auditing ambiguous.
- Reusing `ReceiptJob` was rejected because temp-session jobs need independent retention and ownership semantics.

### 2. Make `POST /receipts/upload` session-first behind a compatibility flag
The canonical new behavior is that upload creates a temp parse session and returns session-first data. During rollout, the backend will gate this behavior behind a feature flag and preserve a transitional-compatible response shape so the current frontend can migrate incrementally.

Rationale:
- Upload is the entry point to the workflow and must eventually move to session-first semantics.
- A compatibility phase reduces frontend/backend coordination risk and allows non-prod validation before switching defaults.

Alternatives considered:
- Adding a brand-new `/receipts/sessions/upload` endpoint and leaving `/receipts/upload` unchanged was rejected because it prolongs duplicate contracts and splits the primary workflow.
- Immediate breaking change without a flag was rejected because the repo already has a working frontend tied to the old contract.

### 3. Keep the frontend unified workspace and adapt it to session-first IDs
The frontend will continue using the existing one-page receipt workspace. The workspace will prefer a returned `sessionId` after upload, poll session endpoints before confirmation, and switch to the official receipt id only after confirm completes.

Rationale:
- The UI is already unified; the real change is backend identity and payload flow, not page structure.
- This keeps product behavior stable while aligning API contracts with temporary parsing.

Alternatives considered:
- Reintroducing separate upload and review pages was rejected because it would reverse the current UX direction.

### 4. Split OCR into explicit fast and recovery profiles
The OCR service will expose two parameterized profiles:
- `fast`: Vietnamese-capable mobile/fast PaddleOCR config, light preprocessing, one OCR pass, conservative post-processing.
- `recovery`: heavier preprocessing with deskew/rotation/stronger cleanup and at most one extra OCR retry.

The parse pipeline will always try fast first, then run recovery only when the quality gate fails.

Rationale:
- Clear receipts should not pay the cost of the current always-heavier pipeline.
- The quality gate preserves reliability when fast-path output is too weak for review.

Alternatives considered:
- Running the heavy path for every receipt was rejected because it preserves current latency costs.
- Multiple cascading retries were rejected because they would create unstable runtimes and poor predictability.

### 5. Use extraction-aware quality gates
Fast-path acceptance will require a combination of OCR and extraction signals:
- acceptable OCR confidence
- non-corrupted text ratio
- minimum OCR output length for non-empty images
- presence of critical fields, especially total amount and a plausible merchant/date candidate
- orientation/distortion metadata that does not strongly indicate correction is still needed

Rationale:
- OCR confidence alone is not enough; a confident but unusable extraction is still a failed review outcome.
- Extraction-aware gating matches what the user actually needs before confirmation.

Alternatives considered:
- Confidence-only gating was rejected as too brittle.
- Always attempting recovery whenever any optional field is missing was rejected because it would over-trigger the heavy path.

### 6. Persist debug and timing metadata on temp sessions first, then snapshot on confirm
All pre-confirm OCR raw text, line output, path selection, preprocessing metadata, and per-stage timings will be stored on temp parse sessions. Confirm will copy or snapshot the finalized OCR/extraction payload into the official receipt persistence model.

Rationale:
- Temp sessions are the true source of pre-confirm parse state.
- Confirmed receipts still need an auditable extraction snapshot for downstream review/debug.

Alternatives considered:
- Writing OCR/extraction only after confirm was rejected because the review UI needs those fields before confirm.

### 7. Default retention policy favors cleanup before confirm and retention after confirm
- Temporary uploads live in temp storage only.
- On confirm, the original image is promoted or copied into permanent receipt storage and retained by default.
- Expired unconfirmed sessions delete temp image plus temp OCR/extraction payload after a grace period.

Rationale:
- This avoids creating permanent artifacts for abandoned uploads while preserving confirmed evidence by default.

Alternatives considered:
- Deleting confirmed images by default was rejected because it weakens audit/debug support.
- Keeping expired temp sessions indefinitely was rejected because it preserves current storage bloat.

## Risks / Trade-offs

- [Compatibility complexity] -> Mitigate with a feature flag, transitional upload response, and frontend support for both response shapes during rollout.
- [State duplication between temp session and confirmed receipt] -> Mitigate by centralizing confirm transition in one service that copies finalized fields and debug snapshots deterministically.
- [Worker complexity increases] -> Mitigate by reusing current queue/worker patterns and limiting recovery to one additional pass.
- [Cleanup can race with active review] -> Mitigate by using explicit session statuses, `expires_at`, and a grace period before deletion.
- [Spec overlap with AI Vision change] -> Mitigate by keeping this change self-contained, explicitly PaddleOCR-based, and avoiding shared provider abstractions tied to Gemini.
- [Debug payload size grows] -> Mitigate by scoping persisted debug metadata to required OCR lines, timings, profile decisions, and preprocess summaries rather than storing arbitrary blobs.

## Migration Plan

1. Add temp parse session and temp parse job schema plus configuration flags without changing existing confirmed receipt tables or legacy routes by default.
2. Implement session-first backend endpoints, temp worker flow, fast/recovery OCR path selection, and cleanup logic behind a feature flag.
3. Update the frontend unified receipt workspace to accept either the legacy upload response or the new session-first response, preferring session ids when present.
4. Enable the feature flag in non-production environments and validate upload, parse, feedback, confirm, timing metadata, and cleanup behavior.
5. Switch the feature flag on by default after successful validation and keep the compatibility response during a short migration window.
6. In a later cleanup change, remove the legacy receipt-first upload path once the frontend and tests no longer rely on it.

Rollback:
- Disable the feature flag to return `POST /receipts/upload` to legacy receipt-first behavior.
- Leave temp session tables in place; they can remain unused without affecting confirmed receipts.

## Open Questions

- None for this proposal phase. The change intentionally locks the default retention, feature-flagged rollout, and dedicated temp-job model so implementation can proceed without additional architectural decisions.
