## Why

The current admin UI still does not match the approved `ADMIN_UI_REBUILD_SPEC.md`: it shows too much explanatory text, uses a module-style layout, and does not provide the requested selected-user experience with a left user list and right workspace.

This change rebuilds the admin UI contract so implementation agents can produce a compact, polished, testable admin interface without rediscovering layout and interaction requirements.

## What Changes

- Rebuild the primary admin UI around a compact no-subtitle design.
- Replace the current selected-user flow with a two-pane admin layout:
  - user list/sidebar on the left, visually similar to a chat/contact list.
  - selected user workspace on the right.
- Keep primary navigation limited to:
  - Overview
  - Users
  - Data warnings
  - Raw data as secondary access.
- Remove the "correct support flow" panel from the overview.
- Keep overview focused on KPI cards and data warnings only.
- Define data warning behavior and explain how warnings affect end users.
- Require CSS polish:
  - readable text sizes.
  - stable box sizing.
  - no text overflow outside boxes.
  - aligned cards/panels.
  - responsive behavior at 375px, 768px, 1024px, and 1440px.
- Require interaction verification for every nav button, user row, workspace tab, filter, reset, pagination, role action, and old global-block route.
- Keep user-owned finance details under `/admin/finance/users/:userId/*`.

## Capabilities

### New Capabilities

- `admin-two-pane-user-workspace`: Defines the admin UI model where the user list becomes a left sidebar and the selected user's finance workspace renders on the right.
- `admin-ui-polish-verification`: Defines CSS, layout, overflow, responsive, and interaction testing requirements for the admin UI.

### Modified Capabilities

- `finance-ui-experience`: Admin UI must follow the compact, polished, no-subtitle FinTrack style defined in `ADMIN_UI_REBUILD_SPEC.md`.
- `user-admin-separation`: Admin user-owned finance details must remain user-scoped and must not return to global detail browsing.
- `system-page-function-map`: Documentation must reflect the new two-pane admin UI and verification requirements.

## Impact

- Affected spec source:
  - `ADMIN_UI_REBUILD_SPEC.md`
- Affected admin UI code:
  - `src/components/admin/FinanceAdminDashboard.tsx`
  - `src/components/admin/FinanceAdminNavLinks.tsx`
  - `src/components/admin/UserWorkspaceHeader.tsx`
  - `src/components/admin/UserWorkspaceTabNav.tsx`
  - possible new `UserListSidebar`, `AdminShell`, `AdminHeader`, empty/error/loading components.
- Affected styling:
  - `src/app/(payload)/custom.scss`
- Affected Payload admin config:
  - `src/payload.config.ts` only if view paths/import map need adjustment.
- Affected docs:
  - `SYSTEM_PAGE_FUNCTION_MAP.md`
  - `ADMIN_OPERATIONS.md`
- Verification:
  - `cmd /c npm run generate:importmap` if admin components/config paths change.
  - `cmd /c npx tsc --noEmit`
  - targeted admin API/UI tests where available.
  - browser smoke tests for nav, tabs, filters, route state, console errors, API 500s, text overflow, and responsive breakpoints.
