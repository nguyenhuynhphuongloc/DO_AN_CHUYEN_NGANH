## Context

The app already has Payload collections for `wallets`, `transactions`, and `savings-goals`, plus shared helpers for wallet setup, finance statistics, and transaction balance effects. Existing requirements allow a default wallet and savings wallets, but the product flow still exposes concepts that can be confused with payment containers, especially category spending jars and savings goal contributions.

The target model is:

- Each user has exactly one active primary wallet used for ordinary income and expense transactions.
- Each user can have many active savings wallets.
- Savings wallets are not selectable as payment wallets for ordinary expenses.
- Savings money can be moved into the primary wallet only through an explicit transfer decision or used as the source for a savings goal contribution.
- Dashboard and savings screens must read like a finance operations surface: compact, scannable, button-driven, accessible, and without helper notes below labels.

## Goals / Non-Goals

**Goals:**

- Centralize primary-wallet selection and balance mutation rules so API and UI behavior match.
- Support multiple savings wallets with list/switch/create flows.
- Add an insufficient-primary-balance flow that can transfer the missing amount from savings after user confirmation.
- Make savings goal funding traceable by source wallet, amount, and date.
- Update dashboard labels and shortcuts for deposit, transaction history, reports, and wallet management.
- Preserve Payload access-control safety, including `overrideAccess: false` whenever Local API calls are made on behalf of a user and passing `req` in hooks or nested operations.

**Non-Goals:**

- Do not introduce standalone spending jars as payment wallets.
- Do not replace existing category budgets; they remain category-level limits and warnings.
- Do not add a new external payment provider or bank integration.
- Do not redesign unrelated authentication, admin, OCR, chatbot, or report chart logic beyond the navigation and balance summaries required here.

## Decisions

### Primary wallet is the transaction wallet of record

Ordinary transaction creation should resolve the user's active primary/default wallet server-side. If the request omits `wallet`, the API uses the primary wallet. If the request includes a wallet for an ordinary expense, the API rejects savings wallets and any wallet not owned by the user.

Alternative considered: keep the wallet selector open for all wallet types. This would preserve flexibility but breaks the mental model that savings is separate from spending and makes expense balances harder to explain.

### Insufficient balance is a two-step decision

When an expense exceeds the primary wallet balance, the first API response should provide a structured insufficient-balance result containing the missing amount and available savings wallets. The client then shows a confirmation choice. If the user confirms, a second request transfers only the missing amount from the selected savings wallet to the primary wallet, then creates the expense. If the user declines or no savings is available, the expense can proceed and the primary wallet may become negative with a warning state.

Alternative considered: automatically withdraw from savings. This hides a material financial action and makes audit/history harder to trust.

### Transfers and contributions are ledgered

Money movement between wallets and into savings goals should create auditable records. If a separate contribution collection is added, it should store `user`, `goal`, `sourceWallet`, `amount`, and `date`. If transactions remain the only ledger, contribution metadata must still allow per-goal history to display source wallet, amount, and date. Balance mutations must be atomic around the transaction or contribution operation.

Alternative considered: update `currentAmount` on goals without history. This is simpler but fails the requested contribution history and makes reconciliation difficult.

### Savings wallet management stays under the savings feature

The savings page should become the place to manage savings wallets and savings goals. It should support creating savings wallets, switching between them, viewing each wallet balance, seeing total active goal count, viewing a goal list, selecting a funding source, and opening a goal detail view with contribution history.

Alternative considered: create a separate wallet-management page for all savings tasks. Dashboard still needs a wallet-management shortcut, but savings-specific operations belong near savings goals.

### Dashboard uses balance-first language and action shortcuts

Dashboard cards should label balances as `Số dư Ví "<tên ví>"` for the primary wallet and `Số dư tiết kiệm` for savings totals. Dashboard actions should link to deposit, transactions, reports, and wallet management. UI should use consistent SVG icons, stable controls, visible focus states, and compact finance-dashboard spacing.

Alternative considered: keep `Hạn mức còn lại` as a top wallet card. Spending-limit information remains useful, but it should not be presented as the primary wallet balance.

## Risks / Trade-offs

- Primary-wallet uniqueness can drift if multiple defaults already exist -> Add a cleanup/migration step and enforce server-side default normalization during wallet setup and wallet updates.
- Wallet balance updates can become inconsistent if nested operations bypass request context -> Use shared balance services and pass `req` for nested Payload operations in hooks or API transaction flows.
- Allowing negative primary balances may surprise users -> Return and display explicit warning text after declined savings transfer or when no savings is available.
- Contribution history may duplicate transaction history -> Keep one clear source of truth or link contribution records to transactions through a reference field.
- UI copy currently contains mojibake in some files -> Update touched user-facing Vietnamese strings to proper UTF-8 while avoiding unrelated rewrite churn.

## Migration Plan

1. Audit wallet records and ensure each user has one active primary/default wallet. If multiple defaults exist, keep the most recent active main wallet as default and unset others.
2. Add or update schema fields for savings contribution history if transaction metadata is insufficient.
3. Update server-side transaction creation to validate wallet type, compute insufficient balance decisions, and default blank/manual source display to `Thủ công`.
4. Update dashboard, transaction, savings, and wallet-management UI flows.
5. Run Payload type generation after schema changes, regenerate import maps if admin components are created or modified, and validate with `tsc --noEmit`.
6. Rollback by disabling the new insufficient-balance prompt and reverting to primary-wallet-only transaction creation; contribution history records can remain read-only if already created.

## Open Questions

- Should the user select the savings wallet to withdraw from when multiple savings wallets can cover the missing amount, or should the UI preselect the highest-balance wallet?
- Should savings goal contributions always increase the goal `currentAmount`, or should `currentAmount` be derived from contribution history during reporting?
