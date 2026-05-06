## 1. Transaction Schema Preparation

- [x] 1.1 Add `merchantName`, `currency`, and `sourceType` to `src/collections/Transactions.ts`
- [x] 1.2 Ensure the new transaction fields are compatible with existing admin labels, validation, and default values
- [x] 1.3 Verify that OCR-created expense transactions still work with the existing stats and balance calculation flow

## 2. Python AI Receipt Intelligence Module

- [x] 2.1 Create `AI/services/receipt_intelligence/` with focused modules for Veryfi parsing, normalization, category suggestion, description generation, configuration, and error handling
- [x] 2.2 Port the Veryfi parser integration from the existing receipt-service code into the new portable module without bringing draft/session workflow code
- [x] 2.3 Port the normalized OCR response contract and editable review field mapping into the new module
- [x] 2.4 Port the Groq category suggestion logic so it accepts an allowed category candidate set from the main app instead of querying categories directly
- [x] 2.5 Update the Python AI OCR endpoint in `AI/main.py` and related service entry points to use the new Veryfi + Groq receipt workflow

## 3. Main App OCR Parse and Confirm Routes

- [x] 3.1 Add a dedicated `POST /api/ai/ocr/receipt` route in `do-an-chuyen-nganh` instead of relying on the generic catch-all proxy
- [x] 3.2 Build the category candidate set in the parse route from user-visible expense categories with exact normalized de-duplication
- [x] 3.3 Forward the uploaded receipt image and OCR metadata contract from the parse route to the Python AI service and return the review-ready response
- [x] 3.4 Add a dedicated `POST /api/ai/ocr/receipt/confirm` route that validates reviewed OCR fields for the authenticated user
- [x] 3.5 Upload the receipt image to `media` during confirm and create the expense transaction with the minimal OCR summary fields
- [x] 3.6 Return user-safe success and failure responses from the confirm route so the UI can show save feedback without exposing raw debug payloads

## 4. Scan Page Review UX

- [x] 4.1 Replace the current scan result UI in `src/app/(frontend)/scan/page.tsx` with a two-column review layout
- [x] 4.2 Bind OCR parse results to editable fields for merchant name, transaction date, total amount, currency, category, description, and user note
- [x] 4.3 Show parse failures as user-visible errors and keep the form free of raw OCR text and structured JSON
- [x] 4.4 Submit the reviewed OCR fields and original image to the confirm route, then show success or failure feedback
- [x] 4.5 Reset the scan page state after successful confirm so the user can scan another receipt immediately

## 5. Validation and Rollout Checks

- [x] 5.1 Validate the Python AI service receipt route with a real or representative receipt image and a constrained category set
- [x] 5.2 Validate that the main app parse route only sends de-duplicated user-visible expense categories to Groq
- [x] 5.3 Validate confirm success: media upload, expense transaction creation, transaction source fields, and stats impact
- [x] 5.4 Validate confirm failure paths: invalid category, invalid payload, provider failure, and save error response handling
- [x] 5.5 Document the required environment variables and local run steps for the integrated Veryfi + Groq OCR workflow
