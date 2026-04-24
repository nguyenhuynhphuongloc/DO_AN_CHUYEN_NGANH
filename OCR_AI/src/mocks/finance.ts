import type {
  BudgetSummary,
  CategoryOption,
  CategorySpendPoint,
  FinanceCategoryCard,
  NotificationItem,
  ReportPoint,
  SavingsGoal,
  TransactionRecord,
  WalletOption
} from "../types/finance";

export const dashboardStats = [
  { label: "Total Balance", value: 28640, currency: "USD", change: "+8.2%", tone: "gold" },
  { label: "Monthly Income", value: 12450, currency: "USD", change: "+4.1%", tone: "green" },
  { label: "Monthly Expense", value: 6410, currency: "USD", change: "-2.6%", tone: "red" },
  { label: "Savings Rate", value: 48.5, suffix: "%", change: "+6.8 pts", tone: "blue" }
] as const;

export const wallets: WalletOption[] = [
  { id: "wallet-main", name: "Main Reserve", currency: "USD", balance: 18240, is_default: true },
  { id: "wallet-travel", name: "Travel Wallet", currency: "USD", balance: 6240 },
  { id: "wallet-cash", name: "Cash Pocket", currency: "USD", balance: 4160 }
];

export const financeCategories: CategoryOption[] = [
  { id: "cat-1", name: "Dining", category_type: "expense", color: "#d4af37", icon: "Utensils" },
  { id: "cat-2", name: "Transport", category_type: "expense", color: "#4f7cff", icon: "Car" },
  { id: "cat-3", name: "Investments", category_type: "income", color: "#2bc28b", icon: "BadgeDollarSign" },
  { id: "cat-4", name: "Utilities", category_type: "expense", color: "#ff8c5a", icon: "Zap" },
  { id: "cat-5", name: "Health", category_type: "expense", color: "#8e71ff", icon: "HeartPulse" }
];

export const transactions: TransactionRecord[] = [
  {
    id: "txn-1",
    title: "Salary Deposit",
    merchant: "Northstar Capital",
    type: "income",
    category: "Salary",
    amount: 8500,
    currency: "USD",
    date: "2026-04-21",
    account: "Main Reserve",
    status: "Cleared"
  },
  {
    id: "txn-2",
    title: "Dinner Meeting",
    merchant: "Maison Aurelia",
    type: "expense",
    category: "Dining",
    amount: 126,
    currency: "USD",
    date: "2026-04-20",
    account: "Main Reserve",
    note: "Client dinner",
    status: "Cleared"
  },
  {
    id: "txn-3",
    title: "Portfolio Contribution",
    merchant: "Vanilla Invest",
    type: "transfer",
    category: "Investments",
    amount: 1500,
    currency: "USD",
    date: "2026-04-18",
    account: "Main Reserve",
    status: "Pending"
  },
  {
    id: "txn-4",
    title: "Ride Share",
    merchant: "Metro Ride",
    type: "expense",
    category: "Transport",
    amount: 32,
    currency: "USD",
    date: "2026-04-18",
    account: "Cash Pocket",
    status: "Cleared"
  },
  {
    id: "txn-5",
    title: "Electricity Bill",
    merchant: "City Utilities",
    type: "expense",
    category: "Utilities",
    amount: 214,
    currency: "USD",
    date: "2026-04-16",
    account: "Main Reserve",
    status: "Flagged"
  }
];

export const budgets: BudgetSummary[] = [
  { id: "budget-1", category: "Dining", spent: 780, limit: 1200, color: "#d4af37" },
  { id: "budget-2", category: "Transport", spent: 430, limit: 700, color: "#4f7cff" },
  { id: "budget-3", category: "Utilities", spent: 610, limit: 650, color: "#ff8c5a" },
  { id: "budget-4", category: "Health", spent: 250, limit: 500, color: "#8e71ff" }
];

export const savingsGoals: SavingsGoal[] = [
  { id: "goal-1", name: "Kyoto Retreat", current: 8400, target: 12000, dueDate: "2026-11-01", contribution: 680 },
  { id: "goal-2", name: "Emergency Cushion", current: 14200, target: 20000, dueDate: "2026-09-15", contribution: 950 },
  { id: "goal-3", name: "Studio Upgrade", current: 5600, target: 9000, dueDate: "2026-08-01", contribution: 420 }
];

export const categoryCards: FinanceCategoryCard[] = [
  { id: "cc-1", name: "Dining", description: "Restaurants, coffee, hosted dinners", icon: "Utensils", color: "#d4af37", transactions: 24 },
  { id: "cc-2", name: "Transport", description: "Ride share, fuel, train", icon: "Car", color: "#4f7cff", transactions: 18 },
  { id: "cc-3", name: "Utilities", description: "Electricity, internet, subscriptions", icon: "Zap", color: "#ff8c5a", transactions: 11 },
  { id: "cc-4", name: "Health", description: "Clinic, supplements, wellness", icon: "HeartPulse", color: "#8e71ff", transactions: 9 }
];

export const reportSeries: ReportPoint[] = [
  { month: "Nov", income: 11200, expense: 7200, savings: 4000 },
  { month: "Dec", income: 11900, expense: 7600, savings: 4300 },
  { month: "Jan", income: 12100, expense: 6900, savings: 5200 },
  { month: "Feb", income: 11840, expense: 7020, savings: 4820 },
  { month: "Mar", income: 12300, expense: 7150, savings: 5150 },
  { month: "Apr", income: 12450, expense: 6410, savings: 6040 }
];

export const categorySpend: CategorySpendPoint[] = [
  { category: "Dining", value: 1480, color: "#d4af37" },
  { category: "Transport", value: 920, color: "#4f7cff" },
  { category: "Utilities", value: 1160, color: "#ff8c5a" },
  { category: "Health", value: 640, color: "#8e71ff" },
  { category: "Shopping", value: 820, color: "#2bc28b" }
];

export const notifications: NotificationItem[] = [
  { id: "n1", title: "Budget threshold reached", description: "Utilities has reached 94% of the monthly cap.", time: "5 minutes ago", tone: "warning" },
  { id: "n2", title: "OCR receipt saved", description: "Maison Aurelia dinner receipt has been confirmed.", time: "32 minutes ago", tone: "success" },
  { id: "n3", title: "Savings pace improved", description: "Emergency Cushion is ahead of monthly target.", time: "1 hour ago", tone: "info" }
];
