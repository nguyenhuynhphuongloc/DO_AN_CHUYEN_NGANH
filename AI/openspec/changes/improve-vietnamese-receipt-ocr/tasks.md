## 1. OCR configuration and preprocessing

- [x] 1.1 Audit PaddleOCR runtime support in `microservices/receipt-service/app/services/ocr_service.py` and switch to a Vietnamese-capable or multilingual configuration with orientation / angle handling enabled where supported.
- [x] 1.2 Expand `microservices/receipt-service/app/services/image_preprocess.py` to apply safe long-receipt resizing, grayscale and contrast normalization, denoise, and deskew / rotate correction while still writing a processed debug image.
- [x] 1.3 Extend the OCR debug payload in `microservices/receipt-service/app/services/ocr_service.py` and `microservices/receipt-service/app/api/receipts.py` to preserve raw text, lines, confidences, and preprocessing metadata for troubleshooting.

## 2. Extraction and payload updates

- [x] 2.1 Refactor `microservices/receipt-service/app/services/extraction_service.py` to rank merchant candidates, parse Vietnamese-friendly dates, and classify labeled amounts for total, subtotal, VAT, discount, and service charge.
- [x] 2.2 Update `microservices/receipt-service/app/api/receipts.py` so parse results keep nullable missing fields, stop stubbing `tax_amount`, and write the expanded optional `extracted_json` structure.
- [x] 2.3 Update `microservices/receipt-service/app/schemas/receipt.py` and, if needed for clarity or compatibility, `microservices/receipt-service/app/models/receipt.py` to document and expose the richer extraction payload without breaking existing response contracts.

## 3. Review flow compatibility

- [x] 3.1 Update `microservices/frontend/lib/types.ts` to represent the expanded extraction payload and OCR debug metadata.
- [x] 3.2 Update `microservices/frontend/app/receipts/[id]/review/page.tsx` to handle nullable dates and amounts safely, avoid auto-filling unknown receipt dates during parse, and surface optional extracted fields without making them mandatory.
- [x] 3.3 Update `microservices/frontend/components/receipt-ocr-debug-panel.tsx` to display the preserved debug data for OCR lines, confidences, and preprocessing details in a backward-compatible way.

## 4. Validation and acceptance

- [x] 4.1 Validate the parse flow with sample cases covering a clear Vietnamese receipt, a rotated receipt, a blurry receipt, a long restaurant receipt, and a receipt containing subtotal, VAT, and total labels.
- [x] 4.2 Verify there is no regression in upload, parse, review, feedback, confirm, and finance transaction creation for authenticated receipt ownership.
- [x] 4.3 Confirm acceptance criteria: Vietnamese OCR output is measurably better than the prior English-only setup, optional extracted fields remain non-blocking when absent, and missing fields stay nullable instead of using unsafe defaults.
