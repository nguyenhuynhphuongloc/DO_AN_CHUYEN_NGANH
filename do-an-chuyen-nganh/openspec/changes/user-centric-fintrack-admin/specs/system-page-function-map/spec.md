## ADDED Requirements

### Requirement: System page map documents user-centric admin routes
`SYSTEM_PAGE_FUNCTION_MAP.md` SHALL document the user-centric admin routes, their purpose, APIs, and data dependencies.

#### Scenario: Documentation is updated
- **WHEN** implementation completes
- **THEN** the page map includes `/admin/finance/users`, `/admin/finance/users/:userId`, and each user workspace child route

### Requirement: Admin operations docs document privacy boundaries
`ADMIN_OPERATIONS.md` SHALL document that user-owned finance details are accessed through selected user workspaces and that global detail browsing is not the primary admin flow.

#### Scenario: Admin docs are updated
- **WHEN** implementation completes
- **THEN** admin docs explain aggregate overview, user-scoped detail access, AI/chat redaction, and session separation limits
