import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import Sidebar from '@/components/Sidebar'
import ReportsClient from '@/app/(frontend)/reports/ReportsClient'

export default async function ReportsPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  const now = new Date()

  // Get data for last 12 months
  const chartData: { month: string; income: number; expense: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const sd = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const ed = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

    const monthTx = await payload.find({
      collection: 'transactions' as any,
      where: {
        and: [
          { user: { equals: user.id } },
          { date: { greater_than_equal: sd.toISOString() } },
          { date: { less_than_equal: ed.toISOString() } },
        ],
      },
      limit: 0,
    })

    const inc = (monthTx.docs as any[]).filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0)
    const exp = (monthTx.docs as any[]).filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0)

    chartData.push({
      month: `T${sd.getMonth() + 1}/${sd.getFullYear()}`,
      income: inc,
      expense: exp,
    })
  }

  // Category breakdown for current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const currentMonthTx = await payload.find({
    collection: 'transactions' as any,
    where: {
      and: [
        { user: { equals: user.id } },
        { date: { greater_than_equal: startOfMonth } },
        { date: { less_than_equal: endOfMonth } },
      ],
    },
    limit: 0,
    depth: 1,
  })

  const categoryMap: Record<string, { name: string; icon: string; color: string; income: number; expense: number }> = {}
  for (const t of (currentMonthTx.docs as any[])) {
    const cat = t.category as { id: string; name: string; icon: string; color: string } | null
    if (cat && typeof cat === 'object') {
      const key = cat.id
      if (!categoryMap[key]) {
        categoryMap[key] = { name: cat.name || '?', icon: cat.icon || '📦', color: cat.color || '#6366f1', income: 0, expense: 0 }
      }
      if (t.type === 'income') categoryMap[key].income += t.amount || 0
      else categoryMap[key].expense += t.amount || 0
    }
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        <div className="page-container">
          <ReportsClient
            chartData={chartData}
            categoryData={Object.values(categoryMap)}
          />
        </div>
      </main>
    </div>
  )
}
