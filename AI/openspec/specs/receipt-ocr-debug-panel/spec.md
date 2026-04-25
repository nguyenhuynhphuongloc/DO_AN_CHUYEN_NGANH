# receipt-ocr-debug-panel Specification

## Purpose
TBD - created by archiving change add-receipt-ocr-debug-panel. Update Purpose after archive.
## Requirements
### Requirement: Receipt detail API exposes OCR debug data
The system SHALL extend `GET /receipts/{id}` with an additive parser-debug payload built from persisted parser result data, while preserving compatibility with the existing receipt detail workflow and avoiding fabricated OCR-only artifacts when the primary provider does not supply them.

#### Scenario: Parser data exists
- **WHEN** a client requests a receipt that has a persisted parser result record
- **THEN** the response SHALL include debug data representing parser/provider output such as raw text when available, provider identity, confidence metadata, runtime metadata, and structured parser diagnostics

#### Scenario: Parser data is missing
- **WHEN** a client requests a receipt that does not yet have parser results
- **THEN** the response SHALL include the debug field as `null` or safe empty values without failing the request

### Requirement: Receipt review page shows an isolated OCR debug panel
The system SHALL render parser debug information in a separate, read-only review panel that remains independent from the editable extraction form, and the panel SHALL support parser-first output such as text, structured JSON, and provider diagnostics.

#### Scenario: Debug panel enabled
- **WHEN** the review page loads with the parser debug panel enabled
- **THEN** the page SHALL render a dedicated parser output card separate from the extraction form and SHALL allow the user to inspect parser text and structured JSON

#### Scenario: Debug panel disabled or removed
- **WHEN** the parser debug panel is disabled or removed from the page
- **THEN** the existing extraction, feedback, and confirmation form SHALL continue to work without code changes to its business logic

### Requirement: OCR debug panel is safe for long raw text
The system SHALL present parser text and JSON debug content in readable, scrollable, read-only formats suitable for review and debugging.

#### Scenario: Long parser content is present
- **WHEN** parser text or structured JSON content is long
- **THEN** the panel SHALL preserve line breaks, render text and JSON in readable read-only containers, and remain scrollable inside its own bounded UI region

#### Scenario: No parser debug data is available
- **WHEN** the page renders a receipt without parser debug content
- **THEN** the panel SHALL display a fallback message indicating that no parser output is available

