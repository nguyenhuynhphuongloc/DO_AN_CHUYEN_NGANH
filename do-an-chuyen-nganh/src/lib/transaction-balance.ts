import type { Payload, PayloadRequest } from 'payload'

import type { User, Wallet } from '@/payload-types'

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

type BalanceMutationOptions = {
  req?: PayloadRequest
  user?: User
}

const accessOptions = (options: BalanceMutationOptions) => {
  if (options.req) {
    return {
      req: options.req,
      overrideAccess: true,
    }
  }

  if (options.user) {
    return {
      user: options.user,
      overrideAccess: false,
    }
  }

  return {
    overrideAccess: true,
  }
}

export const applyWalletBalanceDelta = async (
  payload: Payload,
  walletId: number | string | undefined,
  delta: number,
  options: BalanceMutationOptions = {},
) => {
  if (!walletId || delta === 0) return

  const mutationAccess = accessOptions(options)
  const wallet = (await payload.findByID({
    collection: 'wallets' as any,
    id: walletId,
    depth: 0,
    ...mutationAccess,
  })) as Wallet

  await payload.update({
    collection: 'wallets' as any,
    id: walletId,
    data: {
      balance: Number(wallet.balance || 0) + delta,
    },
    ...mutationAccess,
  })
}

export const applyTransactionCreateBalance = async (
  payload: Payload,
  transaction: TransactionLike,
  options: BalanceMutationOptions = {},
) => {
  await applyWalletBalanceDelta(payload, getRelationId(transaction.wallet), getTransactionBalanceEffect(transaction), options)
}

export const applyTransactionUpdateBalance = async (
  payload: Payload,
  previousTransaction: TransactionLike,
  nextTransaction: TransactionLike,
  options: BalanceMutationOptions = {},
) => {
  const previousWalletId = getRelationId(previousTransaction.wallet)
  const nextWalletId = getRelationId(nextTransaction.wallet)
  const previousEffect = getTransactionBalanceEffect(previousTransaction)
  const nextEffect = getTransactionBalanceEffect(nextTransaction)

  if (String(previousWalletId) === String(nextWalletId)) {
    await applyWalletBalanceDelta(payload, nextWalletId, nextEffect - previousEffect, options)
    return
  }

  await applyWalletBalanceDelta(payload, previousWalletId, -previousEffect, options)
  await applyWalletBalanceDelta(payload, nextWalletId, nextEffect, options)
}

export const applyTransactionDeleteBalance = async (
  payload: Payload,
  transaction: TransactionLike,
  options: BalanceMutationOptions = {},
) => {
  await applyWalletBalanceDelta(payload, getRelationId(transaction.wallet), -getTransactionBalanceEffect(transaction), options)
}
