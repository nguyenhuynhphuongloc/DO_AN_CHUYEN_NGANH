## Why

The OCR backend alone is not enough for real expense entry because users still need a lightweight review step to verify, correct, and submit extracted receipt data. A reusable frontend module is needed now so the OCR flow can be embedded into existing applications without coupling them to a specific page layout or heavy UI framework.

## What Changes

- Add a reusable React + TypeScript receipt OCR review component that can be embedded into an existing application through configurable endpoint props.
- Add Tailwind-compatible markup and styling primitives without introducing heavyweight component libraries or global state dependencies.
- Integrate the UI with the existing n8n OCR webhook using `multipart/form-data` with the `receipt` file field.
- Display OCR results in an editable form, including a notes field and a category dropdown initialized from `ai_suggested_category`.
- Add user-visible loading, error, and success states for upload, OCR processing, and submission.
- Add a mock save API contract to simulate persistence of the reviewed OCR payload.

## Capabilities

### New Capabilities
- `receipt-ocr-review-ui`: Render a reusable upload-and-review receipt OCR module with editable normalized fields.
- `receipt-ocr-client-integration`: Connect the UI module to configurable OCR and save endpoints with clear loading and error handling.
- `receipt-ocr-mock-save`: Accept reviewed OCR submissions through a mock save endpoint for persistence simulation.

### Modified Capabilities
- None.

## Impact

- New frontend module files for React component logic, TypeScript types, and Tailwind-friendly styles
- New client-side API integration layer for OCR and save requests
- New mock persistence endpoint or route handler for reviewed receipt submissions
- New documentation or example usage showing how to embed the component into another system
- New tests or validation coverage for editable fields, error handling, and submit flow
