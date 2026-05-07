## ADDED Requirements

### Requirement: Page map documents admin routes
The repository SHALL document rebuilt admin pages, modules, API routes, data dependencies, and performance notes in `SYSTEM_PAGE_FUNCTION_MAP.md`.

#### Scenario: Developer reviews admin surface
- **WHEN** a developer opens the system page map
- **THEN** they can identify the admin overview, users, wallets, transactions, categories and jars, savings, receipts and OCR, AI advisor, notifications, data quality, and settings modules

#### Scenario: Developer traces admin API
- **WHEN** a developer reviews an admin function such as filtering transactions, inspecting OCR receipts, or running data-quality checks
- **THEN** the page map identifies the admin page, visible action, API route or server action, Payload collections, and major performance risks involved

### Requirement: Page map distinguishes user and admin experiences
The repository SHALL distinguish normal user-facing finance pages from admin back-office pages.

#### Scenario: Developer reviews route ownership
- **WHEN** a developer reviews `SYSTEM_PAGE_FUNCTION_MAP.md`
- **THEN** the document makes clear which routes are normal user finance routes and which routes require admin role access
