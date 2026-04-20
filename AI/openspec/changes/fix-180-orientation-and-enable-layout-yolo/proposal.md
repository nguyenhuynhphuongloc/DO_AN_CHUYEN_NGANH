## Why

The current receipt OCR pipeline still fails on images that are effectively upside down when document-level orientation consensus does not cross the current threshold before row ordering runs. The service also relies on brittle heuristic zoning for receipt structure because layout-guided OCR is disabled by default and not wired to a receipt-oriented label mapping path.

## What Changes

- Add a document-level 180-degree correction path that prioritizes majority upside-down evidence before text box row ordering is reused for OCR.
- Enable layout-guided OCR configuration for receipt parsing and define an explicit runtime model path contract for a DocLayout-YOLO compatible weight file.
- Introduce generic YOLO-to-canonical receipt label mapping with geometric fallback so layout blocks can drive `_layout_payload(...)` without depending on receipt-specific raw labels.
- Preserve safe fallback behavior when layout output is sparse or semantically weak, while reducing dependence on heuristic zoning for successful receipt OCR runs.

## Capabilities

### New Capabilities
- `receipt-document-orientation-correction`: Correct upside-down receipt images before OCR row ordering so line order remains top-to-bottom after preprocessing.
- `receipt-layout-guided-ocr`: Run receipt OCR inside layout blocks produced by a generic YOLO layout model and normalize raw labels into canonical receipt OCR regions.

### Modified Capabilities
- None.

## Impact

- Affected code: `microservices/receipt-service/app/services/ocr_service.py`, `ocr_pipeline.py`, `layout_postprocess.py`, and `app/core/config.py`
- Affected runtime behavior: document orientation correction thresholds, layout enablement defaults, layout model path configuration, and layout block semantics passed into extraction
- Dependencies: a compatible Ultralytics `.pt` layout model such as DocLayout-YOLO weights fine-tuned or validated for receipts
