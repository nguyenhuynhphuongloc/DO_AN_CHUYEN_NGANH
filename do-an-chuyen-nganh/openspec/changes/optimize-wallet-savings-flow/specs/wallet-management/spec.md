## ADDED Requirements

### Requirement: Users have one primary wallet and many savings wallets
The system SHALL model each user as having one active primary wallet for ordinary spending and any number of active savings wallets for savings balances.

#### Scenario: User opens wallet management
- **WHEN** a user opens wallet management
- **THEN** the system shows one primary wallet section and a list of that user's savings wallets

#### Scenario: User creates a savings wallet
- **WHEN** a user creates a savings wallet with a valid name and opening balance
- **THEN** the system creates an active savings wallet owned by that user without changing the primary wallet

#### Scenario: User already has a primary wallet
- **WHEN** a wallet setup or update would mark a wallet as the user's primary wallet
- **THEN** the system unsets primary/default status from the user's other active wallets

### Requirement: Savings can fund primary wallet shortfalls by confirmation
The system SHALL allow a user to transfer the missing amount from an owned savings wallet into the primary wallet when an expense exceeds the primary wallet balance and the user confirms the transfer.

#### Scenario: Savings wallet covers shortfall
- **WHEN** an expense exceeds the primary wallet balance and an owned savings wallet has at least the missing amount
- **THEN** the system presents that savings wallet as an available source for covering the shortfall

#### Scenario: User confirms savings transfer
- **WHEN** the user confirms using a savings wallet to cover the shortfall
- **THEN** the system decreases the selected savings wallet by the missing amount and increases the primary wallet by the same amount before applying the expense

#### Scenario: User declines savings transfer
- **WHEN** the user declines to use savings for the shortfall
- **THEN** the system allows the expense to continue against the primary wallet and marks the result with a negative-balance warning

## MODIFIED Requirements

### Requirement: Savings wallet is separate from spending wallet
The system SHALL support user-owned savings wallets whose balances are reported separately from the primary spending wallet and SHALL prevent savings wallets from being used as ordinary expense payment wallets.

#### Scenario: User creates savings wallet
- **WHEN** a user creates a wallet with type `savings`
- **THEN** the wallet is available only to that user and appears in savings/balance reporting

#### Scenario: User creates ordinary expense
- **WHEN** a user creates an ordinary expense transaction
- **THEN** the system uses the user's primary wallet and does not allow a savings wallet as the payment wallet

#### Scenario: User views savings balances
- **WHEN** a user opens dashboard, reports, or savings management
- **THEN** savings wallet balances are shown separately from the primary wallet balance
