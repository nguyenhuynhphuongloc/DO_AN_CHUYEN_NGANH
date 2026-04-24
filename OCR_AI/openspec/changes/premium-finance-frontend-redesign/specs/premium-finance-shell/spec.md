## ADDED Requirements

### Requirement: The frontend provides a premium authenticated finance application shell
The system SHALL provide an authenticated finance application shell with a top header, left navigation sidebar, main content area, and footer, and the shell SHALL remain visually consistent across dashboard, transactions, budgets, categories, savings goals, reports, OCR, AI Vanilla, notifications, and settings pages.

#### Scenario: Authenticated user navigates between finance modules
- **WHEN** an authenticated user opens a protected finance route
- **THEN** the frontend renders the shared application shell with persistent navigation and the requested module content inside the main content area

### Requirement: The sidebar exposes finance navigation and the mandatory bottom user section
The system SHALL render sidebar navigation items for Dashboard, Transactions, Budgets, Categories, Savings Goals, Reports / Analytics, OCR Receipts, AI Vanilla, Notifications, and Settings, and the bottom of the sidebar SHALL include an avatar, username, and gear-triggered user menu with Profile, Settings, Security, and Logout actions.

#### Scenario: User opens the sidebar settings menu
- **WHEN** the authenticated user activates the gear icon in the sidebar user section
- **THEN** the frontend shows a compact menu containing Profile, Settings, Security, and Logout actions without leaving the shared shell

### Requirement: The finance shell uses a premium dark theme with optional light-theme support
The system SHALL default to a premium dark visual system with black-dominant surfaces, restrained gold accents, readable typography, subtle borders, soft shadows, and compact spacing, and the frontend SHALL support an optional light theme that uses white, navy, and gold without breaking readability.

#### Scenario: User views the dashboard in the default theme
- **WHEN** the authenticated user loads the finance dashboard without changing theme settings
- **THEN** the interface renders using the premium dark theme with gold used only for accents, highlights, or important emphasis states

### Requirement: Shared finance pages expose consistent loading, empty, and responsive states
The system SHALL provide reusable loading, empty, filter, and section-shell patterns so finance pages remain visually coherent on desktop and usable on mobile-sized layouts.

#### Scenario: Finance page has no records
- **WHEN** a finance page such as transactions or savings goals has no available records
- **THEN** the frontend shows a purpose-built empty state inside the shared shell instead of leaving the page blank or structurally broken
