## Why

Receipt parsing currently runs OCR and extraction inside the HTTP request path, which slows the user-facing parse action and wastes the local machine GPU when it is available. This change is needed to move parsing to a production-minded background worker so Vietnamese-first OCR remains accurate while becoming faster, more resilient, and easier to operate in local Docker-based environments.

## What Changes

- Move receipt preprocessing, OCR, and extraction out of the blocking parse request path into a queued background execution flow.
- Reuse and extend `receipt_jobs` plus existing receipt status fields so queued, running, ready-for-review, and failed parsing states are visible without redesigning storage.
- Add a long-lived receipt worker process that keeps PaddleOCR warm and processes queued jobs one receipt at a time or in controlled batches.
- Update PaddleOCR runtime initialization to prefer GPU acceleration when configured and available, with safe CPU fallback when GPU support is absent or misconfigured.
- Preserve the current Vietnamese-first PaddleOCR behavior, OCR debug output, confidence metadata, nullable extracted fields, and authenticated confirm-to-finance flow.
- Update receipt-service runtime and Docker configuration so local GPU access is possible when the host supports it, and document how to run and verify GPU execution.
- Update the frontend upload/review flow to show polling-based parsing progress and transition into the existing review screen when background processing is complete.
- Prevent duplicate OCR execution for the same receipt unless parsing is explicitly re-requested.

## Capabilities

### New Capabilities
- `receipt-processing-queue`: background queueing, worker execution, GPU-aware OCR runtime selection, and frontend polling for the existing receipt parsing workflow.

### Modified Capabilities
- None.

## Impact

- `microservices/receipt-service/app/api/receipts.py`
- `microservices/receipt-service/app/services/ocr_service.py`
- `microservices/receipt-service/app/services/image_preprocess.py`
- `microservices/receipt-service/app/services/extraction_service.py`
- `microservices/receipt-service/app/models/receipt.py`
- `microservices/receipt-service/app/schemas/receipt.py`
- `microservices/receipt-service/app/core/config.py`
- New background worker module(s) in `microservices/receipt-service/app/`
- `microservices/receipt-service/Dockerfile`
- `microservices/receipt-service/requirements.txt`
- `docker-compose.yml`
- `microservices/frontend/app/receipts/upload/page.tsx`
- `microservices/frontend/app/receipts/[id]/review/page.tsx`
- `microservices/frontend/lib/api.ts`
- `microservices/frontend/lib/types.ts`
- Documentation for local GPU setup and worker operation
