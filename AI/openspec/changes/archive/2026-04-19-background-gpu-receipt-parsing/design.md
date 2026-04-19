## Context

The current receipt flow already stores uploaded files, receipt rows, OCR results, extraction results, and `receipt_jobs`, but the parse endpoint in [`receipts.py`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/receipt-service/app/api/receipts.py) still performs preprocessing, PaddleOCR, and extraction synchronously inside the HTTP request. That makes the frontend wait on the slowest part of the pipeline, reloads operational pressure onto the API process, and leaves the local machine GPU unused even though recent OCR work already moved recognition toward a Vietnamese-first PaddleOCR setup in [`ocr_service.py`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/receipt-service/app/services/ocr_service.py). The service also already has a `ReceiptJob` model in [`receipt.py`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/receipt-service/app/models/receipt.py), a Dockerized runtime in [`Dockerfile`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/receipt-service/Dockerfile), and frontend receipt upload/review pages in [`page.tsx`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/frontend/app/receipts/upload/page.tsx) and [`page.tsx`](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/frontend/app/receipts/[id]/review/page.tsx).

This change is cross-cutting because it alters execution flow, introduces a worker process, changes queue semantics, expands runtime configuration for GPU use, updates Docker and local deployment guidance, and adds frontend polling/progress behavior while preserving the existing review and confirm workflow.

## Goals / Non-Goals

**Goals:**
- Move preprocessing, OCR, and extraction out of the blocking API request path into background job execution.
- Reuse existing receipt, OCR result, extraction, and `receipt_jobs` structures instead of redesigning storage.
- Use local GPU acceleration for PaddleOCR when available and configured, with explicit CPU fallback when it is not.
- Keep the OCR model warm in a long-lived worker process rather than reloading on every parse request.
- Preserve Vietnamese-first OCR behavior, OCR debug metadata, nullable extracted fields, authenticated ownership, and confirm-to-finance flow.
- Expose queue/progress state to the frontend so users can observe `queued`, `processing`, `ready_for_review`, and `failed` transitions.
- Prevent duplicate OCR execution for the same receipt unless the user explicitly re-queues parsing.

**Non-Goals:**
- Replacing PaddleOCR with another OCR engine or introducing an external queue platform in this change.
- Rewriting the overall microservice architecture or creating a separate distributed worker service.
- Changing finance-service transaction semantics or bypassing manual review/confirmation.
- Adding unsafe fallback values for missing dates or other extracted fields.

## Decisions

### Reuse the database as the queue source of truth

The worker will poll `receipt_jobs` for queued parse jobs instead of introducing Redis, Celery, RabbitMQ, or another queue system. Each parse request will create or reuse a `ReceiptJob` entry with expanded status values such as `queued`, `preprocessing`, `ocr_running`, `extracting`, `ready_for_review`, and `failed`, and receipt-level status will move in parallel.

Why this over adding a dedicated queue broker: the system already persists receipts and job rows in Postgres, and the requested change is incremental and local-development friendly.

Alternative considered: in-process FastAPI background tasks. Rejected because they still bind work to API container lifecycle, make warm OCR model reuse harder, and are brittle for GPU-bound long-running jobs.

### Add a dedicated receipt worker process inside the existing receipt-service codebase

The implementation will introduce a worker entrypoint under `receipt-service` that shares the same models, settings, preprocessing, OCR, and extraction modules as the API. The worker will loop over queued jobs, atomically claim one, execute preprocessing, OCR, extraction, and persistence, then update job and receipt status. This keeps the OCR model warm for repeated jobs and avoids cross-service duplication.

Why this over embedding worker logic in the API process: the worker needs a different concurrency model and lifecycle, and warm OCR/GPU model state should be isolated from request serving.

Alternative considered: adding a separate standalone microservice. Rejected because it adds coordination overhead and container complexity without clear benefit for the current scope.

### Make OCR runtime explicitly GPU-aware with safe CPU fallback

`ocr_service.py` and `core/config.py` will be extended so OCR device preference is driven by environment variables such as enabled/disabled GPU mode, preferred device string, and fallback behavior. The worker will attempt GPU initialization first when configured, log whether the selected device is GPU or CPU, and fall back to CPU if GPU initialization fails or the runtime lacks GPU support.

Why this over hard-coding GPU usage: local environments vary, and the system must still run safely on machines without configured CUDA support.

Alternative considered: maintaining separate CPU and GPU worker implementations. Rejected because it duplicates logic and configuration.

### Parse endpoint becomes queueing endpoint with idempotent behavior

The parse-trigger endpoint will stop doing OCR work inline. Instead, it will create or resume a queued parse job, update receipt status, and return immediately with the refreshed receipt detail plus current job state. If an OCR/extraction result already exists and no explicit reprocess flag is supplied, the endpoint will avoid enqueueing duplicate work.

Why this over keeping a synchronous parse endpoint alongside an async one: two parsing modes increase ambiguity and make progress/state handling harder for the frontend.

Alternative considered: moving queue creation into upload only. Rejected because the current flow explicitly triggers parse from the frontend, and preserving that step is lower risk.

### Frontend will poll receipt detail instead of adding a separate realtime channel

The upload/review flow will use periodic polling of the existing receipt detail endpoint to observe job and receipt status changes. The upload page may redirect to review immediately after upload, and the review page will show progress until parsing completes, then preserve its current extracted-field editing and confirm behavior.

Why this over WebSockets or SSE: polling is sufficient for a single-user local receipt workflow and avoids introducing another realtime subsystem.

Alternative considered: building a dedicated job-status endpoint. Rejected because receipt detail already contains job history and is enough for this workflow with minor schema/type updates.

### Runtime and Docker configuration will be extended, not replaced

The receipt-service Docker/runtime setup will be updated to support a separate worker process and optional GPU access in local Docker environments. Documentation will cover CPU-only usage, GPU-enabled usage, and how to verify the OCR runtime’s selected device from logs. The base runtime will remain usable without GPU.

Why this over hard-switching to a GPU-only image: CPU fallback is a required constraint and the development environment may not have a compatible GPU.

## Risks / Trade-offs

- [Database polling can be less scalable than a broker-backed queue] -> Mitigation: keep the worker claim logic atomic and bounded, and scope this design to the current local/low-volume architecture.
- [GPU-capable PaddlePaddle installation differs from CPU installation and may be platform-specific] -> Mitigation: make device preference configurable, document supported local Docker paths, and keep CPU fallback as the default safe path.
- [Job duplication or race conditions can create repeated OCR runs] -> Mitigation: claim jobs transactionally, reuse existing unfinished jobs, and skip requeueing receipts already ready for review unless reprocess is explicitly requested.
- [Worker crashes can leave jobs stuck in running-like states] -> Mitigation: persist timestamps/status transitions, treat stale claimed jobs as recoverable on restart, and keep failure states explicit.
- [Frontend polling can briefly lag behind actual worker completion] -> Mitigation: keep polling intervals short while processing, stop polling when the job reaches a terminal state, and route to the existing review UI once ready.
