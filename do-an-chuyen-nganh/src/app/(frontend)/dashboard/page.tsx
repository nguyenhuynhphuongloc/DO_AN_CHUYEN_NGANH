import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import DashboardClient from '@/app/(frontend)/DashboardClient'
import MonthFilter from '@/components/MonthFilter'
import Sidebar from '@/components/Sidebar'
import { getFinanceStats } from '@/lib/finance-stats'
import { getWalletSetupState } from '@/lib/wallets'
import config from '@/payload.config'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  const walletSetupState = await getWalletSetupState(payload, user.id)
  if (walletSetupState.needsSetup) {
    redirect('/setup')
  }

  const { month, year } = await searchParams
  const now = new Date()
  const selectedMonth = month ? parseInt(month, 10) : now.getMonth() + 1
  const selectedYear = year ? parseInt(year, 10) : now.getFullYear()
  const stats = await getFinanceStats(payload, user.id, {
    month: selectedMonth,
    year: selectedYear,
    chartMonths: 6,
    recentLimit: 5,
  })

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        <div className="page-container">
          <div className="page-header" style={{ marginBottom: '24px' }}>
            <h1 className="page-title">Xin chào, {user.name || user.email}!</h1>
            <div style={{ marginTop: '16px' }}>
              <MonthFilter currentMonth={selectedMonth} currentYear={selectedYear} />
            </div>
          </div>

          <DashboardClient stats={JSON.parse(JSON.stringify(stats))} />
        </div>
      </main>
    </div>
  )
}
