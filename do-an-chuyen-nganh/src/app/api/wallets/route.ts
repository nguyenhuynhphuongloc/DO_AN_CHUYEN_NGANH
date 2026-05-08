import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@payload-config'
import { applyWalletBalanceDelta } from '@/lib/transaction-balance'
import { assertOwnedWallet, getPrimaryWallet, listUserWallets } from '@/lib/wallets'
import { transferBetweenWallets } from '@/lib/wallet-balance-service'

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0
  const parsed = Number(value.replace(/[^\d-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export async function POST(request: Request) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const action = body.action || 'create-savings'

  try {
    if (action === 'deposit') {
      const walletId = Number(body.wallet || body.walletId)
      const amount = toNumber(body.amount)
      if (!walletId || amount <= 0) {
        return Response.json({ error: 'Ví và số tiền nạp là bắt buộc.' }, { status: 400 })
      }

      const wallet = await assertOwnedWallet(payload, user, walletId)

      await applyWalletBalanceDelta(payload, wallet.id, amount, { user })

      return Response.json({ ok: true, source: 'external_bank', walletId: wallet.id, amount })
    }

    if (action === 'transfer') {
      const sourceWalletId = Number(body.sourceWallet || body.sourceWalletId)
      const destinationWalletId = Number(body.destinationWallet || body.destinationWalletId)
      const amount = toNumber(body.amount)

      if (!sourceWalletId || !destinationWalletId || amount <= 0) {
        return Response.json({ error: 'Ví nguồn, ví đích và số tiền là bắt buộc.' }, { status: 400 })
      }

      const result = await transferBetweenWallets({
        payload,
        user,
        sourceWalletId,
        destinationWalletId,
        amount,
      })

      return Response.json({
        ok: true,
        sourceWalletId: result.sourceWallet.id,
        destinationWalletId: result.destinationWallet.id,
        amount,
      })
    }

    if (action === 'list-wallets') {
      const wallets = await listUserWallets(payload, user.id)
      return Response.json({ wallets })
    }

    const primaryWallet = await getPrimaryWallet(payload, user.id)
    const wallet = await payload.create({
      collection: 'wallets' as any,
      data: {
        user: user.id,
        name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'Ví tiết kiệm',
        walletType: 'savings',
        currency: primaryWallet?.currency || 'VND',
        balance: Math.max(toNumber(body.balance), 0),
        isDefault: false,
        isActive: true,
      },
      user,
      overrideAccess: false,
    })

    return Response.json({ wallet })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể cập nhật ví.'
    return Response.json({ error: message }, { status: 400 })
  }
}
