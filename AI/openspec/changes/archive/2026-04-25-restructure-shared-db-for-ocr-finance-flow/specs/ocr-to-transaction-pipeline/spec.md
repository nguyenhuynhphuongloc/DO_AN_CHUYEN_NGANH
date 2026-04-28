## ADDED Requirements

### Requirement: OCR pipeline persists receipt and parser state before transaction confirmation
The system SHALL persist uploaded receipt records and parser-result records before any finance transaction is created.

#### Scenario: Receipt is parsed successfully
- **WHEN** the OCR pipeline completes the Veryfi parsing step
- **THEN** the system SHALL store the receipt record and associated parser output in the shared database before the user confirms the transaction

#### Scenario: User abandons the review flow
- **WHEN** a receipt is parsed but never confirmed
- **THEN** the parser result SHALL remain traceable without requiring a confirmed transaction record to exist

### Requirement: OCR pipeline stores a normalized receipt JSON contract for downstream review and finance mapping
The system SHALL preserve a normalized receipt JSON payload that captures the parser interpretation of the receipt before finance confirmation.

#### Scenario: Parser returns structured receipt data
- **WHEN** Veryfi parsing completes successfully
- **THEN** the persisted normalized receipt JSON SHALL preserve merchant name, transaction date/time, total amount, currency, provider category context, and line items in review-safe structured form

#### Scenario: Review form is prepared from parser output
- **WHEN** the system maps parser output into editable review fields
- **THEN** it SHALL derive those fields from the normalized receipt JSON rather than reparsing raw provider payload ad hoc

### Requirement: Confirmed transactions are linked back to their source receipts
The system SHALL link a confirmed transaction to the receipt that produced it whenever the transaction originated from OCR review.

#### Scenario: Receipt review is confirmed
- **WHEN** the user submits a reviewed OCR result as a transaction
- **THEN** the created transaction SHALL reference the originating receipt record

#### Scenario: Transaction does not come from OCR
- **WHEN** a transaction is created manually or by another source
- **THEN** the receipt linkage MAY remain null without breaking the transaction model

### Requirement: Draft receipt state remains separate from confirmed receipt persistence
The system SHALL treat parsed receipt review state as a draft lifecycle that is independent from final confirmed receipt persistence.

#### Scenario: User leaves review without confirming
- **WHEN** the user exits the review flow after parsing has completed
- **THEN** the system SHALL preserve the draft receipt/session state so the user can resume review later without creating a finance transaction

#### Scenario: User explicitly chooses not to save
- **WHEN** the user discards or chooses not to save the parsed receipt
- **THEN** the system SHALL remove the draft receipt/session state and SHALL NOT persist a confirmed receipt or linked finance transaction

### Requirement: OCR-originated transactions record their source path
The system SHALL preserve the source of transaction creation so OCR-originated finance entries can be distinguished from manual entries.

#### Scenario: OCR-backed confirmation creates a transaction
- **WHEN** a transaction is created from a reviewed receipt
- **THEN** the persisted transaction or linked parser result SHALL identify the source as OCR or receipt-AI flow

#### Scenario: Application audits OCR effectiveness later
- **WHEN** the system needs to compare OCR-assisted and manual transaction behavior
- **THEN** the shared database SHALL allow OCR-originated transactions to be filtered without relying on description heuristics
