# Layout OCR Runtime Notes

## Purpose

This service now supports an optional layout-recognition stage before OCR. Layout is disabled by default and should be enabled only when a compatible YOLO layout model is available.

## Dependencies

The receipt-service runtime now includes:

- `ultralytics==8.4.38`
- existing OCR stack:
  - `paddleocr==3.3.3`
  - `paddlepaddle==3.2.0` in the CPU base runtime
  - `paddlepaddle-gpu==3.2.0` in the GPU override runtime
  - `vietocr==0.3.13`

The service Docker image still uses:

- base image: `python:3.11-slim`

## Config

Relevant layout config:

- `OCR_LAYOUT_ENABLED=true`
- `OCR_LAYOUT_BACKEND=yolo`
- `OCR_LAYOUT_MODEL_PATH=/models/receipt_layout.pt`
- `OCR_LAYOUT_MODEL_AUTO_DOWNLOAD=true`
- `OCR_LAYOUT_MODEL_DOWNLOAD_URL=https://huggingface.co/Armaggheddon/yolo11-document-layout/resolve/main/yolo11n_doc_layout.pt`
- `OCR_LAYOUT_MODEL_DOWNLOAD_TIMEOUT_SECONDS=120`
- `OCR_LAYOUT_CONFIDENCE_THRESHOLD=0.25`
- `OCR_LAYOUT_IOU_THRESHOLD=0.45`
- `OCR_LAYOUT_MAX_BLOCKS=20`
- `OCR_LAYOUT_MIN_BLOCK_AREA_RATIO=0.0025`
- `OCR_LAYOUT_MERGE_SAME_LABEL_GAP_PIXELS=24`

## Runtime Behavior

### When layout is disabled

- the service uses the existing whole-image OCR path
- no layout model is loaded

### When layout is enabled with a valid model path

- layout inference runs after preprocessing
- OCR runs inside the ordered semantic blocks that survive post-processing
- extraction receives optional layout block metadata
- runtime logs include the model path, model source (`local` or `download:<url>`), backend, and device

### When layout is enabled but unusable

Examples:

- model path missing
- incompatible weights
- runtime failure
- no usable blocks after filtering

Behavior:

- parse continues
- service falls back to the existing whole-image OCR path
- debug payload includes `layout.fallback_reason`
- missing file or failed auto-download resolves to `fallback_reason=missing_model`
- invalid or unreadable weights resolve to `fallback_reason=layout_model_load_failed`

## Docker Notes

The current Dockerfile does not hardcode a layout model file. The runtime supports:

- a local file at `OCR_LAYOUT_MODEL_PATH`
- a one-time auto-download into that same path when the file is missing

Default remote source:

- repository: `Armaggheddon/yolo11-document-layout`
- file: `yolo11n_doc_layout.pt`
- cached path: `/models/receipt_layout.pt`

For Docker Compose, mount the host `./models` directory into the container at `/models`. The default compose stack now mounts that directory for both `receipt-service` and `receipt-worker`, so the downloaded model stays cached across restarts.

To replace the model:

- copy a compatible Ultralytics `.pt` file to `./models/receipt_layout.pt`, or
- point `OCR_LAYOUT_MODEL_DOWNLOAD_URL` to another direct `.pt` URL

When `/models/receipt_layout.pt` already exists, the service does not download again.

Useful debug payload fields now include:

- `layout.runtime.model_path`
- `layout.runtime.model_loaded`
- `layout.runtime.model_source`
- `layout.runtime.device`

## Rollback

Disable layout only:

```env
OCR_LAYOUT_ENABLED=false
```

No worker, queue, or frontend workflow rollback is required for that change.
