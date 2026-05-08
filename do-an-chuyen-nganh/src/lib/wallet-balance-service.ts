import type { Payload } from 'payload'

import type { User, Wallet } from '@/payload-types'
import { applyWalletBalanceDelta } from '@/lib/transaction-balance'
import { assertOwnedWallet, getPrimaryWallet, getRelationId, listSavingsWallets } from '@/lib/wallets'

export type ShortfallSavingsWallet = {
  id: number
  name: string
  balance: number
}

export type ExpenseShortfall = {
  missingAmount: number
  primaryWallet: Wallet
  eligibleSavingsWallets: ShortfallSavingsWallet[]
}

export const resolvePrimaryWalletOrThrow = async (payload: Payload, user: User): Promise<Wallet> => {
  const primaryWallet = await getPrimaryWallet(payload, user.id)
  if (!primaryWallet) {
    throw new Error('Người dùng chưa có ví chính.')
  }

  return primaryWallet
}

export const getExpenseShortfall = async (
  payload: Payload,
  user: User,
  amount: number,
  walletId?: number | string,
): Promise<ExpenseShortfall | null> => {
  const primaryWallet = walletId ? await assertOwnedWallet(payload, user, walletId) : await resolvePrimaryWalletOrThrow(payload, user)
  const missingAmount = Math.max(amount - Number(primaryWallet.balance || 0), 0)
  if (missingAmount <= 0) return null

  const savingsWallets = await listSavingsWallets(payload, user.id)
  const eligibleSavingsWallets = savingsWallets
    .filter((wallet) => Number(wallet.balance || 0) >= missingAmount)
    .map((wallet) => ({
      id: wallet.id,
      name: wallet.name,
      balance: Number(wallet.balance || 0),
    }))

  if (eligibleSavingsWallets.length === 0) return null

  return {
    missingAmount,
    primaryWallet,
    eligibleSavingsWallets,
  }
}

export const transferSavingsToPrimary = async ({
  payload,
  user,
  savingsWalletId,
  amount,
  targetWalletId,
}: {
  payload: Payload
  user: User
  savingsWalletId: number | string
  amount: number
  targetWalletId?: number | string
}): Promise<{ primaryWallet: Wallet; savingsWallet: Wallet }> => {
  if (amount <= 0) {
    throw new Error('Số tiền chuyển phải lớn hơn 0.')
  }

  const primaryWallet = targetWalletId
    ? await assertOwnedWallet(payload, user, targetWalletId)
    : await resolvePrimaryWalletOrThrow(payload, user)
  const savingsWallet = await assertOwnedWallet(payload, user, savingsWalletId)

  if (savingsWallet.walletType !== 'savings') {
    throw new Error('Chỉ có thể rút từ ví tiết kiệm.')
  }

  if (Number(savingsWallet.balance || 0) < amount) {
    throw new Error('Số dư tiết kiệm không đủ để bù phần còn thiếu.')
  }

  await applyWalletBalanceDelta(payload, savingsWallet.id, -amount, { user })
  await applyWalletBalanceDelta(payload, primaryWallet.id, amount, { user })

  return {
    primaryWallet,
    savingsWallet,
  }
}

export const createSavingsGoalContribution = async ({
  payload,
  user,
  goalId,
  sourceWalletId,
  amount,
  date,
  description,
}: {
  payload: Payload
  user: User
  goalId: number | string
  sourceWalletId: number | string
  amount: number
  date?: string
  description?: string
}) => {
  if (amount <= 0) {
    throw new Error('Số tiền nạp phải lớn hơn 0.')
  }

  const [goal, sourceWallet] = await Promise.all([
    payload.findByID({
      collection: 'savings-goals' as any,
      id: goalId,
      depth: 0,
      user,
      overrideAccess: false,
    }),
    assertOwnedWallet(payload, user, sourceWalletId),
  ])

  const ownerId = getRelationId((goal as any).owner)
  const participantIds = Array.isArray((goal as any).participants)
    ? (goal as any).participants.map((participant: unknown) => String(getRelationId(participant)))
    : []
  const canAccessGoal = String(ownerId) === String(user.id) || participantIds.includes(String(user.id))

  if (!canAccessGoal) {
    throw new Error('Mục tiêu tiết kiệm không thuộc quyền truy cập của người dùng.')
  }

  if (Number(sourceWallet.balance || 0) < amount) {
    throw new Error('Số dư ví nạp không đủ.')
  }

  const currentAmountBefore = Number((goal as any).currentAmount || 0)
  const targetAmount = Number((goal as any).targetAmount || 0)

  const contribution = await payload.create({
    collection: 'savings-contributions' as any,
    data: {
      user: user.id,
      goal: Number(goalId),
      sourceWallet: sourceWallet.id,
      amount,
      movementType: 'contribution',
      date: date || new Date().toISOString(),
      description: description || `Nạp vào mục tiêu ${(goal as any).title || ''}`.trim(),
    },
    user,
    overrideAccess: false,
  })

  await applyWalletBalanceDelta(payload, sourceWallet.id, -amount, { user })

  const newCurrentAmount = currentAmountBefore + amount
  const wasNotComplete = currentAmountBefore < targetAmount
  const isNowComplete = newCurrentAmount >= targetAmount

  await payload.update({
    collection: 'savings-goals' as any,
    id: goalId,
    data: {
      currentAmount: newCurrentAmount,
      status: isNowComplete ? 'completed' : (goal as any).status,
    },
    user,
    overrideAccess: false,
  })

  if (wasNotComplete && isNowComplete) {
    await payload.create({
      collection: 'notifications' as any,
      data: {
        recipient: ownerId,
        message: `Chúc mừng! Mục tiêu "${(goal as any).title}" đã đạt được!`,
        type: 'completion',
        read: false,
        link: '/savings',
      },
      user,
      overrideAccess: false,
    })
  }

  return contribution
}

export const createSavingsGoalWithdrawal = async ({
  payload,
  user,
  goalId,
  destinationWalletId,
  amount,
  date,
  description,
}: {
  payload: Payload
  user: User
  goalId: number | string
  destinationWalletId: number | string
  amount: number
  date?: string
  description?: string
}) => {
  if (amount <= 0) {
    throw new Error('Số tiền rút phải lớn hơn 0.')
  }

  const [goal, destinationWallet] = await Promise.all([
    payload.findByID({
      collection: 'savings-goals' as any,
      id: goalId,
      depth: 0,
      user,
      overrideAccess: false,
    }),
    assertOwnedWallet(payload, user, destinationWalletId),
  ])

  const ownerId = getRelationId((goal as any).owner)
  const participantIds = Array.isArray((goal as any).participants)
    ? (goal as any).participants.map((participant: unknown) => String(getRelationId(participant)))
    : []
  const canAccessGoal = String(ownerId) === String(user.id) || participantIds.includes(String(user.id))

  if (!canAccessGoal) {
    throw new Error('Mục tiêu tiết kiệm không thuộc quyền truy cập của người dùng.')
  }

  const currentAmount = Number((goal as any).currentAmount || 0)
  if (currentAmount < amount) {
    throw new Error('Số tiền rút vượt quá số tiền hiện có trong mục tiêu.')
  }

  await payload.create({
    collection: 'savings-contributions' as any,
    data: {
      user: user.id,
      goal: Number(goalId),
      sourceWallet: destinationWalletId,
      amount,
      movementType: 'withdrawal',
      date: date || new Date().toISOString(),
      description: description || `Rút khỏi mục tiêu ${(goal as any).title || ''}`.trim(),
    },
    user,
    overrideAccess: false,
  })

  await applyWalletBalanceDelta(payload, destinationWallet.id, amount, { user })

  await payload.update({
    collection: 'savings-goals' as any,
    id: goalId,
    data: {
      currentAmount: currentAmount - amount,
      status: currentAmount - amount >= Number((goal as any).targetAmount || 0) ? 'completed' : 'active',
    },
    user,
    overrideAccess: false,
  })

  return { ok: true }
}

export const transferBetweenWallets = async ({
  payload,
  user,
  sourceWalletId,
  destinationWalletId,
  amount,
}: {
  payload: Payload
  user: User
  sourceWalletId: number | string
  destinationWalletId: number | string
  amount: number
}) => {
  if (amount <= 0) {
    throw new Error('Số tiền chuyển phải lớn hơn 0.')
  }

  if (String(sourceWalletId) === String(destinationWalletId)) {
    throw new Error('Ví nguồn và ví đích không được trùng nhau.')
  }

  const [sourceWallet, destinationWallet] = await Promise.all([
    assertOwnedWallet(payload, user, sourceWalletId),
    assertOwnedWallet(payload, user, destinationWalletId),
  ])

  if (Number(sourceWallet.balance || 0) < amount) {
    throw new Error('Số dư ví nguồn không đủ.')
  }

  await applyWalletBalanceDelta(payload, sourceWallet.id, -amount, { user })
  await applyWalletBalanceDelta(payload, destinationWallet.id, amount, { user })

  return { sourceWallet, destinationWallet }
}
