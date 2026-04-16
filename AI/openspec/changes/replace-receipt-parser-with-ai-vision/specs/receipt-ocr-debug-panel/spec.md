## MODIFIED Requirements

### Requirement: Receipt detail API exposes OCR debug data
The system SHALL extend `GET /receipts/{id}` with an additive debug field built from the current parser result data, without changing the database schema or modifying receipt workflow behavior. Under the Gemini-based parsing architecture, the debug payload SHALL accurately represent Gemini parser metadata and SHALL NOT fabricate traditional OCR line output when Gemini does not return it.

#### Scenario: Parser debug data exists
- **WHEN** a client requests a receipt that has parser result metadata persisted for the current parsing architecture
- **THEN** the response SHALL include debug-safe fields such as provider identity, model or device metadata when available, confidence summary when available, and raw parser text or summary fields only if they are actually present

#### Scenario: Parser does not return OCR-style lines
- **WHEN** Gemini does not produce traditional OCR line output
- **THEN** the response SHALL keep line-oriented debug fields `null`, empty, or omitted safely instead of synthesizing fake OCR lines

#### Scenario: Debug data is missing
- **WHEN** a client requests a receipt that does not yet have parser result metadata
- **THEN** the response SHALL include the debug payload as `null` or safe empty values without failing the request

### Requirement: Receipt review page shows an isolated OCR debug panel
The system SHALL render parser debug information in a separate, read-only panel on the receipt review page, and that panel SHALL remain independent from the extraction form even as the underlying parser changes from PaddleOCR to Gemini Vision.

#### Scenario: Debug panel enabled
- **WHEN** the review page loads with debug display enabled
- **THEN** the page SHALL render a dedicated parser debug card separate from the extraction form

#### Scenario: Debug panel disabled or removed
- **WHEN** the parser debug panel is disabled or removed from the page
- **THEN** the existing extraction, feedback, and confirmation form SHALL continue to work without code changes to its business logic

### Requirement: OCR debug panel is safe for long raw text
The system SHALL present parser debug content in a readable, scrollable, read-only format suitable for UI debugging, whether the parser returns OCR-like raw text, summarized provider output, or sparse metadata only.

#### Scenario: Long parser debug content is present
- **WHEN** parser raw text or debug output is long
- **THEN** the panel SHALL preserve line breaks where relevant, use readable formatting for raw parser output, and remain scrollable inside its own bordered card

#### Scenario: No parser debug data is available
- **WHEN** the page renders a receipt without parser debug content
- **THEN** the panel SHALL display a fallback message indicating that no parser debug data is available
