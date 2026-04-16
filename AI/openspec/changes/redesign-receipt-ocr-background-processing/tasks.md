## 1. Receipt-service queue orchestration

- [x] 1.1 Add queue helper logic in `microservices/receipt-service/app` to create, reuse, and claim `receipt_jobs` records with `job_type=parse` and statuses `queued`, `preprocessing`, `ocr_running`, `extracting`, `ready_for_review`, and `failed`
- [x] 1.2 Refactor `POST /receipts/upload` so it stores the file, creates the receipt, enqueues a parse job, and returns immediately without running OCR
- [x] 1.3 Refactor `POST /receipts/{id}/parse` into an asynchronous requeue endpoint that preserves ownership checks and skips duplicate OCR unless a force-rerun is requested
- [x] 1.4 Update receipt serialization and schemas so receipt detail responses expose the active parse job state needed for frontend polling and failure reporting

## 2. Worker and OCR pipeline

- [x] 2.1 Add a dedicated receipt worker entrypoint that polls queued parse jobs and claims work transactionally
- [x] 2.2 Move preprocessing, OCR, extraction, and persistence out of the synchronous API handler into the worker pipeline
- [x] 2.3 Update the OCR service to initialize PaddleOCR once per worker process, log the effective device, and support GPU-preferred or CPU-only startup via environment configuration
- [x] 2.4 Implement automatic CPU fallback when GPU initialization fails without aborting queued job processing
- [x] 2.5 Persist OCR debug output and extracted data into `receipt_ocr_results` and `receipt_extractions`, keeping missing or uncertain fields as `null`
- [x] 2.6 Mark receipt and job records consistently for success, failure, and retry-safe duplicate handling

## 3. Frontend async review flow

- [x] 3.1 Update `microservices/frontend/lib/api.ts` and `lib/types.ts` to support queued parse responses, polling, and optional force-rerun parse requests
- [x] 3.2 Update `microservices/frontend/app/receipts/upload/page.tsx` to route users into the review flow after upload while parsing continues asynchronously
- [x] 3.3 Update `microservices/frontend/app/receipts/[id]/review/page.tsx` to poll receipt status until parsing reaches `ready_for_review` or `failed`
- [x] 3.4 Keep the existing review, OCR debug, feedback, and confirm UI intact once extraction data is available

## 4. Runtime and deployment

- [x] 4.1 Update `microservices/receipt-service/requirements.txt`, Dockerfile, and runtime configuration for PaddleOCR plus configurable CPU or GPU PaddlePaddle installation
- [x] 4.2 Update `docker-compose.yml` and related env examples to run the new receipt worker and document optional GPU-enabled deployment settings
- [x] 4.3 Document how to run the pipeline in CPU-only mode, how to enable GPU mode, and how to verify the effective OCR device from logs

## 5. Validation and fixes

- [x] 5.1 Validate that upload and parse-trigger requests return immediately while jobs continue asynchronously in the worker
- [x] 5.2 Test with real receipt images covering a normal receipt, blurry receipt, long receipt, and invalid input failure handling
- [x] 5.3 Run one GPU-enabled validation and one CPU-only validation, record whether GPU was detected, and confirm CPU fallback works when GPU is unavailable
- [x] 5.4 Verify job status transitions, review-page polling behavior, OCR debug persistence, nullable extraction fields, and unchanged confirm-to-finance flow
- [x] 5.5 Capture the commands run, relevant worker logs, pass/fail outcomes, and apply minimal follow-up fixes for any issues found
