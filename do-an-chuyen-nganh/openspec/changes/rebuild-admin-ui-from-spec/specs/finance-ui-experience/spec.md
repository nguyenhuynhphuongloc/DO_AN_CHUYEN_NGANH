## ADDED Requirements

### Requirement: Admin headers do not use subtitles
Admin pages SHALL render only labels, badges, and actions in headers and SHALL NOT render long subtitle text under page titles.

#### Scenario: Overview header renders
- **WHEN** an admin opens `/admin`
- **THEN** the header shows `Tổng quan` and actions without a subtitle paragraph

#### Scenario: Users header renders
- **WHEN** an admin opens `/admin/finance/users`
- **THEN** the header shows `Người dùng` and actions without explanatory subtitle text

### Requirement: Admin overview excludes support-flow panel
The admin overview SHALL NOT render the panel named or functioning as `Luồng hỗ trợ đúng`.

#### Scenario: Overview content renders
- **WHEN** an admin opens `/admin`
- **THEN** the content shows KPI cards and data warnings, and does not show a support-flow instruction panel

### Requirement: Admin overview shows data warnings with user impact
The admin overview and data warning page SHALL make data warnings actionable for admin operations and explain how warnings affect user-visible finance data.

#### Scenario: Warning has related user
- **WHEN** a data warning includes a related user id
- **THEN** the warning action opens the selected user's workspace

#### Scenario: Data warning page renders
- **WHEN** an admin opens `/admin/finance/data-quality`
- **THEN** the page shows warning type, affected area, related user when available, next step, and a concise explanation of user impact
