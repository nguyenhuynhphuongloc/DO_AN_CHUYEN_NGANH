## ADDED Requirements

### Requirement: Active repository architecture aligns to auth-service, finance-service, and stateless OCR
The system SHALL treat `auth-service`, `finance-service`, and the stateless OCR layer as the only supported application-level architecture for this repository. Active code, scripts, docs, env examples, and naming SHALL distinguish application services from databases and tables.

#### Scenario: Developer inspects the supported architecture
- **WHEN** a developer reads active repository docs or setup instructions
- **THEN** they find `auth-service` mapped to `auth_db`, `finance-service` mapped to `finance_db`, and OCR described as a stateless extraction flow rather than a DB-backed persistence service

### Requirement: Unsupported receipt-persistence architecture is removed or deprecated from active repo surfaces
The system MUST NOT present `receipt-save-service`, `receipt_reviews`, `receipt_db`, `ocr-audit-service`, OCR persistence tables, OCR job tables, OCR feedback tables, or receipt lifecycle persistence as active implementation targets in runnable code, package scripts, env templates, or active documentation.

#### Scenario: Developer audits active runtime and docs
- **WHEN** a developer searches the active repository for supported persistence architecture
- **THEN** the active repo surfaces point to finance transaction persistence and do not expose the retired receipt-persistence model as a valid path

### Requirement: Confirmed invoice fields are the only persisted OCR outcome
The system SHALL treat OCR output as temporary UI input and SHALL persist only the user-confirmed important invoice fields by creating a transaction in `finance_db.transactions`.

#### Scenario: User confirms OCR output
- **WHEN** the user confirms the extracted invoice values
- **THEN** the frontend hands off only the final confirmed transaction fields to `finance-service`, and no raw OCR text, extraction archive, or receipt review record is persisted
