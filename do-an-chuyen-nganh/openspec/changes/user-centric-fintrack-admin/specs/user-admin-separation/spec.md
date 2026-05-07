## ADDED Requirements

### Requirement: Admin accounts are not normal finance workspace users
The system SHALL keep admin operations separate from ordinary user finance workflows, even though the current Payload auth collection is shared.

#### Scenario: Admin opens user app route
- **WHEN** a logged-in admin opens a normal user app route such as `/dashboard`
- **THEN** the system redirects the admin to `/admin`

#### Scenario: Admin logs in through user login
- **WHEN** an admin credential is submitted through `/auth/login`
- **THEN** the system rejects that user-app login flow and instructs the person to use `/admin`

### Requirement: Admin inspection does not mutate user finance data by default
The user-centric admin workspace SHALL default to inspection and support diagnostics, not direct mutation of user finance records.

#### Scenario: Admin views user transactions
- **WHEN** an admin opens a user's transactions tab
- **THEN** the default UI shows read-only rows and detail views

#### Scenario: Admin action is high risk
- **WHEN** a future task adds editing or deletion for user finance records
- **THEN** the action requires a reviewed confirmation flow and is outside this change unless explicitly specified
