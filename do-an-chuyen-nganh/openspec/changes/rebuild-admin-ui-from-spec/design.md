## Context

`ADMIN_UI_REBUILD_SPEC.md` is now the source document for the desired admin UI. The current admin implementation is user-scoped in data model and API, but the visual and interaction model is still not acceptable: page headers contain explanatory text, the overview contains a support-flow panel the user rejected, and selecting a user does not become the requested chat-like left user list plus right workspace layout.

This change is UI-first. It should reuse the existing user-scoped services and admin API routes from `user-centric-fintrack-admin`, while replacing the admin presentation and interaction model.

Relevant current code:

- `src/components/admin/FinanceAdminDashboard.tsx`
- `src/components/admin/FinanceAdminNavLinks.tsx`
- `src/components/admin/UserWorkspaceHeader.tsx`
- `src/components/admin/UserWorkspaceTabNav.tsx`
- `src/app/(payload)/custom.scss`
- `src/payload.config.ts`
- `src/lib/admin/service.ts`
- `src/app/api/admin/[...path]/route.ts`

## Goals / Non-Goals

**Goals:**

- Implement the admin UI described by `ADMIN_UI_REBUILD_SPEC.md`.
- Remove subtitles and long explanatory copy from admin headers.
- Remove the "correct support flow" overview panel.
- Keep `/admin` focused on KPI cards and data warnings.
- Make `/admin/finance/users` the central UI where:
  - no user selected: users render as a full-width list/table.
  - user selected: users render as a left sidebar similar to a chat/contact list, with the selected user's workspace on the right.
- Keep all user-owned detail data under `/admin/finance/users/:userId/*`.
- Make UI compact, aligned, readable, and resilient to long content.
- Verify all function-switching buttons, nav links, tabs, filters, old global-block routes, console errors, API 500s, and responsive breakpoints.

**Non-Goals:**

- Rewriting admin APIs unless a UI requirement reveals a missing narrow field.
- Adding admin edit/delete flows for user finance data.
- Adding export features.
- Adding a separate admin app outside Payload Admin.
- Changing normal user finance pages.

## Decisions

### 1. Treat `ADMIN_UI_REBUILD_SPEC.md` as the implementation source of truth

Implementation agents must read `ADMIN_UI_REBUILD_SPEC.md` before editing admin UI files. The OpenSpec artifacts translate that document into requirements and tasks, but the Markdown file remains the human-editable UI contract.

Alternative considered: keep only OpenSpec specs. That would make the user-facing editable UI draft harder to review.

### 2. Use a two-pane admin layout for selected-user state

The user list page has two states:

```text
No selected user:
  Header
  Filter bar
  Full-width user list

Selected user:
  Header
  Left user sidebar
  Right selected-user workspace
```

This aligns with the requested chat-like interaction: admin can switch users from the left list without leaving the workspace surface.

Alternative considered: keep separate `/admin/finance/users` list and `/admin/finance/users/:id` page. That is simpler, but does not match the requested UI.

### 3. Remove subtitles and minimize explanatory copy

Admin headers should show labels and actions only. Long text should not appear under page headings. Explanatory details may remain only where they are functional content, such as the data warning impact table.

Alternative considered: keep short helper text. The user explicitly requested removing subtitles, so helper text must not be part of headers.

### 4. Keep overview privacy-safe and simple

The overview shows KPI cards and data warnings. It does not show recent transactions, wallet rows, receipt rows, or AI/chat contents across users. It also removes the "correct support flow" panel.

### 5. Make CSS constraints explicit

The UI must use stable sizing and containment rules:

- `box-sizing: border-box`
- controlled typography scale
- no text overflow outside boxes
- tables in horizontal-scroll wrappers
- sidebar independent scrolling
- active tabs that do not alter layout size
- responsive checks at 375px, 768px, 1024px, and 1440px

### 6. Verification includes browser interaction, not only TypeScript/tests

The final implementation must verify:

- nav links.
- user row selection.
- left sidebar switching.
- every workspace tab.
- filters and reset actions.
- old global-block routes.
- browser console.
- network/API errors.
- long-content layout behavior.

This is required because the reported issue is visual and interaction correctness, not only data correctness.

## Risks / Trade-offs

- [Risk] Payload Admin custom views may not naturally preserve nested selected-user state in the desired two-pane layout.  
  Mitigation: route selected user through `/admin/finance/users/:userId` and render the user list sidebar from the same custom view.

- [Risk] User list queries can become heavy if every sidebar row computes wallet/transaction counts.  
  Mitigation: use existing paginated user row API, keep sidebar row fields narrow, and add pagination/infinite-load only if needed.

- [Risk] Long Vietnamese labels, emails, merchant names, or AI log text can overflow compact cards.  
  Mitigation: enforce overflow rules in shared table/card/sidebar styles and verify with long sample data.

- [Risk] Removing subtitles may make some screens unclear.  
  Mitigation: use concise labels, badges, table headers, and action names instead of page-level explanatory copy.

- [Risk] Browser smoke testing takes longer than API tests.  
  Mitigation: keep the interaction checklist explicit and bounded to key routes and breakpoints.

## Migration Plan

1. Replace admin shell/header/nav to remove subtitles and support compact labels.
2. Rebuild overview to show only KPI cards and data warnings.
3. Rebuild users route to support full-list and selected-user two-pane states.
4. Create or refactor user sidebar, workspace header, tabs, and tab panels.
5. Apply shared CSS polish and overflow containment.
6. Keep old global finance routes as block pages that route admins back to user selection.
7. Update docs to reference the new UI model.
8. Run import map generation if Payload component references change.
9. Run TypeScript and targeted tests.
10. Run browser smoke tests and responsive checks.

Rollback strategy:

- Restore previous admin custom view implementation while keeping user-scoped APIs.
- Since this change is UI/CSS focused, no data migration rollback is expected.

## Open Questions

- Should the left user sidebar use pagination, infinite scroll, or fixed first-page results?
- Should mobile selected-user state use a drawer for the user list or a top collapsible list?
- Should `Dữ liệu gốc` remain visible in primary nav or move to a secondary footer group?
