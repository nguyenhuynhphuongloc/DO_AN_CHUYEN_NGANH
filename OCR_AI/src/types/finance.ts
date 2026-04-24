export interface WalletOption {
  id: string;
  name: string;
  currency: string;
  balance: number;
  is_default?: boolean;
}

export interface CategoryOption {
  id: string;
  name: string;
  category_type: string;
  is_active?: boolean;
  color?: string;
  icon?: string;
}

export interface TransactionRecord {
  id: string;
  title: string;
  merchant: string;
  type: "income" | "expense" | "transfer";
  category: string;
  amount: number;
  currency: string;
  date: string;
  account: string;
  note?: string;
  status?: "Cleared" | "Pending" | "Flagged";
}

export interface BudgetSummary {
  id: string;
  category: string;
  spent: number;
  limit: number;
  color: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  current: number;
  target: number;
  dueDate: string;
  contribution: number;
}

export interface FinanceCategoryCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  transactions: number;
}

export interface ReportPoint {
  month: string;
  income: number;
  expense: number;
  savings: number;
}

export interface CategorySpendPoint {
  category: string;
  value: number;
  color: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  tone: "info" | "warning" | "success";
}
