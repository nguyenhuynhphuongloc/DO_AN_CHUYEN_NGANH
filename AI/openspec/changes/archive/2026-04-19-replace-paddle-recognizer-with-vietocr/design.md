## Context

The current `receipt-service` pipeline already has an async upload -> queue -> worker -> extraction -> review flow, plus a session-first persistence path and OCR debug payloads. Recent runtime work improved latency and observability, but the recognition layer still depends on PaddleOCR recognizers that are tuned for general Latin text rather than Vietnamese receipt text with heavy diacritics, abbreviations, and noisy point-of-sale formatting. The receipt system also now relies on stable downstream contracts: extraction expects a single ordered line list and raw text string, and the review UI expects additive OCR debug data without workflow churn.

This change must therefore improve the recognition layer without reworking:
- async queueing and worker execution
- session-first parse persistence
- extraction contracts and review flow
- authenticated ownership behavior

The main technical constraint is that recognition quality must improve while preserving rollout safety. VietOCR introduces new dependencies, optional GPU usage, batching considerations, and backend-specific confidence semantics, so the design must isolate the recognizer behind a clean abstraction and preserve a Paddle fallback path.

## Goals / Non-Goals

**Goals:**
- Keep Paddle-based text detection and detection ordering in the current OCR pipeline.
- Replace the primary recognition path with VietOCR over cropped text regions.
- Introduce detector and recognizer abstractions so recognition backends can be switched by config.
- Preserve the existing OCR output contract: ordered `lines`, `raw_text`, confidence/debug payloads, and additive metadata used by extraction and review.
- Preserve or normalize recognizer confidence semantics into the existing OCR result contract and document backend-specific caveats.
- Support GPU execution for VietOCR when CUDA is available, with CPU fallback when not.
- Batch crop recognition where practical to reduce end-to-end latency.
- Make row-grouping tolerance for box ordering configurable and validated on receipt layouts.
- Record detection, crop, recognition, and total OCR timings along with selected detector/recognizer backend.
- Provide a benchmark/evaluation path that compares Paddle recognition and VietOCR recognition on Vietnamese receipts, with JSON output and markdown summary.
- Add regression validation for existing `ocr_debug` / `raw_json` payload shape and frontend compatibility.
- Validate end-to-end parse flow in both recognizer modes: `OCR_RECOGNIZER_BACKEND=vietocr` and `OCR_RECOGNIZER_BACKEND=paddle`.
- Produce a markdown report documenting changed files, classes, and execution flow.

**Non-Goals:**
- Replacing Paddle detection with another detector.
- Rewriting the worker, queue, or parse-session architecture.
- Replacing extraction or moving extraction logic to the frontend.
- Changing receipt upload/review/confirm API semantics beyond additive debug metadata.
- Introducing a mandatory new service boundary for OCR; this remains in-process in `receipt-service`.

## Decisions

### 1. Split OCR into detector and recognizer interfaces

The current `OCRService` mixes device selection, model selection, and recognition into a single service centered on PaddleOCR. This change will separate the OCR pipeline into:
- a detector abstraction responsible for image-level text-box detection and ordering
- a recognizer abstraction responsible for crop-level text recognition
- a coordinating OCR service that glues detection, cropping, recognition, post-processing, confidence aggregation, and debug payload creation together

Why:
- VietOCR can replace only the recognition step without disturbing the rest of the pipeline.
- Rollback to Paddle recognition stays simple: switch config instead of branching parse flow.

Alternatives considered:
- Replace the entire OCR path with VietOCR end to end: rejected because VietOCR is not the detector in the current architecture and would force a broader rewrite.
- Keep a monolithic OCR service and branch internally: rejected because it would entangle Paddle-specific and VietOCR-specific behavior and make rollback/debugging harder.

### 2. Keep Paddle detection as the stable source of text boxes and ordering

Paddle detection remains the source of bounding boxes. The detector output will be normalized into a stable internal structure containing:
- polygon/box coordinates
- detection confidence where available
- stable sort order using configurable row-grouping tolerance before left-to-right ordering within a row

Recognition will operate on crops derived from this ordered list.

Why:
- Existing detection logic and preprocessing are already integrated and debugged.
- The main quality problem in current receipts is recognition, not box discovery.
- Stable ordering is required so extraction continues to receive sensible line sequences.

Alternatives considered:
- Use VietOCR or a custom detector for lines: rejected because the scope is explicitly “replace only recognition.”
- Hardcode a fixed row tolerance: rejected because receipt resolution and layout density vary.

### 3. Make VietOCR the default primary recognizer, keep Paddle as fallback

Add a new `OCR_RECOGNIZER_BACKEND` setting with supported values such as:
- `vietocr`
- `paddle`

Optionally add a secondary fallback recognizer or rollback switch such as:
- `OCR_RECOGNIZER_FALLBACK=paddle`

The first implementation path should prefer VietOCR as the primary recognition backend while keeping Paddle recognition adapter code present for immediate rollback.

Why:
- The team needs an incremental, rollback-safe migration.
- Benchmarking requires the ability to compare both recognizers against the same detector and ordering logic.

Alternatives considered:
- Hard cutover to VietOCR with no fallback: rejected because it increases rollout risk.

### 4. Batch recognition at the crop level, but keep ordering deterministic

Once text boxes are detected and sorted, image crops will be generated in that stable order. The recognizer adapter will support batch recognition APIs where practical:
- VietOCR batch inference for multiple crops
- Paddle recognition fallback batch path if its adapter supports it

The returned recognized strings must be re-associated with the original ordered crop indexes so downstream line ordering is deterministic.

Why:
- Crop-level batching is the cleanest latency win once recognition moves out of end-to-end PaddleOCR.
- Stable ordering is more important than raw throughput because extraction depends on line sequence.

Trade-off:
- Batching may require crop resizing/padding logic and careful GPU memory handling.

### 5. Preserve the current OCR result contract and normalize confidence semantics

The OCR payload will keep current fields:
- `raw_text`
- `lines`
- `confidence`
- `raw_json` / debug metadata

The debug payload will be expanded additively to include:
- `detector_backend`
- `recognizer_backend`
- `detector_model_name`
- `recognizer_model_name`
- `detection_seconds`
- `crop_seconds`
- `recognition_seconds`
- `total_ocr_seconds`
- `detected_box_count`
- crop batching metadata
- actual runtime device and CUDA availability

Recognizer confidence will be normalized into the existing OCR result contract:
- preserve current top-level `confidence` shape
- document when backend-specific confidence is estimated, averaged, approximated, or unavailable
- keep additive backend-specific debug fields when needed instead of silently changing semantics

Why:
- Extraction and review UI should not need contract-breaking changes.
- Benchmarking and rollout need visibility into which recognizer actually ran.

Alternatives considered:
- Expose only backend-specific confidence and let consumers infer semantics: rejected because it would make existing extraction and frontend behavior harder to reason about.

### 6. Make row ordering configurable, deterministic, and receipt-aware

Detection output ordering will use a configurable row-grouping tolerance so nearby boxes that belong to the same receipt row are grouped before left-to-right ordering is applied within that row. The tolerance must be configurable via runtime settings and validated on receipt-like layouts.

Why:
- Receipt headers, merchant lines, and payment summary rows often have slight vertical jitter.
- A rigid sort can scramble line order and damage extraction even when detection and recognition are individually correct.

Alternatives considered:
- Post-hoc heuristic reordering in extraction only: rejected because OCR `lines` should already be stable and review-safe.

### 7. Use device-aware recognizer adapters with honest fallback

VietOCR integration will be device-aware:
- if CUDA is available and enabled by config, use GPU
- otherwise run on CPU

The adapter must report the actual runtime device used. This should reuse the existing honest-runtime approach introduced in recent OCR optimization work rather than assuming GPU success from config alone.

Why:
- The project already suffered from false assumptions about OCR device usage.
- VietOCR CPU fallback must remain functional for developer machines and rollback scenarios.

### 8. Add regression-safe validation for OCR debug payloads and frontend compatibility

The implementation must validate that existing `ocr_debug` / `raw_json` payload shapes remain additively compatible with current API serialization and frontend review rendering. New detector/recognizer fields are additive; existing keys must remain available where they already exist today.

Why:
- The receipt review UI and debug panel already consume these payloads.
- This recognizer migration should not require a frontend rewrite to remain usable.

### 9. Add a benchmark/evaluation script outside the request path

Introduce a benchmark tool under `microservices/receipt-service` or a dedicated scripts folder that:
- runs Paddle detection once
- evaluates the same receipt images with both recognizers
- records timings and output summaries
- optionally compares extraction-level outputs on the same images

The script should be usable against a local folder of Vietnamese receipts and produce:
- machine-readable JSON output
- a human-readable markdown summary comparing Paddle vs VietOCR on the same images

Why:
- Recognizer migration should be evidence-driven.
- The benchmark must not add cost to the normal request/worker path.

## Risks / Trade-offs

- [VietOCR improves Vietnamese text but increases integration complexity] -> Keep a narrow recognizer adapter boundary and preserve Paddle fallback via config.
- [Crop-level ordering drifts from the current end-to-end Paddle line ordering] -> Centralize box sorting and keep ordering rules explicit, testable, and logged.
- [Batching helps latency but can increase GPU memory use] -> Make batch size configurable and preserve a safe smaller default with CPU compatibility.
- [Confidence semantics differ between VietOCR and Paddle] -> Normalize recognizer confidence into the existing OCR payload and document backend-specific caveats in debug metadata.
- [New dependencies complicate Docker/runtime setup] -> Update requirements and Dockerfile incrementally, keep CPU-safe defaults, and document GPU requirements explicitly.
- [Extraction quality could regress if crop grouping differs] -> Keep detector order stable, benchmark on real Vietnamese receipts, and use the markdown report to document any changed heuristics.
- [Row-grouping tolerance is too loose or too strict] -> Make tolerance configurable, validate on real receipt layouts, and keep a known-safe default.
- [Frontend depends on old debug keys] -> Treat new OCR metadata as additive only and run regression validation against current `ocr_debug` / `raw_json` consumers.

## Migration Plan

1. Introduce detector and recognizer abstractions without changing the public OCR contract.
2. Implement Paddle detector adapter first so the existing box discovery path remains stable.
3. Implement Paddle recognizer adapter as the baseline backend behind the new abstraction.
4. Implement VietOCR recognizer adapter and config-driven backend selection.
5. Add crop ordering, configurable row-grouping tolerance, batching, confidence normalization, timing instrumentation, and additive debug fields.
6. Update Dockerfile, requirements, and runtime config to support VietOCR on CPU and GPU.
7. Add benchmark tooling and run side-by-side evaluation on real Vietnamese receipt samples, producing JSON and markdown outputs.
8. Run regression validation for `ocr_debug` / `raw_json` payload shape and frontend compatibility in both recognizer modes.
9. Validate end-to-end parse behavior with `OCR_RECOGNIZER_BACKEND=vietocr` and `OCR_RECOGNIZER_BACKEND=paddle`.
10. Set `vietocr` as the preferred backend in non-prod once benchmark evidence is acceptable; retain `paddle` rollback switch.
11. Produce the markdown implementation report summarizing changed files, classes, and flow.

Rollback strategy:
- Switch `OCR_RECOGNIZER_BACKEND` back to `paddle`.
- Keep the detector/recognizer abstraction intact; only the recognizer backend changes.
- If VietOCR dependencies cause runtime instability, revert the Docker/requirements changes while preserving the architecture split for a future attempt.

## Open Questions

- Which VietOCR checkpoint offers the best accuracy/latency trade-off for Vietnamese receipts in this project’s hardware envelope?
- Whether line grouping should remain one-box-to-one-line initially or add a later merge stage for multi-box receipt lines.
- Whether benchmark output should live only as JSON/CLI output or also persist sample markdown reports under versioned evaluation folders.
