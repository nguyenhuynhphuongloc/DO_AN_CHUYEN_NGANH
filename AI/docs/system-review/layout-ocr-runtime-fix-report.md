# Layout OCR Runtime Fix Report

## Why layout was not working before

- The running stack had `OCR_LAYOUT_ENABLED=false`, so layout detection was skipped at runtime.
- Even when layout is enabled, the service previously had no startup validation for `OCR_LAYOUT_MODEL_PATH`.
- The layout runtime did not expose clear fallback reasons for:
  - missing model path
  - unreadable model path
  - model load failure
- The debug payload did not make it obvious whether layout was merely configured, actually used, or why it was bypassed.

## What was fixed

- Added startup validation in [main.py](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/receipt-service/app/main.py:32) and [worker.py](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/receipt-service/app/worker.py:21) so layout config is checked as the service starts.
- Added explicit layout runtime validation in [layout_service.py](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/microservices/receipt-service/app/services/layout_service.py:33) for:
  - `OCR_LAYOUT_ENABLED`
  - empty/missing/unreadable model path
  - model load failure
- Standardized fallback reasons:
  - `layout_disabled`
  - `missing_model`
  - `layout_model_load_failed`
  - `no_usable_layout_blocks`
  - `too_few_layout_blocks`
  - `all_metadata_blocks`
- Extended the OCR debug payload with:
  - `layout.raw_detections_count`
  - `layout.postprocessed_block_count`
  - `layout.debug_image_path`
  - block-level OCR text and line counts when layout is used
- Added layout inference logging for:
  - inference start
  - model path
  - raw detection count
  - postprocess removals/merges/capping
  - final block list before block OCR
- Added Docker dev model mount support:
  - host `./models`
  - container `/models`
- Updated sample config in `.env.example` to document the expected model location:
  - `/models/receipt_layout.pt`

## Validation run

- Validation artifact: [layout-validation.json](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/tmp/layout-validation.json)
- Markdown summary: [layout-validation.md](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/tmp/layout-validation.md)
- Load failure check: [layout-load-failure.json](/d:/School_Proj/DO_AN_CHUYEN_NGANH/AI/tmp/layout-load-failure.json)

Observed results:

- `OCR_LAYOUT_ENABLED=false` -> `layout.used=false`, `fallback_reason=layout_disabled`
- `OCR_LAYOUT_ENABLED=true` with empty model path -> `layout.used=false`, `fallback_reason=missing_model`
- `OCR_LAYOUT_ENABLED=true` with invalid `.pt` file -> `layout.used=false`, `fallback_reason=layout_model_load_failed`

## Current limitations

- The repository still does not include a valid receipt layout YOLO weight file.
- Because of that, `layout.used=true` could not be validated end-to-end in this workspace yet.
- Debug images for real detected layout blocks will only appear after a compatible receipt layout model is mounted at `/models/receipt_layout.pt`.
- OCR quality comparison between layout-disabled and layout-enabled modes remains blocked until that model is available.
