## 1. Baseline investigation and layout insertion point

- [x] 1.1 Inspect the current session-first parse flow, OCR service, extraction service, and OCR debug payload path to identify the exact insertion point for optional layout recognition.
- [x] 1.2 Define normalized layout block models and label taxonomy for receipt regions (`header`, `items`, `totals`, `footer`, optional payment/info).
- [x] 1.3 Add config flags and runtime defaults for enabling, disabling, and tuning layout detection without breaking current parse success behavior.
- [x] 1.4 Map raw detector labels into a canonical internal taxonomy (`header`, `items`, `totals`, `footer`, `payment_info`, `metadata`) and define debug/runtime behavior for unknown labels.

## 2. Layout detection service and post-processing

- [x] 2.1 Add Ultralytics dependency/runtime integration needed for YOLO-based layout inference in `receipt-service`.
- [x] 2.2 Implement `layout_service.py` with cached model loading, externally supplied weight path support, and inference-only runtime behavior.
- [x] 2.3 Implement `layout_postprocess.py` to normalize labels, filter by confidence, sort blocks, and produce ordered semantic layout blocks.
- [x] 2.4 Ensure layout failure, missing weights, or empty detections automatically fall back to the current whole-image OCR path without failing the parse job.
- [x] 2.5 Cap OCR-eligible layout blocks and implement pruning/merge rules to control OCR overhead on long or noisy receipts.
- [x] 2.6 Rewrite `layout_postprocess.py` to use receipt-oriented semantic assignment rules that separate top metadata, primary items body, totals bands, and footer/barcode regions more reliably than the original generic heuristics.

## 3. OCR pipeline integration

- [x] 3.1 Integrate optional layout detection after preprocessing and before OCR in the parse pipeline / OCR coordinator.
- [x] 3.2 Run the current Paddle detector and recognizer pipeline inside each ordered layout block while preserving stable row grouping within each block.
- [x] 3.3 Flatten block OCR output back into the existing `raw_text` and `lines` contract so downstream consumers remain compatible.
- [x] 3.4 Add block-level OCR metadata including layout label, layout confidence, bbox, block OCR text, line counts, and timings.
- [x] 3.5 Preserve whole-image OCR as the exact fallback path when layout is disabled or unusable.
- [x] 3.6 Implement the final layout strategy for both OCR profiles:
  - layout inside `fast`
  - layout inside `recovery`
  - no extra profile branch beyond the existing fast/recovery decision

## 4. Block-aware extraction

- [x] 4.1 Refactor extraction to optionally consume layout block metadata while keeping the current extraction entrypoints and payload contracts intact.
- [x] 4.2 Make merchant/date/header fields prefer header-like blocks, item rows prefer item blocks, and summary amounts prefer totals blocks.
- [x] 4.3 Persist additive field provenance showing which layout block contributed to each selected field.

## 5. API, debug, and frontend compatibility

- [x] 5.1 Extend receipt/session OCR debug serialization additively with layout metadata while preserving existing keys.
- [x] 5.2 Update frontend OCR debug types and debug panel rendering to show detected layout blocks, OCR text per block, and field provenance without changing the review workflow.
- [x] 5.3 Validate backward compatibility of receipt detail response, session detail response, OCR debug payload shape, and frontend production build.
  - Backend receipt/session payload compatibility validated through runtime artifacts and code-path inspection.
  - Frontend production build validated successfully with `docker compose build frontend`, including full Next.js compile, type-check, and route generation output.

## 6. Benchmarking and validation

- [x] 6.1 Add benchmark/evaluation scripts to compare no-layout OCR and layout-aware OCR on the same Vietnamese receipt images.
- [x] 6.2 Make benchmark outputs emit both JSON and Markdown summary artifacts.
- [x] 6.3 Validate parse flow with `OCR_LAYOUT_ENABLED=false`.
- [x] 6.4 Validate parse flow with `OCR_LAYOUT_ENABLED=true`.
- [x] 6.5 Validate both recognizer modes with layout integration:
  - `OCR_RECOGNIZER_BACKEND=vietocr`
  - `OCR_RECOGNIZER_BACKEND=paddle`
- [x] 6.6 Validate fallback behavior when layout detection fails or is disabled.
- [x] 6.7 Compare extracted merchant/date/total quality between no-layout and layout-aware modes on the same receipt set and summarize whether layout improved, regressed, or matched baseline per receipt.

## 7. Documentation and rollout safety

- [x] 7.1 Produce `implementation-report.md` covering changed files, classes, flow changes, config flags, and rollback behavior.
- [x] 7.2 Produce `validation.md` summarizing compatibility, fallback, and benchmark findings.
- [x] 7.3 Produce `layout-ocr-architecture.md` documenting the old path, new layout-aware path, fallback path, file/class responsibilities, config flags, and rollback steps.
- [x] 7.4 Update Docker/runtime docs for Ultralytics dependency and optional layout runtime behavior.
