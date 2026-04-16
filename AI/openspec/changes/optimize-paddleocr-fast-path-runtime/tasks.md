## 1. Runtime investigation and instrumentation

- [x] 1.1 Inspect the live receipt worker/container to record actual OCR device, Paddle CUDA support, GPU visibility, and current resolved detector/recognizer models.
- [x] 1.2 Add OCR runtime instrumentation for actual device, CUDA availability, resolved model names, enabled optional features, line count, and preprocessed image dimensions.
- [x] 1.3 Persist the new runtime evidence in logs and OCR debug payloads without breaking the review flow.

## 2. Fast-path model and quality-gate fixes

- [x] 2.1 Refactor the fast path to use an explicitly lightweight detector/recognizer configuration instead of unintentionally resolving to a heavy server detector.
- [x] 2.2 Keep expensive orientation/unwarping features out of the fast path unless explicitly required, and record those flags in debug metadata.
- [x] 2.3 Tighten the fast-path quality gate so corrupted Vietnamese text, fragmented merchant/header lines, weak merchant quality, or excessive garbled-text ratio trigger recovery automatically.

## 3. GPU runtime enablement

- [x] 3.1 Inspect Dockerfile, Compose, and environment settings to determine why the current worker falls back to CPU.
- [x] 3.2 If the current host/runtime supports NVIDIA GPU, update the receipt-service/worker container setup and Paddle package/runtime so OCR actually runs on GPU.
- [x] 3.3 If GPU cannot be enabled in the current environment, document the exact blocker and preserve an optimized CPU fallback path.

## 4. Validation and evidence

- [x] 4.1 Run before/after validation on the same or equivalent Vietnamese receipt and compare OCR device, model names, OCR time, total parse time, recovery behavior, and OCR text quality.
- [x] 4.2 Confirm whether fast path no longer uses a heavy server detector unintentionally.
- [x] 4.3 Record a concise validation summary with the exact root cause of the previous OCR latency and whether OCR is now using CPU or NVIDIA GPU in practice.
