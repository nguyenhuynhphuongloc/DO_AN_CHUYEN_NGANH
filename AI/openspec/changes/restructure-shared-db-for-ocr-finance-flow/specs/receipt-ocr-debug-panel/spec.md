## MODIFIED Requirements

### Requirement: Receipt detail API exposes parser-oriented debug data
The system SHALL extend receipt detail responses with debug data built from stored parser results so clients can inspect parser text and structured JSON without depending on OCR-mechanics-specific assumptions.

#### Scenario: Parser data exists
- **WHEN** a client requests a receipt that has stored parser results
- **THEN** the response SHALL include parser-oriented debug data containing provider identity, parser text or raw text, and structured JSON when available

#### Scenario: Parser data is missing
- **WHEN** a client requests a receipt that does not yet have parser results
- **THEN** the response SHALL include the debug field as `null` or safe empty values without failing the request

### Requirement: Receipt review page shows an isolated parser output panel
The system SHALL render parser output in a separate, read-only panel on the receipt review page, and that panel SHALL remain independent from the confirmation form.

#### Scenario: Parser output panel enabled
- **WHEN** the review page loads with parser output available
- **THEN** the page SHALL render a dedicated output panel for parser text and structured JSON separate from the confirmation form

#### Scenario: Parser output panel disabled or removed
- **WHEN** the parser output panel is disabled or removed from the page
- **THEN** the confirmation form SHALL continue to work without code changes to its business logic

### Requirement: Parser output panel avoids primary-form clutter from confidence-heavy OCR metadata
The system SHALL prioritize parser text and structured JSON in the review experience and SHALL NOT require confidence summaries or detected metadata blocks in the primary confirmation experience.

#### Scenario: Confidence or low-level parser metadata is present
- **WHEN** parser debug output contains confidence scores or auxiliary metadata
- **THEN** the primary confirmation experience SHALL keep those values outside the minimal business form

#### Scenario: Long parser content is present
- **WHEN** parser text or structured JSON is long
- **THEN** the panel SHALL preserve readability with scrollable, read-only presentation suited for inspection
