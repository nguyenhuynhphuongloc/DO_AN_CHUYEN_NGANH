## 1. Data Model And Access

- [x] 1.1 Audit `wallets`, `transactions`, and `savings-goals` fields against the new one-primary-wallet and many-savings-wallets model.
- [x] 1.2 Add or update schema support for savings goal contribution history with user, goal, source wallet, amount, and contribution date.
- [x] 1.3 Ensure wallet, savings goal, and contribution access controls restrict reads and mutations to the owning user or existing authorized participants where applicable.
- [x] 1.4 Add server-side enforcement so each user has only one active primary/default wallet.
- [x] 1.5 Run Payload type generation after schema changes.

## 2. Wallet And Balance Services

- [x] 2.1 Refactor wallet helpers to resolve the user's primary wallet and list active savings wallets consistently.
- [x] 2.2 Add shared validation to reject savings wallets as ordinary expense payment wallets.
- [x] 2.3 Add a balance service for primary-wallet expenses, savings shortfall detection, savings-to-primary transfers, and negative-balance warnings.
- [x] 2.4 Ensure nested Payload operations in hooks or balance flows pass `req` and user-scoped Local API calls use `overrideAccess: false`.
- [x] 2.5 Add migration or cleanup logic for users with multiple default wallets if existing data requires it.

## 3. Transaction Flow

- [x] 3.1 Update transaction creation API to default ordinary transactions to the primary wallet when no wallet is provided.
- [x] 3.2 Update transaction creation API to return a structured shortfall response when an expense exceeds the primary wallet balance and savings funds are available.
- [x] 3.3 Add confirmation handling to transfer only the missing amount from a selected savings wallet before creating the expense.
- [x] 3.4 Allow expense creation with a negative primary wallet balance when the user declines savings transfer or no eligible savings wallet exists, returning a warning.
- [x] 3.5 Update manual source handling so blank manual input stores `manual` and displays as `Thủ công`.
- [x] 3.6 Verify transaction update/delete balance effects remain correct with primary-wallet and transfer behavior.

## 4. Savings Wallets And Goals

- [x] 4.1 Update the savings page to create, list, switch between, and inspect multiple savings wallets.
- [x] 4.2 Add savings goal summary count and a clear list of current goals under the savings summary.
- [x] 4.3 Add goal detail navigation or modal/page showing contribution history with source wallet, amount, and date.
- [x] 4.4 Add contribution flow support for choosing an owned source wallet.
- [x] 4.5 Update contribution logic to record contribution history and adjust balances atomically.
- [x] 4.6 Prevent funding a goal from another user's wallet or inaccessible goal.

## 5. Dashboard And Navigation UI

- [x] 5.1 Update dashboard wallet cards to show `Số dư Ví "<tên ví>"` for the primary wallet and `Số dư tiết kiệm` for savings totals.
- [x] 5.2 Add dashboard action buttons for `Nạp tiền`, `Lịch sử giao dịch`, `Báo cáo thu chi`, and `Quản lý ví`.
- [x] 5.3 Route dashboard shortcuts to deposit, transactions, reports, and wallet management workflows.
- [x] 5.4 Add or update deposit UI so users can deposit into either the primary wallet or a selected savings wallet.
- [x] 5.5 Keep category spending jars as category budgets only and remove any UI implication that jars are payment containers.

## 6. UX, Validation, And Quality

- [x] 6.1 Apply a compact professional finance UI pass using consistent SVG icons, visible focus states, stable button dimensions, and responsive layouts.
- [x] 6.2 Remove descriptive helper notes directly under labels in touched dashboard, transaction, wallet, and savings goal forms.
- [x] 6.3 Update touched Vietnamese UI strings to proper UTF-8 where they are user-facing.
- [x] 6.4 Add focused tests or verification coverage for wallet ownership, savings-wallet rejection, shortfall handling, savings transfer, negative balance warning, and contribution history.
- [x] 6.5 Run `payload generate:importmap` if admin components are created or modified.
- [x] 6.6 Run `tsc --noEmit` and resolve TypeScript errors.
