import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers.js'

export async function GET(request: Request) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  // Default: current month
  const now = new Date()
  const startDate = from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endDate = to || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const transactions = await payload.find({
    collection: 'transactions' as any,
    where: {
      and: [
        { user: { equals: user.id } },
        { date: { greater_than_equal: startDate } },
        { date: { less_than_equal: endDate } },
      ],
    },
    limit: 0,
    depth: 1,
  })

  const totalIncome = (transactions.docs as any[])
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const totalExpense = (transactions.docs as any[])
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const balance = totalIncome - totalExpense

  // Group by category
  const categoryMap: Record<string, { name: string; icon: string; color: string; total: number; type: string }> = {}

  for (const t of (transactions.docs as any[])) {
    const cat = t.category as { id: string; name: string; icon: string; color: string } | null
    if (cat && typeof cat === 'object') {
      const key = cat.id
      if (!categoryMap[key]) {
        categoryMap[key] = {
          name: cat.name || 'Không phân loại',
          icon: cat.icon || '📦',
          color: cat.color || '#6366f1',
          total: 0,
          type: t.type || 'expense',
        }
      }
      categoryMap[key].total += t.amount || 0
    }
  }

  const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.total - a.total)

  // Recent transactions
  const recent = await payload.find({
    collection: 'transactions' as any,
    where: { user: { equals: user.id } },
    sort: '-date',
    limit: 5,
    depth: 1,
  })

  return Response.json({
    totalIncome,
    totalExpense,
    balance,
    categoryBreakdown,
    recentTransactions: recent.docs,
    period: { from: startDate, to: endDate },
  })
}
