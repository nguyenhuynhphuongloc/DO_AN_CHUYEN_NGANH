# receipt-review-transaction-form Specification

## Purpose
Define the minimal receipt confirmation form, its autofill behavior, and the draft/discard semantics around user review before transaction creation.

## Requirements
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

#### Scenario: Review form needs item-level context
- **WHEN** the user inspects why the parser chose certain values
- **THEN** the review/debug experience SHALL be able to reference line items and provider category context from the normalized receipt JSON without expanding the primary form beyond the six business fields

### Requirement: Default description is generated and remains editable
The system SHALL generate a default human-readable description from parsed receipt context and SHALL allow the user to modify it before confirmation.

#### Scenario: Receipt has enough context for description generation
- **WHEN** the parser output includes transaction time, merchant or category context, and amount
- **THEN** the review form SHALL prefill a basic description derived from those fields

#### Scenario: User edits the generated description
- **WHEN** the user changes the description before confirmation
- **THEN** the user-edited description SHALL be saved instead of the generated default

### Requirement: Review flow preserves draft and discard semantics
The system SHALL distinguish between leaving a parsed receipt in draft review state and explicitly discarding it.

#### Scenario: User leaves the review page without confirming
- **WHEN** the user navigates away after OCR parsing has already completed
- **THEN** the parsed receipt SHALL remain resumable as a draft review item until it expires or is explicitly discarded

#### Scenario: User chooses not to save the receipt
- **WHEN** the user explicitly discards the parsed receipt
- **THEN** the system SHALL remove the draft review item and SHALL NOT create a confirmed receipt or finance transaction
