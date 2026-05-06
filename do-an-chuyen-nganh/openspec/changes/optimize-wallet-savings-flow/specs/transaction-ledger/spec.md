## ADDED Requirements

### Requirement: Expense shortfalls have explicit handling
The system SHALL detect when an expense exceeds the primary wallet balance and SHALL either complete a confirmed savings transfer or record the expense with a negative-balance warning.

#### Scenario: Expense needs confirmation
- **WHEN** a user submits an expense greater than the primary wallet balance and savings funds are available
- **THEN** the system returns the missing amount and eligible savings wallets before creating the expense

#### Scenario: Expense proceeds after transfer
- **WHEN** the user confirms a savings wallet transfer for the missing amount
- **THEN** the system creates the transfer effect and the expense so the primary wallet reflects the expense correctly

#### Scenario: Expense proceeds without transfer
- **WHEN** the user chooses not to transfer savings or has no eligible savings wallet
- **THEN** the system creates the expense against the primary wallet and returns a warning that the primary wallet balance is negative or needs review

### Requirement: Manual source defaults to display name
The system SHALL treat empty or manual transaction source input as `Thủ công` in user-facing transaction forms and lists.

#### Scenario: User leaves source blank
- **WHEN** a user creates a transaction without entering a source
- **THEN** the system stores the manual source type and displays the source as `Thủ công`

#### Scenario: User views manual transaction
- **WHEN** a manual transaction appears in dashboard, reports, or transaction history
- **THEN** the source label is displayed as `Thủ công`

## MODIFIED Requirements

### Requirement: Transactions are wallet-backed
The system SHALL associate every new ordinary transaction with the user's primary wallet unless the transaction is an explicit wallet transfer or savings goal contribution.

#### Scenario: User creates transaction with wallet
- **WHEN** a user creates an ordinary transaction with their primary wallet
- **THEN** the transaction is saved with that wallet

#### Scenario: User creates transaction with another user's wallet
- **WHEN** a user attempts to save a transaction using another user's wallet
- **THEN** the system rejects the transaction

#### Scenario: User creates ordinary expense with savings wallet
- **WHEN** a user attempts to save an ordinary expense using a savings wallet
- **THEN** the system rejects the savings wallet as a payment wallet

#### Scenario: User creates transaction without wallet
- **WHEN** a user creates an ordinary transaction without explicitly choosing a wallet
- **THEN** the system assigns the user's primary wallet

### Requirement: Transaction source is tracked
The system SHALL record how each transaction was created using a source type and SHALL display manual entries as `Thủ công`.

#### Scenario: Chatbot saves transaction
- **WHEN** a transaction is confirmed from chatbot input
- **THEN** the transaction source type is `chatbot`

#### Scenario: OCR saves transaction
- **WHEN** a transaction is confirmed from OCR review
- **THEN** the transaction source type is `receipt_ai`

#### Scenario: Manual transaction is saved
- **WHEN** a user creates a transaction from the manual add-transaction flow
- **THEN** the transaction source type is `manual` and the displayed source is `Thủ công`
