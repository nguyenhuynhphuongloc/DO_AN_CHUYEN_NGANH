## ADDED Requirements

### Requirement: Primary admin UI does not expose global private finance tables
The primary admin UI SHALL keep private finance rows scoped to a selected user and SHALL NOT expose global wallet, transaction, receipt, notification, or AI/chat detail tables as primary navigation destinations.

#### Scenario: Admin navigation renders
- **WHEN** the admin primary navigation renders
- **THEN** it shows overview, users, data warnings, and raw data access, but not global wallet, transaction, receipt, notification, or AI/chat module links

#### Scenario: Admin opens selected user receipts
- **WHEN** an admin opens `/admin/finance/users/:userId/receipts`
- **THEN** receipt/OCR rows are scoped to the selected user

### Requirement: Admin workspace remains inspection-first
The rebuilt admin UI SHALL default to read-only inspection for user-owned finance records.

#### Scenario: Admin opens user transactions
- **WHEN** an admin opens a user's transactions tab
- **THEN** the UI presents read-only rows and detail surfaces, not immediate edit/delete controls
