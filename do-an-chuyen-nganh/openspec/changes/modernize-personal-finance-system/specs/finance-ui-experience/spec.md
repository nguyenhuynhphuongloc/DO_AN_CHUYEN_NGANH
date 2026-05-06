## ADDED Requirements

### Requirement: First-time users complete finance setup
The system SHALL guide users who lack a default wallet or monthly spending limit through a setup flow before normal dashboard usage.

#### Scenario: User lacks default wallet
- **WHEN** a logged-in user has no default wallet
- **THEN** the UI prompts the user to create or confirm a default wallet

#### Scenario: User lacks monthly spending limit
- **WHEN** a logged-in user has a default wallet but no monthly spending limit
- **THEN** the UI prompts the user to enter a monthly spending target

### Requirement: UI uses professional finance patterns
The system SHALL present wallet, budget, transaction, OCR, and report workflows with a restrained dashboard layout, consistent icons, accessible controls, and responsive behavior.

#### Scenario: User opens finance dashboard on mobile
- **WHEN** the dashboard is viewed at mobile width
- **THEN** wallet cards, spending progress, alerts, and transaction summaries remain readable without horizontal scrolling

#### Scenario: Interactive control is focused
- **WHEN** a keyboard user focuses a button, input, tab, or select
- **THEN** the UI shows a visible focus state

### Requirement: UI avoids emoji iconography
The system SHALL use a consistent SVG icon set for UI icons instead of emoji icons.

#### Scenario: Category icon is displayed
- **WHEN** a category, wallet, source type, or report metric icon appears in the UI
- **THEN** it uses the chosen SVG icon set consistently

### Requirement: Reports use appropriate chart types
The system SHALL use charts that directly support financial decision making.

#### Scenario: User reviews category jars
- **WHEN** category budget usage is displayed
- **THEN** the UI shows progress bars or equivalent budget progress visuals with spent, limit, remaining, and percentage

#### Scenario: User reviews cashflow
- **WHEN** cashflow over time is displayed
- **THEN** the UI uses a time-series chart with income and expense clearly distinguished
