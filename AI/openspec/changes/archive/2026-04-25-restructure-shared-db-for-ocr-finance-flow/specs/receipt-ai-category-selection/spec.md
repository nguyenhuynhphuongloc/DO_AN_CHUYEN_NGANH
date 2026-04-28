## ADDED Requirements

### Requirement: Category suggestion uses DB-constrained AI selection
The system SHALL determine a suggested receipt category by evaluating normalized receipt data against categories that already exist in the shared database for the current user or system scope.

#### Scenario: Category candidates are prepared for AI analysis
- **WHEN** the system asks the category resolver for a suggestion
- **THEN** it SHALL provide only categories that are valid for the current user or globally allowed in the shared database

#### Scenario: AI attempts to return an unknown category
- **WHEN** the model output does not correspond to an allowed database category
- **THEN** the system SHALL reject that suggestion and SHALL NOT persist it as the selected category

### Requirement: Groq operates on normalized receipt context rather than raw image OCR alone
The system SHALL use normalized Veryfi-derived receipt data as the input to Groq category analysis.

#### Scenario: Receipt has structured parser output
- **WHEN** a parsed receipt is ready for category analysis
- **THEN** the category resolver SHALL evaluate structured fields such as merchant name, amount, transaction time, raw text, and normalized description context

#### Scenario: Receipt lacks enough context for confident category suggestion
- **WHEN** normalized receipt context is missing or ambiguous
- **THEN** the system SHALL allow the category suggestion to remain empty or uncertain rather than forcing an invented category

#### Scenario: Provider category is present in parser output
- **WHEN** Veryfi or another parser returns its own category label
- **THEN** that provider category SHALL be treated as context inside the normalized receipt JSON and SHALL NOT bypass DB-constrained category selection

### Requirement: Category selection remains review-first and user-overridable
The system SHALL treat AI category output as a suggestion for the review form and SHALL require explicit user confirmation before the final transaction category is persisted.

#### Scenario: AI suggests a category successfully
- **WHEN** the receipt review form is displayed
- **THEN** the suggested category SHALL prefill the category field without bypassing user review

#### Scenario: User disagrees with the suggested category
- **WHEN** the user changes the category before confirmation
- **THEN** the user-selected category SHALL replace the AI suggestion in the final transaction
