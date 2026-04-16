## Why

The current receipt pipeline is tuned for English-only OCR and light extraction heuristics, which causes inconsistent results for Vietnamese receipts and low-quality images. This change is needed now to improve parse quality without disrupting the existing upload, review, feedback, confirm, and finance handoff flow that the product already depends on.

## What Changes

- Upgrade `receipt-service` OCR configuration from English-only PaddleOCR to a Vietnamese-capable or multilingual setup suitable for printed Vietnamese receipts with diacritics.
- Enable document orientation and text angle handling, and strengthen image preprocessing for deskew, denoise, contrast normalization, and safe resizing of long receipts before OCR.
- Preserve and extend OCR debug storage so raw text, line-level output, confidence data, and preprocessing metadata remain available for troubleshooting.
- Improve extraction heuristics for merchant name, transaction date, total amount, tax amount, and currency while keeping missing values nullable rather than fabricating defaults.
- Extend `extracted_json` with optional receipt metadata such as merchant address, receipt number, payment method, subtotal, discount, service charge, and line items when confidence is sufficient.
- Keep the existing authenticated upload, parse, review, feedback, and confirm workflow intact, with only minimal backward-compatible frontend updates for optional extracted fields and low-confidence display.
- Prepare the extraction payload shape so later category and wallet suggestion features can consume richer receipt context without requiring another pipeline redesign.

## Capabilities

### New Capabilities
- `receipt-processing`: Vietnamese-first OCR, resilient image preprocessing, richer receipt field extraction, and backward-compatible review payloads for the existing receipt pipeline.

### Modified Capabilities
- None.

## Impact

- `microservices/receipt-service/app/services/ocr_service.py`
- `microservices/receipt-service/app/services/image_preprocess.py`
- `microservices/receipt-service/app/services/extraction_service.py`
- `microservices/receipt-service/app/api/receipts.py`
- `microservices/receipt-service/app/schemas/receipt.py`
- `microservices/receipt-service/app/models/receipt.py`
- `microservices/frontend/app/receipts/[id]/review/page.tsx`
- `microservices/frontend/components/receipt-ocr-debug-panel.tsx`
- `microservices/frontend/lib/types.ts`
- Receipt OCR runtime dependencies and configuration for PaddleOCR / image preprocessing in `receipt-service`
