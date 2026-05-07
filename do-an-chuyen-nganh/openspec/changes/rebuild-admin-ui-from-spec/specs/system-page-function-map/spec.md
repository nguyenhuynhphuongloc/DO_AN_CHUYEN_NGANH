## ADDED Requirements

### Requirement: Documentation describes the two-pane admin UI
System documentation SHALL describe the admin layout where the users list becomes a left sidebar and the selected user's workspace renders on the right.

#### Scenario: Documentation is updated
- **WHEN** the implementation completes
- **THEN** `SYSTEM_PAGE_FUNCTION_MAP.md` documents `/admin/finance/users`, `/admin/finance/users/:userId`, the sidebar/workspace behavior, and all workspace tabs

### Requirement: Documentation includes UI verification requirements
Admin documentation SHALL include the required UI and interaction verification checklist.

#### Scenario: Admin operations docs are updated
- **WHEN** the implementation completes
- **THEN** `ADMIN_OPERATIONS.md` or equivalent documentation lists required checks for text overflow, aligned boxes, responsive breakpoints, nav/tab clicks, filters, console errors, and API 500 responses
