## ADDED Requirements

### Requirement: Transactions are wallet-backed
The system SHALL associate every new transaction with a wallet owned by the transaction user.

#### Scenario: User creates transaction with wallet
- **WHEN** a user creates a transaction with a wallet they own
- **THEN** the transaction is saved with that wallet

#### Scenario: User creates transaction with another user's wallet
- **WHEN** a user attempts to save a transaction using another user's wallet
- **THEN** the system rejects the transaction

### Requirement: Transaction category is valid for type and user
The system SHALL validate that a transaction category is active, visible to the user, and matches the transaction type.

#### Scenario: Expense uses income category
- **WHEN** a user saves an expense transaction with an income category
- **THEN** the system rejects the transaction

#### Scenario: Transaction uses private category from another user
- **WHEN** a user saves a transaction with another user's private category
- **THEN** the system rejects the transaction

### Requirement: Transaction source is tracked
The system SHALL record how each transaction was created using a source type.

#### Scenario: Chatbot saves transaction
- **WHEN** a transaction is confirmed from chatbot input
- **THEN** the transaction source type is `chatbot`

#### Scenario: OCR saves transaction
- **WHEN** a transaction is confirmed from OCR review
- **THEN** the transaction source type is `receipt_ai`

### Requirement: Users can review and edit own transactions
The system SHALL allow users to list, filter, review, and edit only their own transactions.

#### Scenario: User filters transaction list
- **WHEN** a user filters by month, wallet, type, category, or source
- **THEN** the system returns matching transactions owned by that user

#### Scenario: User edits transaction
- **WHEN** a user edits amount, date, wallet, category, description, note, or merchant
- **THEN** the system validates ownership and updates reporting inputs

