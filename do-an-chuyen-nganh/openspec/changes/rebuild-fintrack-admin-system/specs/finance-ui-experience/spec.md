## ADDED Requirements

### Requirement: Admin UI uses data-dense finance patterns
The system SHALL present admin finance operations with a compact, data-dense dashboard layout optimized for scanning, filtering, comparison, and repeated support work.

#### Scenario: Admin opens overview
- **WHEN** an admin opens the finance admin overview
- **THEN** KPI cards, alerts, charts, and recent activity use compact spacing, clear labels, and stable dimensions without decorative marketing sections

#### Scenario: Admin reviews table module
- **WHEN** an admin opens a table-heavy module such as Transactions, Users, Wallets, Receipts, or Data Quality
- **THEN** the UI provides visible filters, sortable or scannable columns, row hover states, pagination, and detail access without horizontal overflow on supported viewport widths

### Requirement: Admin UI uses consistent visual system
The system SHALL use a restrained operational visual system for admin pages with high contrast, neutral surfaces, a blue action accent, and SVG icons.

#### Scenario: Admin views controls
- **WHEN** admin buttons, tabs, filters, cards, table actions, or status indicators appear
- **THEN** they use consistent icon sizing, visible focus states, accessible contrast, and no emoji iconography

### Requirement: Admin charts support operations
The system SHALL use chart types that support finance operations and diagnostics.

#### Scenario: Admin reviews cashflow
- **WHEN** admin cashflow or transaction volume over time is displayed
- **THEN** the UI uses a time-series chart with clear income, expense, and net distinctions

#### Scenario: Admin reviews budget usage
- **WHEN** admin budget/jar usage is displayed
- **THEN** the UI uses progress bars or equivalent compact visuals with spent, limit, remaining, and percentage

#### Scenario: Admin reviews source mix
- **WHEN** admin transaction source distribution is displayed
- **THEN** the UI distinguishes manual, chatbot, receipt AI, transfer, and adjustment sources with accessible labels
