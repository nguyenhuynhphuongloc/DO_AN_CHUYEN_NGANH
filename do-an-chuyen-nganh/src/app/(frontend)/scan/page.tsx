import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'
import Sidebar from '@/components/Sidebar'
import { getWalletSetupState } from '@/lib/wallets'

import ScanClient from './ScanClient'

export default async function ScanPage() {
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

  const categories = await payload.find({
    collection: 'categories' as any,
    where: {
      or: [{ isDefault: { equals: true } }, { user: { equals: user.id } }],
    },
    limit: 200,
    depth: 0,
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
      type: true,
    },
    user,
    overrideAccess: false,
  })

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        <div className="page-container">
          <ScanClient
            user={{
              email: user.email,
              name: user.name,
              currency: user.currency || 'VND',
            }}
            categories={JSON.parse(JSON.stringify(categories.docs))}
          />
        </div>
      </main>
    </div>
  )
}
