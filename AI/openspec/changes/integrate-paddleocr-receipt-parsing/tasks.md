## 1. Dependency and Runtime Setup

- [x] 1.1 Add `paddleocr`, `paddlepaddle`, `opencv-python`, `pillow`, and `numpy` to `microservices/receipt-service/requirements.txt` with versions compatible with the current Python runtime and Docker image
- [x] 1.2 Update receipt-service Docker and run instructions so PaddleOCR dependencies install and the service still starts correctly in the local stack
- [x] 1.3 Document any required OCR runtime notes, model download expectations, and install/run commands for local development

## 2. OCR Pipeline Services

- [x] 2.1 Create `app/services/ocr_service.py` with singleton PaddleOCR initialization and `extract_text(image_path: str) -> dict`
- [x] 2.2 Create `app/services/image_preprocess.py` with grayscale, contrast enhancement, light blur, and processed-image output helpers
- [x] 2.3 Create `app/services/extraction_service.py` with deterministic extraction for merchant name, transaction date, total amount, and default currency

## 3. Receipt Parse Integration

- [x] 3.1 Replace mock OCR usage in `app/api/receipts.py` with preprocess -> PaddleOCR -> extraction flow while keeping the existing parse response contract
- [x] 3.2 Update parse persistence to write OCR results, extracted fields, receipt status, processed timestamp, and job state using the existing receipt schema only
- [x] 3.3 Add guarded error handling so invalid images or OCR failures mark parse state as failed and return controlled API errors without crashing the service

## 4. Flow Preservation and Compatibility

- [x] 4.1 Verify `POST /receipts/upload`, `GET /receipts/{id}`, `POST /receipts/{id}/feedback`, and `POST /receipts/{id}/confirm` remain compatible with the current frontend and finance-service flow
- [x] 4.2 Confirm no database schema or frontend contract changes are required after integrating real OCR
- [x] 4.3 Capture example OCR output and known limitations for the final implementation summary

## 5. End-to-End Verification

- [x] 5.1 Run the full local workflow: upload -> parse -> review -> confirm and verify a finance transaction is created from real OCR-backed data
- [x] 5.2 Test invalid image, blurry image, and missing-field cases and confirm receipt/job failure or partial-review behavior is handled correctly
- [x] 5.3 Re-review the final implementation against the current ERD and service contracts, then fix any remaining mismatches before closing the change
