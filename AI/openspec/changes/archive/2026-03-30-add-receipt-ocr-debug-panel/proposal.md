## Why

Receipt OCR is now returning real text and extracted fields, but the review page does not expose the raw OCR output in a way that is easy to inspect during UI testing. Adding a removable debug panel now will make OCR verification faster without coupling debugging concerns to the core receipt confirmation workflow.

## What Changes

- Extend `GET /receipts/{id}` to include an `ocr_debug` payload built only from existing `receipt_ocr_results` data.
- Add a read-only OCR debug panel to the receipt review page that is visually separate from the extraction form.
- Isolate the debug UI into its own frontend component so it can be disabled or deleted later without affecting receipt parsing, feedback, or confirmation flows.
- Gate the panel behind a simple local boolean toggle in the review page.

## Capabilities

### New Capabilities
- `receipt-ocr-debug-panel`: Expose OCR raw text debug information in the receipt review experience without changing core receipt behavior or schema.

### Modified Capabilities
- None.

## Impact

- Affected backend API: `receipt-service` `GET /receipts/{id}`
- Affected frontend UI: receipt review page and a new isolated debug component
- No database schema changes
- No changes to parse, feedback, confirm, or finance-service integration
