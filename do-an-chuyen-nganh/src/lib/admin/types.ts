export type AdminKpi = {
  label: string
  value: number | string
  tone?: 'neutral' | 'good' | 'warning' | 'danger'
  helper?: string
}

export type AdminPagination = {
  limit: number
  page: number
  totalDocs: number
  totalPages: number
}

export type AdminPaginatedResponse<T> = {
  docs: T[]
  pagination: AdminPagination
}

export type AdminRelationshipSummary = {
  id: number | string
  label?: string | null
  email?: string | null
}

export type AdminUserRow = {
  id: number | string
  email?: string | null
  name?: string | null
  role?: string | null
  currency?: string | null
  createdAt?: string | null
  walletCount: number
  transactionCount: number
  hasDefaultWallet: boolean
  latestTransactionDate?: string | null
}

export type AdminWalletRow = {
  id: number | string
  name?: string | null
  walletType?: string | null
  currency?: string | null
  balance: number
  monthlySpendingLimit?: number | null
  isDefault?: boolean | null
  isActive?: boolean | null
  user?: AdminRelationshipSummary | null
}

export type AdminTransactionRow = {
  id: number | string
  type?: string | null
  amount: number
  currency?: string | null
  date?: string | null
  description?: string | null
  merchantName?: string | null
  sourceType?: string | null
  user?: AdminRelationshipSummary | null
  wallet?: AdminRelationshipSummary | null
  category?: AdminRelationshipSummary | null
  receipt?: AdminRelationshipSummary | null
  savingsGoal?: AdminRelationshipSummary | null
}

export type AdminCategoryRow = {
  id: number | string
  name?: string | null
  type?: string | null
  icon?: string | null
  color?: string | null
  isDefault?: boolean | null
  user?: AdminRelationshipSummary | null
  duplicateKey?: string | null
}

export type AdminBudgetRow = {
  id: number | string
  amount: number
  spent: number
  remaining: number
  usagePercent: number
  period?: string | null
  month?: number | null
  year?: number | null
  isActive?: boolean | null
  user?: AdminRelationshipSummary | null
  wallet?: AdminRelationshipSummary | null
  category?: AdminRelationshipSummary | null
}

export type AdminSavingsRow = {
  id: number | string
  title?: string | null
  targetAmount: number
  currentAmount: number
  contributionTotal: number
  status?: string | null
  owner?: AdminRelationshipSummary | null
  inconsistent: boolean
}

export type AdminReceiptRow = {
  id: number | string
  transactionId: number | string
  user?: AdminRelationshipSummary | null
  merchantName?: string | null
  amount: number
  currency?: string | null
  date?: string | null
  sourceType?: string | null
  receipt?: AdminRelationshipSummary | null
  status: 'linked' | 'missing_media'
}

export type AdminNotificationRow = {
  id: number | string
  message?: string | null
  type?: string | null
  read?: boolean | null
  link?: string | null
  recipient?: AdminRelationshipSummary | null
  createdAt?: string | null
}

export type AdminDataQualityFinding = {
  id: string
  severity: 'warning' | 'danger'
  area: 'users' | 'wallets' | 'transactions' | 'categories' | 'budgets' | 'receipts' | 'media' | 'savings'
  title: string
  detail: string
  recordId?: number | string
  userId?: number | string
  nextStep: string
}

export type AdminOverview = {
  kpis: AdminKpi[]
  transactionSourceMix: Array<{ sourceType: string; count: number; total: number }>
  cashflow: Array<{ label: string; income: number; expense: number; net: number }>
  budgetWarnings: {
    atRisk: number
    exceeded: number
  }
  recentTransactions: AdminTransactionRow[]
  receiptWarnings: AdminReceiptRow[]
  dataQuality: AdminDataQualityFinding[]
}

// User-scoped admin workspace types
export type AdminUserProfile = {
  id: number | string
  email?: string | null
  name?: string | null
  role?: string | null
  currency?: string | null
  createdAt?: string | null
  walletSetupState: 'no-wallet' | 'has-default' | 'multiple-wallets'
  walletCount: number
  transactionCount: number
  latestActivityDate?: string | null
}

export type AdminUserWorkspaceOverview = {
  kpis: AdminKpi[]
  budgetWarnings: {
    atRisk: number
    exceeded: number
  }
  totalBalance: number
  savingsBalance: number
  monthlyIncome: number
  monthlyExpense: number
  netCashflow: number
  receiptCount: number
  aiChatCount: number
}

export type AdminAiChatLogRow = {
  id: number | string
  kind?: string | null
  direction?: string | null
  status?: 'success' | 'error' | null
  redactedText?: string | null
  intent?: string | null
  linkedTransaction?: AdminRelationshipSummary | null
  errorMessage?: string | null
  createdAt?: string | null
}
