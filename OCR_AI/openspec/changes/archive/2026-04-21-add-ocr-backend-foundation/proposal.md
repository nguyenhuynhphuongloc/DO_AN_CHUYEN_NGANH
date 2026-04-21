## Why

The project needs a reusable OCR backend foundation before any expense-management frontend can rely on receipt extraction. Defining the upload contract, Veryfi integration boundary, and normalized response behavior now reduces coupling and prevents frontend code from depending on vendor-specific OCR output.

## What Changes

- Add a containerized local OCR integration stack based on Docker Compose and n8n, with Veryfi credentials supplied through environment variables.
- Define a receipt-upload webhook contract that accepts an image file from a frontend and triggers synchronous OCR processing through Veryfi.
- Normalize Veryfi OCR output into a strict JSON response contract for expense ingestion.
- Add deterministic validation and failure handling so blurry images, OCR failures, and insufficient extracted data return HTTP 400 with meaningful error details.
- Keep the module reusable by isolating vendor-specific mapping and category suggestion logic inside the workflow boundary instead of the frontend.

## Capabilities

### New Capabilities
- `receipt-ocr-webhook`: Accept receipt image uploads through an n8n webhook and orchestrate OCR processing against Veryfi.
- `receipt-ocr-normalization`: Transform successful OCR results into the exact JSON schema expected by the frontend.
- `receipt-ocr-failure-handling`: Detect OCR, image-quality, and data-completeness failures and return a stable HTTP 400 error response.

### Modified Capabilities
- None.

## Impact

- New local infrastructure definition for Docker Compose and n8n runtime configuration
- New n8n workflow export(s) for webhook intake, OCR invocation, normalization, and error handling
- New environment-variable contract for Veryfi authentication and workflow configuration
- New documentation and example requests for consumers integrating with the OCR module
- New tests or validation fixtures for success and failure response behavior
