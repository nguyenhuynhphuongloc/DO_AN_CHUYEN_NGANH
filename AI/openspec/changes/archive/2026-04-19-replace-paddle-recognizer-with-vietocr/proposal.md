## Why

The current receipt OCR pipeline is still anchored to PaddleOCR recognition models that are optimized for general Latin text, not Vietnamese receipt text with dense diacritics. Real project evidence shows that even after runtime and GPU improvements, receipt text can remain visibly corrupted, which reduces extraction quality and reviewer trust while leaving the rest of the async worker architecture otherwise sound.

## What Changes

- Refactor the receipt OCR pipeline into explicit detector and recognizer abstractions so Paddle text detection and text recognition can evolve independently.
- Keep Paddle text detection for bounding-box discovery, ordering, and line grouping, but replace the primary text recognizer with VietOCR over cropped text regions.
- Add a configurable recognizer switch so runtime can choose `vietocr` as the primary path and retain `paddle` as a rollback-safe fallback recognizer.
- Preserve the existing async upload -> queued job -> worker -> extraction -> review architecture and the current OCR result contract consumed by extraction and the review UI.
- Support GPU execution for VietOCR when CUDA is available and preserve CPU fallback when it is not.
- Batch recognize cropped text regions where practical, record detection/crop/recognition/total OCR timings, and keep OCR debug output intact.
- Add a benchmark/evaluation path to compare Paddle recognition versus VietOCR recognition on real Vietnamese receipt images.
- Add a markdown implementation report documenting changed files, classes, and flow for the recognizer migration.

## Capabilities

### New Capabilities
- `receipt-vietocr-recognition`: Hybrid OCR pipeline that keeps Paddle detection and swaps recognition between VietOCR and Paddle via configuration while preserving stable downstream receipt parsing contracts.

### Modified Capabilities
- `receipt-ocr-debug-panel`: OCR debug payloads must expose detector vs recognizer timing, selected recognizer backend, line ordering evidence, and benchmark-friendly runtime metadata for the new hybrid OCR path.

## Impact

- Affected backend modules in `microservices/receipt-service`: OCR service, preprocessing/cropping flow, parse pipeline, worker logging, config, Dockerfile, requirements, and benchmark tooling.
- Affected runtime and deployment configuration for `receipt-service` / `receipt-worker` so VietOCR dependencies, CUDA usage, and recognizer-selection flags are available without changing queue or API ownership flow.
- Minimal API/debug payload changes in `receipt-service` and corresponding type/debug rendering updates in the frontend so the review UI continues to work without a workflow rewrite.
- Additional engineering documentation in markdown covering the recognizer refactor, changed files, and rollback path.
