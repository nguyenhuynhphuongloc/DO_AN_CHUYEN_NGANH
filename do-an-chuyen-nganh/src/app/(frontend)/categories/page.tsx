import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import Sidebar from '@/components/Sidebar'
import CategoriesClient from '@/app/(frontend)/categories/CategoriesClient'
import { getWalletSetupState } from '@/lib/wallets'

export default async function CategoriesPage() {
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
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const defaultWallet = setupState.defaultWallet
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString()
  const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString()

  const [categories, budgets, transactions] = await Promise.all([
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
        type: true,
        icon: true,
        note: true,
        color: true,
        isDefault: true,
        user: true,
      },
      overrideAccess: false,
      user,
    }),
    defaultWallet
      ? payload.find({
          collection: 'budgets' as any,
          where: {
            and: [
              { user: { equals: user.id } },
              { wallet: { equals: defaultWallet.id } },
              { month: { equals: currentMonth } },
              { year: { equals: currentYear } },
              { isActive: { not_equals: false } },
            ],
          },
          limit: 1000,
          depth: 0,
          select: {
            id: true,
            category: true,
            wallet: true,
            amount: true,
            month: true,
            year: true,
            isActive: true,
          },
          overrideAccess: true,
        })
      : Promise.resolve({ docs: [] }),
    defaultWallet
      ? payload.find({
          collection: 'transactions' as any,
          where: {
            and: [
              { user: { equals: user.id } },
              { wallet: { equals: defaultWallet.id } },
              { type: { equals: 'expense' } },
              { date: { greater_than_equal: startOfMonth } },
              { date: { less_than_equal: endOfMonth } },
            ],
          },
          limit: 1000,
          depth: 0,
          select: {
            id: true,
            category: true,
            amount: true,
          },
          overrideAccess: true,
        })
      : Promise.resolve({ docs: [] }),
  ])

  const spentByCategory = (transactions.docs as any[]).reduce<Record<string, number>>((result, transaction) => {
    const categoryId = typeof transaction.category === 'object' ? transaction.category?.id : transaction.category
    if (categoryId) {
      result[String(categoryId)] = (result[String(categoryId)] || 0) + Number(transaction.amount || 0)
    }
    return result
  }, {})

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        <div className="page-container">
          <CategoriesClient
            initialCategories={JSON.parse(JSON.stringify(categories.docs))}
            initialBudgets={JSON.parse(JSON.stringify(budgets.docs))}
            wallets={JSON.parse(JSON.stringify(setupState.wallets))}
            defaultWalletId={defaultWallet?.id ?? null}
            monthlySpendingLimit={defaultWallet?.monthlySpendingLimit ?? 0}
            spentByCategory={spentByCategory}
            currentMonth={currentMonth}
            currentYear={currentYear}
          />
        </div>
      </main>
    </div>
  )
}
