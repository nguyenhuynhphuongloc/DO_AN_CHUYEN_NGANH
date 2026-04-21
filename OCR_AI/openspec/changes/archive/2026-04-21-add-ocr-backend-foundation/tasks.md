## 1. Local OCR Runtime Setup

- [x] 1.1 Add the Docker Compose stack and environment template for running local n8n with Veryfi credentials supplied from env vars
- [x] 1.2 Define the repository structure for n8n workflow exports, local storage, and startup documentation

## 2. Receipt OCR Workflow

- [x] 2.1 Create the n8n webhook workflow that accepts one receipt image upload and rejects missing or invalid input
- [x] 2.2 Configure the Veryfi request step to send the uploaded file to the synchronous document-processing endpoint with confidence details enabled
- [x] 2.3 Implement the normalization step that maps OCR output into `total_amount`, `currency`, `transaction_datetime`, `merchant_name`, `payment_method`, and `ai_suggested_category`
- [x] 2.4 Implement deterministic category mapping and fallback handling for date-only receipts and unknown payment methods

## 3. Failure Handling And Verification

- [x] 3.1 Add workflow branches that return structured HTTP 400 errors for `INVALID_INPUT`, `OCR_FAILED`, `BLURRY_IMAGE`, and `INSUFFICIENT_DATA`
- [x] 3.2 Add smoke-test fixtures or scripted checks for a successful receipt, a blurry receipt, and an insufficient-data receipt
- [x] 3.3 Document the webhook request format, success schema, error schema, and local run steps for downstream frontend integration
