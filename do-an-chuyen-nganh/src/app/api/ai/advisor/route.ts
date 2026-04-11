import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers.js'
import { NextRequest } from 'next/server'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { text } = await request.json()

    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString()
    const endDate = now.toISOString()

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

    const docs = transactions.docs as any[]
    
    const monthlyStats: Record<string, { income: number; expense: number }> = {}
    
    docs.forEach(t => {
      const date = new Date(t.date)
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { income: 0, expense: 0 }
      }
      if (t.type === 'income') {
        monthlyStats[monthKey].income += t.amount || 0
      } else {
        monthlyStats[monthKey].expense += t.amount || 0
      }
    })

    const totalIncome = docs.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0)
    const totalExpense = docs.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0)
    const balance = totalIncome - totalExpense

    const categoryMap: Record<string, { name: string; total: number; type: string }> = {}
    for (const t of docs) {
      if (t.type === 'expense') {
        const cat = t.category as { id: string; name: string } | null
        if (cat && typeof cat === 'object') {
          const key = cat.id
          if (!categoryMap[key]) {
            categoryMap[key] = { name: cat.name, total: 0, type: t.type }
          }
          categoryMap[key].total += t.amount || 0
        }
      }
    }
    const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.total - a.total).slice(0, 5)

    const financialContext = {
      totalIncome,
      totalExpense,
      balance,
      categoryBreakdown,
      monthlyStats,
      period: "3 tháng gần nhất"
    }

    const response = await fetch(`${AI_SERVICE_URL}/api/ai/advisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        context: financialContext,
      }),
    })

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error('Advisor API error:', error)
    return Response.json({ error: 'Failed to get financial advice' }, { status: 500 })
  }
}
