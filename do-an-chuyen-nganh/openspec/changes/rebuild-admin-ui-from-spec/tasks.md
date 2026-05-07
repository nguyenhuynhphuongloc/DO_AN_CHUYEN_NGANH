## 1. Orientation And Guardrails

- [x] 1.1 Read `ADMIN_UI_REBUILD_SPEC.md` completely before editing admin UI.
- [x] 1.2 Read `openspec/changes/rebuild-admin-ui-from-spec/proposal.md`, `design.md`, and all `specs/**/spec.md`.
- [x] 1.3 Read current admin files: `src/components/admin/FinanceAdminDashboard.tsx`, `FinanceAdminNavLinks.tsx`, `UserWorkspaceHeader.tsx`, `UserWorkspaceTabNav.tsx`, `AdminDataTable.tsx`, `AdminFilterBar.tsx`, `AdminKpiCard.tsx`, `AdminStatusBadge.tsx`, and `src/app/(payload)/custom.scss`.
- [x] 1.4 Confirm existing admin service/API helpers already provide user-scoped data before changing UI: `getAdminUsers`, `getAdminUserProfile`, `getAdminUserWorkspaceOverview`, `getAdminUserWallets`, `getAdminUserTransactions`, `getAdminUserCategories`, `getAdminUserBudgets`, `getAdminUserSavings`, `getAdminUserReceipts`, `getAdminUserAiLogs`, `getAdminUserNotifications`.
- [x] 1.5 Do not add edit/delete finance actions; keep user-owned finance records read-only unless the spec is explicitly changed.

## 2. UI Skill And Design Constraints

- [x] 2.1 Run `python .codex/skills/ui-ux-pro-max/scripts/search.py "personal finance admin dashboard compact sidebar workspace table" --design-system -p "FinTrack Admin UI Rebuild" -f markdown`.
- [x] 2.2 Run `python .codex/skills/ui-ux-pro-max/scripts/search.py "admin dashboard table overflow responsive focus tabs sidebar" --domain ux -n 8`.
- [x] 2.3 Run `python .codex/skills/ui-ux-pro-max/scripts/search.py "nextjs navigation tabs sidebar dashboard tables" --stack nextjs`.
- [x] 2.4 Summarize applicable constraints in working notes: compact typography, no subtitles, no text overflow, aligned boxes, responsive breakpoints, Next `Link`, visible focus states, no decorative layout.

## 3. Admin Shell And Navigation

- [x] 3.1 Refactor admin header in `FinanceAdminDashboard.tsx` so all admin headers show only page label, status badges if needed, and actions; remove subtitle paragraphs.
- [x] 3.2 Update `FinanceAdminNavLinks.tsx` so primary admin nav shows only `Tá»•ng quan`, `NgÆ°á»i dÃ¹ng`, `Cáº£nh bÃ¡o dá»¯ liá»‡u`, and secondary `Dá»¯ liá»‡u gá»‘c`.
- [x] 3.3 Ensure primary nav does not show global wallet, transaction, category, budget, savings, receipt, AI, or notification module links.
- [x] 3.4 Keep `AdminLogoutButton` visible in the admin header/action area.
- [x] 3.5 Ensure all internal admin links use Next `Link`, not raw `<a>`, except where Payload UI requires otherwise.

## 4. Overview Page

- [x] 4.1 Rebuild `/admin` content to show KPI cards and data warnings only.
- [x] 4.2 Remove the `Luá»“ng há»— trá»£ Ä‘Ãºng` or support-flow panel entirely.
- [x] 4.3 Remove any global recent transaction, global wallet, global receipt, global notification, or global AI/chat detail rows from overview.
- [x] 4.4 Keep overview KPI cards compact and aligned: users, missing default wallet, wallets, current-month transactions, OCR receipts, AI/chat logs, data warnings.
- [x] 4.5 Build the data warning panel with columns/fields: severity, area, issue, related user, action.
- [x] 4.6 Link data warnings with a known `userId` to `/admin/finance/users/:userId`; link warnings without `userId` to `/admin/finance/data-quality`.
- [x] 4.7 Add overview empty/loading/error states without long explanatory subtitles.

## 5. Users Page Full-List State

- [x] 5.1 Implement `/admin/finance/users` no-selected-user state as a full-width users list/table.
- [x] 5.2 Keep the users header label-only: `NgÆ°á»i dÃ¹ng` plus actions `Táº£i láº¡i` and `ÄÄƒng xuáº¥t`.
- [x] 5.3 Implement filter bar fields: search, role, wallet setup, activity, created date range if supported by existing params.
- [x] 5.4 Render user rows/cards with avatar initials, email, name, role badge, wallet count, transaction count, setup badge, latest activity, and `Má»Ÿ` action.
- [x] 5.5 Make clicking a user row or `Má»Ÿ` navigate to `/admin/finance/users/:userId`.
- [x] 5.6 Ensure the full-list state does not render any selected-user workspace panel.

## 6. Selected-User Two-Pane Layout

- [x] 6.1 Implement selected-user layout for `/admin/finance/users/:userId` and `/admin/finance/users/:userId/:section`.
- [x] 6.2 Create or refactor `UserListSidebar` under `src/components/admin/` for the left chat-like user list.
- [x] 6.3 Make the left sidebar 300-360px on desktop and independently scrollable.
- [x] 6.4 Add sidebar search input and compact user rows with avatar initials, email, small role/setup labels, and latest activity.
- [x] 6.5 Add active selected-user indicator in the sidebar using primary color without shifting row layout.
- [x] 6.6 Make clicking a different sidebar user navigate to that user's workspace and preserve the active section when reasonable.
- [x] 6.7 Render the selected user's workspace on the right with top alignment matching the sidebar.
- [x] 6.8 Implement mobile behavior: user list becomes a drawer/collapsible top list or a full-width list above workspace, without horizontal page overflow.

## 7. Workspace Header And Tabs

- [x] 7.1 Refactor `UserWorkspaceHeader.tsx` to show only the selected user's email/name and compact badges: role, currency, wallet count, transaction count, wallet setup.
- [x] 7.2 Remove long helper text/subtitles from workspace header.
- [x] 7.3 Refactor `UserWorkspaceTabNav.tsx` with tabs: `Tá»•ng quan`, `VÃ­ tiá»n`, `Giao dá»‹ch`, `Danh má»¥c`, `HÅ© chi`, `Tiáº¿t kiá»‡m`, `HÃ³a Ä‘Æ¡n/OCR`, `AI/chat`, `ThÃ´ng bÃ¡o`.
- [x] 7.4 Ensure all tabs route under `/admin/finance/users/:userId/*`.
- [x] 7.5 Ensure active tab styling does not resize or shift the tab bar.
- [x] 7.6 Ensure mobile tabs use horizontal scroll and do not wrap into broken multi-line controls.

## 8. Workspace Tab Content

- [x] 8.1 Implement user overview tab with compact KPI cards and panels for `ThÃ´ng tin` and `Cáº£nh bÃ¡o cá»§a ngÆ°á»i dÃ¹ng nÃ y`.
- [x] 8.2 Implement wallets tab with scoped filters and table fields from `ADMIN_UI_REBUILD_SPEC.md`.
- [x] 8.3 Implement transactions tab with scoped filters, table fields, and read-only detail drawer if existing component supports it.
- [x] 8.4 Implement categories tab with system/user scope fields and no other users' custom categories.
- [x] 8.5 Implement budgets/hÅ© chi tab with usage percentage states and scoped budget rows.
- [x] 8.6 Implement savings tab with goals, progress, contribution totals, and consistency warnings.
- [x] 8.7 Implement receipts/OCR tab with receipt status, media filename/detail where available, and missing-media warnings.
- [x] 8.8 Implement AI/chat tab using redacted rows only and excluding `rawText`.
- [x] 8.9 Implement notifications tab scoped to selected user.
- [x] 8.10 Ensure every tab empty state says `NgÆ°á»i dÃ¹ng nÃ y...` and does not use generic `KhÃ´ng cÃ³ dá»¯ liá»‡u`.

## 9. Data Warning Page

- [x] 9.1 Rebuild `/admin/finance/data-quality` header to label-only `Cáº£nh bÃ¡o dá»¯ liá»‡u` with actions `Cháº¡y kiá»ƒm tra láº¡i`, `Chá»n ngÆ°á»i dÃ¹ng`, `ÄÄƒng xuáº¥t`.
- [x] 9.2 Show the user-impact table from `ADMIN_UI_REBUILD_SPEC.md` or a compact equivalent explaining how warning types affect the user.
- [x] 9.3 Implement warning filters: area, severity, has related user if supported.
- [x] 9.4 Render warning rows with severity, area, issue, detail, related user, record id, next step, and action.
- [x] 9.5 Link warnings with `userId` to that user's workspace.
- [x] 9.6 Provide loading, empty, and error states without subtitles.

## 10. Old Global Detail Routes

- [x] 10.1 Ensure `/admin/finance/wallets`, `/transactions`, `/categories`, `/budgets`, `/savings`, `/receipts`, `/ai`, and `/notifications` do not render global detail tables.
- [x] 10.2 Render a compact block page for old global routes with only `Cáº§n chá»n ngÆ°á»i dÃ¹ng trÆ°á»›c`, `Chá»n ngÆ°á»i dÃ¹ng`, and `Vá» tá»•ng quan`.
- [x] 10.3 Verify old global routes do not expose cross-user private rows in the primary UI.

## 11. CSS Polish And Containment

- [x] 11.1 Update `src/app/(payload)/custom.scss` with shared admin typography scale: page labels 22-24px, section labels 15-17px, body/table 13-14px, badge/button 12-14px.
- [x] 11.2 Add or verify `box-sizing: border-box` for admin custom components.
- [x] 11.3 Ensure cards, panels, filters, tables, sidebar rows, tabs, and buttons have stable dimensions and do not shift on hover/active.
- [x] 11.4 Add text containment styles for long email, ID, route, merchant, and AI/chat text: controlled wrapping, ellipsis, or max width.
- [x] 11.5 Ensure table wrappers use horizontal scrolling without causing full-page horizontal scroll.
- [x] 11.6 Ensure sidebar scroll is independent from workspace content.
- [x] 11.7 Ensure panel/card spacing is consistent at 12px or 16px and boxes do not visually drift.
- [x] 11.8 Add responsive CSS for 375px, 768px, 1024px, and 1440px breakpoints.
- [x] 11.9 Ensure visible focus states on links, buttons, inputs, filters, tabs, and sidebar user rows.
- [x] 11.10 Add `prefers-reduced-motion` handling for admin transitions.

## 12. Documentation

- [x] 12.1 Update `SYSTEM_PAGE_FUNCTION_MAP.md` to document the new two-pane user admin UI.
- [x] 12.2 Update `ADMIN_OPERATIONS.md` to document no-subtitle admin UI, user sidebar/workspace behavior, data warning user impact, and global route block behavior.
- [x] 12.3 Keep `ADMIN_UI_REBUILD_SPEC.md` as the human-editable UI source of truth; update it only if implementation reveals a needed spec correction.

## 13. Automated Verification

- [x] 13.1 Run `cmd /c npm run generate:importmap` if Payload admin component paths/config changed.
- [x] 13.2 Run `cmd /c npx tsc --noEmit`.
- [x] 13.3 Run `cmd /c npx vitest run tests/int/admin-api.int.spec.ts --config ./vitest.config.mts` if admin API usage changed.
- [x] 13.4 Add or update component/unit tests for route parsing or sidebar/tab behavior if such tests are available in the repo.

## 14. Browser Interaction Verification

- [x] 14.1 Start the app with Docker or local dev server and record the URL used for verification.
- [x] 14.2 Login as an admin account.
- [x] 14.3 Test primary nav links: `Tá»•ng quan`, `NgÆ°á»i dÃ¹ng`, `Cáº£nh bÃ¡o dá»¯ liá»‡u`, `Dá»¯ liá»‡u gá»‘c`.
- [x] 14.4 Test overview actions: `Chá»n ngÆ°á»i dÃ¹ng`, `Cáº£nh bÃ¡o dá»¯ liá»‡u`, `ÄÄƒng xuáº¥t`.
- [x] 14.5 Test full users list: click multiple user rows and `Má»Ÿ` buttons.
- [x] 14.6 Test selected-user sidebar: switch between multiple users and confirm active highlight/route/workspace updates.
- [x] 14.7 Test every workspace tab: overview, wallets, transactions, categories, budgets, savings, receipts, AI/chat, notifications.
- [x] 14.8 Test filters submit and reset without losing selected user context.
- [x] 14.9 Test old global-block routes and their `Chá»n ngÆ°á»i dÃ¹ng` / `Vá» tá»•ng quan` actions.
- [x] 14.10 Check browser console for errors during all navigation.
- [x] 14.11 Check network panel or route responses for API 500 errors during all navigation.

## 15. Visual And Responsive Verification

- [x] 15.1 Verify `/admin`, `/admin/finance/users`, and at least one selected user workspace at 375px.
- [x] 15.2 Verify the same routes at 768px.
- [x] 15.3 Verify the same routes at 1024px.
- [x] 15.4 Verify the same routes at 1440px.
- [x] 15.5 Test long data values: long email, long wallet name, long merchant name, long route/id, and long AI/chat text.
- [x] 15.6 Confirm text remains inside boxes and no button/table/sidebar row spills outside its container.
- [x] 15.7 Confirm cards/panels in the same row are aligned and do not overlap.
- [x] 15.8 Confirm mobile has no full-page horizontal scroll; only table wrappers may scroll horizontally.

## 16. Final Review

- [x] 16.1 Confirm all admin headers are subtitle-free.
- [x] 16.2 Confirm overview has no `Luá»“ng há»— trá»£ Ä‘Ãºng` panel.
- [x] 16.3 Confirm user-owned details are only visible under selected-user workspace routes.
- [x] 16.4 Confirm no primary navigation link opens global sensitive finance rows.
- [x] 16.5 Confirm final response lists changed files, verification commands, browser checks, and any unresolved questions.
