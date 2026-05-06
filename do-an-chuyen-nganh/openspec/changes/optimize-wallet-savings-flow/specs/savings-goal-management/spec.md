## ADDED Requirements

### Requirement: Users manage multiple savings wallets
The system SHALL allow users to create, list, switch between, and inspect multiple savings wallets owned by them.

#### Scenario: User creates savings wallet
- **WHEN** a user enters a valid savings wallet name and starting balance
- **THEN** the system creates a savings wallet owned by that user and shows it in the savings wallet list

#### Scenario: User switches savings wallet
- **WHEN** a user selects a different savings wallet in savings management
- **THEN** the system shows that wallet's balance and related savings context

#### Scenario: User requests another user's savings wallet
- **WHEN** a user attempts to read or mutate a savings wallet owned by another user
- **THEN** the system denies access

### Requirement: Users manage savings goals
The system SHALL show the number of savings goals, a goal list, and goal details for savings goals visible to the user.

#### Scenario: User opens savings goals
- **WHEN** a user opens the savings section
- **THEN** the system shows the count of current goals and a list of those goals below the summary

#### Scenario: User opens goal detail
- **WHEN** a user selects a savings goal
- **THEN** the system opens a detail view for that goal

### Requirement: Savings goal contributions are source-tracked
The system SHALL let users choose a funding source wallet when contributing to a savings goal and SHALL keep contribution history with source wallet, amount, and contribution date.

#### Scenario: User contributes from primary wallet
- **WHEN** a user contributes to a savings goal from their primary wallet
- **THEN** the system records the source wallet, amount, date, and goal while updating balances consistently

#### Scenario: User contributes from savings wallet
- **WHEN** a user contributes to a savings goal from an owned savings wallet
- **THEN** the system records the source wallet, amount, date, and goal while updating balances consistently

#### Scenario: User views contribution history
- **WHEN** a user opens a savings goal detail page
- **THEN** the system shows contribution history including source wallet, amount, and contribution date

#### Scenario: User uses another user's source wallet
- **WHEN** a user attempts to fund a savings goal from another user's wallet
- **THEN** the system rejects the contribution
