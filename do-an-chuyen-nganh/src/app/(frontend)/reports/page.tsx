import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import ReportsClient from '@/app/(frontend)/reports/ReportsClient'
import Sidebar from '@/components/Sidebar'
import { getFinanceStats } from '@/lib/finance-stats'
import { getWalletSetupState } from '@/lib/wallets'
import config from '@/payload.config'

export default async function ReportsPage() {
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

  const now = new Date()
  const stats = await getFinanceStats(payload, user.id, {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    chartMonths: 12,
    recentLimit: 10,
  })

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        <div className="page-container">
          <ReportsClient stats={JSON.parse(JSON.stringify(stats))} />
        </div>
      </main>
    </div>
  )
}
