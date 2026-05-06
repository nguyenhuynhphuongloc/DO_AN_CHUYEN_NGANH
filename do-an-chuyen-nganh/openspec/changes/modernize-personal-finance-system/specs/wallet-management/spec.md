## ADDED Requirements

### Requirement: Users have private wallets
The system SHALL store wallets as user-owned records and SHALL prevent users from reading or mutating wallets owned by other users.

#### Scenario: User lists wallets
- **WHEN** a user opens wallet-dependent screens
- **THEN** the system returns only wallets owned by that user

#### Scenario: User requests another wallet
- **WHEN** a user requests a wallet owned by another user
- **THEN** the system denies access

### Requirement: Default wallet is available
The system SHALL ensure every active user has one default wallet before creating wallet-backed transactions.

#### Scenario: User has no default wallet
- **WHEN** a user logs in and no default wallet exists
- **THEN** the system prompts setup or creates a default wallet according to the onboarding flow

#### Scenario: Transaction is created
- **WHEN** a user creates a transaction without explicitly choosing a wallet
- **THEN** the system assigns the user's default wallet

### Requirement: Monthly spending limit is user configurable
The system SHALL allow users to configure a monthly spending limit for their primary spending wallet.

#### Scenario: User sets monthly spending limit
- **WHEN** a user enters a valid monthly spending amount
- **THEN** the system stores the amount for that user's wallet and uses it in dashboard and budget calculations

#### Scenario: User enters invalid monthly spending limit
- **WHEN** a user enters a zero, negative, or malformed monthly spending amount
- **THEN** the system rejects the value with a validation message

### Requirement: Savings wallet is separate from spending wallet
The system SHALL support user-owned savings wallets whose balances are reported separately from spending wallets.

#### Scenario: User creates savings wallet
- **WHEN** a user creates a wallet with type `savings`
- **THEN** the wallet is available only to that user and appears in savings/balance reporting

