import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import Sidebar from '@/components/Sidebar'
import TransactionsClient from './TransactionsClient'

export default async function TransactionsPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  const transactions = await payload.find({
    collection: 'transactions' as any,
    where: { user: { equals: user.id } },
    sort: '-date',
    limit: 20,
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
          />
        </div>
      </main>
    </div>
  )
}
