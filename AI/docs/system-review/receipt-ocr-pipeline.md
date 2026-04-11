# Receipt OCR Pipeline

## End-to-End Flow

```text
Upload
-> Save local file + receipt row
-> Create queued parse job
-> Return immediately
-> Worker claims job
-> Preprocess image
-> PaddleOCR
-> Save receipt_ocr_results
-> Rule-based extraction
-> Save receipt_extractions
-> Mark ready_for_review or failed
-> Review UI polls status
-> Feedback
-> Confirm
-> finance-service transaction creation
```

## Step-by-Step Breakdown

### 1. Upload

Implementation:

- `microservices/receipt-service/app/api/receipts.py`
- function: `upload_receipt`

Reads:

- uploaded file bytes from multipart form data

Writes:

- local file under `RECEIPT_UPLOAD_DIR`
- `receipts` row with:
  - `user_id` from authenticated JWT `sub`
  - `file_name`
  - `original_url`
  - `mime_type`
  - `file_size`
  - `image_hash`
  - `status=queued` after job enqueue
- `receipt_jobs` row with:
  - `job_type=parse`
  - `status=queued`

Failure points:

- empty file
- missing/invalid bearer token
- disk write failure

### 2. Save file

Implementation detail:

- file is saved locally and the local path is persisted as `original_url`

Risk:

- storage path is tightly coupled to runtime filesystem layout

### 3. Queue and job claim

Implementation:

- `microservices/receipt-service/app/services/receipt_queue.py`
- functions: `enqueue_parse_job`, `claim_next_parse_job`
- worker entrypoint: `microservices/receipt-service/app/worker.py`

Job states used by the parse pipeline:

- `queued`
- `preprocessing`
- `ocr_running`
- `extracting`
- `ready_for_review`
- `failed`

Behavior:

- upload auto-enqueues parsing
- `POST /receipts/{id}/parse` reuses current results unless `force=true`
- duplicate OCR runs are skipped when a completed parse already exists
- worker polls and claims the oldest queued job transactionally

### 4. Preprocess image

Implementation:

- `microservices/receipt-service/app/services/image_preprocess.py`
- function: `preprocess_image`

Operations:

- OpenCV image read
- resize so the largest side is at most `1280`
- grayscale conversion
- contrast boost
- light Gaussian blur
- save processed image

Writes:

- processed PNG file in `uploads/processed`

Failure points:

- unreadable image
- OpenCV decode issue
- processed image save failure

### 5. OCR

Implementation:

- `microservices/receipt-service/app/services/ocr_service.py`
- `OCRService.extract_text`

Configuration:

- PaddleOCR singleton through `lru_cache`
- language: `en`
- orientation helpers disabled
- device controlled by `OCR_DEVICE`
- CPU threads controlled by `OCR_CPU_THREADS`

Behavior:

- worker keeps OCR model warm in memory
- tries GPU when configured and CUDA is available
- falls back to CPU automatically when GPU is unavailable or misconfigured

Produces:

- `raw_text`
- `lines`
- average confidence
- line-level confidences
- effective OCR device

### 6. Save OCR result

Implementation:

- `microservices/receipt-service/app/services/parse_pipeline.py`

Writes to `receipt_ocr_results`:

- `ocr_provider`
- `raw_text`
- `raw_json`
- `confidence_score`

Also writes into `raw_json`:

- OCR lines
- line confidences
- processed image path
- effective OCR device

### 7. Extraction

Implementation:

- `microservices/receipt-service/app/services/extraction_service.py`
- function: `extract_all`

Current rules:

- extraction now uses a hybrid staged pipeline:
  - normalize OCR text and separators
  - build soft zones for header, metadata, item table, payment summary, and footer
  - generate merchant/date/amount/currency/payment/labeled-field candidates
  - score and rank candidates
  - validate selected values against safe business rules
  - persist rich extraction metadata into `extracted_json`
- merchant name is chosen from scored header-oriented candidates instead of blindly using the first OCR line
- transaction date accepts practical OCR-corrupted separators such as `/`, `-`, `.`, and `:`
- numeric values are normalized by `_parse_decimal`:
  - both `,` and `.` present -> treat `,` as thousand separators
  - only `,` present -> treat as thousands if later groups have length `3`, otherwise treat as decimal separator
  - only `.` present -> treat as thousands if later groups have length `3`
- amount candidates are grouped into:
  - `total_amount`
  - `subtotal_amount`
  - `tax_amount`
  - `discount_amount`
  - `service_charge`
- total selection prefers total-labeled candidates and nearby supporting lines, while avoiding customer-cash and non-total signals
- optional fields are extracted conservatively when supported by line labels or layout hints:
  - `payment_method`
  - `receipt_number`
  - `merchant_address`
  - `merchant_phone`
  - `cashier_name`
  - `table_number`
  - `guest_count`
  - `time_in`
  - `time_out`
- simple row-like receipts can also produce `items[]` with:
  - `name`
  - `quantity`
  - `unit_price`
  - `line_total`
- extracted values remain `null` when confidence is weak or validation fails
- `currency` still remains nullable and is not guessed

Important behavior:

- missing or uncertain fields remain `null`
- no fake defaults are injected during extraction
- extraction is language-agnostic and does not contain Vietnamese-specific OCR behavior
- `extracted_json` now preserves:
  - normalized text payload
  - zone breakdown
  - selected fields
  - `items`
  - field-level confidence
  - compact source-line trace metadata
  - `needs_review_fields`
  - `extraction_version`
  - `extraction_notes`
  - description-like text for later suggestion features

### 8. Save extraction

Implementation:

- `microservices/receipt-service/app/services/parse_pipeline.py`

Writes to `receipt_extractions`:

- `merchant_name`
- `transaction_date`
- `total_amount`
- `tax_amount`
- `currency`
- `extracted_json`
- `confidence_score`
- `review_status=needs_review`

Also updates:

- `receipts.status=ready_for_review`
- `receipts.processed_at`
- `receipt_jobs.status=ready_for_review`

### 9. Review UI

Implementation:

- `microservices/frontend/app/receipts/[id]/review/page.tsx`

Visible parts:

- receipt status card
- parse/retry queue button
- editable extraction form
- feedback area
- isolated OCR debug panel

Behavior:

- review page polls `GET /receipts/{id}` while the active parse job is:
  - `queued`
  - `preprocessing`
  - `ocr_running`
  - `extracting`
- form stays disabled until extraction is available
- existing edit-and-confirm flow remains the same once data is ready

### 10. Feedback

Implementation:

- `POST /receipts/{id}/feedback`
- function: `save_feedback`

Writes:

- `receipt_feedback`
- `receipt_feedback.user_id` from authenticated JWT `sub`
- updated values back into `receipt_extractions`
- `receipts.status=reviewed`

### 11. Confirm

Implementation:

- `POST /receipts/{id}/confirm`
- function: `confirm_receipt`
- finance integration: `microservices/receipt-service/app/services/finance_client.py`

Writes:

- updates `receipt_extractions.review_status=confirmed`
- updates `receipts.status=confirmed`
- attaches `finance_transaction_id` into extraction JSON

External call:

- `receipt-service` sends a transaction creation request to `finance-service`
- the inbound bearer token is forwarded so `finance-service` can create the transaction under the same authenticated user context

## Database Table Mapping

### receipts

- mapped by `Receipt`
- used for upload metadata, receipt lifecycle state, and processed timestamp

### receipt_ocr_results

- mapped by `ReceiptOcrResult`
- used to persist raw OCR output and OCR metadata

### receipt_extractions

- mapped by `ReceiptExtraction`
- used to persist structured extracted fields and review state

### receipt_feedback

- mapped by `ReceiptFeedback`
- used to store user corrections and feedback notes

### receipt_jobs

- mapped by `ReceiptJob`
- used to track async parse lifecycle for each queued parse run

## Practical Risks in the Pipeline

- local file storage is not durable across environments
- extraction still depends heavily on OCR text quality
- merchant/date/total heuristics are still simple and generic
- GPU OCR availability depends on host/runtime support
- `receipt-service` still relies on `create_all()` instead of managed DB migrations
