## 1. Backend OCR Debug Response

- [x] 1.1 Extend `receipt-service` `GET /receipts/{id}` response types to expose an additive `ocr_debug` payload derived only from `receipt_ocr_results`
- [x] 1.2 Ensure the backend returns safe `ocr_debug` fallback values or `null` when OCR data is missing without changing parse, feedback, or confirm behavior

## 2. Frontend Debug Panel

- [x] 2.1 Add an isolated `receipt-ocr-debug-panel` component that renders OCR provider, confidence score, raw text, and optional OCR lines as read-only debug content
- [x] 2.2 Update the receipt review page to render the debug panel in its own bordered card behind a simple local `showOcrDebug = true` toggle
- [x] 2.3 Keep the extraction form independent so disabling or removing the debug panel does not affect receipt review business logic

## 3. Verification and Cleanup

- [x] 3.1 Update frontend receipt types or API typing so the new debug payload is type-safe
- [x] 3.2 Build the frontend and verify the review page still loads with the debug panel rendered separately
- [x] 3.3 Reconcile any task or spec wording with the actual system state and keep the debug panel implementation minimal and removable
