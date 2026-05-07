import type { Payload, Where } from 'payload'

import { normalizeCategoryName } from '@/lib/category-normalization'
import type {
  AdminAiChatLogRow,
  AdminBudgetRow,
  AdminCategoryRow,
  AdminDataQualityFinding,
  AdminNotificationRow,
  AdminOverview,
  AdminPaginatedResponse,
  AdminReceiptRow,
  AdminRelationshipSummary,
  AdminSavingsRow,
  AdminTransactionRow,
  AdminUserProfile,
  AdminUserRow,
  AdminUserWorkspaceOverview,
  AdminWalletRow,
} from './types'

type QueryParams = URLSearchParams

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

const getId = (value: any): number | string | undefined => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && ('id' in value)) return value.id
  return undefined
}

const getLabel = (value: any): string | null => {
  if (!value || typeof value !== 'object') return null
  return value.name ?? value.title ?? value.email ?? value.filename ?? value.description ?? null
}

const relationshipSummary = (value: any): AdminRelationshipSummary | null => {
  const id = getId(value)
  if (id == null) return null
  return {
    id,
    label: getLabel(value),
    email: typeof value === 'object' ? value.email ?? null : null,
  }
}

const numberValue = (value: unknown): number => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const stringParam = (params: QueryParams, key: string): string | null => {
  const value = params.get(key)
  return value && value.trim() ? value.trim() : null
}

const numberParam = (params: QueryParams, key: string): number | null => {
  const value = stringParam(params, key)
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const paging = (params: QueryParams) => {
  const page = Math.max(1, numberParam(params, 'page') ?? 1)
  const limit = Math.min(MAX_LIMIT, Math.max(1, numberParam(params, 'limit') ?? DEFAULT_LIMIT))
  return { limit, page }
}

const andWhere = (conditions: any[]): Where => {
  const filtered = conditions.filter(Boolean)
  if (filtered.length === 0) return {}
  if (filtered.length === 1) return filtered[0]
  return { and: filtered } as Where
}

const dateRangeWhere = (params: QueryParams) => {
  const from = stringParam(params, 'from')
  const to = stringParam(params, 'to')
  if (!from && !to) return null
  const range: Record<string, string> = {}
  if (from) range.greater_than_equal = new Date(from).toISOString()
  if (to) range.less_than_equal = new Date(to).toISOString()
  return { date: range }
}

const responsePage = <T>(result: any, docs: T[]): AdminPaginatedResponse<T> => ({
  docs,
  pagination: {
    limit: result.limit,
    page: result.page,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  },
})

const find = (payload: Payload, args: any) =>
  payload.find({
    depth: 1,
    overrideAccess: true,
    ...args,
  } as any)

const findAll = async (payload: Payload, collection: string, where: Where = {}, limit = 1000) => {
  const result = await find(payload, {
    collection,
    where,
    limit,
    page: 1,
  })
  return result.docs as any[]
}

const count = async (payload: Payload, collection: string, where: Where = {}) => {
  const result = await find(payload, {
    collection,
    where,
    limit: 1,
    depth: 0,
  })
  return result.totalDocs
}

const isMissingRelationError = (error: unknown) => {
  const cause = (error as { cause?: { code?: string } })?.cause
  return cause?.code === '42P01' || String(error).includes('does not exist')
}

const mapTransaction = (doc: any): AdminTransactionRow => ({
  id: doc.id,
  type: doc.type ?? null,
  amount: numberValue(doc.amount),
  currency: doc.currency ?? null,
  date: doc.date ?? null,
  description: doc.description ?? null,
  merchantName: doc.merchantName ?? null,
  sourceType: doc.sourceType ?? null,
  user: relationshipSummary(doc.user),
  wallet: relationshipSummary(doc.wallet),
  category: relationshipSummary(doc.category),
  receipt: relationshipSummary(doc.receipt),
  savingsGoal: relationshipSummary(doc.savingsGoal),
})

const mapWallet = (doc: any): AdminWalletRow => ({
  id: doc.id,
  name: doc.name ?? null,
  walletType: doc.walletType ?? null,
  currency: doc.currency ?? null,
  balance: numberValue(doc.balance),
  monthlySpendingLimit: doc.monthlySpendingLimit ?? null,
  isDefault: doc.isDefault ?? null,
  isActive: doc.isActive ?? null,
  user: relationshipSummary(doc.user),
})

const currentMonthRange = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { end: end.toISOString(), start: start.toISOString() }
}

export async function getAdminOverview(payload: Payload): Promise<AdminOverview> {
  const month = currentMonthRange()
  const currentMonthWhere = {
    date: {
      greater_than_equal: month.start,
      less_than_equal: month.end,
    },
  }

  const [usersTotal, wallets, transactions, budgets, savingsGoals, receiptTransactions, recentResult] = await Promise.all([
    count(payload, 'users'),
    findAll(payload, 'wallets', {}, 1000),
    findAll(payload, 'transactions', currentMonthWhere as Where, 2000),
    findAll(payload, 'budgets', { isActive: { equals: true } } as Where, 1000),
    findAll(payload, 'savings-goals', {}, 1000),
    findAll(payload, 'transactions', { sourceType: { equals: 'receipt_ai' } } as Where, 1000),
    find(payload, {
      collection: 'transactions',
      sort: '-date',
      limit: 8,
      depth: 1,
    }),
  ])

  const income = transactions.filter((doc) => doc.type === 'income').reduce((sum, doc) => sum + numberValue(doc.amount), 0)
  const expense = transactions.filter((doc) => doc.type === 'expense').reduce((sum, doc) => sum + numberValue(doc.amount), 0)
  const sourceMap = new Map<string, { count: number; total: number }>()
  for (const doc of transactions) {
    const key = doc.sourceType || 'manual'
    const next = sourceMap.get(key) || { count: 0, total: 0 }
    next.count += 1
    next.total += numberValue(doc.amount)
    sourceMap.set(key, next)
  }

  const budgetRows = await buildBudgetRows(payload, budgets)
  const atRisk = budgetRows.filter((budget) => budget.usagePercent >= 80 && budget.usagePercent < 100).length
  const exceeded = budgetRows.filter((budget) => budget.usagePercent >= 100).length
  const receiptWarnings = receiptTransactions
    .filter((doc) => !doc.receipt)
    .slice(0, 8)
    .map(mapReceipt)

  const dataQuality = await getAdminDataQuality(payload)

  return {
    kpis: [
      { label: 'Users', value: usersTotal },
      { label: 'Wallet balance', value: wallets.reduce((sum, doc) => sum + numberValue(doc.balance), 0) },
      { label: 'Income this month', value: income, tone: 'good' },
      { label: 'Expense this month', value: expense, tone: 'warning' },
      { label: 'Net cashflow', value: income - expense, tone: income - expense >= 0 ? 'good' : 'danger' },
      { label: 'OCR receipts', value: receiptTransactions.length },
      { label: 'Savings goals', value: savingsGoals.length },
      { label: 'Data warnings', value: dataQuality.length, tone: dataQuality.length > 0 ? 'warning' : 'good' },
    ],
    transactionSourceMix: Array.from(sourceMap.entries()).map(([sourceType, value]) => ({ sourceType, ...value })),
    cashflow: [{ label: 'Current month', income, expense, net: income - expense }],
    budgetWarnings: { atRisk, exceeded },
    recentTransactions: (recentResult.docs as any[]).map(mapTransaction),
    receiptWarnings,
    dataQuality: dataQuality.slice(0, 8),
  }
}

export async function getAdminUsers(payload: Payload, params: QueryParams): Promise<AdminPaginatedResponse<AdminUserRow>> {
  const { limit, page } = paging(params)
  const role = stringParam(params, 'role')
  const search = stringParam(params, 'search')
  const setup = stringParam(params, 'setup')

  const result = await find(payload, {
    collection: 'users',
    where: andWhere([
      role ? { role: { equals: role } } : null,
      search
        ? {
            or: [
              { email: { contains: search } },
              { name: { contains: search } },
            ],
          }
        : null,
    ]),
    limit,
    page,
    sort: '-createdAt',
  })

  const rows = await Promise.all((result.docs as any[]).map(async (doc): Promise<AdminUserRow | null> => {
    const [wallets, transactions] = await Promise.all([
      findAll(payload, 'wallets', { user: { equals: doc.id } } as Where, 1000),
      find(payload, {
        collection: 'transactions',
        where: { user: { equals: doc.id } },
        limit: 1,
        sort: '-date',
      }),
    ])
    const hasDefaultWallet = wallets.some((wallet) => wallet.isDefault)
    if (setup === 'complete' && !hasDefaultWallet) return null
    if (setup === 'incomplete' && hasDefaultWallet) return null
    return {
      id: doc.id,
      email: doc.email ?? null,
      name: doc.name ?? null,
      role: doc.role ?? null,
      currency: doc.currency ?? null,
      createdAt: doc.createdAt ?? null,
      walletCount: wallets.length,
      transactionCount: transactions.totalDocs,
      hasDefaultWallet,
      latestTransactionDate: (transactions.docs[0] as any)?.date ?? null,
    }
  }))

  return responsePage(result, rows.filter(Boolean) as AdminUserRow[])
}

export async function getAdminUserFinanceSummary(payload: Payload, userId: string) {
  const user = await payload.findByID({ collection: 'users' as any, id: userId, depth: 0, overrideAccess: true })
  const [wallets, recentTransactions, budgets, savingsGoals, receipts] = await Promise.all([
    findAll(payload, 'wallets', { user: { equals: userId } } as Where, 1000),
    find(payload, { collection: 'transactions', where: { user: { equals: userId } }, limit: 10, sort: '-date' }),
    findAll(payload, 'budgets', { user: { equals: userId } } as Where, 1000),
    findAll(payload, 'savings-goals', { owner: { equals: userId } } as Where, 1000),
    findAll(payload, 'transactions', { and: [{ user: { equals: userId } }, { sourceType: { equals: 'receipt_ai' } }] } as Where, 100),
  ])

  return {
    user: {
      id: (user as any).id,
      email: (user as any).email ?? null,
      name: (user as any).name ?? null,
      role: (user as any).role ?? null,
      currency: (user as any).currency ?? null,
    },
    wallets: wallets.map(mapWallet),
    recentTransactions: (recentTransactions.docs as any[]).map(mapTransaction),
    budgets: await buildBudgetRows(payload, budgets),
    savingsGoals: await buildSavingsRows(payload, savingsGoals),
    receipts: receipts.map(mapReceipt),
  }
}

export async function getAdminWallets(payload: Payload, params: QueryParams): Promise<AdminPaginatedResponse<AdminWalletRow>> {
  const { limit, page } = paging(params)
  const result = await find(payload, {
    collection: 'wallets',
    where: andWhere([
      stringParam(params, 'user') ? { user: { equals: stringParam(params, 'user') } } : null,
      stringParam(params, 'walletType') ? { walletType: { equals: stringParam(params, 'walletType') } } : null,
      stringParam(params, 'isDefault') ? { isDefault: { equals: stringParam(params, 'isDefault') === 'true' } } : null,
      stringParam(params, 'isActive') ? { isActive: { equals: stringParam(params, 'isActive') === 'true' } } : null,
    ]),
    limit,
    page,
    sort: 'name',
  })
  return responsePage(result, (result.docs as any[]).map(mapWallet))
}

export async function getAdminTransactions(payload: Payload, params: QueryParams): Promise<AdminPaginatedResponse<AdminTransactionRow>> {
  const { limit, page } = paging(params)
  const result = await find(payload, {
    collection: 'transactions',
    where: andWhere([
      stringParam(params, 'user') ? { user: { equals: stringParam(params, 'user') } } : null,
      stringParam(params, 'wallet') ? { wallet: { equals: stringParam(params, 'wallet') } } : null,
      stringParam(params, 'type') ? { type: { equals: stringParam(params, 'type') } } : null,
      stringParam(params, 'category') ? { category: { equals: stringParam(params, 'category') } } : null,
      stringParam(params, 'sourceType') ? { sourceType: { equals: stringParam(params, 'sourceType') } } : null,
      numberParam(params, 'minAmount') != null ? { amount: { greater_than_equal: numberParam(params, 'minAmount') } } : null,
      numberParam(params, 'maxAmount') != null ? { amount: { less_than_equal: numberParam(params, 'maxAmount') } } : null,
      stringParam(params, 'search')
        ? {
            or: [
              { description: { contains: stringParam(params, 'search') } },
              { merchantName: { contains: stringParam(params, 'search') } },
              { note: { contains: stringParam(params, 'search') } },
            ],
          }
        : null,
      dateRangeWhere(params),
    ]),
    limit,
    page,
    sort: '-date',
  })
  return responsePage(result, (result.docs as any[]).map(mapTransaction))
}

export async function getAdminCategories(payload: Payload, params: QueryParams): Promise<AdminPaginatedResponse<AdminCategoryRow>> {
  const { limit, page } = paging(params)
  const scope = stringParam(params, 'scope')
  const result = await find(payload, {
    collection: 'categories',
    where: andWhere([
      stringParam(params, 'type') ? { type: { equals: stringParam(params, 'type') } } : null,
      scope === 'system' ? { isDefault: { equals: true } } : null,
      scope === 'user' ? { isDefault: { not_equals: true } } : null,
      stringParam(params, 'user') ? { user: { equals: stringParam(params, 'user') } } : null,
      stringParam(params, 'search') ? { name: { contains: stringParam(params, 'search') } } : null,
    ]),
    limit,
    page,
    sort: 'name',
  })
  const all = await findAll(payload, 'categories', {}, 5000)
  const counts = new Map<string, number>()
  for (const category of all) {
    const key = `${category.type}|${category.isDefault ? 'system' : getId(category.user) || 'none'}|${normalizeCategoryName(category.name || '')}`
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return responsePage(result, (result.docs as any[]).map((doc) => {
    const key = `${doc.type}|${doc.isDefault ? 'system' : getId(doc.user) || 'none'}|${normalizeCategoryName(doc.name || '')}`
    return {
      id: doc.id,
      name: doc.name ?? null,
      type: doc.type ?? null,
      icon: doc.icon ?? null,
      color: doc.color ?? null,
      isDefault: doc.isDefault ?? null,
      user: relationshipSummary(doc.user),
      duplicateKey: (counts.get(key) || 0) > 1 ? key : null,
    }
  }))
}

async function buildBudgetRows(payload: Payload, budgets: any[]): Promise<AdminBudgetRow[]> {
  const rows: AdminBudgetRow[] = []
  for (const budget of budgets) {
    const where = andWhere([
      getId(budget.user) ? { user: { equals: getId(budget.user) } } : null,
      getId(budget.wallet) ? { wallet: { equals: getId(budget.wallet) } } : null,
      getId(budget.category) ? { category: { equals: getId(budget.category) } } : null,
      budget.month && budget.year
        ? {
            date: {
              greater_than_equal: new Date(Number(budget.year), Number(budget.month) - 1, 1).toISOString(),
              less_than_equal: new Date(Number(budget.year), Number(budget.month), 0, 23, 59, 59, 999).toISOString(),
            },
          }
        : null,
      { type: { equals: 'expense' } },
    ])
    const transactions = await findAll(payload, 'transactions', where, 5000)
    const spent = transactions.reduce((sum, doc) => sum + numberValue(doc.amount), 0)
    const amount = numberValue(budget.amount)
    rows.push({
      id: budget.id,
      amount,
      spent,
      remaining: Math.max(0, amount - spent),
      usagePercent: amount > 0 ? Math.round((spent / amount) * 100) : 0,
      period: budget.period ?? null,
      month: budget.month ?? null,
      year: budget.year ?? null,
      isActive: budget.isActive ?? null,
      user: relationshipSummary(budget.user),
      wallet: relationshipSummary(budget.wallet),
      category: relationshipSummary(budget.category),
    })
  }
  return rows
}

export async function getAdminBudgets(payload: Payload, params: QueryParams): Promise<AdminPaginatedResponse<AdminBudgetRow>> {
  const { limit, page } = paging(params)
  const result = await find(payload, {
    collection: 'budgets',
    where: andWhere([
      stringParam(params, 'user') ? { user: { equals: stringParam(params, 'user') } } : null,
      stringParam(params, 'wallet') ? { wallet: { equals: stringParam(params, 'wallet') } } : null,
      stringParam(params, 'category') ? { category: { equals: stringParam(params, 'category') } } : null,
      stringParam(params, 'period') ? { period: { equals: stringParam(params, 'period') } } : null,
      numberParam(params, 'month') ? { month: { equals: numberParam(params, 'month') } } : null,
      numberParam(params, 'year') ? { year: { equals: numberParam(params, 'year') } } : null,
    ]),
    limit,
    page,
    sort: '-year,-month',
  })
  return responsePage(result, await buildBudgetRows(payload, result.docs as any[]))
}

async function buildSavingsRows(payload: Payload, goals: any[]): Promise<AdminSavingsRow[]> {
  const rows: AdminSavingsRow[] = []
  for (const goal of goals) {
    const contributions = await findAll(payload, 'savings-contributions', { goal: { equals: goal.id } } as Where, 5000)
    const contributionTotal = contributions.reduce((sum, doc) => sum + numberValue(doc.amount), 0)
    const currentAmount = numberValue(goal.currentAmount)
    rows.push({
      id: goal.id,
      title: goal.title ?? null,
      targetAmount: numberValue(goal.targetAmount),
      currentAmount,
      contributionTotal,
      status: goal.status ?? null,
      owner: relationshipSummary(goal.owner),
      inconsistent: Math.abs(currentAmount - contributionTotal) > 1,
    })
  }
  return rows
}

export async function getAdminSavings(payload: Payload, params: QueryParams): Promise<AdminPaginatedResponse<AdminSavingsRow>> {
  const { limit, page } = paging(params)
  const result = await find(payload, {
    collection: 'savings-goals',
    where: andWhere([
      stringParam(params, 'owner') ? { owner: { equals: stringParam(params, 'owner') } } : null,
      stringParam(params, 'status') ? { status: { equals: stringParam(params, 'status') } } : null,
      stringParam(params, 'search') ? { title: { contains: stringParam(params, 'search') } } : null,
    ]),
    limit,
    page,
    sort: '-createdAt',
  })
  return responsePage(result, await buildSavingsRows(payload, result.docs as any[]))
}

const mapReceipt = (doc: any): AdminReceiptRow => ({
  id: doc.receipt?.id ?? `transaction-${doc.id}`,
  transactionId: doc.id,
  user: relationshipSummary(doc.user),
  merchantName: doc.merchantName ?? null,
  amount: numberValue(doc.amount),
  currency: doc.currency ?? null,
  date: doc.date ?? null,
  sourceType: doc.sourceType ?? null,
  receipt: relationshipSummary(doc.receipt),
  status: doc.receipt ? 'linked' : 'missing_media',
})

export async function getAdminReceipts(payload: Payload, params: QueryParams): Promise<AdminPaginatedResponse<AdminReceiptRow>> {
  const { limit, page } = paging(params)
  const result = await find(payload, {
    collection: 'transactions',
    where: andWhere([
      { sourceType: { equals: 'receipt_ai' } },
      stringParam(params, 'user') ? { user: { equals: stringParam(params, 'user') } } : null,
      stringParam(params, 'merchant') ? { merchantName: { contains: stringParam(params, 'merchant') } } : null,
      numberParam(params, 'minAmount') != null ? { amount: { greater_than_equal: numberParam(params, 'minAmount') } } : null,
      numberParam(params, 'maxAmount') != null ? { amount: { less_than_equal: numberParam(params, 'maxAmount') } } : null,
      stringParam(params, 'status') === 'missing_media' ? { receipt: { exists: false } } : null,
      dateRangeWhere(params),
    ]),
    limit,
    page,
    sort: '-date',
  })
  return responsePage(result, (result.docs as any[]).map(mapReceipt))
}

export async function getAdminReceiptDetail(payload: Payload, id: string) {
  const transaction = await payload.findByID({ collection: 'transactions' as any, id, depth: 2, overrideAccess: true })
  return {
    transaction: mapTransaction(transaction),
    receipt: relationshipSummary((transaction as any).receipt),
    raw: {
      merchantName: (transaction as any).merchantName ?? null,
      note: (transaction as any).note ?? null,
      sourceRefId: (transaction as any).sourceRefId ?? null,
    },
  }
}

export async function getAdminNotifications(payload: Payload, params: QueryParams): Promise<AdminPaginatedResponse<AdminNotificationRow>> {
  const { limit, page } = paging(params)
  const result = await find(payload, {
    collection: 'notifications',
    where: andWhere([
      stringParam(params, 'recipient') ? { recipient: { equals: stringParam(params, 'recipient') } } : null,
      stringParam(params, 'type') ? { type: { equals: stringParam(params, 'type') } } : null,
      stringParam(params, 'read') ? { read: { equals: stringParam(params, 'read') === 'true' } } : null,
    ]),
    limit,
    page,
    sort: '-createdAt',
  })
  return responsePage(result, (result.docs as any[]).map((doc) => ({
    id: doc.id,
    message: doc.message ?? null,
    type: doc.type ?? null,
    read: doc.read ?? null,
    link: doc.link ?? null,
    recipient: relationshipSummary(doc.recipient),
    createdAt: doc.createdAt ?? null,
  })))
}

export async function getAdminDataQuality(payload: Payload): Promise<AdminDataQualityFinding[]> {
  const [users, wallets, transactions, categories, budgets, media, savingsGoals] = await Promise.all([
    findAll(payload, 'users', {}, 5000),
    findAll(payload, 'wallets', {}, 5000),
    findAll(payload, 'transactions', {}, 5000),
    findAll(payload, 'categories', {}, 5000),
    findAll(payload, 'budgets', {}, 5000),
    findAll(payload, 'media', {}, 5000),
    findAll(payload, 'savings-goals', {}, 5000),
  ])

  const findings: AdminDataQualityFinding[] = []
  const walletsByUser = new Map<string, any[]>()
  for (const wallet of wallets) {
    const userId = getId(wallet.user)
    if (!userId) continue
    const key = String(userId)
    walletsByUser.set(key, [...(walletsByUser.get(key) || []), wallet])
  }

  for (const user of users) {
    const userWallets = walletsByUser.get(String(user.id)) || []
    if (!userWallets.some((wallet) => wallet.isDefault)) {
      findings.push({
        id: `user-${user.id}-default-wallet`,
        area: 'wallets',
        severity: 'warning',
        title: 'User missing default wallet',
        detail: `${user.email || user.id} has no default wallet.`,
        recordId: user.id,
        userId: user.id,
        nextStep: 'Open the user finance summary and create or assign a default wallet.',
      })
    }
  }

  const categoryById = new Map(categories.map((category) => [String(category.id), category]))
  for (const transaction of transactions) {
    if (!getId(transaction.user) || !getId(transaction.wallet) || !getId(transaction.category)) {
      findings.push({
        id: `transaction-${transaction.id}-relationship`,
        area: 'transactions',
        severity: 'danger',
        title: 'Transaction missing required relationship',
        detail: `Transaction ${transaction.id} is missing user, wallet, or category.`,
        recordId: transaction.id,
        userId: getId(transaction.user),
        nextStep: 'Open the transaction detail and repair the missing relationship.',
      })
    }
    const category = categoryById.get(String(getId(transaction.category)))
    if (category && transaction.type && category.type && transaction.type !== category.type) {
      findings.push({
        id: `transaction-${transaction.id}-category-type`,
        area: 'categories',
        severity: 'danger',
        title: 'Transaction category type mismatch',
        detail: `Transaction ${transaction.id} is ${transaction.type} but category is ${category.type}.`,
        recordId: transaction.id,
        userId: getId(transaction.user),
        nextStep: 'Choose a category with the same income/expense type.',
      })
    }
    if (transaction.sourceType === 'receipt_ai' && !transaction.receipt) {
      findings.push({
        id: `transaction-${transaction.id}-receipt`,
        area: 'receipts',
        severity: 'warning',
        title: 'OCR transaction missing receipt media',
        detail: `Receipt AI transaction ${transaction.id} has no linked media.`,
        recordId: transaction.id,
        userId: getId(transaction.user),
        nextStep: 'Inspect the OCR confirmation flow or attach receipt media.',
      })
    }
  }

  const budgetKeys = new Set<string>()
  for (const budget of budgets) {
    if (!getId(budget.category)) {
      findings.push({
        id: `budget-${budget.id}-category`,
        area: 'budgets',
        severity: 'danger',
        title: 'Budget missing category',
        detail: `Budget ${budget.id} has no category.`,
        recordId: budget.id,
        userId: getId(budget.user),
        nextStep: 'Assign an expense category or remove the invalid budget.',
      })
    }
    const key = [getId(budget.user), getId(budget.wallet), getId(budget.category), budget.period, budget.month, budget.year].join('|')
    if (budgetKeys.has(key)) {
      findings.push({
        id: `budget-${budget.id}-duplicate`,
        area: 'budgets',
        severity: 'warning',
        title: 'Duplicate budget scope',
        detail: `Budget ${budget.id} duplicates another user/wallet/category/period scope.`,
        recordId: budget.id,
        userId: getId(budget.user),
        nextStep: 'Merge duplicate budget rows or deactivate one row.',
      })
    }
    budgetKeys.add(key)
  }

  for (const file of media) {
    if (!file.ownerId) {
      findings.push({
        id: `media-${file.id}-owner`,
        area: 'media',
        severity: 'warning',
        title: 'Media without owner',
        detail: `Media ${file.filename || file.id} has no ownerId.`,
        recordId: file.id,
        nextStep: 'Confirm whether this is shared media or assign an owner.',
      })
    }
  }

  const savingsRows = await buildSavingsRows(payload, savingsGoals)
  for (const row of savingsRows) {
    if (row.inconsistent) {
      findings.push({
        id: `savings-${row.id}-total`,
        area: 'savings',
        severity: 'warning',
        title: 'Savings total inconsistent',
        detail: `${row.title || row.id} current amount does not match contribution total.`,
        recordId: row.id,
        userId: row.owner?.id,
        nextStep: 'Inspect savings contributions and recalculate the goal current amount.',
      })
    }
  }

  return findings
}

// USER-SCOPED ADMIN SERVICE HELPERS
// All enforce user constraint internally, do not rely on UI providing correct params

export async function getAdminUserProfile(
  payload: Payload,
  userId: string,
): Promise<import('./types').AdminUserProfile> {
  const user = await payload.findByID({
    collection: 'users' as any,
    id: userId,
    depth: 0,
    overrideAccess: true,
  })

  const wallets = await findAll(payload, 'wallets', { user: { equals: userId } } as Where, 1000)
  const transactions = await find(payload, {
    collection: 'transactions',
    where: { user: { equals: userId } },
    limit: 1,
    sort: '-date',
    depth: 0,
  })

  const hasDefault = wallets.some((w) => w.isDefault)
  let walletSetupState: 'no-wallet' | 'has-default' | 'multiple-wallets' = 'no-wallet'
  if (wallets.length === 0) walletSetupState = 'no-wallet'
  else if (hasDefault && wallets.length === 1) walletSetupState = 'has-default'
  else if (hasDefault) walletSetupState = 'multiple-wallets'
  else walletSetupState = 'has-default' // has wallets but missing default (data quality issue)

  return {
    id: (user as any).id,
    email: (user as any).email ?? null,
    name: (user as any).name ?? null,
    role: (user as any).role ?? null,
    currency: (user as any).currency ?? null,
    createdAt: (user as any).createdAt ?? null,
    walletSetupState,
    walletCount: wallets.length,
    transactionCount: transactions.totalDocs,
    latestActivityDate: (transactions.docs[0] as any)?.date ?? null,
  }
}

export async function getAdminUserWorkspaceOverview(
  payload: Payload,
  userId: string,
): Promise<import('./types').AdminUserWorkspaceOverview> {
  const month = currentMonthRange()
  const currentMonthWhere = {
    date: {
      greater_than_equal: month.start,
      less_than_equal: month.end,
    },
  }

  const [wallets, monthlyTransactions, budgets, receipts, aiLogs] = await Promise.all([
    findAll(payload, 'wallets', { user: { equals: userId } } as Where, 1000),
    find(payload, {
      collection: 'transactions',
      where: andWhere([{ user: { equals: userId } }, currentMonthWhere]),
      limit: 1000,
      depth: 0,
    }),
    findAll(payload, 'budgets', { user: { equals: userId } } as Where, 1000),
    findAll(payload, 'transactions', andWhere([{ user: { equals: userId } }, { sourceType: { equals: 'receipt_ai' } }]) as Where, 1000),
    count(payload, 'ai-chat-logs' as any, { user: { equals: userId } } as Where).catch((error) => {
      if (isMissingRelationError(error)) return 0
      throw error
    }),
  ])

  const income = monthlyTransactions.docs.filter((t: any) => t.type === 'income').reduce((sum, t: any) => sum + numberValue(t.amount), 0)
  const expense = monthlyTransactions.docs.filter((t: any) => t.type === 'expense').reduce((sum, t: any) => sum + numberValue(t.amount), 0)
  const totalBalance = wallets.reduce((sum, w: any) => sum + numberValue(w.balance), 0)
  const savingsBalance = wallets
    .filter((w: any) => w.walletType === 'savings')
    .reduce((sum, w: any) => sum + numberValue(w.balance), 0)

  const budgetRows = await buildBudgetRows(payload, budgets)
  const atRisk = budgetRows.filter((b) => b.usagePercent >= 80 && b.usagePercent < 100).length
  const exceeded = budgetRows.filter((b) => b.usagePercent >= 100).length

  return {
    kpis: [
      {
        label: 'Tổng số dư',
        value: totalBalance,
      },
      { label: 'Thu nhập tháng này', value: income, tone: 'good' },
      { label: 'Chi tiêu tháng này', value: expense, tone: 'warning' },
      { label: 'Dòng tiền ròng', value: income - expense, tone: income - expense >= 0 ? 'good' : 'danger' },
      { label: 'Hóa đơn OCR', value: receipts.length },
      { label: 'Nhật ký AI/chat', value: aiLogs },
    ],
    budgetWarnings: { atRisk, exceeded },
    totalBalance,
    savingsBalance,
    monthlyIncome: income,
    monthlyExpense: expense,
    netCashflow: income - expense,
    receiptCount: receipts.length,
    aiChatCount: aiLogs,
  }
}

export async function getAdminUserWallets(
  payload: Payload,
  userId: string,
  params: QueryParams = new URLSearchParams(),
): Promise<AdminPaginatedResponse<AdminWalletRow>> {
  const { limit, page } = paging(params)
  const result = await find(payload, {
    collection: 'wallets',
    where: andWhere([
      { user: { equals: userId } }, // enforce user constraint
      stringParam(params, 'walletType') ? { walletType: { equals: stringParam(params, 'walletType') } } : null,
      stringParam(params, 'isDefault') ? { isDefault: { equals: stringParam(params, 'isDefault') === 'true' } } : null,
      stringParam(params, 'isActive') ? { isActive: { equals: stringParam(params, 'isActive') === 'true' } } : null,
    ]),
    limit,
    page,
    sort: 'name',
  })
  return responsePage(result, (result.docs as any[]).map(mapWallet))
}

export async function getAdminUserTransactions(
  payload: Payload,
  userId: string,
  params: QueryParams = new URLSearchParams(),
): Promise<AdminPaginatedResponse<AdminTransactionRow>> {
  const { limit, page } = paging(params)
  // Ignore conflicting params.user
  const result = await find(payload, {
    collection: 'transactions',
    where: andWhere([
      { user: { equals: userId } }, // enforce user constraint
      stringParam(params, 'wallet') ? { wallet: { equals: stringParam(params, 'wallet') } } : null,
      stringParam(params, 'type') ? { type: { equals: stringParam(params, 'type') } } : null,
      stringParam(params, 'category') ? { category: { equals: stringParam(params, 'category') } } : null,
      stringParam(params, 'sourceType') ? { sourceType: { equals: stringParam(params, 'sourceType') } } : null,
      numberParam(params, 'minAmount') != null ? { amount: { greater_than_equal: numberParam(params, 'minAmount') } } : null,
      numberParam(params, 'maxAmount') != null ? { amount: { less_than_equal: numberParam(params, 'maxAmount') } } : null,
      stringParam(params, 'search')
        ? {
            or: [
              { description: { contains: stringParam(params, 'search') } },
              { merchantName: { contains: stringParam(params, 'search') } },
              { note: { contains: stringParam(params, 'search') } },
            ],
          }
        : null,
      dateRangeWhere(params),
    ]),
    limit,
    page,
    sort: '-date',
  })
  return responsePage(result, (result.docs as any[]).map(mapTransaction))
}

export async function getAdminUserCategories(
  payload: Payload,
  userId: string,
  params: QueryParams = new URLSearchParams(),
): Promise<AdminPaginatedResponse<AdminCategoryRow>> {
  const { limit, page } = paging(params)
  // Return system defaults PLUS selected-user custom categories (do not include other users' custom categories)
  const result = await find(payload, {
    collection: 'categories',
    where: andWhere([
      {
        or: [
          { isDefault: { equals: true } }, // system defaults
          { user: { equals: userId } }, // user's custom categories
        ],
      },
      stringParam(params, 'type') ? { type: { equals: stringParam(params, 'type') } } : null,
      stringParam(params, 'search') ? { name: { contains: stringParam(params, 'search') } } : null,
    ]),
    limit,
    page,
    sort: 'name',
  })
  // Rebuild dedup counts only for this user's categories
  const userCategories = await findAll(
    payload,
    'categories',
    { user: { equals: userId } } as Where,
    5000,
  )
  const systemDefaults = await findAll(payload, 'categories', { isDefault: { equals: true } } as Where, 5000)
  const counts = new Map<string, number>()
  for (const cat of [...userCategories, ...systemDefaults]) {
    const key = `${cat.type}|${cat.isDefault ? 'system' : getId(cat.user) || 'none'}|${normalizeCategoryName(cat.name || '')}`
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return responsePage(result, (result.docs as any[]).map((doc) => {
    const key = `${doc.type}|${doc.isDefault ? 'system' : getId(doc.user) || 'none'}|${normalizeCategoryName(doc.name || '')}`
    return {
      id: doc.id,
      name: doc.name ?? null,
      type: doc.type ?? null,
      icon: doc.icon ?? null,
      color: doc.color ?? null,
      isDefault: doc.isDefault ?? null,
      user: relationshipSummary(doc.user),
      duplicateKey: (counts.get(key) || 0) > 1 ? key : null,
    }
  }))
}

export async function getAdminUserBudgets(
  payload: Payload,
  userId: string,
  params: QueryParams = new URLSearchParams(),
): Promise<AdminPaginatedResponse<AdminBudgetRow>> {
  const { limit, page } = paging(params)
  const result = await find(payload, {
    collection: 'budgets',
    where: andWhere([
      { user: { equals: userId } }, // enforce user constraint
      stringParam(params, 'wallet') ? { wallet: { equals: stringParam(params, 'wallet') } } : null,
      stringParam(params, 'category') ? { category: { equals: stringParam(params, 'category') } } : null,
      stringParam(params, 'period') ? { period: { equals: stringParam(params, 'period') } } : null,
      numberParam(params, 'month') ? { month: { equals: numberParam(params, 'month') } } : null,
      numberParam(params, 'year') ? { year: { equals: numberParam(params, 'year') } } : null,
    ]),
    limit,
    page,
    sort: '-year,-month',
  })
  return responsePage(result, await buildBudgetRows(payload, result.docs as any[]))
}

export async function getAdminUserSavings(
  payload: Payload,
  userId: string,
  params: QueryParams = new URLSearchParams(),
): Promise<AdminPaginatedResponse<AdminSavingsRow>> {
  const { limit, page } = paging(params)
  // Owner or participant scoping for savings-goals, plus selected-user contribution summaries
  const result = await find(payload, {
    collection: 'savings-goals',
    where: andWhere([
      {
        or: [
          { owner: { equals: userId } },
          { participants: { contains: userId } },
        ],
      },
      stringParam(params, 'status') ? { status: { equals: stringParam(params, 'status') } } : null,
      stringParam(params, 'search') ? { title: { contains: stringParam(params, 'search') } } : null,
    ]),
    limit,
    page,
    sort: '-createdAt',
  })
  return responsePage(result, await buildSavingsRows(payload, result.docs as any[]))
}

export async function getAdminUserReceipts(
  payload: Payload,
  userId: string,
  params: QueryParams = new URLSearchParams(),
): Promise<AdminPaginatedResponse<AdminReceiptRow>> {
  const { limit, page } = paging(params)
  const result = await find(payload, {
    collection: 'transactions',
    where: andWhere([
      { sourceType: { equals: 'receipt_ai' } },
      { user: { equals: userId } }, // enforce user constraint
      stringParam(params, 'merchant') ? { merchantName: { contains: stringParam(params, 'merchant') } } : null,
      numberParam(params, 'minAmount') != null ? { amount: { greater_than_equal: numberParam(params, 'minAmount') } } : null,
      numberParam(params, 'maxAmount') != null ? { amount: { less_than_equal: numberParam(params, 'maxAmount') } } : null,
      stringParam(params, 'status') === 'missing_media' ? { receipt: { exists: false } } : null,
      dateRangeWhere(params),
    ]),
    limit,
    page,
    sort: '-date',
  })
  return responsePage(result, (result.docs as any[]).map(mapReceipt))
}

export async function getAdminUserNotifications(
  payload: Payload,
  userId: string,
  params: QueryParams = new URLSearchParams(),
): Promise<AdminPaginatedResponse<AdminNotificationRow>> {
  const { limit, page } = paging(params)
  const result = await find(payload, {
    collection: 'notifications',
    where: andWhere([
      { recipient: { equals: userId } }, // enforce user constraint
      stringParam(params, 'type') ? { type: { equals: stringParam(params, 'type') } } : null,
      stringParam(params, 'read') ? { read: { equals: stringParam(params, 'read') === 'true' } } : null,
    ]),
    limit,
    page,
    sort: '-createdAt',
  })
  return responsePage(result, (result.docs as any[]).map((doc) => ({
    id: doc.id,
    message: doc.message ?? null,
    type: doc.type ?? null,
    read: doc.read ?? null,
    link: doc.link ?? null,
    recipient: relationshipSummary(doc.recipient),
    createdAt: doc.createdAt ?? null,
  })))
}

export async function getAdminUserAiLogs(
  payload: Payload,
  userId: string,
  params: QueryParams = new URLSearchParams(),
): Promise<AdminPaginatedResponse<import('./types').AdminAiChatLogRow>> {
  const { limit, page } = paging(params)
  const result = await find(payload, {
    collection: 'ai-chat-logs' as any,
    where: andWhere([
      { user: { equals: userId } }, // enforce user constraint
      stringParam(params, 'kind') ? { kind: { equals: stringParam(params, 'kind') } } : null,
      stringParam(params, 'status') ? { status: { equals: stringParam(params, 'status') } } : null,
      stringParam(params, 'direction') ? { direction: { equals: stringParam(params, 'direction') } } : null,
    ]),
    limit,
    page,
    sort: '-createdAt',
  }).catch((error) => {
    if (isMissingRelationError(error)) {
      return {
        docs: [],
        limit,
        page,
        totalDocs: 0,
        totalPages: 0,
      }
    }
    throw error
  })
  // Redacted by default: do not return rawText
  return responsePage(result, (result.docs as any[]).map((doc) => ({
    id: doc.id,
    kind: doc.kind ?? null,
    direction: doc.direction ?? null,
    status: doc.status ?? null,
    redactedText: doc.redactedText ?? null,
    intent: doc.intent ?? null,
    linkedTransaction: relationshipSummary(doc.linkedTransaction),
    errorMessage: doc.errorMessage ?? null,
    createdAt: doc.createdAt ?? null,
  })))
}
