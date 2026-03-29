# Receipt OCR Pipeline

## End-to-End Flow

```text
Upload
-> Save local file + receipt row
-> Preprocess image
-> PaddleOCR
-> Save receipt_ocr_results
-> Rule-based extraction
-> Save receipt_extractions
-> Review UI
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
  - `file_name`
  - `original_url`
  - `mime_type`
  - `file_size`
  - `image_hash`
  - `status=uploaded`

Failure points:

- empty file
- invalid/missing default user ID
- disk write failure

### 2. Save file

Implementation detail:

- file is saved locally and the local path is persisted as `original_url`

Risk:

- storage path is tightly coupled to runtime filesystem layout

### 3. Preprocess image

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

### 4. OCR

Implementation:

- `microservices/receipt-service/app/services/ocr_service.py`
- `OCRService.extract_text`

Configuration:

- PaddleOCR singleton through `lru_cache`
- language: `en`
- orientation helpers disabled
- CPU threads limited to `2`

Reads:

- processed image path

Produces:

- `raw_text`
- `lines`
- average confidence
- line-level confidences

Failure points:

- OCR runtime or model init failure
- slow first-run model warm-up
- memory pressure on large or difficult images

### 5. Save OCR result

Implementation:

- `parse_receipt` in `receipts.py`

Writes to `receipt_ocr_results`:

- `ocr_provider`
- `raw_text`
- `raw_json`
- `confidence_score`

Also writes into `raw_json`:

- OCR lines
- line confidences
- processed image path

### 6. Extraction

Implementation:

- `microservices/receipt-service/app/services/extraction_service.py`
- function: `extract_all`

Current rules:

- merchant name = first OCR line
- date = first match of `dd/mm/yyyy` or `dd-mm-yyyy`
- total amount = largest amount from total-like lines, otherwise largest fallback amount
- currency = `VND`

Failure points:

- noisy first OCR line
- ambiguous totals, VAT, service charge
- unsupported date formats
- non-VND receipts

### 7. Save extraction

Implementation:

- `parse_receipt` in `receipts.py`

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

- `receipts.status=parsed`
- `receipts.processed_at`
- `receipt_jobs` for OCR and extraction

### 8. Review UI

Implementation:

- `microservices/frontend/app/receipts/[id]/review/page.tsx`

Visible parts:

- receipt status card
- parse button
- editable extraction form
- feedback area
- isolated OCR debug panel

Data shown:

- extracted merchant
- amount
- date
- category and wallet selection
- OCR raw text and OCR lines

### 9. Feedback

Implementation:

- `POST /receipts/{id}/feedback`
- function: `save_feedback`

Writes:

- `receipt_feedback`
- updated values back into `receipt_extractions`
- `receipts.status=reviewed`

Failure points:

- feedback submitted before parse
- invalid date payload
- DB write failure

### 10. Confirm

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

Current business behavior:

- confirm can create a transaction even if it drives balance negative
- if overspending happens, a warning is returned to the frontend

## Database Table Mapping

### receipts

- mapped by `Receipt`
- used for upload, status tracking, and file metadata

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
- used to track OCR and extraction job status

## Practical Risks in the Pipeline

- OCR remains synchronous inside the HTTP request
- local file storage is not durable across environments
- extraction still depends heavily on OCR text quality
- date and total heuristics are simple and brittle
