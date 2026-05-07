## ADDED Requirements

### Requirement: Admin UI uses compact polished typography
The admin UI SHALL use a compact typography scale that is readable without oversized or undersized text.

#### Scenario: Admin page renders
- **WHEN** any admin page renders
- **THEN** page labels are approximately 22-24px, section labels are approximately 15-17px, table/body text is approximately 13-14px, and primary content text is not below 12px

### Requirement: Text stays inside its containing boxes
The admin UI SHALL prevent long text from overflowing outside cards, panels, buttons, sidebar rows, and table cells.

#### Scenario: Long email appears in sidebar
- **WHEN** a user has a long email address
- **THEN** the sidebar row truncates or wraps the email within the row without breaking the sidebar width

#### Scenario: Long merchant or AI text appears in a table
- **WHEN** a table contains long merchant names, IDs, routes, or AI/chat text
- **THEN** the content wraps or truncates within the table cell and does not overflow outside the table container

### Requirement: Boxes and panels remain aligned
The admin UI SHALL keep cards, panels, filters, tables, sidebar, and workspace aligned without visual drift.

#### Scenario: KPI grid renders on desktop
- **WHEN** the overview KPI grid renders at desktop width
- **THEN** cards in the same row align consistently and no card is offset by active or loading state

#### Scenario: Selected-user layout renders
- **WHEN** the selected-user layout renders at desktop width
- **THEN** the left sidebar and right workspace share the same top alignment and do not overlap

### Requirement: Responsive layouts avoid full-page horizontal overflow
The admin UI SHALL avoid full-page horizontal scrolling at supported breakpoints.

#### Scenario: Admin renders at 375px
- **WHEN** the admin UI is viewed at 375px width
- **THEN** text does not overlap, boxes do not spill out of the viewport, and wide tables scroll inside their table wrapper

#### Scenario: Admin renders at 1024px
- **WHEN** the admin UI is viewed at 1024px width with a selected user
- **THEN** the user sidebar and workspace fit side by side without overlap

### Requirement: Admin interactions are browser-verified
The implementation SHALL verify all primary navigation, user selection, workspace tabs, filters, and old global-block actions in a browser.

#### Scenario: Workspace tabs are clicked
- **WHEN** each workspace tab is clicked during verification
- **THEN** the URL, active state, selected user, console output, and network responses are checked for incorrect UI state, console errors, and API 500 responses

#### Scenario: Filters are submitted and reset
- **WHEN** admin filters are submitted and reset
- **THEN** the UI stays within the correct route scope and does not lose the selected user context
