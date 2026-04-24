## ADDED Requirements

### Requirement: Receipt confirmation uses a minimal business review form
The system SHALL present OCR-backed receipt confirmation through a review form limited to merchant name, amount, transaction time, wallet, category, and description.

#### Scenario: Parsed receipt is ready for review
- **WHEN** the receipt review screen is displayed after parsing
- **THEN** the primary confirmation form SHALL show only merchant name, amount, transaction time, wallet, category, and description as the main editable business fields

#### Scenario: Legacy OCR-heavy fields exist in parser data
- **WHEN** parser metadata includes confidence or auxiliary detection details
- **THEN** those values SHALL NOT appear as required primary confirmation inputs

### Requirement: Review form fields are prefilled from parser and DB-backed suggestions
The system SHALL prefill review fields from normalized parser output and database-backed suggestions before user confirmation.

#### Scenario: Parser returns store and amount information
- **WHEN** the receipt review form is prepared
- **THEN** merchant name, amount, and transaction time SHALL be prefilled from normalized receipt data when available

#### Scenario: Category and wallet suggestions exist
- **WHEN** the review form loads with valid suggestions
- **THEN** the category field SHALL be prefilled from the AI category suggestion and the wallet field SHALL be prefilled from DB-backed defaults or configured user defaults

### Requirement: Default description is generated and remains editable
The system SHALL generate a default human-readable description from parsed receipt context and SHALL allow the user to modify it before confirmation.

#### Scenario: Receipt has enough context for description generation
- **WHEN** the parser output includes transaction time, merchant or category context, and amount
- **THEN** the review form SHALL prefill a basic description derived from those fields

#### Scenario: User edits the generated description
- **WHEN** the user changes the description before confirmation
- **THEN** the user-edited description SHALL be saved instead of the generated default
