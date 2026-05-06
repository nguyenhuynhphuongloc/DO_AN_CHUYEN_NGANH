## Requirements

### Requirement: Veryfi-backed receipt parsing
The system SHALL parse uploaded receipt images through the Python AI service using Veryfi as the receipt document parser for the main scan workflow.

#### Scenario: Successful receipt parse
- **WHEN** an authenticated user uploads a supported receipt image to the main OCR parse route
- **THEN** the system returns a successful OCR result sourced from the Python AI service using Veryfi

#### Scenario: Unsupported or unreadable receipt image
- **WHEN** the uploaded file is missing, unsupported, or Veryfi cannot produce a usable parse result
- **THEN** the system returns a failure response that the UI can render as a parse error without creating any transaction or media record

### Requirement: Review-ready normalized OCR contract
The system SHALL normalize the parser output into a review-ready contract containing human-editable receipt fields for merchant name, transaction date, total amount, currency, suggested category, description, and user note.

#### Scenario: Receipt includes merchant, date, and amount
- **WHEN** the parser returns merchant, transaction date, and amount fields
- **THEN** the normalized OCR response includes those values in `review_fields` for direct UI binding

#### Scenario: Receipt has partial parser output
- **WHEN** the parser omits one or more review fields
- **THEN** the normalized OCR response preserves any available values and leaves missing review fields empty instead of failing the request

### Requirement: OCR result omits debug data from the v1 review UI contract
The system SHALL keep the scan page UI contract focused on review fields and SHALL NOT require raw parser text or structured debug JSON to be shown in the user-facing v1 scan review experience.

#### Scenario: OCR parse succeeds
- **WHEN** the system returns the normalized OCR response to the scan page
- **THEN** the response contains the review-ready business fields needed by the UI without requiring raw OCR text or structured debug payload to be rendered
