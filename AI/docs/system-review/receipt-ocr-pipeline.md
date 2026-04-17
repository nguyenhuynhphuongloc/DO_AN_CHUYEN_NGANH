# Receipt OCR System Review

## Executive Summary

`receipt-service` no longer runs a single monolithic PaddleOCR pipeline. The current codebase uses:

- `PaddleOCR` text detection through `TextDetection`
- configurable text recognition through:
  - `VietOCR` as the default recognizer backend
  - `PaddleOCR TextRecognition` as the fallback / rollback-safe backend
- a two-profile OCR pipeline:
  - `fast`
  - `recovery`
- a session-first async parsing flow behind `RECEIPT_SESSION_FIRST_ENABLED`

The effective source of truth for OCR orchestration is:

- API entry: `microservices/receipt-service/app/api/receipts.py`
- queue + worker: `microservices/receipt-service/app/services/receipt_queue.py`, `microservices/receipt-service/app/worker.py`
- parse orchestration: `microservices/receipt-service/app/services/parse_pipeline.py`
- preprocessing: `microservices/receipt-service/app/services/image_preprocess.py`
- OCR execution: `microservices/receipt-service/app/services/ocr_service.py`
- detector / recognizer adapters: `microservices/receipt-service/app/services/ocr_pipeline.py`
- post-processing: `microservices/receipt-service/app/services/ocr_postprocess.py`
- extraction: `microservices/receipt-service/app/services/extraction_service.py`

## Current End-to-End OCR Workflow

### 1. Upload and session creation

`POST /receipts/upload` in `app/api/receipts.py` has two behaviors:

- legacy receipt-first flow when `receipt_session_first_enabled = false`
- current preferred session-first flow when `receipt_session_first_enabled = true`

Session-first path:

1. file bytes are read from multipart form upload
2. temp image is stored via `store_temp_upload()` in `app/services/receipt_storage.py`
3. a `ReceiptParseSession` row is created
4. a `ReceiptParseJob` row is queued
5. API returns a `ReceiptWorkflowResponse` shaped for the unified frontend workspace

### 2. Worker claim loop

`app/worker.py` runs a background polling loop:

1. claim oldest queued `ReceiptParseJob`
2. if none exists, claim legacy `ReceiptJob`
3. if nothing is queued, run expired temp-session cleanup
4. sleep for `WORKER_POLL_INTERVAL_SECONDS`

The worker still preserves the original async architecture:

- upload request returns immediately
- OCR and extraction run outside the HTTP request
- review UI polls workflow state

### 3. Parse pipeline

`process_session_parse_job()` and `process_parse_job()` in `app/services/parse_pipeline.py` both route into `_run_profiled_parse()`.

Current behavior:

1. run `fast` preprocessing + OCR + extraction
2. evaluate fast-path quality through `_needs_recovery(...)`
3. if needed, run `recovery` preprocessing + OCR + extraction
4. compare fast vs recovery result confidence
5. persist OCR debug JSON, extraction payload, timings, and selected path
6. mark job/session or job/receipt `ready_for_review` or `failed`

### 4. Review and confirm

Frontend now uses a single-page workspace:

- main route: `microservices/frontend/app/receipts/upload/page.tsx`
- main component: `microservices/frontend/components/receipt-workspace.tsx`
- old review route redirects into the workspace

Pre-confirm flow:

- poll `GET /receipts/sessions/{session_id}` or legacy `GET /receipts/{id}`
- display receipt image preview
- display OCR text/debug panel
- display editable extracted fields
- save reviewer feedback

Confirm flow:

- `POST /receipts/sessions/{session_id}/confirm`
- handled by `finalize_parse_session()` in `app/services/session_finalize.py`
- creates the official `Receipt`, `ReceiptOcrResult`, `ReceiptExtraction`, and optional `ReceiptFeedback`
- calls `finance-service`
- promotes temp image to permanent storage

## OCR Stack and Runtime Versions

### Python / API stack

From `microservices/receipt-service/requirements.txt`:

- `fastapi==0.115.6`
- `uvicorn==0.32.1`
- `sqlalchemy==2.0.36`
- `psycopg[binary]==3.2.3`
- `pydantic==2.10.3`
- `pydantic-settings==2.6.1`
- `python-multipart==0.0.18`

### OCR / imaging stack

- `opencv-python==4.10.0.84`
- `numpy==1.26.4`
- `pillow==10.2.0`
- `paddleocr==3.3.3`
- `paddlepaddle==3.2.0` in base CPU build
- `paddlepaddle-gpu==3.2.0` in GPU override build
- `vietocr==0.3.13`
- `torch` + `torchvision`
  - CPU wheels by default
  - CUDA wheels through `docker-compose.gpu.yml`

### Runtime container base

From `microservices/receipt-service/Dockerfile`:

- base image: `python:3.11-slim`
- system packages:
  - `libgomp1`
  - `libglib2.0-0`
  - `libsm6`
  - `libxrender1`
  - `libxext6`
  - `libgl1`

### Compose/runtime modes

- `docker-compose.yml`
  - CPU-safe base runtime
  - `OCR_DEVICE=${RECEIPT_OCR_DEVICE:-auto}`
- `docker-compose.gpu.yml`
  - forces `OCR_DEVICE=gpu`
  - sets NVIDIA env vars
  - adds `gpus: all`
  - switches Paddle and Torch installs to GPU wheels

## Current OCR Pipeline Design

## 1. Preprocessing profiles

Implemented in `app/services/image_preprocess.py`.

### Fast profile

Pipeline:

- safe resize
- grayscale
- `cv2.normalize`
- light non-local means denoise
- orientation check

Purpose:

- keep latency low
- preserve small text without always paying heavy cleanup cost

### Recovery profile

Pipeline:

- safe resize
- grayscale
- CLAHE
- stronger denoise
- sharpen filter
- deskew
- orientation check

Purpose:

- retry difficult receipts only when the fast path looks weak

### Resize policy

- `MAX_LONG_SIDE = 2200`
- `MIN_SHORT_SIDE = 900`

This is materially different from the old documentation that described a single fixed max-side resize to `1280`.

## 2. Detection and recognition split

Implemented in `app/services/ocr_pipeline.py`.

### Detection

Always handled by Paddle through `PaddleDetectorAdapter`.

Current configured models:

- fast detector: `PP-OCRv5_mobile_det`
- recovery detector: `PP-OCRv5_server_det`

### Recognition

Selected through `OCR_RECOGNIZER_BACKEND`.

Supported backends:

- `vietocr`
- `paddle`

Adapters:

- `VietOCRRecognizerAdapter`
- `PaddleRecognizerAdapter`

Defaults from `app/core/config.py`:

- `ocr_recognizer_backend = "vietocr"`
- `ocr_fallback_recognizer_backend = "paddle"`
- `ocr_recognizer_batch_size = 8`
- `ocr_row_grouping_tolerance = 0.65`
- `ocr_vietocr_config_name = "vgg_seq2seq"`

### Box ordering

After detection:

1. detected polygons are normalized to `OCRBox`
2. boxes are grouped into visual rows with configurable tolerance
3. boxes are sorted top-to-bottom, then left-to-right within each row
4. crops are extracted through perspective warp
5. recognizer runs on ordered crops in batch

The row-ordering metadata is preserved in `ocr_debug.ordering`.

## 3. OCR post-processing

`app/services/ocr_postprocess.py` is responsible for conservative Vietnamese normalization and low-quality estimation.

Current OCR result payload still keeps:

- `raw_text`
- `lines`
- `confidence`
- `confidences`
- `device`
- `provider`
- `ocr_language`
- `fallback_used`
- `line_count`
- `detected_box_count`
- `runtime`
- `engine_config`
- `ordering`

This preserves downstream extraction and frontend compatibility while adding more runtime/debug metadata.

## 4. Fast-path recovery gate

Implemented in `_needs_recovery(...)` inside `app/services/parse_pipeline.py`.

Current recovery reasons include:

- low OCR confidence
- corrupted text ratio
- strong Vietnamese corruption signal
- too-short OCR output
- too few detected lines
- fragmented line output
- fragmented header lines
- weak merchant candidate
- missing total amount
- missing critical context
- orientation-corrected input
- deskew-needed signal

This is a material change from the older generic “run OCR once then extract” design.

## Persistence Model

### Temporary parse layer

Tables in `app/models/receipt.py`:

- `receipt_parse_sessions`
- `receipt_parse_jobs`

`ReceiptParseSession` stores:

- temp image URL
- optional permanent URL
- OCR raw text
- OCR debug JSON
- extraction JSON
- reviewer feedback
- finance transaction ID
- confirmed receipt linkage
- expiry/finalization timestamps

### Confirmed receipt layer

Official persistence still uses:

- `receipts`
- `receipt_ocr_results`
- `receipt_extractions`
- `receipt_feedback`
- `receipt_jobs` for legacy receipt-first mode

This means the current codebase is in a compatibility phase:

- session-first for new flow when feature flag is on
- legacy receipt-first path still present when feature flag is off

## Current Folder Map for OCR-Relevant Code

```text
microservices/receipt-service/
  Dockerfile
  requirements.txt
  db/
    migrations/
      20260416_add_receipt_parse_sessions.sql
  scripts/
    benchmark_recognizers.py
    validate_recognizer_contract.py
  app/
    api/
      receipts.py
    core/
      auth.py
      config.py
    db/
      base.py
      session.py
    models/
      receipt.py
    schemas/
      receipt.py
    services/
      extraction_service.py
      finance_client.py
      image_preprocess.py
      ocr_pipeline.py
      ocr_postprocess.py
      ocr_service.py
      parse_pipeline.py
      receipt_queue.py
      receipt_storage.py
      session_finalize.py
    worker.py
```

Frontend OCR-review surface:

```text
microservices/frontend/
  app/receipts/upload/page.tsx
  app/receipts/[id]/review/page.tsx
  components/receipt-workspace.tsx
  components/receipt-ocr-text-panel.tsx
  lib/api.ts
  lib/types.ts
```

## OCR Debug / Observability Shape

The current persisted OCR debug payload includes:

- `lines`
- `confidences`
- `processed_image_path`
- `device`
- `ocr_language`
- `fallback_used`
- `low_quality_ratio`
- `line_count`
- `detected_box_count`
- `short_line_ratio`
- `raw_lines_before_postprocess`
- `postprocess`
- `runtime`
- `engine_config`
- `ordering`
- `preprocess`
- `profile`
- `selected_path`
- `timings`
- `recovery_reasons`

Timing fields currently persisted:

- `queue_delay_seconds`
- `fast_path.preprocess_seconds`
- `fast_path.ocr_seconds`
- `fast_path.extraction_seconds`
- `recovery_path.*`
- `total_parse_seconds`

This is the current source of truth for profiling OCR latency in the live system.

## Current Frontend Review Shape

The OCR review UX is no longer split into a standalone upload page and a separate review page as the main flow.

Current behavior:

- `/receipts/upload` hosts the unified workspace
- the workspace can load either:
  - a temp parse session via `sessionId`
  - a legacy/confirmed receipt via `receiptId`
- OCR text is rendered in `ReceiptOcrTextPanel`
- field editing and confirm happen in the same workspace
- polling is still done every 3 seconds while the parse job is active

## Current Risks and Observations

- The codebase is in a hybrid compatibility phase:
  - legacy receipt-first flow still exists
  - session-first flow is feature-flagged
- Official DB migrations exist for parse sessions, but the worker still also calls `Base.metadata.create_all(...)`
- OCR quality still depends heavily on receipt image quality, detector output, and recognizer backend choice
- VietOCR is integrated and switchable, but benchmark results are not universally better on every sample
- GPU OCR depends on running with `docker-compose.gpu.yml` and an actual NVIDIA-capable host
- Temp storage and promoted permanent storage are still filesystem-based, not object storage based

## Recommended Reading Order

If someone needs to understand the current OCR system from code:

1. `app/core/config.py`
2. `app/api/receipts.py`
3. `app/services/receipt_queue.py`
4. `app/worker.py`
5. `app/services/parse_pipeline.py`
6. `app/services/image_preprocess.py`
7. `app/services/ocr_service.py`
8. `app/services/ocr_pipeline.py`
9. `app/services/ocr_postprocess.py`
10. `app/services/extraction_service.py`
11. `app/services/session_finalize.py`
