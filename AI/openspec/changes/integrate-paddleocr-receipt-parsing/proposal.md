## Why

The current receipt pipeline is functionally complete but still relies on mock OCR output, which prevents the system from extracting real text from uploaded receipt images and limits the value of the upload, review, and confirmation flow. Replacing the mock OCR step now allows the existing receipt-service workflow to produce real user-visible data without changing the finalized database schema or breaking the frontend contract.

## What Changes

- Replace the mock OCR step in `receipt-service` with a real PaddleOCR-based text extraction pipeline.
- Add image preprocessing before OCR to improve extraction quality for common receipt images.
- Add rule-based structured extraction from OCR text for merchant name, transaction date, total amount, and currency.
- Persist real OCR output and extracted fields into the existing receipt tables without changing schema.
- Preserve the current upload, parse, review, feedback, and confirm API flow used by the frontend.
- Add failure handling so OCR or extraction issues mark receipt processing as failed instead of crashing the service.
- Add dependency and runtime guidance for PaddleOCR and image processing packages in the receipt service.

## Capabilities

### New Capabilities
- `receipt-real-ocr-processing`: Process uploaded receipt images with PaddleOCR, store OCR and extracted results in the existing receipt schema, and preserve the current review-and-confirm flow.

### Modified Capabilities
- None.

## Impact

- Affected code: `microservices/receipt-service` OCR, parsing, extraction, and error handling modules; receipt parse API integration; local runtime configuration and dependency setup.
- Affected APIs: `POST /receipts/{id}/parse` behavior becomes real OCR-backed while keeping the existing request and response contract stable.
- Dependencies: `paddleocr`, `paddlepaddle`, `opencv-python`, `pillow`, and `numpy`.
- Systems: receipt-service runtime, Docker image size/startup characteristics, and end-to-end receipt-to-transaction flow verification.
