## 1. Queue and status plumbing

- [x] 1.1 Refactor `microservices/receipt-service/app/api/receipts.py` so the parse-trigger endpoint enqueues or reuses a parse job and returns immediately instead of running preprocessing, OCR, and extraction inline.
- [x] 1.2 Extend `microservices/receipt-service/app/models/receipt.py` and `microservices/receipt-service/app/schemas/receipt.py` so `receipt_jobs` and receipt detail responses expose the queue/progress states needed for polling: `queued`, `preprocessing`, `ocr_running`, `extracting`, `ready_for_review`, and `failed`.
- [x] 1.3 Add idempotency and duplicate-prevention logic so a receipt with an active or already-completed parse is not reprocessed unless explicitly requested.

## 2. Background worker execution

- [x] 2.1 Create receipt-service worker module(s) and entrypoint(s) that poll queued `receipt_jobs`, claim one job atomically, and keep a warm OCR service instance alive across jobs.
- [x] 2.2 Move the existing preprocessing, OCR persistence, extraction persistence, and receipt/job status transitions into reusable worker-side functions shared with the current Vietnamese-first OCR pipeline.
- [x] 2.3 Add failure handling and stale-job recovery so worker crashes or OCR errors leave explicit job states and error messages instead of hanging the receipt in a running state.

## 3. GPU-aware OCR runtime

- [x] 3.1 Extend `microservices/receipt-service/app/core/config.py` and `microservices/receipt-service/app/services/ocr_service.py` with environment-driven GPU/CPU device configuration, GPU-first initialization, and safe CPU fallback.
- [x] 3.2 Make the OCR runtime log whether PaddleOCR is running on GPU or CPU and preserve existing OCR debug output, confidence metadata, and Vietnamese-first language behavior.
- [x] 3.3 Update `microservices/receipt-service/requirements.txt`, `microservices/receipt-service/Dockerfile`, and related runtime assumptions so local GPU-capable PaddlePaddle/PaddleOCR execution is supported when the host machine and Docker runtime allow it.

## 4. Frontend progress and review flow

- [x] 4.1 Update `microservices/frontend/lib/types.ts` and `microservices/frontend/lib/api.ts` to represent queued background job states and receipt progress during parsing.
- [x] 4.2 Update `microservices/frontend/app/receipts/upload/page.tsx` and `microservices/frontend/app/receipts/[id]/review/page.tsx` to poll receipt/job state, show queued/processing/failed/ready status, and stop polling when parsing reaches a terminal state.
- [x] 4.3 Preserve the current review and confirm behavior once parsing is complete, including editable extracted fields, nullable missing values, and the existing confirm-to-finance flow.

## 5. Runtime documentation and validation

- [x] 5.1 Update `docker-compose.yml` and project documentation to describe how to run the API and worker together, how to enable GPU access locally, and how to verify GPU usage from logs.
- [x] 5.2 Validate the new execution flow for GPU available, GPU unavailable with CPU fallback, one clear Vietnamese receipt, one blurry receipt, one long receipt, and one failed OCR case.
- [x] 5.3 Verify acceptance criteria: upload/parse requests return without blocking on OCR, the worker performs background OCR/extraction, GPU preference and CPU fallback both behave safely, and the review/confirm workflow has no regression.
