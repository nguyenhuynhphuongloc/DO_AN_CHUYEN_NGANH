import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import SetupClient from '@/app/(frontend)/setup/SetupClient'
import { getWalletSetupState } from '@/lib/wallets'
import config from '@/payload.config'

export default async function WalletSetupPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  const setupState = await getWalletSetupState(payload, user.id)
  if (!setupState.needsSetup) {
    redirect('/')
  }

  return (
    <SetupClient
      initialName={setupState.defaultWallet?.name ?? undefined}
      initialCurrency={setupState.defaultWallet?.currency ?? undefined}
      initialBalance={setupState.defaultWallet?.balance ?? undefined}
      initialMonthlySpendingLimit={setupState.defaultWallet?.monthlySpendingLimit ?? undefined}
    />
  )
}
