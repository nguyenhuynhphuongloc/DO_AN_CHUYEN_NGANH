## Why

Real runtime evidence shows the current PaddleOCR fast path is neither fast nor reliable enough for Vietnamese receipts. A recent parse spent about 181 seconds inside OCR alone, accepted visibly corrupted Vietnamese text, and logs confirmed the worker fell back to CPU while still using `PP-OCRv5_server_det` on the fast path.

## What Changes

- Investigate and correct the actual PaddleOCR runtime path so fast-path OCR uses a truly lightweight detector/recognizer pair instead of unintentionally relying on a heavier server detector.
- Add explicit runtime instrumentation for OCR device, GPU availability, model names, text box count, preprocessed image size, selected profile, and per-stage timings.
- Tighten the fast-path quality gate so corrupted Vietnamese output, fragmented merchant/header text, and high garbled-text ratios trigger recovery instead of being accepted.
- Investigate Docker and Paddle runtime support for NVIDIA GPU, enable GPU usage when the environment truly supports it, and preserve honest CPU fallback when it does not.
- Keep PaddleOCR and the existing session-first architecture intact; this change optimizes runtime behavior and observability rather than redesigning the flow.

## Capabilities

### New Capabilities
- `receipt-paddleocr-runtime-optimization`: Runtime model selection, device verification, and OCR instrumentation for PaddleOCR receipt parsing.

### Modified Capabilities
- `receipt-temp-parse-sessions`: Fast-path acceptance, recovery triggering, and parse timing/debug behavior change based on actual OCR quality and runtime evidence.
- `receipt-ocr-debug-panel`: Debug payloads must expose OCR runtime/device/model evidence and parse timings clearly enough to verify CPU vs GPU and fast-path vs recovery behavior.

## Impact

- Affected backend modules in `microservices/receipt-service`: Dockerfile, OCR service, image preprocessing, parse pipeline, worker logging, and configuration.
- Affected container/runtime configuration in Compose or related env settings for GPU exposure to `receipt-service` and `receipt-worker`.
- Affected frontend OCR/debug rendering so runtime/device/model metadata is visible during review.
- Validation requires real runtime evidence comparing before/after device, model selection, OCR time, total parse time, and OCR text quality for Vietnamese receipts.
