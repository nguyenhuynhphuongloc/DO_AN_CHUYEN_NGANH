## ADDED Requirements

### Requirement: OCR uses allowed categories only
The system SHALL provide OCR category resolution with only categories that the user is allowed to use.

#### Scenario: OCR request is built
- **WHEN** a user uploads a receipt for OCR
- **THEN** the system sends only active expense categories visible to that user as allowed category candidates

#### Scenario: OCR returns category outside allowed set
- **WHEN** OCR returns a category outside the allowed candidate set
- **THEN** the system treats the category as unresolved and requires user selection

### Requirement: Receipt confirmation stores audit history
The system SHALL preserve receipt image metadata, OCR raw text, normalized fields, suggested category, and user-reviewed fields when a receipt transaction is confirmed.

#### Scenario: OCR confirmation succeeds
- **WHEN** a user confirms reviewed OCR fields
- **THEN** the system creates a transaction linked to receipt/audit data

#### Scenario: OCR confirmation fails after file storage
- **WHEN** receipt media or receipt records are created but transaction creation fails
- **THEN** the system cleans up or marks the partial receipt state as failed

### Requirement: Users can view receipt details from transactions
The system SHALL let users open receipt details for their own OCR transactions.

#### Scenario: User opens OCR transaction receipt
- **WHEN** a user clicks view receipt on their OCR transaction
- **THEN** the system displays receipt image, merchant, date, total, line items or raw OCR details when available

#### Scenario: User opens another user's receipt
- **WHEN** a user requests receipt details for another user's transaction
- **THEN** the system denies access

