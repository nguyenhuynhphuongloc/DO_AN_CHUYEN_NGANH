import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import Sidebar from '@/components/Sidebar'
import TransactionsClient from './TransactionsClient'

export default async function TransactionsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ month?: string; year?: string }> 
}) {
  const params = await searchParams
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  const now = new Date()
  const month = params.month ? parseInt(params.month) : (now.getMonth() + 1)
  const year = params.year ? parseInt(params.year) : now.getFullYear()

  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

  const transactions = await payload.find({
    collection: 'transactions' as any,
    where: {
      and: [
        { user: { equals: user.id } },
        { date: { greater_than_equal: startDate } },
        { date: { less_than_equal: endDate } },
      ],
    },
    sort: '-date',
    limit: 100,
    depth: 1,
  })


  const categories = await payload.find({
    collection: 'categories' as any,
    where: {
      or: [
        { isDefault: { equals: true } },
        { user: { equals: user.id } },
      ],
    },
    limit: 100,
  })

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        <div className="page-container">
          <TransactionsClient
            initialTransactions={JSON.parse(JSON.stringify(transactions.docs))}
            totalDocs={transactions.totalDocs}
            categories={JSON.parse(JSON.stringify(categories.docs))}
            currentMonth={month}
            currentYear={year}
          />
        </div>
      </main>
    </div>
  )
}
