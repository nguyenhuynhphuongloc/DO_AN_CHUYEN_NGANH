import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import Sidebar from '@/components/Sidebar'
import TransactionsClient from './TransactionsClient'
import { getWalletSetupState } from '@/lib/wallets'

export default async function TransactionsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ month?: string; year?: string; wallet?: string; type?: string; category?: string; source?: string; search?: string }> 
}) {
  const params = await searchParams
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  const setupState = await getWalletSetupState(payload, user.id)
  if (setupState.needsSetup) {
    redirect('/setup')
  }

  const now = new Date()
  const month = params.month ? parseInt(params.month) : (now.getMonth() + 1)
  const year = params.year ? parseInt(params.year) : now.getFullYear()
  const selectedWallet = params.wallet || 'all'
  const selectedType = params.type || 'all'
  const selectedCategory = params.category || 'all'
  const selectedSource = params.source || 'all'
  const search = params.search || ''

  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

  const andConditions: any[] = [
    { user: { equals: user.id } },
    { date: { greater_than_equal: startDate } },
    { date: { less_than_equal: endDate } },
  ]

  if (selectedWallet !== 'all') andConditions.push({ wallet: { equals: Number(selectedWallet) } })
  if (selectedType !== 'all') andConditions.push({ type: { equals: selectedType } })
  if (selectedCategory !== 'all') andConditions.push({ category: { equals: Number(selectedCategory) } })
  if (selectedSource !== 'all') andConditions.push({ sourceType: { equals: selectedSource } })
  if (search.trim()) {
    andConditions.push({
      or: [
        { description: { contains: search.trim() } },
        { merchantName: { contains: search.trim() } },
        { note: { contains: search.trim() } },
      ],
    })
  }

  const [transactions, categories] = await Promise.all([
    payload.find({
      collection: 'transactions' as any,
      where: {
        and: andConditions,
      },
      sort: '-date',
      limit: 100,
      depth: 1,
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        date: true,
        note: true,
        category: true,
        wallet: true,
        sourceType: true,
        receipt: true,
        merchantName: true,
      },
      overrideAccess: true,
    }),
    payload.find({
      collection: 'categories' as any,
      where: {
        or: [
          { isDefault: { equals: true } },
          { user: { equals: user.id } },
        ],
      },
      limit: 100,
      depth: 0,
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
        type: true,
        isDefault: true,
        user: true,
      },
      overrideAccess: true,
    }),
  ])

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        <div className="page-container">
          <TransactionsClient
            initialTransactions={JSON.parse(JSON.stringify(transactions.docs))}
            totalDocs={transactions.totalDocs}
            categories={JSON.parse(JSON.stringify(categories.docs))}
            wallets={JSON.parse(JSON.stringify(setupState.wallets))}
            currentMonth={month}
            currentYear={year}
            filters={{
              wallet: selectedWallet,
              type: selectedType,
              category: selectedCategory,
              source: selectedSource,
              search,
            }}
          />
        </div>
      </main>
    </div>
  )
}
