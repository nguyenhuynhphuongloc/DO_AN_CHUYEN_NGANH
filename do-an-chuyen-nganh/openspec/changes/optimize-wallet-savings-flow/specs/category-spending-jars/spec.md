## MODIFIED Requirements

### Requirement: Category spending jars are user-private budgets
The system SHALL let users set category-level spending jars as private budget records and SHALL NOT require spending jars as payment containers for ordinary transactions.

#### Scenario: User creates category jar
- **WHEN** a user sets a monthly limit for a category
- **THEN** the system creates or updates a budget owned by that user for the selected category and period

#### Scenario: User opens category jar list
- **WHEN** a user views category jars
- **THEN** the system shows limit, spent amount, remaining amount, and usage percentage for each jar

#### Scenario: User creates ordinary transaction
- **WHEN** a user creates an ordinary income or expense transaction
- **THEN** the system does not require creating or selecting a spending jar as the payment source
