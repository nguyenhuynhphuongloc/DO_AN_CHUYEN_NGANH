## Context

The current receipt pipeline stores uploads correctly and preserves user ownership checks, but `POST /receipts/{id}/parse` still performs image preprocessing, PaddleOCR execution, extraction, and persistence inside the request handler. That makes API latency depend on OCR runtime, prevents efficient concurrent processing, and reloads OCR execution into the synchronous web path. The system already has the core persistence structures needed for an incremental redesign: `receipts`, `receipt_ocr_results`, `receipt_extractions`, and `receipt_jobs`.

This change spans the FastAPI receipt-service, the Next.js frontend review flow, and container runtime configuration. It also introduces a runtime-dependent behavior split between GPU-capable environments and CPU-only environments, which means the design must be explicit about initialization, fallback, and verification.

## Goals / Non-Goals

**Goals:**
- Remove preprocessing, OCR, and extraction from the blocking HTTP request path.
- Reuse `receipt_jobs` as the queue and execution-state record for async parsing.
- Keep a warm PaddleOCR model inside a dedicated worker process.
- Prefer GPU OCR when enabled and available, while falling back safely to CPU.
- Preserve current auth checks, receipt ownership checks, nullable extracted fields, OCR debug payloads, and confirm-to-finance behavior.
- Let the frontend poll for receipt readiness without changing the post-parse review form contract.

**Non-Goals:**
- Rewriting the whole receipt domain model or replacing `receipt_jobs` with an external broker.
- Introducing locale-specific OCR tuning or Vietnamese-only parsing logic.
- Changing finance-service transaction semantics or weakening token forwarding.
- Reworking the review form after parsing is complete.

## Decisions

### 1. Use `receipt_jobs` as a single parse-pipeline queue record
The worker will consume `receipt_jobs` entries with `job_type=parse` and treat `status` as the pipeline phase: `queued`, `preprocessing`, `ocr_running`, `extracting`, `ready_for_review`, or `failed`. This matches the required lifecycle more directly than keeping separate user-visible `ocr` and `extract` jobs.

Why this approach:
- It reuses the existing queue table and avoids introducing Redis, RabbitMQ, or a new jobs schema.
- It gives the frontend one authoritative processing state to poll.
- It keeps retries and failure reporting attached to the same receipt-run.

Alternatives considered:
- Keep separate `ocr` and `extract` jobs. Rejected because the requested state model describes one pipeline, and the frontend would still need a derived aggregate state.
- Add an external queue. Rejected for this change because it is a larger operational redesign than required.

### 2. Move parsing orchestration into a dedicated worker process
The API process will only create or reuse a queued parse job and return immediately. A separate worker entrypoint in receipt-service will poll for queued jobs, claim one job transactionally, preprocess the image, run OCR, run extraction, persist outputs, and finalize the receipt state.

Why this approach:
- It removes OCR latency from user-facing endpoints.
- It allows multiple worker replicas later without changing the API contract.
- It keeps OCR model lifetime independent from request concurrency.

Alternatives considered:
- FastAPI background tasks. Rejected because they still tie work to the web container lifecycle and make horizontal scaling and GPU placement less explicit.
- In-process thread pool execution. Rejected because OCR and GPU runtime management are cleaner in a dedicated worker.

### 3. Make upload auto-queue parsing and keep parse as an explicit requeue path
The upload endpoint will create the initial parse job so the target flow becomes `Upload -> Queue -> Worker -> Review`. `POST /receipts/{id}/parse` will remain available as an idempotent requeue or force-rerun endpoint for manual retry, debugging, or future admin tooling.

Why this approach:
- It aligns with the target flow and improves UX by starting work immediately after upload.
- It preserves an explicit API surface for retries without requiring the frontend review form to own orchestration.
- It limits frontend changes to status polling and conditional UI states.

Alternatives considered:
- Keep upload unchanged and make parse only queue work. Rejected because it preserves an unnecessary extra step for the normal user path.

### 4. Keep PaddleOCR warm and GPU-aware in the worker
The worker will initialize a singleton OCR service once at process start. Configuration will allow `OCR_DEVICE=auto|gpu|cpu` or equivalent flags, with startup logs stating whether PaddleOCR is using GPU or CPU. If GPU initialization fails while GPU is preferred, the worker will log the failure and retry initialization on CPU instead of exiting.

Why this approach:
- Warm initialization avoids model reload cost on every job.
- Explicit logs make runtime verification practical in both Docker and local environments.
- Automatic CPU fallback protects availability when drivers or CUDA libraries are missing.

Alternatives considered:
- Crash on GPU init failure. Rejected because availability is more important than strict device preference.
- Reinitialize PaddleOCR per job. Rejected because it adds avoidable latency and startup overhead.

### 5. Preserve current persistence contracts and nullable extraction behavior
The worker will continue writing OCR output to `receipt_ocr_results` and structured extraction output to `receipt_extractions`, including `raw_text`, `lines`, confidence data, and `extracted_json`. Missing fields remain `null`; the worker must not synthesize fake dates, totals, or merchant names to satisfy downstream forms.

Why this approach:
- It preserves the current review page contract and downstream confirm flow.
- It matches the requirement to reuse existing tables and keep uncertain values nullable.

Alternatives considered:
- Add a new normalized extraction schema. Rejected because it is unnecessary for this performance redesign.

### 6. Prevent duplicate OCR with explicit force semantics
Before enqueuing a new parse job, the API will inspect the receipt state and existing OCR/extraction rows. If completed results already exist and the caller has not requested a force-rerun, the API returns current state rather than enqueueing duplicate work. A forced rerun will create a new parse job and overwrite the persisted OCR and extraction outputs for that receipt.

Why this approach:
- It controls compute cost and avoids unnecessary worker churn.
- It still supports reprocessing after model or preprocessing changes.

Alternatives considered:
- Always enqueue a new job. Rejected because it wastes compute and complicates UI semantics.

### 7. Use polling against receipt detail instead of changing the review payload shape heavily
The frontend will continue loading the receipt detail endpoint and will poll it while the parse job is in a non-terminal processing state. The review form remains the same once the receipt reaches `ready_for_review`; only the orchestration changes.

Why this approach:
- It minimizes frontend risk and preserves the existing review and confirm screens.
- It reuses the current receipt detail response that already includes jobs, OCR debug data, and extraction results.

Alternatives considered:
- Introduce WebSockets or SSE. Rejected because polling is sufficient for this scope and simpler to deploy.

## Risks / Trade-offs

- [DB-backed queue polling can create contention under multiple workers] -> Mitigate with transactional job claiming, ordered polling, and a clear rule that only `queued` jobs are claimable.
- [GPU-enabled images increase container complexity and image size] -> Mitigate with separate CPU/GPU dependency guidance, Docker profiles or compose overrides, and explicit startup checks.
- [Auto-queue on upload changes the happy path timing] -> Mitigate by keeping review UI resilient to in-progress receipts and retaining a manual requeue endpoint.
- [Worker crash mid-job can leave stale in-progress states] -> Mitigate with heartbeat-free initial recovery rules such as retrying old non-terminal jobs that have no recent update window or were never finished.
- [PaddleOCR GPU support differs by host driver stack] -> Mitigate by treating GPU as opportunistic, not mandatory, and verifying effective device selection in logs.

## Migration Plan

1. Add worker entrypoint, queue orchestration helpers, and GPU-aware OCR initialization behind environment configuration.
2. Update upload and parse APIs to enqueue parse jobs and return current receipt state immediately.
3. Update receipt serialization and frontend review polling to recognize queued, processing, ready, and failed states.
4. Update Dockerfiles and compose configuration for CPU-only default operation plus optional GPU-capable runtime.
5. Validate with real receipt images in CPU-only and GPU-enabled runs, including failure cases and duplicate-run behavior.
6. Deploy API and worker together. Roll back by scaling down the worker and restoring synchronous parse behavior only if necessary during a short-lived recovery patch.

## Open Questions

- Should stale in-progress jobs be retried automatically after a timeout, or should the first implementation require an explicit requeue?
- Should the manual parse endpoint expose a `force` flag in the request body or via query parameter for reruns?
- Should the worker record the effective device (`gpu` or `cpu`) in `raw_json` for per-receipt auditability, or is startup/job logging sufficient?
