## ADDED Requirements

### Requirement: The frontend uses Plus Jakarta Sans as the primary application typeface
The system SHALL use `Plus Jakarta Sans` as the primary frontend typeface across the application shell and pages, while preserving fallback fonts if the primary font cannot be loaded.

#### Scenario: User opens the frontend
- **WHEN** the frontend application renders its global layout and page content
- **THEN** the default typography uses `Plus Jakarta Sans` as the primary font family with defined fallback fonts available

### Requirement: Typography changes do not alter existing feature coverage
The system SHALL apply the typography baseline change globally without removing or functionally changing the existing dashboard, transactions, reports, OCR, AI Vanilla, authentication, or settings workflows.

#### Scenario: User navigates between frontend modules after the font update
- **WHEN** the user moves between existing frontend pages
- **THEN** the pages continue to render their current workflows while reflecting the updated typography baseline
