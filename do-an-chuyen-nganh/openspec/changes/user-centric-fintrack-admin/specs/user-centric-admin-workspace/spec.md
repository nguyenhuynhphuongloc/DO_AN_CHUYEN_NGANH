## ADDED Requirements

### Requirement: Admin enters user-owned finance data through a selected user
The admin UI SHALL require a selected user context before showing user-owned finance details such as wallets, transactions, custom categories, jars, savings, receipts, notifications, and AI/chat logs.

#### Scenario: Admin opens user list
- **WHEN** an admin opens `/admin/finance/users`
- **THEN** the system shows searchable users and links each user to that user's finance workspace

#### Scenario: Admin opens a user workspace
- **WHEN** an admin opens `/admin/finance/users/:userId`
- **THEN** the system shows a profile header and finance summary for only that user

#### Scenario: Admin opens a finance detail section
- **WHEN** an admin opens `/admin/finance/users/:userId/transactions`
- **THEN** the system shows only transactions owned by `:userId`

### Requirement: Global admin overview avoids sensitive detail rows
The admin overview SHALL show aggregate operational metrics and warning counts, but SHALL NOT show full cross-user rows for wallets, transactions, receipts, notifications, or AI/chat messages.

#### Scenario: Admin views overview
- **WHEN** an admin opens `/admin`
- **THEN** the page shows aggregate KPIs and links to user or data-quality views without listing private finance rows across all users

#### Scenario: Admin follows data quality issue
- **WHEN** a data-quality warning relates to a user-owned record
- **THEN** the system links the admin to the relevant user's workspace or a scoped diagnostic view

### Requirement: User workspace provides scoped navigation
The user workspace SHALL provide breadcrumbs and tabs that keep the admin inside the selected user's context.

#### Scenario: Admin navigates between tabs
- **WHEN** an admin moves from `/admin/finance/users/:userId/wallets` to the transactions tab
- **THEN** the target route remains under `/admin/finance/users/:userId/transactions`

#### Scenario: Admin uses filters
- **WHEN** an admin filters a user workspace table
- **THEN** filters apply only within the selected user's records

### Requirement: Raw Payload collections remain secondary
The admin UI MAY keep links to raw Payload collections, but finance operations SHALL promote the user-centric workspace as the primary path.

#### Scenario: Admin nav renders finance links
- **WHEN** the finance admin navigation renders
- **THEN** direct global finance detail links are replaced by the user list and user workspace links

### Requirement: Admin UI implementation uses UI skill guidance
Any implementation task that changes admin UI SHALL run `ui-ux-pro-max` searches before editing UI files and SHALL apply the resulting accessibility and data-dashboard constraints.

#### Scenario: Agent starts UI implementation
- **WHEN** an implementation agent begins a task that edits `src/components/admin/**` or `src/app/(payload)/custom.scss`
- **THEN** the agent first runs the required `ui-ux-pro-max` design-system, UX, and Next.js stack searches documented in `design.md`

#### Scenario: UI is reviewed
- **WHEN** admin UI changes are complete
- **THEN** the result has visible focus states, high-contrast inputs, data-dense tables, breadcrumbs, and no decorative marketing layout
