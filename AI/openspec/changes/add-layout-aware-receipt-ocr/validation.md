# Layout-Aware OCR Validation

## Validation Performed

### Static validation

- Python compile check passed for the changed backend files and new scripts via:
  - `py -3 -m compileall microservices/receipt-service/app microservices/receipt-service/scripts`
- `docker compose config` passed for the updated compose stack, including `./models:/models` mounts on `receipt-service` and `receipt-worker`
- receipt-service / receipt-worker image rebuild passed with:
  - `docker compose build receipt-service receipt-worker`

### Runtime validation completed

- Verified real YOLO layout model loading inside Docker with:
  - `get_layout_service().validate_runtime(ensure_load=True)`
- Verified model auto-download fallback into a writable mounted directory
- Verified missing-model fallback when auto-download is disabled
- Validated parse flow with `OCR_LAYOUT_ENABLED=false`
- Validated parse flow with `OCR_LAYOUT_ENABLED=true`
- Validated both recognizer modes:
  - `OCR_RECOGNIZER_BACKEND=vietocr`
  - `OCR_RECOGNIZER_BACKEND=paddle`
- Ran benchmark comparisons on the same receipt set in no-layout and layout-aware modes

Artifacts produced under `artifacts/layout-validation/`:

- `validate-layout-good.json`
- `validate-layout-good.md`
- `validate-layout-bill.json`
- `validate-layout-bill.md`
- `benchmark-vietocr.json`
- `benchmark-vietocr.md`
- `benchmark-paddle.json`
- `benchmark-paddle.md`

## Frontend Build Validation

### Production build

Local `npm run build` on Windows can still hang after the initial Next.js banner in `microservices/frontend`, but production build validation is now complete through the project Docker runtime.

Validated with:

- `docker compose build frontend`

Observed build phases:

- optimized production build started
- compile completed successfully
- lint/type-check phase completed
- static pages generated
- route summary emitted for the app pages and API routes

## Compatibility Findings

### Payload compatibility

Based on code-path inspection plus runtime payload artifacts:

- receipt/session OCR debug payloads remain additive
- existing top-level OCR fields are preserved
- `layout` metadata is optional
- extraction payloads preserve existing fields and add `field_provenance`
- layout debug payload now includes:
  - `layout.enabled`
  - `layout.used`
  - `layout.fallback_reason`
  - `layout.runtime.model_path`
  - `layout.runtime.model_loaded`
  - `layout.runtime.model_source`
  - `layout.runtime.device`
  - `layout.raw_detections_count`
  - `layout.postprocessed_block_count`
  - per-block `label`, `raw_label`, `confidence`, `bbox`, `area_ratio`, `ocr_text`, `ocr_line_count`

### Fallback behavior

Verified by runtime artifacts:

- `OCR_LAYOUT_ENABLED=false` uses the old whole-image OCR path
- missing model with auto-download disabled yields `layout.used=false` plus `fallback_reason="missing_model"`
- insufficient or unusable layout detections yield:
  - `fallback_reason="too_few_layout_blocks"` on some receipts
  - `fallback_reason="missing_model"` when the model path is unavailable
- layout failure does not fail the parse job by itself

### Real model loading

Verified runtime sources:

- local cached model at `./models/receipt_layout.pt` -> `/models/receipt_layout.pt`
- auto-download source:
  - `https://huggingface.co/Armaggheddon/yolo11-document-layout/resolve/main/yolo11n_doc_layout.pt`
- runtime reports:
  - `model_source=local` for the cached compose-mounted model
  - `model_source=download:<url>` for the auto-download test path

### Layout-enabled runtime result

`layout.used=true` was validated on `643675b3-e16b-4a49-93ea-39ff9b00b120.jpg` for both recognizer modes:

- raw detections: `11`
- postprocessed blocks: `9`
- semantic blocks included usable `header`, `items`, and `totals`
- debug image path was returned
- OCR ran per block and emitted block-level ordering metadata

### Benchmark summary

Compared on:

- `bill.jpg`
- `1dac8c84-5d11-450e-851b-051f422a1e51.jpg`
- `643675b3-e16b-4a49-93ea-39ff9b00b120.jpg`

Results:

- all merchant/date/total comparisons were `matched`
- no benchmarked receipt showed a field-quality regression
- only `643675b3-e16b-4a49-93ea-39ff9b00b120.jpg` produced `layout.used=true`
- `bill.jpg` and `1dac8c84-5d11-450e-851b-051f422a1e51.jpg` fell back safely with `too_few_layout_blocks`

## Remaining Gap

The backend OCR/layout validation tasks are complete.

Frontend production build compatibility is also validated through Docker. The remaining environment-specific issue is only that local Windows `next build` may still hang outside Docker, which does not block this OpenSpec change.
