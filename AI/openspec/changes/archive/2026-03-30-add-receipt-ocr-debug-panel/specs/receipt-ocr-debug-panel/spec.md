## ADDED Requirements

### Requirement: Receipt detail API exposes OCR debug data
The system SHALL extend `GET /receipts/{id}` with an additive `ocr_debug` field built only from existing OCR result data, without changing the database schema or modifying receipt workflow behavior.

#### Scenario: OCR data exists
- **WHEN** a client requests a receipt that has a `receipt_ocr_results` record
- **THEN** the response SHALL include `ocr_debug.raw_text`, `ocr_debug.lines`, `ocr_debug.provider`, and `ocr_debug.confidence_score`

#### Scenario: OCR data is missing
- **WHEN** a client requests a receipt that does not yet have OCR results
- **THEN** the response SHALL include `ocr_debug` as `null` or safe empty values without failing the request

### Requirement: Receipt review page shows an isolated OCR debug panel
The system SHALL render OCR debug information in a separate, read-only panel on the receipt review page, and that panel SHALL remain independent from the extraction form.

#### Scenario: Debug panel enabled
- **WHEN** the review page loads with `showOcrDebug` enabled
- **THEN** the page SHALL render a dedicated OCR debug card separate from the extraction form

#### Scenario: Debug panel disabled or removed
- **WHEN** the OCR debug panel is disabled or removed from the page
- **THEN** the existing extraction, feedback, and confirmation form SHALL continue to work without code changes to its business logic

### Requirement: OCR debug panel is safe for long raw text
The system SHALL present OCR debug content in a readable, scrollable, read-only format suitable for UI debugging.

#### Scenario: Long OCR content is present
- **WHEN** OCR raw text or line output is long
- **THEN** the panel SHALL preserve line breaks, use monospaced text for raw OCR, and remain scrollable inside its own bordered card

#### Scenario: No OCR data is available
- **WHEN** the page renders a receipt without OCR debug content
- **THEN** the panel SHALL display a fallback message indicating that no OCR data is available
