## Why

The current receipt parsing flow runs OCR and extraction inside the request-response cycle, which makes receipt parsing slow, ties API latency to OCR runtime, and limits throughput under concurrent uploads. Moving parsing into a background pipeline now is necessary to preserve the existing review-and-confirm workflow while making the system responsive, scalable, and able to use GPU acceleration safely when available.

## What Changes

- Change the receipt upload or parse-trigger flow so it persists the receipt, creates a queued parsing job, and returns immediately without blocking on OCR.
- Introduce asynchronous receipt job processing that reuses `receipt_jobs` to drive preprocessing, OCR, extraction, and failure handling through explicit job states.
- Add a long-lived OCR worker that keeps PaddleOCR warm, prefers GPU execution when configured and available, and falls back to CPU automatically when GPU is unavailable or misconfigured.
- Preserve the existing receipt review and confirm flow by keeping `receipts`, `receipt_ocr_results`, `receipt_extractions`, and `receipt_jobs` as the core data structures.
- Extend receipt status reporting so the frontend can poll for `queued`, processing, ready, and failed states before loading the existing review page.
- Prevent duplicate OCR work by reusing existing OCR and extraction outputs unless a parse is explicitly re-requested.
- Update runtime and Docker configuration so the receipt service can run in CPU-only environments and in GPU-enabled environments with clear verification guidance.

## Capabilities

### New Capabilities
- `receipt-async-ocr-processing`: Queue and process receipt OCR and extraction asynchronously with GPU-aware PaddleOCR execution, CPU fallback, duplicate-run protection, and status-driven frontend review readiness.

### Modified Capabilities
- None.

## Impact

- Affected code: `microservices/receipt-service/app/api`, `app/services`, `app/models`, `app/schemas`, worker entrypoints, and runtime configuration; `microservices/frontend/app/receipts`, `components`, and `lib`; Docker and compose files for receipt-service runtime.
- Affected APIs: receipt upload or parse-trigger endpoints return immediately after job creation; receipt detail or status responses expose queued, processing, ready-for-review, and failed state needed for polling.
- Dependencies: PaddleOCR runtime packages, optional GPU-capable PaddlePaddle build, worker process support, and container runtime configuration for GPU passthrough.
- Systems: receipt-service async processing, frontend receipt status UX, deployment/runtime documentation, and end-to-end receipt-to-finance confirmation behavior.
