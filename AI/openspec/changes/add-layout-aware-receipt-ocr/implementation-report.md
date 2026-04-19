# Layout-Aware Receipt OCR Implementation Report

## Summary

This change adds an optional layout-recognition stage to the current receipt OCR pipeline without replacing the existing async parse architecture. Layout runs after preprocessing and before OCR. When it succeeds, OCR runs per semantic block. When it is disabled, misconfigured, or returns no usable blocks, the pipeline falls back to the current whole-image OCR path.

The implementation is additive and rollback-safe through config.

## Changed Files

### Backend OCR and layout

- `microservices/receipt-service/app/core/config.py`
  - added layout feature flags, auto-download settings, and tuning settings
- `microservices/receipt-service/app/services/layout_models.py`
  - added normalized raw and canonical layout block models
- `microservices/receipt-service/app/services/layout_postprocess.py`
  - added canonical taxonomy mapping, geometric fallback heuristics for generic document-layout classes, overlap suppression, merge, prune, and max-block capping
- `microservices/receipt-service/app/services/layout_service.py`
  - added cached Ultralytics YOLO runtime integration with external weight path support
  - added optional model auto-download and cache-to-path behavior
  - added explicit runtime metadata for model path, model source, load state, and device
- `microservices/receipt-service/app/services/ocr_service.py`
  - integrated optional layout detection
  - runs OCR inside ordered layout blocks when layout is usable
  - preserves whole-image fallback path
  - emits additive layout debug metadata
- `microservices/receipt-service/app/services/parse_pipeline.py`
  - passes layout blocks into extraction
  - persists layout metadata into OCR debug payloads
- `microservices/receipt-service/app/services/extraction_service.py`
  - made extraction optionally block-aware
  - added field provenance

### API and schema

- `microservices/receipt-service/app/schemas/receipt.py`
  - added additive `layout` field to OCR debug response schema
- `microservices/receipt-service/app/api/receipts.py`
  - serializes layout debug metadata for receipt and session detail payloads

### Frontend compatibility

- `microservices/frontend/lib/types.ts`
  - added optional `layout` debug payload shape and `field_provenance`
- `microservices/frontend/components/receipt-ocr-text-panel.tsx`
  - renders layout debug blocks and field provenance additively
- `microservices/frontend/next.config.ts`
  - constrains Next.js build worker behavior for more predictable local Windows execution
- `microservices/frontend/package.json`
  - pins supported Node runtime to `>=20 <21` for stable frontend build behavior
- `microservices/frontend/.nvmrc`
  - sets the recommended local frontend Node version to `20`

### Scripts and runtime docs

- `microservices/receipt-service/scripts/benchmark_layout_ocr.py`
  - compares no-layout and layout-aware OCR on the same images
- `microservices/receipt-service/scripts/validate_layout_modes.py`
  - validates layout toggle plus recognizer backend combinations
- `microservices/receipt-service/scripts/benchmark_recognizers.py`
  - pinned to no-layout baseline behavior for recognizer-only comparison
- `microservices/receipt-service/scripts/validate_recognizer_contract.py`
  - pinned to no-layout baseline behavior for recognizer-only contract validation
- `microservices/receipt-service/LAYOUT_OCR_RUNTIME.md`
  - documents runtime/dependency expectations, model source, replacement flow, and rollback behavior
- `microservices/receipt-service/requirements.txt`
  - added `ultralytics==8.4.38`
- `microservices/receipt-service/.env.example`
  - added layout flags and default model download source
- `microservices/receipt-service/.env`
  - added layout flags and default model download source
- `docker-compose.yml`
  - mounts `./models:/models` for both `receipt-service` and `receipt-worker`
- `models/.gitkeep`
  - ensures the mounted model cache directory exists in the repository

## New Classes and Responsibilities

### `RawLayoutDetection`

Represents one raw detection from the YOLO layout detector before normalization.

### `LayoutBlock`

Represents one canonical, OCR-eligible semantic block after normalization and post-processing.

### `LayoutDetectionResult`

Represents the runtime outcome of the layout phase, including whether layout was enabled, whether it was used, fallback reason, runtime metadata, and normalized blocks.

### `LayoutService`

Loads the external YOLO layout model lazily, runs inference, and returns normalized layout results. Failures are converted into safe fallback metadata rather than hard parse failures.

## Flow Changes

### Old path

1. preprocess image using selected OCR profile
2. run whole-image Paddle text detection
3. order text boxes
4. recognize text crops
5. normalize text
6. extract fields

### New path

1. preprocess image using selected OCR profile
2. if layout is enabled, run layout detection on the processed image
3. if layout returns usable blocks:
   - order blocks
   - OCR inside each block
   - flatten block output into existing `raw_text` and `lines`
4. if layout is disabled or unusable:
   - run the old whole-image OCR path
5. extraction receives optional layout blocks and applies block preference heuristics
6. OCR debug response includes additive layout and field provenance metadata

### Fast vs recovery strategy

- `fast` profile:
  - layout runs on the fast-preprocessed image
  - no extra layout retries
- `recovery` profile:
  - layout runs on the recovery-preprocessed image only when the existing parse strategy has already selected recovery
- layout does not create a third independent parse branch

## Config Flags

- `OCR_LAYOUT_ENABLED`
- `OCR_LAYOUT_BACKEND`
- `OCR_LAYOUT_MODEL_PATH`
- `OCR_LAYOUT_CONFIDENCE_THRESHOLD`
- `OCR_LAYOUT_IOU_THRESHOLD`
- `OCR_LAYOUT_MAX_BLOCKS`
- `OCR_LAYOUT_MIN_BLOCK_AREA_RATIO`
- `OCR_LAYOUT_MERGE_SAME_LABEL_GAP_PIXELS`
- `OCR_LAYOUT_MODEL_AUTO_DOWNLOAD`
- `OCR_LAYOUT_MODEL_DOWNLOAD_URL`
- `OCR_LAYOUT_MODEL_DOWNLOAD_TIMEOUT_SECONDS`

## Rollback

Rollback is config-only:

1. set `OCR_LAYOUT_ENABLED=false`
2. leave recognizer backend and worker/session flow unchanged
3. optionally remove the Ultralytics dependency in a later cleanup if layout support is no longer needed

## Notes

- The implementation preserves receipt/session detail payload shape additively.
- The implementation preserves the current review workflow and OCR text panel.
- The default rollout now supports either:
  - a manually supplied local model at `OCR_LAYOUT_MODEL_PATH`
  - or a one-time auto-download into that same path
- Runtime validation with a real YOLO layout model was completed in Docker using a mounted `/models` directory and the cached `receipt_layout.pt` artifact.
- Frontend production build compatibility was validated with `docker compose build frontend`, which completed full Next.js compile, type-check, static page generation, and route summary output under the project Node 20 container runtime.
