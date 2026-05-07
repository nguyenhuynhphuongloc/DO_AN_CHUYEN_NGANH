## ADDED Requirements

### Requirement: Admin users page supports full-list and selected-user layouts
The admin users page SHALL render a full-width user list when no user is selected and SHALL render a two-pane layout when a user is selected.

#### Scenario: Admin opens users page without selected user
- **WHEN** an admin opens `/admin/finance/users`
- **THEN** the UI shows the users filter bar and a full-width users list without a user workspace panel

#### Scenario: Admin selects a user
- **WHEN** an admin selects a user from `/admin/finance/users`
- **THEN** the UI navigates to `/admin/finance/users/:userId` and renders the user list on the left with the selected user's workspace on the right

### Requirement: User list sidebar behaves like a compact contact list
The selected-user admin layout SHALL show users in a compact left sidebar similar to a chat/contact list.

#### Scenario: Selected user workspace renders
- **WHEN** an admin opens `/admin/finance/users/:userId`
- **THEN** the left sidebar shows searchable compact user rows with avatar initials, email, role/status labels, latest activity, and an active selected-user indicator

#### Scenario: Admin switches selected user
- **WHEN** an admin clicks a different user in the left sidebar
- **THEN** the route changes to that user's workspace and the active sidebar indicator moves to the clicked user

### Requirement: Workspace tabs stay scoped to the selected user
The selected-user workspace SHALL keep all detail tabs under `/admin/finance/users/:userId/*`.

#### Scenario: Admin changes workspace tab
- **WHEN** an admin clicks any workspace tab
- **THEN** the target route remains under `/admin/finance/users/:userId/` and the selected user remains highlighted in the sidebar

#### Scenario: Admin opens transactions tab
- **WHEN** an admin opens `/admin/finance/users/:userId/transactions`
- **THEN** the UI shows only the selected user's transaction workspace and does not render a global transaction table

### Requirement: Old global finance routes show a selected-user block
Old global finance detail routes SHALL not render sensitive global detail tables.

#### Scenario: Admin opens old global transactions route
- **WHEN** an admin opens `/admin/finance/transactions`
- **THEN** the UI shows a compact block with `Cần chọn người dùng trước`, `Chọn người dùng`, and `Về tổng quan`

#### Scenario: Admin opens old global AI route
- **WHEN** an admin opens `/admin/finance/ai`
- **THEN** the UI does not show cross-user AI/chat rows and instead links back to user selection
