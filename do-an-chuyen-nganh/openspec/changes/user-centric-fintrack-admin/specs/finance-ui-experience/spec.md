## ADDED Requirements

### Requirement: User workspace UI follows FinTrack data-dashboard style
The admin user workspace UI SHALL use a data-dense, high-contrast FinTrack dashboard style aligned with the main app theme.

#### Scenario: User workspace renders
- **WHEN** an admin opens `/admin/finance/users/:userId`
- **THEN** the page uses compact KPI cards, white surfaces, visible neutral borders, FinTrack blue primary accents, and readable dark text

### Requirement: User workspace UI includes depth cues
The admin user workspace UI SHALL show breadcrumbs and persistent selected-user context.

#### Scenario: Admin opens nested user section
- **WHEN** an admin opens `/admin/finance/users/:userId/receipts`
- **THEN** the page clearly shows the selected user's email/name and the current section

### Requirement: Scoped tables provide clear empty and loading states
Each user workspace table SHALL provide a clear empty state and scoped filter controls.

#### Scenario: User has no receipts
- **WHEN** an admin opens a user's receipts tab and no receipt records exist
- **THEN** the UI states that this user has no receipt/OCR records rather than showing a generic global empty table
