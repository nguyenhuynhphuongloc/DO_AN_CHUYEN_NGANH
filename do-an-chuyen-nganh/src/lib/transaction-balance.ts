import type { Payload } from 'payload'

type TransactionLike = {
  type?: 'income' | 'expense' | null
  amount?: number | null
  wallet?: unknown
}

export const getRelationId = (value: unknown): number | string | undefined => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: number | string }).id
    if (typeof id === 'number' || typeof id === 'string') return id
  }
  return undefined
}

export const getTransactionBalanceEffect = (transaction: TransactionLike): number => {
  const amount = Number(transaction.amount || 0)
  if (transaction.type === 'income') return amount
  if (transaction.type === 'expense') return -amount
  return 0
}

export const applyWalletBalanceDelta = async (payload: Payload, walletId: number | string | undefined, delta: number) => {
  if (!walletId || delta === 0) return

  const wallet = await payload.findByID({
    collection: 'wallets' as any,
    id: walletId,
    depth: 0,
    overrideAccess: true,
  })

  await payload.update({
    collection: 'wallets' as any,
    id: walletId,
    data: {
      balance: Number((wallet as any).balance || 0) + delta,
    },
    overrideAccess: true,
  })
}

export const applyTransactionCreateBalance = async (payload: Payload, transaction: TransactionLike) => {
  await applyWalletBalanceDelta(payload, getRelationId(transaction.wallet), getTransactionBalanceEffect(transaction))
}

export const applyTransactionUpdateBalance = async (
  payload: Payload,
  previousTransaction: TransactionLike,
  nextTransaction: TransactionLike,
) => {
  const previousWalletId = getRelationId(previousTransaction.wallet)
  const nextWalletId = getRelationId(nextTransaction.wallet)
  const previousEffect = getTransactionBalanceEffect(previousTransaction)
  const nextEffect = getTransactionBalanceEffect(nextTransaction)

  if (String(previousWalletId) === String(nextWalletId)) {
    await applyWalletBalanceDelta(payload, nextWalletId, nextEffect - previousEffect)
    return
  }

  await applyWalletBalanceDelta(payload, previousWalletId, -previousEffect)
  await applyWalletBalanceDelta(payload, nextWalletId, nextEffect)
}

export const applyTransactionDeleteBalance = async (payload: Payload, transaction: TransactionLike) => {
  await applyWalletBalanceDelta(payload, getRelationId(transaction.wallet), -getTransactionBalanceEffect(transaction))
}
