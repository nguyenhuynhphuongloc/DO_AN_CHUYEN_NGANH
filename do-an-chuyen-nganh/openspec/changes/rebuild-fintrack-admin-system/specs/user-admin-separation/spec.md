## ADDED Requirements

### Requirement: Admin APIs are role restricted
The system SHALL allow access to admin-only API routes only for authenticated users with `role` equal to `admin`.

#### Scenario: Normal user calls admin API
- **WHEN** an authenticated normal user requests a route under `/api/admin/*`
- **THEN** the system denies the request and returns no admin or finance data

#### Scenario: Admin user calls admin API
- **WHEN** an authenticated admin user requests a route under `/api/admin/*`
- **THEN** the system processes the request according to the route contract

### Requirement: Admin actions are separated from normal finance flows
The system SHALL keep admin operations separate from normal user finance screens and APIs.

#### Scenario: Admin changes user role
- **WHEN** an admin changes a user's role
- **THEN** the operation is performed through an admin-gated action or API and not through the normal user profile update flow

#### Scenario: User uses finance app
- **WHEN** a normal user navigates through dashboard, transactions, categories, reports, savings, chat, or scan
- **THEN** the UI does not expose admin navigation, admin APIs, or admin-only actions
