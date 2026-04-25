# receipt-parser-review-output Specification

## Purpose
TBD - created by archiving change make-veryfi-primary-receipt-parser. Update Purpose after archive.
## Requirements
### Requirement: Review UI SHALL show parser text to the user
The system SHALL expose readable parser text for a parsed receipt so the user can inspect what content was extracted from the document before confirmation.

#### Scenario: Parser text is available
- **WHEN** a receipt has completed parsing and parser text is available
- **THEN** the review experience SHALL display the parser text in a readable, scrollable, read-only panel

#### Scenario: Parser text is unavailable
- **WHEN** a parsed receipt does not include readable parser text
- **THEN** the review experience SHALL display a safe fallback message instead of failing the page

### Requirement: Review UI SHALL show structured JSON for the parsed receipt
The system SHALL expose structured JSON representing the parsed receipt data and metadata so the user can inspect the structured interpretation of the receipt before confirmation.

#### Scenario: Structured JSON is available
- **WHEN** the receipt detail payload includes structured parser output
- **THEN** the review experience SHALL display the JSON in a read-only format suitable for inspection

#### Scenario: Structured JSON contains review hints
- **WHEN** the parsed output identifies missing or low-confidence fields
- **THEN** the JSON-backed review state SHALL preserve those hints so the UI can highlight the affected fields

### Requirement: Review form SHALL autofill from normalized parser output
The system SHALL autofill the editable receipt review form from normalized parser output so the user can review, correct, and confirm the fields that will be used to save the transaction.

#### Scenario: Normalized fields are present
- **WHEN** the receipt detail payload contains normalized structured fields
- **THEN** the review form SHALL prefill merchant, date, amount, and other supported values from that output

#### Scenario: User edits autofilled values
- **WHEN** the user changes one or more autofilled fields before confirmation
- **THEN** the submitted confirmation SHALL use the user-edited values rather than the original autofilled values

