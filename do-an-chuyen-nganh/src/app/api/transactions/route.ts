import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@payload-config'
import { applyTransactionCreateBalance } from '@/lib/transaction-balance'
import {
  getExpenseShortfall,
  resolvePrimaryWalletOrThrow,
  transferSavingsToPrimary,
} from '@/lib/wallet-balance-service'
import { assertOrdinaryTransactionWallet, assertOwnedWallet } from '@/lib/wallets'

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
  const amount = toNumber(body.amount)
  const type = body.type === 'income' || body.type === 'expense' ? body.type : null
  const category = Number(body.category)
  const requestedWallet = body.wallet ? Number(body.wallet) : undefined

  if (!type || amount <= 0 || !category) {
    return Response.json({ error: 'Loại, số tiền và danh mục là bắt buộc.' }, { status: 400 })
  }

  try {
    const primaryWallet = await resolvePrimaryWalletOrThrow(payload, user)
    const sourceType = typeof body.sourceType === 'string' && body.sourceType.trim() ? body.sourceType : 'manual'
    const isSavingsGoalContribution = Boolean(body.savingsGoal)
    const isTransfer = sourceType === 'transfer'
    const wallet = requestedWallet || primaryWallet.id
    const paymentWallet =
      type === 'expense' && !isSavingsGoalContribution && !isTransfer
        ? await assertOrdinaryTransactionWallet(payload, user, wallet)
        : await assertOwnedWallet(payload, user, wallet)
    const walletBalance = Number(paymentWallet.balance || 0)
    const missingWalletAmount = type === 'expense' ? Math.max(amount - walletBalance, 0) : 0

    if (type === 'expense' && !isSavingsGoalContribution && !isTransfer) {
      const shortfall = await getExpenseShortfall(payload, user, amount, wallet)
      if (shortfall && !body.confirmSavingsTransfer && !body.allowNegativeBalance) {
        return Response.json(
          {
            error: 'Số dư ví không đủ.',
            code: 'PRIMARY_WALLET_SHORTFALL',
            missingAmount: shortfall.missingAmount,
            primaryWallet: shortfall.primaryWallet,
            eligibleSavingsWallets: shortfall.eligibleSavingsWallets,
          },
          { status: 409 },
        )
      }

      if (shortfall && body.confirmSavingsTransfer) {
        const savingsWalletId = body.savingsWallet || body.savingsWalletId
        if (!savingsWalletId) {
          return Response.json({ error: 'Vui lòng chọn ví tiết kiệm để bù số dư.' }, { status: 400 })
        }

        await transferSavingsToPrimary({
          payload,
          user,
          savingsWalletId: Number(savingsWalletId),
          amount: shortfall.missingAmount,
          targetWalletId: wallet,
        })
      }
    }

    const transaction = await payload.create({
      collection: 'transactions' as any,
      data: {
        type,
        amount,
        category,
        wallet,
        description: body.description || '',
        date: body.date || new Date().toISOString(),
        note: body.note || '',
        sourceType,
        savingsGoal: body.savingsGoal || undefined,
      },
      user,
      overrideAccess: false,
    })

    await applyTransactionCreateBalance(payload, transaction as any, { user })

    const nextWalletBalance = type === 'expense' ? walletBalance - amount : walletBalance

    return Response.json({
      transaction,
      warning:
        type === 'expense' && missingWalletAmount > 0 && !body.confirmSavingsTransfer && nextWalletBalance < 0
          ? 'Số dư ví đang âm. Vui lòng kiểm tra lại.'
          : undefined,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lưu giao dịch.'
    return Response.json({ error: message }, { status: 400 })
  }
}
