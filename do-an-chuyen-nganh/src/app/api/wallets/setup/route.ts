import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { createInitialWallets } from '@/lib/wallets'

export async function POST(request: Request) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const result = await createInitialWallets(payload, user, body)

    return Response.json({
      defaultWallet: result.defaultWallet,
      savingsWallet: result.savingsWallet ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể thiết lập ví.'
    return Response.json({ error: message }, { status: 400 })
  }
}
