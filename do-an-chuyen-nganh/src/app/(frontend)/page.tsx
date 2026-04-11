import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import Sidebar from '@/components/Sidebar'
import DashboardClient from '@/app/(frontend)/DashboardClient'
import MonthFilter from '@/components/MonthFilter'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string; year?: string }> }) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  const { month, year } = await searchParams
  const now = new Date()
  const selectedMonth = month ? parseInt(month) : now.getMonth() + 1
  const selectedYear = year ? parseInt(year) : now.getFullYear()

  // Get stats for selected month
  const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1).toISOString()
  const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59).toISOString()

  const transactions = await payload.find({
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

  const totalIncome = (transactions.docs as any[])
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const totalExpense = (transactions.docs as any[])
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const balance = totalIncome - totalExpense

  // Category breakdown
  const categoryMap: Record<string, { name: string; icon: string; color: string; total: number }> = {}
  for (const t of (transactions.docs as any[])) {
    if (t.type === 'expense') {
      const cat = t.category as { id: string; name: string; icon: string; color: string } | null
      if (cat && typeof cat === 'object') {
        const key = cat.id
        if (!categoryMap[key]) {
          categoryMap[key] = { name: cat.name || '?', icon: cat.icon || '📦', color: cat.color || '#6366f1', total: 0 }
        }
        categoryMap[key].total += t.amount || 0
      }
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

  // Chart data (6 months up to selected month)
  const chartData: { month: string; income: number; expense: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(selectedYear, selectedMonth - 1 - i, 1)
    const sd = new Date(d.getFullYear(), d.getMonth(), 1)
    const ed = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

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

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        <div className="page-container">
          <div className="page-header" style={{ marginBottom: '24px' }}>
            <div>
              <h1 className="page-title">Xin chào, {user.name || user.email}!</h1>
              <p className="page-subtitle">Tổng quan tài chính của bạn</p>
            </div>
            <div style={{ marginTop: '16px' }}>
              <MonthFilter currentMonth={selectedMonth} currentYear={selectedYear} />
            </div>
          </div>

          <DashboardClient
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
            categoryBreakdown={categoryBreakdown}
            recentTransactions={JSON.parse(JSON.stringify(recent.docs))}
            chartData={chartData}
          />
        </div>
      </main>
    </div>
  )
}
