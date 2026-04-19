## Context

The current receipt OCR system is already in an incremental state:

- upload and parsing are asynchronous
- session-first parsing exists behind a feature flag
- OCR uses fast and recovery preprocess profiles
- Paddle detection is already separated from recognition
- VietOCR is the default recognizer backend
- OCR results are persisted into debug-friendly JSON payloads
- extraction and the review workspace depend on stable output contracts

This means layout-awareness should be introduced as an optional enhancement layer, not a rewrite. The current system should still succeed when layout detection is disabled, misconfigured, unavailable, or produces poor block segmentation.

## Goals / Non-Goals

**Goals**
- Add a layout-recognition stage after preprocessing and before OCR.
- Segment receipts into ordered semantic blocks such as:
  - `header`
  - `items`
  - `totals`
  - `footer`
  - optional `payment_info` or `metadata`
- Run the existing OCR stack inside each block:
  - Paddle detection
  - VietOCR primary recognizer
  - optional Paddle recognizer mode by config
- Make extraction block-aware while preserving current output contracts.
- Keep layout enhancement optional and rollback-safe through config only.
- Preserve async parse jobs, session-first parse flow, and the review/confirm UX.
- Add additive debug metadata, benchmark tooling, validation, and architecture docs.

**Non-Goals**
- Rewriting upload/session/queue/worker architecture
- Replacing Paddle detection or VietOCR recognition
- Adding model training or annotation tooling
- Breaking receipt/session detail contracts or the current review UI
- Requiring layout detection for parse success

## Decisions

### 1. Add a dedicated layout service layer

Create a layout-specific module set:

- `app/services/layout_models.py`
- `app/services/layout_postprocess.py`
- `app/services/layout_service.py`

Responsibilities:

- `layout_models.py`
  - internal typed models for raw layout detections and normalized blocks
  - shared enums/labels for semantic regions
- `layout_postprocess.py`
  - confidence filtering
  - label normalization
  - ordering
  - overlap suppression and block merging where needed
- `layout_service.py`
  - Ultralytics runtime integration
  - model loading and caching
  - image-level inference and normalized block output

Why:
- keeps layout logic isolated from OCR logic
- makes rollback simple because layout can be bypassed without changing recognizer code

### 1.5. Map detector labels into a canonical internal taxonomy

The YOLO layout model may emit raw labels that differ by training set or weight source. The pipeline should not expose those raw labels as the main semantic contract. Instead, `layout_postprocess.py` should normalize model-specific labels into a canonical internal taxonomy:

- `header`
- `items`
- `totals`
- `footer`
- `payment_info`
- `metadata`

Normalization behavior:

- map known aliases into canonical labels
- preserve the original raw detector label in debug metadata
- assign unknown or unsupported labels to:
  - `metadata` when the box is still OCR-eligible and geometrically plausible
  - `unknown` only in debug metadata when the block should not be trusted for routing

Unknown-label behavior:

- unknown labels must not break parse flow
- unknown labels should not receive strong extraction routing preference
- unknown labels may still be OCR'd if they survive confidence, size, and block-count pruning
- extraction should treat them as low-priority context rather than a primary semantic source

Why:
- keeps extraction logic stable across different weight files
- avoids coupling the service contract to model-specific class names

### 2. Keep layout optional and config-driven

Add settings:

- `OCR_LAYOUT_ENABLED=true|false`
- `OCR_LAYOUT_BACKEND=yolo`
- `OCR_LAYOUT_MODEL_PATH=...`
- `OCR_LAYOUT_CONFIDENCE_THRESHOLD=...`
- `OCR_LAYOUT_IOU_THRESHOLD=...`
- `OCR_LAYOUT_MAX_BLOCKS=...`
- `OCR_LAYOUT_RUN_ON_RECOVERY_ONLY=false|true` if needed later

Behavior:

- if layout is disabled, run the current whole-image OCR path
- if layout model path is missing or inference fails, log the failure and fall back to the whole-image OCR path
- if layout returns no usable blocks, fall back to the whole-image OCR path

Why:
- rollback must be possible by config only
- layout failure must not block parsing

### 3. Run layout detection on the already selected processed image

The pipeline should stay:

1. choose `fast` or `recovery` preprocess profile
2. produce processed image
3. run layout detection on that processed image
4. run OCR per block if layout succeeded
5. otherwise run the existing whole-image OCR path

Why:
- keeps preprocessing logic centralized
- avoids introducing another independent image transformation branch
- ensures layout and OCR operate on the same image variant

### 4. Preserve the current OCR ordering logic inside each block

Within every block:

1. crop the block region from the processed image
2. run Paddle text detection on the block image
3. normalize box coordinates relative to the full image and block-local coordinates as needed
4. apply the current row-grouping tolerance and ordering logic inside that block
5. recognize ordered crops with the selected recognizer backend

Final line order across the receipt:

- blocks are ordered top-to-bottom and left-to-right
- lines inside each block preserve existing stable ordering
- the flattened `lines` output remains compatible with current extraction and review consumers

Why:
- preserves current OCR contract
- avoids introducing incompatible text ordering semantics

### 4.5. Cap OCR-eligible layout blocks and control OCR overhead

Layout-aware OCR must not allow an arbitrary number of tiny or overlapping blocks to explode OCR latency. Add config-driven controls such as:

- `OCR_LAYOUT_MAX_BLOCKS`
- `OCR_LAYOUT_MIN_BLOCK_AREA_RATIO`
- `OCR_LAYOUT_MERGE_SAME_LABEL_GAP_PIXELS`

Post-processing must apply pruning and merge rules before OCR:

- discard blocks below minimum confidence threshold
- discard blocks that are too small to plausibly hold receipt text
- discard heavily overlapping duplicate blocks after label-aware suppression
- merge vertically adjacent or lightly separated blocks of the same canonical class when that improves semantic coherence, especially for:
  - `items`
  - `totals`
  - `footer`
- sort remaining blocks and cap the final OCR-eligible set to `OCR_LAYOUT_MAX_BLOCKS`

Pruning priority:

1. confidence
2. minimum block size / area
3. overlap suppression
4. semantic merge
5. max-block cap

If pruning removes all usable blocks, fall back to the current whole-image OCR path.

Why:
- controls OCR latency and prevents layout from turning one parse into many uncontrolled OCR passes
- keeps layout enhancement useful on long receipts without unbounded overhead

### 5. Make extraction block-aware but contract-compatible

Do not change extraction entrypoints to require a new frontend contract. Instead:

- keep `extract_all(lines, raw_text)` working
- extend extraction internals to optionally consume layout block metadata when present

Preferred extraction behavior:

- `merchant_name`, `transaction_date`, contact/address fields:
  - prefer `header`
  - may use `metadata`
- `items[]`:
  - prefer `items`
- `subtotal_amount`, `tax_amount`, `discount_amount`, `service_charge`, `total_amount`:
  - prefer `totals`
- footer-only phrases:
  - prefer `footer`

Add to `extracted_json`:

- block provenance per selected field
- block label / block index when available

Why:
- keeps output backward-compatible
- improves extraction reliability without requiring a new API response shape

### 6. Preserve OCR contracts and extend debug metadata additively

Top-level OCR contract should remain compatible:

- `raw_text`
- `lines`
- `confidence`
- `confidences`
- `provider`
- `device`
- `runtime`
- `engine_config`

Additive debug metadata should include:

- `layout.enabled`
- `layout.backend`
- `layout.used`
- `layout.fallback_reason`
- `layout.blocks`
- `layout.timings`
- per block:
  - `label`
  - `confidence`
  - `bbox`
  - `ocr_text`
  - `ocr_line_count`
  - `ocr_timings`
- field provenance, e.g.:
  - `merchant_name -> header block 0`
  - `total_amount -> totals block 2`

Why:
- frontend debug panel can be extended without breaking old fields
- rollback path remains transparent in debug payloads

### 7. Use Ultralytics as the layout runtime

Layout detection will use:

- `ultralytics==8.4.38`
- externally supplied weights through `OCR_LAYOUT_MODEL_PATH`

Do not hardcode a specific filename. The implementation should accept any compatible Ultralytics YOLO weights path, including future YOLOv10-style compatible weights when supported by the runtime actually installed.

Why:
- avoids coupling the code to one specific model artifact
- keeps the implementation practical and inference-only

### 8. Add benchmark and validation paths outside the request flow

New scripts should compare:

- whole-image OCR without layout
- layout-aware OCR

Measurements:

- layout time
- OCR time
- extraction time
- total parse time
- line count
- block count
- extracted merchant/date/total comparison between:
  - no-layout OCR
  - layout-aware OCR

Quality comparison should explicitly capture, for the same receipt set:

- merchant extraction agreement / qualitative correctness
- transaction date agreement / qualitative correctness
- total amount agreement / qualitative correctness
- whether layout-aware mode improved, regressed, or matched no-layout mode per receipt

The markdown summary should call out:

- receipts where layout improved field routing
- receipts where layout added cost without quality gain
- receipts where layout failed and whole-image fallback was used

### 8.5. Lock the fast/recovery layout strategy

Layout should follow the OCR profile strategy rather than introducing a third independent branch.

Final strategy:

- `fast` path:
  - run layout detection on the fast-preprocessed image only when `OCR_LAYOUT_ENABLED=true`
  - keep fast-path layout lightweight:
    - one layout inference
    - capped OCR-eligible blocks
    - no extra layout retries
- `recovery` path:
  - only run if the existing fast-path quality gate already decides recovery is needed
  - run layout detection again on the recovery-preprocessed image
  - allow recovery layout to use the same canonical taxonomy and pruning rules, but on the heavier processed image

Selection behavior:

- first decide fast vs recovery using the existing parse strategy
- then apply layout or no-layout inside the chosen profile
- if layout fails in either profile, fall back to the existing whole-image OCR for that same profile

This means:

- layout does not decide whether recovery runs
- recovery does not exist solely because layout was enabled
- layout remains an enhancement layer inside each OCR profile, not a replacement for profile selection

Why:
- keeps the current fast/recovery design intact
- avoids multiplying branches into an unmaintainable matrix
- makes timing/debug analysis clearer because profile selection and layout selection remain separate concerns

Artifacts:

- JSON results
- Markdown summary

Validation matrix:

- `OCR_LAYOUT_ENABLED=false`
- `OCR_LAYOUT_ENABLED=true`
- `OCR_RECOGNIZER_BACKEND=vietocr`
- `OCR_RECOGNIZER_BACKEND=paddle`
- layout failure fallback behavior
- frontend build / type compatibility

### 9. Add architecture documentation and rollback procedure

Produce:

- `implementation-report.md`
- `validation.md`
- `layout-ocr-architecture.md`

The architecture doc should explain:

- old OCR path
- new layout-aware path
- fallback path
- config flags
- file/class responsibilities
- rollback steps

## Risks / Trade-offs

- [Layout model quality may be inconsistent on receipts] -> Keep layout optional, confidence-filtered, and fallback-safe.
- [Per-block OCR can increase total OCR calls] -> Keep block count capped and benchmark no-layout vs layout-aware modes.
- [Incorrect block ordering could hurt extraction] -> Centralize layout block ordering and preserve current line ordering inside each block.
- [New dependency on Ultralytics/Torch can complicate Docker] -> Keep versions pinned conservatively and avoid unnecessary upgrades.
- [Extraction could become overfit to layout labels] -> Use block preference, not hard-only routing, so fallback text heuristics still work.
- [Frontend debug payload could drift] -> Keep all new layout data additive and regression-test response shapes and frontend build.

## Migration Plan

1. Add layout settings and placeholder-safe service interfaces.
2. Implement Ultralytics-backed layout detection and normalized block post-processing.
3. Integrate optional layout stage into parse pipeline and OCR service with rollback-safe whole-image fallback.
4. Add block-level OCR metadata and flattened compatibility output.
5. Make extraction block-aware while preserving current response contracts.
6. Extend frontend debug types and OCR debug panel additively.
7. Add benchmark/evaluation scripts for no-layout vs layout-aware OCR.
8. Validate both layout-disabled and layout-enabled modes under both recognizer backends.
9. Document architecture, implementation, validation, and rollback steps.

Rollback strategy:

- set `OCR_LAYOUT_ENABLED=false`
- keep existing recognizer backend settings unchanged
- continue using the current whole-image OCR path
- if runtime dependencies cause trouble, revert Ultralytics-related Docker/requirements changes without touching queue/session flow

## Open Questions

- Which semantic labels should be treated as canonical for the first model rollout if the supplied weights expose more classes than the pipeline needs?
- Whether item-heavy long receipts should cap the number of layout item blocks to avoid excessive OCR overhead.
- Whether block-aware extraction should add confidence bonuses by block label only, or also by block position and geometry.
