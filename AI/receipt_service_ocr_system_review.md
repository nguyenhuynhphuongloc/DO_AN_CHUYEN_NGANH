# Receipt Service OCR System Review (Forensic)

## 1. Executive Summary

The active OCR pipeline is **worker-driven**, not request-thread-driven. API requests upload receipts and enqueue parse jobs; `app/worker.py` polls queued jobs and executes the OCR pipeline in `app/services/parse_pipeline.py`.

The real OCR core is:

1. `image_preprocess.preprocess_image(...)`
2. `ocr_service.get_ocr_service().extract_text(...)`
3. `extraction_service.extract_all(...)`
4. `parse_pipeline._persist_results(...)`

This is orchestrated by `parse_pipeline.process_parse_job(...)` and persisted into:

- `receipt_ocr_results` (`ReceiptOcrResult`)
- `receipt_extractions` (`ReceiptExtraction`)
- `receipt_jobs` (`ReceiptJob`)

Key forensic findings:

- **Source of truth for OCR orchestration** is concentrated in `parse_pipeline.py`.
- **Request flow and worker flow are intentionally split**, but some status transitions are duplicated.
- `ocr_placeholder.py` is legacy/orphaned and not referenced anywhere in active code.
- `receipt_queue.get_active_parse_job(...)` does not actually filter active statuses; it returns latest parse job.
- `.env` includes `RECEIPT_DEFAULT_USER_ID`, but no active code reads it.

---

## 2. Folder Map

`microservices/receipt-service/`

- `app/`
  - `main.py` FastAPI app bootstrap + router registration + DB table creation
  - `worker.py` polling worker process entrypoint
  - `api/`
    - `receipts.py` HTTP endpoints and response shaping
  - `core/`
    - `config.py` settings model
    - `auth.py` bearer/JWT verification
  - `db/`
    - `base.py` SQLAlchemy base
    - `session.py` engine/session factory
  - `models/`
    - `receipt.py` ORM entities: receipt, OCR result, extraction, feedback, jobs
  - `schemas/`
    - `receipt.py` Pydantic request/response schemas
  - `services/`
    - `parse_pipeline.py` end-to-end OCR parse job orchestration
    - `ocr_service.py` PaddleOCR integration
    - `image_preprocess.py` OpenCV preprocessing
    - `extraction_service.py` text-to-fields extractor
    - `receipt_queue.py` queueing/claiming parse jobs
    - `finance_client.py` finance-service integration for confirm step
    - `ocr_placeholder.py` unused legacy placeholder
- `uploads/` persisted files
- `requirements.txt` Python deps
- `Dockerfile`, `.env`, `.env.example`, `.dockerignore`

---

## 3. File Inventory (Purpose + Activity)

### Runtime entrypoints

- `app/main.py`  
  Activity: **active**  
  Purpose: API app startup, CORS setup, `Base.metadata.create_all`, router include, `/health`.

- `app/worker.py`  
  Activity: **active**  
  Purpose: long-running polling worker; claims queued parse jobs and executes OCR pipeline.

### API layer

- `app/api/receipts.py`  
  Activity: **active**  
  Purpose: upload/get/parse/feedback/confirm endpoints; enqueue logic and response serialization.

### OCR pipeline services

- `app/services/parse_pipeline.py`  
  Activity: **active (primary orchestration)**  
  Purpose: phase transitions, preprocessing, OCR, extraction, persistence, failure handling.

- `app/services/ocr_service.py`  
  Activity: **active (provider adapter)**  
  Purpose: PaddleOCR init with CPU/GPU fallback; text line extraction; confidence aggregation.

- `app/services/image_preprocess.py`  
  Activity: **active**  
  Purpose: resize + grayscale + contrast/brightness + Gaussian blur + save processed image.

- `app/services/extraction_service.py`  
  Activity: **active (field extraction core)**  
  Purpose: heuristics-driven extraction of merchant/date/amounts/payment metadata/item lines + trace payload.

- `app/services/receipt_queue.py`  
  Activity: **active**  
  Purpose: enqueue parse job, claim next queued job with DB lock, utility accessors.

- `app/services/finance_client.py`  
  Activity: **active (post-OCR confirm path)**  
  Purpose: create finance transaction via HTTP.

- `app/services/ocr_placeholder.py`  
  Activity: **inactive/legacy**  
  Purpose: static fake parser helper; no imports/calls in active graph.

### Data + config + auth

- `app/models/receipt.py` active ORM schema
- `app/schemas/receipt.py` active response/request contract
- `app/core/config.py` active settings source
- `app/core/auth.py` active JWT validation
- `app/db/session.py`, `app/db/base.py` active DB foundation

### Package init files

- `app/services/__init__.py` empty, no behavior
- other `__init__.py` files are package markers; `models/__init__.py` re-exports model symbols

---

## 4. Class/Function Responsibility Analysis

## 4.1 API orchestration (`app/api/receipts.py`)

- `_load_receipt(...)`  
  Loads receipt with joined relations (`ocr_result`, `extraction`, `feedback_items`, `jobs`) and enforces ownership.

- `_serialize_receipt(...)`  
  Builds API DTO; constructs debug block from `receipt.ocr_result.raw_json` (`lines`, `device`, provider, confidence).

- `upload_receipt(...)` (`async`)  
  Stores uploaded file to `settings.receipt_upload_dir`, hashes bytes, creates `Receipt`, enqueues parse job, commits.

- `parse_receipt(...)`  
  Re-enqueues parse (optionally forced). Does **not** run OCR directly.

- `save_feedback(...)`  
  Persists user corrections to `ReceiptFeedback`, mutates `ReceiptExtraction`, updates `extracted_json`.

- `confirm_receipt(...)`  
  Calls `finance_client.create_finance_transaction`, updates extraction status and receipt status to confirmed.

## 4.2 Worker/orchestration (`app/worker.py`, `app/services/parse_pipeline.py`)

- `run_worker()`  
  Poll loop:
  - claim job
  - call `process_parse_job(db, job.id)`
  - sleep if no jobs

- `process_parse_job(...)` (source-of-truth orchestrator)  
  Sequence:
  1. load job + receipt
  2. verify source file exists
  3. set phase `preprocessing`
  4. `preprocess_image`
  5. set phase `ocr_running`
  6. OCR extract
  7. set phase `extracting`
  8. heuristic extraction
  9. persist OCR + extraction data
  10. set phase `ready_for_review`
  11. on exception: rollback and mark `failed`

- `_persist_results(...)`  
  Writes to both `receipt.ocr_result` and `receipt.extraction`; updates confidence and detailed JSON payloads.

## 4.3 OCR provider integration (`app/services/ocr_service.py`)

- `OCRService._build_ocr()`  
  Chooses device from `OCR_DEVICE` (`auto/gpu/cpu`), detects CUDA via `paddle`, falls back to CPU safely.

- `OCRService.extract_text(...)`  
  Calls `PaddleOCR.predict`, normalizes different payload shapes, builds:
  - `lines`
  - `confidences`
  - `raw_text`
  - `confidence` (average)
  - `device`, `provider`

- `get_ocr_service()`  
  `@lru_cache(maxsize=1)` singleton-like service per process.

## 4.4 Preprocess chain (`app/services/image_preprocess.py`)

- `preprocess_image(...)`:
  - load image with OpenCV
  - resize if max side > 1280
  - grayscale
  - contrast/brightness boost (`alpha=1.35`, `beta=10`)
  - Gaussian blur
  - write processed image

## 4.5 Extraction core (`app/services/extraction_service.py`)

- `extract_all(lines, raw_text)` is the main extraction API.
- Implements:
  - line normalization
  - zone segmentation (`header`, `metadata`, `item_table`, `payment_summary`, `footer`)
  - candidate generation for merchant/date/currency/amounts/payment method/labels
  - selection + validation
  - item line extraction
  - confidence map + traceability map (`source_lines`)
  - review flagging (`needs_review_fields`)
  - structured `extracted_json` payload

This module is the heaviest logic owner and effectively a standalone heuristic extractor engine.

---

## 5. Real OCR Flow (Request Flow vs Worker Flow)

## 5.1 Request flow (synchronous HTTP)

`POST /receipts/upload`:

1. save file to uploads directory
2. create `Receipt(status='uploaded')`
3. call `enqueue_parse_job(...)` (usually creates queued job)
4. commit
5. return receipt detail with jobs

`POST /receipts/{id}/parse`:

1. load receipt
2. enqueue parse job (or reuse existing active/completed depending on force)
3. commit
4. return current state (still async processing)

No OCR/preprocessing/extraction runs in HTTP request thread.

## 5.2 Worker flow (async-by-polling background)

`run_worker()` loop:

1. `claim_next_parse_job(...)` selects `queued` job with `FOR UPDATE SKIP LOCKED`
2. sets job status `preprocessing`, receipt status `processing`, commits
3. calls `process_parse_job(...)`
4. pipeline sets phases and persists outputs

## 5.3 Call graph (active code)

`upload_receipt` / `parse_receipt`  
-> `receipt_queue.enqueue_parse_job`  
-> DB queued `ReceiptJob`

`worker.run_worker`  
-> `receipt_queue.claim_next_parse_job`  
-> `parse_pipeline.process_parse_job`  
-> `image_preprocess.preprocess_image`  
-> `ocr_service.get_ocr_service().extract_text`  
-> `extraction_service.extract_all`  
-> `parse_pipeline._persist_results`  
-> DB (`ReceiptOcrResult`, `ReceiptExtraction`, statuses)

`confirm_receipt`  
-> `finance_client.create_finance_transaction`

---

## 6. Duplicate Logic Findings (with confidence)

## 6.1 Job phase/status assignment overlap

Finding: `claim_next_parse_job(...)` already sets status to `preprocessing`, then `process_parse_job(...)` immediately calls `_set_phase(..., "preprocessing")` again.  
Locations:
- `receipt_queue.claim_next_parse_job`
- `parse_pipeline.process_parse_job` + `_set_phase`

Impact: duplicated state transition writes; extra commit churn; ownership split between queue and pipeline.  
Confidence: **High**

## 6.2 Receipt status ownership overlap

Finding: both queue layer and parse pipeline mutate `receipt.status` to processing-related values.  
Locations:
- `receipt_queue.enqueue_parse_job` sets `receipt.status = "queued"`
- `receipt_queue.claim_next_parse_job` sets `"processing"`
- `parse_pipeline._set_phase` sets `"processing"`/`"failed"`/`"ready_for_review"`

Impact: status ownership is distributed across modules, increasing ambiguity.  
Confidence: **High**

## 6.3 Review-state payload duplication across API and extraction persistence

Finding: review semantics exist in two places:
- DB column: `ReceiptExtraction.review_status`
- JSON field: `extracted_json["review_status"]` via `_merge_corrected_extraction_payload`

Impact: two sources can drift if not updated consistently.  
Confidence: **High**

## 6.4 Time source duplication pattern

Finding: multiple modules define their own time helper (`_now`, `utc_now`, local `now` computations in parse pipeline).  
Impact: minor inconsistency risk (timezone and formatting semantics).  
Confidence: **Medium**

---

## 7. Source-of-Truth Mapping

| Concern | Source of truth in code | Notes |
|---|---|---|
| Parse job lifecycle | `app/services/parse_pipeline.py` + `app/services/receipt_queue.py` | Split ownership; pipeline is primary execution engine |
| OCR provider behavior | `app/services/ocr_service.py` | PaddleOCR only in active path |
| Image preprocessing | `app/services/image_preprocess.py` | Single function pipeline |
| Extraction heuristics | `app/services/extraction_service.py` | Main logic center for field inference |
| Persistence schema | `app/models/receipt.py` | ORM defines durable structure |
| API serialization/debug surface | `app/api/receipts.py::_serialize_receipt` | Builds `ocr_debug` from stored raw JSON |
| Auth truth | `app/core/auth.py` | Local HS256 verify against configured secret |
| Environment configuration | `app/core/config.py` | Pydantic settings model |

Practical conclusion: for OCR behavior changes, the highest-impact files are:

1. `parse_pipeline.py` (orchestration + persistence shape)
2. `ocr_service.py` (provider output semantics)
3. `extraction_service.py` (business extraction logic)

---

## 8. Dead/Legacy Code Findings (with confidence)

## 8.1 Orphan OCR placeholder module

Finding: `app/services/ocr_placeholder.py::parse_receipt_placeholder` has no imports/usages in `receipt-service` codebase.  
Evidence: no `rg` hit outside file itself.  
Confidence: **Very High**

## 8.2 Unused parse job status constants

Finding: `PARSE_JOB_TERMINAL_STATUSES` and `PARSE_JOB_ALL_STATUSES` are defined in `receipt_queue.py` but never referenced.  
Confidence: **Very High**

## 8.3 Unused environment variable

Finding: `.env(.example)` defines `RECEIPT_DEFAULT_USER_ID`, but no active code reads `settings.receipt_default_user_id` (field not present in `Settings`).  
Confidence: **Very High**

## 8.4 Potentially stale compiled artifact hints

Finding: `__pycache__` includes references like `receipt_processing.cpython-...pyc` while no `receipt_processing.py` exists in source tree.  
Interpretation: legacy module likely removed previously.  
Confidence: **Medium** (artifact-based inference)

---

## 9. Architectural Assessment

## 9.1 What is strong

- Clear async boundary: requests enqueue, worker executes heavy OCR.
- DB-backed queue with `FOR UPDATE SKIP LOCKED` prevents double-claim races.
- OCR result and extraction result persisted separately with confidence metadata.
- Extraction includes explainability traces (`source_lines`, field confidence, zone segmentation).

## 9.2 What is unclear/overlapping

- Status ownership split across queue + pipeline + API update paths.
- `get_active_parse_job(...)` name implies active filtering but returns latest parse job regardless of active/terminal status.
- Review status duplicated at column + JSON levels.
- Table creation (`Base.metadata.create_all`) runs in both API and worker startup.

## 9.3 OCR provider abstraction state

- Active provider is effectively hardcoded to PaddleOCR (`provider: "paddleocr"` in service + persistence default).
- `ocr_placeholder` suggests historical mock phase but no active abstraction interface remains.

---

## 10. Cleanup Targets For Later Refactor (No code changes yet)

1. Consolidate lifecycle status ownership into one module boundary (queue claim vs pipeline phase updates).  
2. Decide single source for review status (`review_status` column vs JSON mirror).  
3. Rename or fix `get_active_parse_job(...)` to match behavior (active-only filter vs latest-job semantics).  
4. Remove or archive `ocr_placeholder.py` if no planned use.  
5. Remove unused constants in `receipt_queue.py`.  
6. Remove unused env vars from `.env.example` and align `Settings` with actually used keys.  
7. Consider centralizing time handling utilities for consistent timezone semantics.  
8. Clarify ownership boundaries:
   - `parse_pipeline.py` should own phase/state transitions
   - `receipt_queue.py` should own queue mechanics only

---

## Appendix A — Active Entry/Flow Anchors

- API boot: `app/main.py`
- Worker boot: `app/worker.py`
- Upload enqueue: `app/api/receipts.py::upload_receipt`
- Parse enqueue: `app/api/receipts.py::parse_receipt`
- Worker claim: `app/services/receipt_queue.py::claim_next_parse_job`
- Pipeline execute: `app/services/parse_pipeline.py::process_parse_job`
- OCR provider call: `app/services/ocr_service.py::OCRService.extract_text`
- Field extraction: `app/services/extraction_service.py::extract_all`

---

## Appendix B — Confidence Legend

- **Very High**: direct static evidence (no references / obvious unused symbol).
- **High**: direct cross-file evidence with minimal interpretation.
- **Medium**: likely true but involves intent inference from naming or artifacts.
