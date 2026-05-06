import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@payload-config'

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0
  const parsed = Number(value.replace(/[^\d-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

const getRelationId = (value: any) => {
  if (typeof value === 'object' && value) return value.id
  return value
}

export async function POST(request: Request) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const body = await request.json()
  const walletId = Number(body.walletId)
  const categoryId = Number(body.categoryId)
  const amount = toNumber(body.amount)
  const month = Number(body.month || now.getMonth() + 1)
  const year = Number(body.year || now.getFullYear())

  if (!walletId || !categoryId || amount < 0 || month < 1 || month > 12 || year < 2000) {
    return Response.json({ error: 'Thông tin hũ chi tiêu không hợp lệ.' }, { status: 400 })
  }

  const wallet = await payload.findByID({
    collection: 'wallets' as any,
    id: walletId,
    depth: 0,
    overrideAccess: true,
  })

  if (Number(getRelationId(wallet.user)) !== Number(user.id) || wallet.walletType === 'savings') {
    return Response.json({ error: 'Ví không hợp lệ cho hũ chi tiêu.' }, { status: 403 })
  }

  const category = await payload.findByID({
    collection: 'categories' as any,
    id: categoryId,
    depth: 0,
    overrideAccess: true,
  })
  const categoryOwner = getRelationId(category.user)
  const canUseCategory = category.isDefault || Number(categoryOwner) === Number(user.id)

  if (!canUseCategory || category.type !== 'expense') {
    return Response.json({ error: 'Chỉ có thể đặt hũ cho danh mục chi tiêu được phép dùng.' }, { status: 400 })
  }

  const existingBudget = await payload.find({
    collection: 'budgets' as any,
    where: {
      and: [
        { user: { equals: user.id } },
        { wallet: { equals: walletId } },
        { category: { equals: categoryId } },
        { month: { equals: month } },
        { year: { equals: year } },
        { isActive: { not_equals: false } },
      ],
    },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })

  const activeBudgets = await payload.find({
    collection: 'budgets' as any,
    where: {
      and: [
        { user: { equals: user.id } },
        { wallet: { equals: walletId } },
        { month: { equals: month } },
        { year: { equals: year } },
        { isActive: { not_equals: false } },
      ],
    },
    depth: 0,
    limit: 1000,
    overrideAccess: true,
  })

  const existingId = existingBudget.docs[0]?.id
  const allocatedAmount = activeBudgets.docs.reduce((sum: number, budget: any) => {
    if (Number(budget.id) === Number(existingId)) return sum
    return sum + Number(budget.amount || 0)
  }, 0)
  const monthlyLimit = Number(wallet.monthlySpendingLimit || 0)

  if (monthlyLimit > 0 && allocatedAmount + amount > monthlyLimit) {
    return Response.json(
      {
        error: 'Tổng hạn mức danh mục vượt mức chi tiêu tháng của ví.',
        allocatedAmount,
        monthlyLimit,
      },
      { status: 400 },
    )
  }

  const data = {
    user: user.id,
    wallet: walletId,
    category: categoryId,
    amount,
    period: 'monthly',
    month,
    year,
    alertThresholds: [80, 100],
    isActive: amount > 0,
  }

  const budget = existingId
    ? await payload.update({
        collection: 'budgets' as any,
        id: existingId,
        data,
        user,
        overrideAccess: false,
      })
    : await payload.create({
        collection: 'budgets' as any,
        data,
        user,
        overrideAccess: false,
      })

  const startOfMonth = new Date(year, month - 1, 1).toISOString()
  const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString()
  const transactions = await payload.find({
    collection: 'transactions' as any,
    where: {
      and: [
        { user: { equals: user.id } },
        { wallet: { equals: walletId } },
        { category: { equals: categoryId } },
        { type: { equals: 'expense' } },
        { date: { greater_than_equal: startOfMonth } },
        { date: { less_than_equal: endOfMonth } },
      ],
    },
    depth: 0,
    limit: 1000,
    overrideAccess: true,
  })
  const spentAmount = transactions.docs.reduce((sum: number, transaction: any) => sum + Number(transaction.amount || 0), 0)
  const usedPercent = amount > 0 ? Math.round((spentAmount / amount) * 100) : 0

  if (amount > 0 && usedPercent >= 80) {
    await payload.create({
      collection: 'notifications' as any,
      data: {
        recipient: user.id,
        message:
          usedPercent >= 100
            ? `Hũ ${category.name} đã vượt hạn mức tháng.`
            : `Hũ ${category.name} đã dùng ${usedPercent}% hạn mức tháng.`,
        type: 'system',
        read: false,
        link: '/categories',
      },
      overrideAccess: true,
    })
  }

  return Response.json(budget)
}
