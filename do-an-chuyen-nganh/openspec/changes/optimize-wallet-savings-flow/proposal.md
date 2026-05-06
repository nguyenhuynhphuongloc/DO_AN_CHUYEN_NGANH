## Why

The current wallet and savings flow mixes category spending jars, savings behavior, and transaction funding in ways that make the finance model hard to understand. This change clarifies that users have one primary spending wallet, can own multiple savings wallets, and all normal transactions affect the primary wallet unless the user explicitly moves money between wallets or savings goals.

## What Changes

- Remove the need to create standalone spending jars for normal expense payment; category budgeting remains integrated with the existing category flow.
- Make the primary wallet the default funding source for all income and expense transactions.
- Prevent savings wallets from being used as the selected payment wallet in the add-transaction expense flow.
- Add an insufficient-primary-balance decision flow: when an expense would overdraw the primary wallet and savings funds are available, prompt the user to optionally transfer only the missing amount from savings; otherwise allow the primary wallet to go negative and show a warning.
- Change manual transaction source entry so a blank source defaults to `Thủ công` instead of forcing the user to select from a list.
- Update the dashboard with action buttons for deposit, transaction history, income/expense reports, and wallet management.
- Rename dashboard wallet labels from budget-oriented labels such as `Hạn mức còn lại` and `tiết kiệm` to balance-oriented labels such as `Số dư Ví "<tên ví>"` and `Số dư tiết kiệm`.
- Clarify the wallet model: each user has one primary wallet and may have many savings wallets.
- Improve the savings section so users can create, switch between, and inspect multiple savings wallets.
- Improve savings goal management with goal counts, goal lists, funding-source selection, and per-goal contribution history details including source wallet, amount, and contribution date.
- Apply a professional finance UI/UX pass to dashboard and savings screens, using clear controls, consistent iconography, accessible states, and no descriptive helper notes under labels.

## Capabilities

### New Capabilities

- `savings-goal-management`: Covers creation and review of multiple savings wallets, savings goals, goal funding, and per-goal contribution history.

### Modified Capabilities

- `wallet-management`: Defines the one-primary-wallet plus many-savings-wallets model and savings transfer behavior.
- `transaction-ledger`: Changes transaction funding rules, insufficient-balance handling, and manual source defaults.
- `finance-ui-experience`: Updates dashboard and savings interaction requirements, labels, action shortcuts, and label/helper-text constraints.
- `finance-reporting`: Updates dashboard balance summaries and navigation expectations for reports and transaction history.
- `category-spending-jars`: Clarifies that spending jars are not required as payment containers and remain category-level budgeting only.

## Impact

- Affects wallet data rules, balance calculation helpers, transaction create/update APIs, and any hooks or utilities that adjust wallet balances.
- Affects dashboard, transactions, reports, savings, wallet setup/management, and savings goal UI.
- Requires Payload schema review for wallet type, primary wallet uniqueness, savings wallet records, savings goals, and savings contribution history.
- Requires updated access control so users can only read and mutate their own wallets, goals, contributions, and transactions.
- Requires `generate:types` after schema changes and `tsc --noEmit` for validation.
