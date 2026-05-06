## ADDED Requirements

### Requirement: System page map documents user-facing routes
The repository SHALL include a maintained `SYSTEM_PAGE_FUNCTION_MAP.md` document that lists every primary user-facing route and describes the page's purpose.

#### Scenario: Developer reviews available pages
- **WHEN** a developer opens the system page map
- **THEN** they can identify the route path, page name, and business purpose for each primary user-facing page

### Requirement: Page map documents functions and interactions
Each page entry in `SYSTEM_PAGE_FUNCTION_MAP.md` SHALL list visible functions, user actions, API calls, and major data dependencies for that page.

#### Scenario: Developer traces a page interaction
- **WHEN** a developer reviews a function such as creating a transaction, confirming OCR, or setting a category budget
- **THEN** the document identifies the page, user action, frontend component, and API or server data path involved

### Requirement: Page map includes performance notes
The page map SHALL include performance notes for pages that perform server-side data loading, AI/OCR calls, chart rendering, or multi-query aggregation.

#### Scenario: Developer investigates slow navigation
- **WHEN** a page is slow to load in Docker
- **THEN** the page map helps identify whether delay is likely route compilation, database queries, AI/OCR calls, chart rendering, or redirects

### Requirement: Page map stays aligned with route changes
Changes that add, remove, rename, or materially alter a primary frontend page SHALL update `SYSTEM_PAGE_FUNCTION_MAP.md`.

#### Scenario: New page is introduced
- **WHEN** a new primary user-facing route is added
- **THEN** the page map is updated in the same change with route purpose, functions, actions, APIs, data dependencies, and performance notes
