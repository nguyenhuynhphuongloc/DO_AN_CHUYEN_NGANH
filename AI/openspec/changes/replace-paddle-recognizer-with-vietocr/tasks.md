## 1. Baseline investigation and architecture split

- [x] 1.1 Inspect the current `receipt-service` OCR pipeline and identify the concrete detection, recognition, line-ordering, and debug contract paths that must remain compatible.
- [x] 1.2 Refactor the OCR implementation into detector and recognizer abstractions without changing the upload, queue, worker, extraction, or review workflow contracts.
- [x] 1.3 Add a Paddle detector adapter and a Paddle recognizer adapter behind the new abstractions as the baseline compatibility path.

## 2. VietOCR recognizer integration

- [x] 2.1 Add VietOCR dependencies and runtime configuration needed for CPU and GPU execution in `receipt-service`.
- [x] 2.2 Implement a VietOCR recognizer adapter that accepts ordered text crops and returns recognized strings plus confidence/runtime metadata where available.
- [x] 2.3 Add crop extraction and stable box sorting so detection results are cropped and recognized top-to-bottom, left-to-right.
- [x] 2.4 Add batch recognition support for ordered crops with configurable batch size while preserving final line order.
- [x] 2.5 Implement configurable row-grouping tolerance for box ordering and validate it against receipt-style layouts.

## 3. OCR pipeline integration and compatibility

- [x] 3.1 Wire the OCR coordinator so Paddle detection feeds ordered crops into the selected recognizer backend (`vietocr` or `paddle`).
- [x] 3.2 Preserve the existing OCR result contract (`raw_text`, `lines`, confidence/debug payloads) so extraction and review UI remain compatible.
- [x] 3.3 Preserve or normalize recognizer confidence semantics into the existing OCR result contract and document backend-specific caveats in debug metadata.
- [x] 3.4 Add config flags for recognizer backend selection and rollback-safe fallback behavior.
- [x] 3.5 Ensure GPU execution uses CUDA when available and falls back honestly to CPU when it is not.
- [x] 3.6 Add regression validation for existing `ocr_debug` / `raw_json` payload shape and frontend compatibility.

## 4. Runtime instrumentation, benchmark, and validation

- [x] 4.1 Add logging and OCR debug metadata for detection time, crop time, recognition time, total OCR time, detector backend, recognizer backend, and actual runtime device.
- [x] 4.2 Add a benchmark or evaluation script that compares Paddle recognition and VietOCR recognition on real Vietnamese receipt images using the same detection flow.
- [x] 4.3 Make the benchmark emit machine-readable JSON results and a markdown summary for the same image set.
- [x] 4.4 Validate that the worker, parse pipeline, extraction, and review flow still function with `OCR_RECOGNIZER_BACKEND=vietocr`.
- [x] 4.5 Validate that the worker, parse pipeline, extraction, and review flow still function with `OCR_RECOGNIZER_BACKEND=paddle`.

## 5. Documentation and rollout safety

- [x] 5.1 Update Dockerfile, requirements, env examples, and compose/runtime settings needed for VietOCR integration.
- [x] 5.2 Produce a markdown report documenting changed files, classes, flow changes, backend selection, benchmark path, and rollback procedure.
- [x] 5.3 Record final validation notes covering compatibility, performance trade-offs, and any remaining recognizer limitations on Vietnamese receipts.
