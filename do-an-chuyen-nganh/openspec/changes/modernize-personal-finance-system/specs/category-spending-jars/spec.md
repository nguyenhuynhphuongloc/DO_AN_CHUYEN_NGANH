## ADDED Requirements

### Requirement: System and user categories are separated
The system SHALL distinguish curated system categories from private user categories.

#### Scenario: User views categories
- **WHEN** a user opens the category screen
- **THEN** the system shows active system categories and that user's private categories

#### Scenario: User category belongs to another user
- **WHEN** a user opens category choices
- **THEN** the system does not show private categories owned by another user

### Requirement: Categories are not auto-created by AI flows
The system SHALL prevent chatbot and OCR flows from creating new category records automatically.

#### Scenario: Chatbot cannot match category
- **WHEN** chatbot parsing does not match an existing allowed category
- **THEN** the system asks the user to choose an existing category

#### Scenario: OCR cannot resolve category
- **WHEN** OCR category resolution does not return an allowed category
- **THEN** the system requires user category selection before saving the transaction

### Requirement: Category spending jars are user-private budgets
The system SHALL let users set category-level spending jars as private budget records.

#### Scenario: User creates category jar
- **WHEN** a user sets a monthly limit for a category
- **THEN** the system creates or updates a budget owned by that user for the selected category and period

#### Scenario: User opens category jar list
- **WHEN** a user views category jars
- **THEN** the system shows limit, spent amount, remaining amount, and usage percentage for each jar

### Requirement: Category jar totals respect monthly spending limit
The system SHALL compare total active category jar limits against the user's monthly spending limit.

#### Scenario: Total jars exceed monthly limit
- **WHEN** the total category jar allocation exceeds the monthly spending limit
- **THEN** the system warns the user and prevents saving unless an explicit override policy is implemented

#### Scenario: Spending exceeds category jar
- **WHEN** category spending reaches configured alert thresholds or exceeds the category jar limit
- **THEN** the system displays a warning and records a notification when notifications are enabled

### Requirement: Category cleanup preserves transaction history
The system SHALL remap transactions from obsolete categories to canonical categories before deleting or archiving obsolete category records.

#### Scenario: Category cleanup dry run
- **WHEN** the category cleanup script runs in dry-run mode
- **THEN** it prints category mappings and affected transaction counts without changing data

#### Scenario: Category cleanup apply
- **WHEN** the category cleanup script applies an approved mapping
- **THEN** transactions point to canonical categories before obsolete categories are archived or deleted

