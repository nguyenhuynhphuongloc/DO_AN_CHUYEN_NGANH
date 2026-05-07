## ADDED Requirements

### Requirement: AI and chat activity is persistently auditable
The system SHALL persist privacy-safe AI/advisor/chat activity records associated with the user who triggered the activity.

#### Scenario: User sends advisor request
- **WHEN** an authenticated user calls the advisor API
- **THEN** the system records an AI audit log with the user id, kind, status, redacted text or summary, and timestamp

#### Scenario: Advisor request fails
- **WHEN** the advisor API fails after receiving an authenticated user request
- **THEN** the system records an AI audit log with status `error` and a support-safe error message

### Requirement: Admin sees AI/chat logs only inside user context
Admin AI/chat audit UI SHALL be accessible from a selected user's workspace and SHALL show only logs for that selected user.

#### Scenario: Admin opens user AI tab
- **WHEN** an admin opens `/admin/finance/users/12/ai`
- **THEN** the system shows only AI/chat logs whose `user` equals `12`

#### Scenario: Admin opens global AI area
- **WHEN** an admin opens a global AI admin area
- **THEN** the system shows aggregate service health or counts, not full cross-user message rows

### Requirement: AI/chat logs are redacted by default
Admin AI/chat log responses SHALL expose redacted or summarized text by default and SHALL NOT expose raw prompt/response text unless explicitly designed as a reviewed admin action.

#### Scenario: Admin requests user AI logs
- **WHEN** an admin requests `/api/admin/users/12/ai-logs`
- **THEN** each row includes redacted/summarized content and excludes raw private content by default

#### Scenario: Raw text exists
- **WHEN** an AI log stores raw text internally
- **THEN** the default user AI logs endpoint still excludes the raw text field

### Requirement: AI/chat logs can link to created finance records
AI/chat audit records SHOULD link to a created transaction when the chat flow creates a transaction.

#### Scenario: Chatbot saves a transaction
- **WHEN** a user confirms a transaction from chatbot
- **THEN** the system records or updates an AI/chat audit entry with a link to the created transaction
