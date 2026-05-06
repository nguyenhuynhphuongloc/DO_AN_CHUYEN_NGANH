## ADDED Requirements

### Requirement: Dashboard exposes finance shortcuts
The system SHALL show dashboard action buttons for depositing money, opening transaction history, opening income/expense reports, and managing wallets.

#### Scenario: User opens dashboard actions
- **WHEN** a user opens the dashboard
- **THEN** the dashboard shows actions for `Nạp tiền`, `Lịch sử giao dịch`, `Báo cáo thu chi`, and `Quản lý ví`

#### Scenario: User opens transaction history shortcut
- **WHEN** a user activates `Lịch sử giao dịch`
- **THEN** the system navigates to the transactions page

#### Scenario: User opens report shortcut
- **WHEN** a user activates `Báo cáo thu chi`
- **THEN** the system navigates to the reports page

### Requirement: Finance forms avoid helper notes under labels
The system SHALL avoid descriptive helper notes directly under labels in dashboard, transaction, savings wallet, and savings goal forms.

#### Scenario: User opens finance form
- **WHEN** a user opens a transaction, wallet, deposit, or savings goal form
- **THEN** form labels are shown without descriptive note text directly under the labels

### Requirement: Savings management supports fast wallet switching
The system SHALL allow users to switch between savings wallets and inspect each wallet's balance without leaving the savings page.

#### Scenario: User has multiple savings wallets
- **WHEN** a user opens savings management with multiple savings wallets
- **THEN** the UI provides a clear control to switch the active savings wallet and updates the displayed balance

## MODIFIED Requirements

### Requirement: UI uses professional finance patterns
The system SHALL present wallet, budget, transaction, OCR, savings, and report workflows with a restrained dashboard layout, consistent SVG icons, accessible controls, responsive behavior, and balance-first labels.

#### Scenario: User opens finance dashboard on mobile
- **WHEN** the dashboard is viewed at mobile width
- **THEN** wallet cards, savings balances, spending progress, alerts, shortcuts, and transaction summaries remain readable without horizontal scrolling

#### Scenario: Interactive control is focused
- **WHEN** a keyboard user focuses a button, input, tab, or select
- **THEN** the UI shows a visible focus state

#### Scenario: User views wallet labels
- **WHEN** wallet balances appear on dashboard or savings screens
- **THEN** the UI labels them as `Số dư Ví "<tên ví>"` for the primary wallet and `Số dư tiết kiệm` for savings totals
