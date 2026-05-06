import type { Payload } from 'payload'

import type { Budget, Category, Transaction, Wallet } from '@/payload-types'

type Relationship<T extends { id: number }> = number | T | null | undefined

export type FinanceStatsOptions = {
  month: number
  year: number
  chartMonths?: number
  recentLimit?: number
}

export type CategoryBreakdownItem = {
  id: number
  name: string
  icon: string
  color: string
  income: number
  expense: number
  total: number
}

export type SourceBreakdownItem = {
  sourceType: string
  count: number
  total: number
}

export type JarUsageItem = {
  budgetId: number
  categoryId: number
  categoryName: string
  icon: string
  color: string
  amount: number
  spent: number
  remaining: number
  percent: number
  status: 'ok' | 'warning' | 'exceeded'
}

export type CashflowDataPoint = {
  month: string
  income: number
  expense: number
  balance: number
}

export type FinanceStats = {
  period: {
    month: number
    year: number
    from: string
    to: string
  }
  totals: {
    totalIncome: number
    totalExpense: number
    balance: number
  }
  walletSummary: {
    totalBalance: number
    spendingBalance: number
    savingsBalance: number
    monthlySpendingLimit: number
    spentAmount: number
    remainingLimit: number
    limitPercent: number
    defaultWallet: Wallet | null
    wallets: Wallet[]
    spendingWallets: Wallet[]
    savingsWallets: Wallet[]
  }
  categoryBreakdown: CategoryBreakdownItem[]
  sourceBreakdown: SourceBreakdownItem[]
  jarUsage: JarUsageItem[]
  chartData: CashflowDataPoint[]
  recentTransactions: Transaction[]
}

export type FinanceAdvisorContext = {
  period: string
  totals: FinanceStats['totals']
  walletSummary: Pick<
    FinanceStats['walletSummary'],
    | 'totalBalance'
    | 'spendingBalance'
    | 'savingsBalance'
    | 'monthlySpendingLimit'
    | 'spentAmount'
    | 'remainingLimit'
    | 'limitPercent'
  >
  categoryBreakdown: CategoryBreakdownItem[]
  sourceBreakdown: SourceBreakdownItem[]
  jarUsage: JarUsageItem[]
  monthlyStats: CashflowDataPoint[]
}

const DEFAULT_CATEGORY_COLOR = '#6366f1'
const DEFAULT_CATEGORY_ICON = 'Wallet'

export const getRelationshipId = <T extends { id: number }>(value: Relationship<T>): number | null => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object') return value.id
  return null
}

export const getMonthBounds = (year: number, month: number) => {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)

  return {
    start,
    end,
    from: start.toISOString(),
    to: end.toISOString(),
  }
}

const addMonths = (date: Date, amount: number) => {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

const getChartBounds = (year: number, month: number, months: number) => {
  const endMonth = new Date(year, month - 1, 1)
  const startMonth = addMonths(endMonth, -(months - 1))
  const end = new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 0, 23, 59, 59, 999)

  return {
    start: startMonth,
    end,
    from: startMonth.toISOString(),
    to: end.toISOString(),
  }
}

const buildMonthKeys = (year: number, month: number, months: number) => {
  const endMonth = new Date(year, month - 1, 1)

  return Array.from({ length: months }, (_, index) => {
    const date = addMonths(endMonth, index - (months - 1))
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`

    return {
      key,
      month: `T${date.getMonth() + 1}/${date.getFullYear()}`,
      income: 0,
      expense: 0,
      balance: 0,
    }
  })
}

const getCategory = (transaction: Transaction): Category | null => {
  return typeof transaction.category === 'object' && transaction.category ? transaction.category : null
}

const getWallet = (transaction: Transaction): Wallet | null => {
  return typeof transaction.wallet === 'object' && transaction.wallet ? transaction.wallet : null
}

export const buildFinanceStatsFromDocs = ({
  month,
  year,
  wallets,
  periodTransactions,
  chartTransactions,
  recentTransactions,
  budgets,
}: {
  month: number
  year: number
  wallets: Wallet[]
  periodTransactions: Transaction[]
  chartTransactions: Transaction[]
  recentTransactions: Transaction[]
  budgets: Budget[]
}): FinanceStats => {
  const bounds = getMonthBounds(year, month)
  const totalIncome = periodTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + (transaction.amount || 0), 0)
  const totalExpense = periodTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + (transaction.amount || 0), 0)

  const categoryMap = new Map<number, CategoryBreakdownItem>()
  const sourceMap = new Map<string, SourceBreakdownItem>()

  for (const transaction of periodTransactions) {
    const sourceType = transaction.sourceType || 'manual'
    const source = sourceMap.get(sourceType) ?? { sourceType, count: 0, total: 0 }
    source.count += 1
    source.total += transaction.amount || 0
    sourceMap.set(sourceType, source)

    const category = getCategory(transaction)
    if (!category) continue

    const item = categoryMap.get(category.id) ?? {
      id: category.id,
      name: category.name || 'Khong phan loai',
      icon: category.icon || DEFAULT_CATEGORY_ICON,
      color: category.color || DEFAULT_CATEGORY_COLOR,
      income: 0,
      expense: 0,
      total: 0,
    }

    if (transaction.type === 'income') {
      item.income += transaction.amount || 0
    } else {
      item.expense += transaction.amount || 0
      item.total += transaction.amount || 0
    }
    categoryMap.set(category.id, item)
  }

  const spendingWallets = wallets.filter((wallet) => wallet.walletType !== 'savings')
  const savingsWallets = wallets.filter((wallet) => wallet.walletType === 'savings')
  const defaultWallet = wallets.find((wallet) => wallet.isDefault) ?? null
  const monthlySpendingLimit = defaultWallet?.monthlySpendingLimit || 0
  const spendingBalance = spendingWallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0)
  const savingsBalance = savingsWallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0)
  const totalBalance = spendingBalance + savingsBalance
  const remainingLimit = monthlySpendingLimit - totalExpense
  const limitPercent = monthlySpendingLimit > 0 ? Math.min((totalExpense / monthlySpendingLimit) * 100, 999) : 0

  const expenseByCategoryAndWallet = new Map<string, number>()
  for (const transaction of periodTransactions) {
    if (transaction.type !== 'expense') continue

    const categoryId = getRelationshipId(transaction.category)
    if (!categoryId) continue

    const walletId = getRelationshipId(transaction.wallet)
    const amount = transaction.amount || 0
    const categoryKey = `${categoryId}:all`
    expenseByCategoryAndWallet.set(categoryKey, (expenseByCategoryAndWallet.get(categoryKey) || 0) + amount)

    if (walletId) {
      const walletKey = `${categoryId}:${walletId}`
      expenseByCategoryAndWallet.set(walletKey, (expenseByCategoryAndWallet.get(walletKey) || 0) + amount)
    }
  }

  const jarUsage = budgets
    .filter((budget) => budget.isActive !== false)
    .map((budget) => {
      const category = typeof budget.category === 'object' && budget.category ? budget.category : null
      const categoryId = category?.id ?? getRelationshipId(budget.category)
      const walletId = getRelationshipId(budget.wallet)
      const spent =
        (categoryId && walletId ? expenseByCategoryAndWallet.get(`${categoryId}:${walletId}`) : undefined) ??
        (categoryId ? expenseByCategoryAndWallet.get(`${categoryId}:all`) : 0) ??
        0
      const amount = budget.amount || 0
      const percent = amount > 0 ? (spent / amount) * 100 : 0
      const status: JarUsageItem['status'] = percent >= 100 ? 'exceeded' : percent >= 80 ? 'warning' : 'ok'

      return {
        budgetId: budget.id,
        categoryId: categoryId || 0,
        categoryName: category?.name || 'Khong phan loai',
        icon: category?.icon || DEFAULT_CATEGORY_ICON,
        color: category?.color || DEFAULT_CATEGORY_COLOR,
        amount,
        spent,
        remaining: amount - spent,
        percent,
        status,
      }
    })
    .sort((a, b) => b.percent - a.percent)

  const monthRows = buildMonthKeys(year, month, Math.max(1, 12))
  const monthMap = new Map(monthRows.map((row) => [row.key, row]))
  for (const transaction of chartTransactions) {
    const transactionDate = new Date(transaction.date)
    const key = `${transactionDate.getFullYear()}-${transactionDate.getMonth() + 1}`
    const row = monthMap.get(key)
    if (!row) continue

    if (transaction.type === 'income') {
      row.income += transaction.amount || 0
    } else {
      row.expense += transaction.amount || 0
    }
    row.balance = row.income - row.expense
  }

  return {
    period: {
      month,
      year,
      from: bounds.from,
      to: bounds.to,
    },
    totals: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    },
    walletSummary: {
      totalBalance,
      spendingBalance,
      savingsBalance,
      monthlySpendingLimit,
      spentAmount: totalExpense,
      remainingLimit,
      limitPercent,
      defaultWallet,
      wallets,
      spendingWallets,
      savingsWallets,
    },
    categoryBreakdown: Array.from(categoryMap.values()).sort((a, b) => b.expense - a.expense),
    sourceBreakdown: Array.from(sourceMap.values()).sort((a, b) => b.total - a.total),
    jarUsage,
    chartData: monthRows,
    recentTransactions,
  }
}

export const getFinanceStats = async (
  payload: Payload,
  userId: number,
  options: FinanceStatsOptions,
): Promise<FinanceStats> => {
  const chartMonths = Math.max(1, options.chartMonths ?? 12)
  const recentLimit = options.recentLimit ?? 5
  const monthBounds = getMonthBounds(options.year, options.month)
  const chartBounds = getChartBounds(options.year, options.month, chartMonths)

  const [walletsResult, periodTransactionsResult, chartTransactionsResult, recentTransactionsResult, budgetsResult] =
    await Promise.all([
      payload.find({
        collection: 'wallets',
        where: {
          and: [{ user: { equals: userId } }, { isActive: { not_equals: false } }],
        },
        sort: '-isDefault,name',
        limit: 100,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'transactions',
        where: {
          and: [
            { user: { equals: userId } },
            { date: { greater_than_equal: monthBounds.from } },
            { date: { less_than_equal: monthBounds.to } },
          ],
        },
        limit: 0,
        depth: 1,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'transactions',
        where: {
          and: [
            { user: { equals: userId } },
            { date: { greater_than_equal: chartBounds.from } },
            { date: { less_than_equal: chartBounds.to } },
          ],
        },
        limit: 0,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'transactions',
        where: { user: { equals: userId } },
        sort: '-date',
        limit: recentLimit,
        depth: 1,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'budgets',
        where: {
          and: [
            { user: { equals: userId } },
            { period: { equals: 'monthly' } },
            { month: { equals: options.month } },
            { year: { equals: options.year } },
            { isActive: { not_equals: false } },
          ],
        },
        limit: 100,
        depth: 1,
        overrideAccess: true,
      }),
    ])

  const stats = buildFinanceStatsFromDocs({
    month: options.month,
    year: options.year,
    wallets: walletsResult.docs as Wallet[],
    periodTransactions: periodTransactionsResult.docs as Transaction[],
    chartTransactions: chartTransactionsResult.docs as Transaction[],
    recentTransactions: recentTransactionsResult.docs as Transaction[],
    budgets: budgetsResult.docs as Budget[],
  })

  return {
    ...stats,
    chartData: stats.chartData.slice(-chartMonths),
  }
}

export const buildFinanceAdvisorContext = (
  stats: FinanceStats,
  period = '3 thang gan nhat',
): FinanceAdvisorContext => {
  return {
    period,
    totals: stats.totals,
    walletSummary: {
      totalBalance: stats.walletSummary.totalBalance,
      spendingBalance: stats.walletSummary.spendingBalance,
      savingsBalance: stats.walletSummary.savingsBalance,
      monthlySpendingLimit: stats.walletSummary.monthlySpendingLimit,
      spentAmount: stats.walletSummary.spentAmount,
      remainingLimit: stats.walletSummary.remainingLimit,
      limitPercent: stats.walletSummary.limitPercent,
    },
    categoryBreakdown: stats.categoryBreakdown.slice(0, 5),
    sourceBreakdown: stats.sourceBreakdown,
    jarUsage: stats.jarUsage.slice(0, 5),
    monthlyStats: stats.chartData,
  }
}
