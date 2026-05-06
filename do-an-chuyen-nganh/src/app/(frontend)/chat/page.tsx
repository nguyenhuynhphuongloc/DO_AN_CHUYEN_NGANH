import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers.js'
import ChatClient from './ChatClient'
import { getWalletSetupState } from '@/lib/wallets'
import { redirect } from 'next/navigation'

export default async function ChatPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  let initialCategories: any[] = []
  let wallets: any[] = []
  let defaultWalletId: number | null = null
  
  if (user) {
    const setupState = await getWalletSetupState(payload, user.id)
    if (setupState.needsSetup) {
      redirect('/setup')
    }
    wallets = setupState.wallets
    defaultWalletId = setupState.defaultWallet?.id ?? null

    // Lấy danh sách danh mục (mặc định + của người dùng) ngay tại server
    const categoriesData = await payload.find({
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
      },
      overrideAccess: true,
    })
    initialCategories = categoriesData.docs
  }

  return <ChatClient user={user} initialCategories={initialCategories} wallets={wallets} defaultWalletId={defaultWalletId} />
}
