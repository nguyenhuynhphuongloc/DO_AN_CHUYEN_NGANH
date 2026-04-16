## ADDED Requirements

### Requirement: Receipt parsing SHALL use PaddleOCR on uploaded receipt images
The system SHALL preprocess the stored receipt image, run PaddleOCR with angle classification enabled, and persist the resulting OCR content through the existing receipt-service parse workflow without changing the parse API contract.

#### Scenario: Successful OCR-backed parse
- **WHEN** a client calls `POST /receipts/{id}/parse` for an uploaded receipt image
- **THEN** the system preprocesses the image, runs PaddleOCR, stores OCR output in `receipt_ocr_results`, stores structured extraction in `receipt_extractions`, updates related `receipt_jobs`, and returns the existing receipt parse response shape

#### Scenario: OCR engine is initialized once per process
- **WHEN** the receipt-service handles multiple parse requests after startup
- **THEN** the system reuses a shared PaddleOCR instance instead of reloading OCR models for each request

### Requirement: Receipt parsing SHALL preserve the existing receipt persistence contract
The system SHALL continue writing receipt parse state only to the existing finalized tables `receipts`, `receipt_jobs`, `receipt_ocr_results`, `receipt_extractions`, and `receipt_feedback`, and it MUST NOT require database schema changes.

#### Scenario: Parse writes use existing schema columns
- **WHEN** a parse request completes successfully
- **THEN** the system writes OCR and extraction data only through columns already defined in the current receipt database ERD

#### Scenario: Review and confirm continue to operate on parsed data
- **WHEN** a receipt has been parsed with PaddleOCR-backed output
- **THEN** the existing feedback and confirm APIs continue to read and update the same receipt, extraction, and feedback records without requiring frontend contract changes

### Requirement: Receipt parsing SHALL extract structured receipt fields from OCR output
The system SHALL derive structured values from OCR text using deterministic extraction rules, including merchant name, transaction date, total amount, and default currency.

#### Scenario: Merchant, date, and amount are extracted from OCR text
- **WHEN** OCR text contains receipt lines and numeric content
- **THEN** the system derives merchant name from the first OCR line, finds transaction date by supported regex matching, selects the largest numeric value as total amount, and defaults currency to `VND`

#### Scenario: Missing fields still preserve review flow
- **WHEN** OCR text does not contain every required field with confidence
- **THEN** the system stores whatever structured fields were found, preserves raw OCR output, and returns data that can still be reviewed and corrected by the user

### Requirement: Receipt parsing SHALL fail gracefully
The system SHALL handle preprocessing, OCR, and extraction failures without crashing the receipt-service process, and it SHALL record parse failure state using the existing receipt status and job records.

#### Scenario: Invalid image causes controlled parse failure
- **WHEN** the parse route receives a stored file that cannot be processed as a valid image
- **THEN** the system marks the relevant receipt or job status as failed, records an error message where supported, and returns a controlled error response

#### Scenario: OCR runtime error does not leave inconsistent success state
- **WHEN** PaddleOCR raises an exception during parsing
- **THEN** the system does not persist a successful parse state, updates receipt processing state to failed, and logs the error for troubleshooting
