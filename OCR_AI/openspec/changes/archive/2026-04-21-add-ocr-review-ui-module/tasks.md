## 1. Module Foundation

- [x] 1.1 Add shared TypeScript types for OCR success, OCR error, editable reviewed receipt state, and mock save request/response payloads
- [x] 1.2 Create the reusable `ReceiptOcrModule` component structure with prop-based configuration for `ocrEndpoint` and `saveEndpoint`
- [x] 1.3 Add Tailwind-compatible markup for the upload block, preview area, editable form fields, notes field, category dropdown, status messages, and submit action

## 2. OCR And Save Integration

- [x] 2.1 Implement file selection, image preview lifecycle management, and `multipart/form-data` OCR upload using the `receipt` field name
- [x] 2.2 Populate the editable form from the normalized OCR response and keep all fields user-editable before submission
- [x] 2.3 Implement visible upload, OCR loading, save loading, OCR error, save error, and save success states
- [x] 2.4 Implement submission of the reviewed receipt payload, including notes and final category, to the mock save endpoint

## 3. Mock API And Verification

- [x] 3.1 Add a mock save endpoint or route handler that returns a structured simulated persistence response with a mock receipt identifier
- [x] 3.2 Add verification coverage for successful OCR review flow, OCR failure display, and mock save success behavior
- [x] 3.3 Document embedding usage, expected endpoint contracts, and default category configuration for host applications
