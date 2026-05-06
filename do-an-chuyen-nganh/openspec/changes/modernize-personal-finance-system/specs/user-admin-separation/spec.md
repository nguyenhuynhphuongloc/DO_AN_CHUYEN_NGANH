## ADDED Requirements

### Requirement: Admin access is role restricted
The system SHALL allow access to the Payload admin interface only for authenticated users with `role` equal to `admin`.

#### Scenario: Normal user opens admin
- **WHEN** an authenticated normal user navigates to `/admin`
- **THEN** the system denies admin access and does not expose admin collections

#### Scenario: Admin user opens admin
- **WHEN** an authenticated admin user navigates to `/admin`
- **THEN** the system allows access to the Payload admin interface

### Requirement: User role is protected
The system SHALL prevent normal users from creating or updating the `role` field.

#### Scenario: Registration submits admin role
- **WHEN** a public registration request includes `role` equal to `admin`
- **THEN** the created account has `role` equal to `user`

#### Scenario: User updates own role
- **WHEN** a normal user submits an update that changes their own `role`
- **THEN** the system rejects or ignores the role change

### Requirement: User profile data is private
The system SHALL allow normal users to read and update only their own profile fields.

#### Scenario: User reads another user
- **WHEN** a normal user requests another user's full profile
- **THEN** the system denies the request or returns only explicitly allowed public summary fields

#### Scenario: User updates own profile
- **WHEN** a normal user updates allowed fields such as name, currency, or avatar
- **THEN** the system saves the changes only for that user's own profile

