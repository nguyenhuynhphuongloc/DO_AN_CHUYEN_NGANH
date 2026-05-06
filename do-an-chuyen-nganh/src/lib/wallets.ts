import type { Payload } from 'payload'

import type { User, Wallet } from '@/payload-types'

export type WalletSetupInput = {
  name?: unknown
  currency?: unknown
  balance?: unknown
  monthlySpendingLimit?: unknown
  createSavingsWallet?: unknown
  savingsName?: unknown
  savingsBalance?: unknown
}

export type NormalizedWalletSetupInput = {
  name: string
  currency: string
  balance: number
  monthlySpendingLimit: number
  createSavingsWallet: boolean
  savingsName: string
  savingsBalance: number
}

const DEFAULT_CURRENCY = 'VND'
const DEFAULT_WALLET_NAME = 'Ví chi tiêu'
const DEFAULT_SAVINGS_WALLET_NAME = 'Ví tiết kiệm'

export const getUserId = (user: number | User): number => {
  return typeof user === 'number' ? user : user.id
}

export const normalizeMoneyValue = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0

  const normalized = value.replace(/[^\d-]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export const normalizeWalletSetupInput = (input: WalletSetupInput): NormalizedWalletSetupInput => {
  const name = typeof input.name === 'string' && input.name.trim() ? input.name.trim() : DEFAULT_WALLET_NAME
  const currency =
    typeof input.currency === 'string' && input.currency.trim()
      ? input.currency.trim().toUpperCase()
      : DEFAULT_CURRENCY
  const balance = normalizeMoneyValue(input.balance)
  const monthlySpendingLimit = normalizeMoneyValue(input.monthlySpendingLimit)
  const createSavingsWallet = Boolean(input.createSavingsWallet)
  const savingsName =
    typeof input.savingsName === 'string' && input.savingsName.trim()
      ? input.savingsName.trim()
      : DEFAULT_SAVINGS_WALLET_NAME
  const savingsBalance = createSavingsWallet
    ? Math.max(normalizeMoneyValue(input.savingsBalance), Math.max(balance - monthlySpendingLimit, 0))
    : 0
  const spendingWalletBalance = createSavingsWallet && balance > monthlySpendingLimit ? monthlySpendingLimit : balance

  if (balance < 0) {
    throw new Error('Số dư ví không được nhỏ hơn 0.')
  }

  if (monthlySpendingLimit <= 0) {
    throw new Error('Mức chi tiêu tháng phải lớn hơn 0.')
  }

  if (savingsBalance < 0) {
    throw new Error('Số dư tiết kiệm không được nhỏ hơn 0.')
  }

  return {
    name,
    currency,
    balance: spendingWalletBalance,
    monthlySpendingLimit,
    createSavingsWallet,
    savingsName,
    savingsBalance,
  }
}

export const listUserWallets = async (payload: Payload, userId: number): Promise<Wallet[]> => {
  const wallets = await payload.find({
    collection: 'wallets',
    where: {
      and: [{ user: { equals: userId } }, { isActive: { not_equals: false } }],
    },
    depth: 0,
    sort: '-isDefault,name',
    limit: 100,
    overrideAccess: true,
  })

  return wallets.docs as Wallet[]
}

export const getDefaultWallet = async (payload: Payload, userId: number): Promise<Wallet | null> => {
  const wallets = await payload.find({
    collection: 'wallets',
    where: {
      and: [
        { user: { equals: userId } },
        { isDefault: { equals: true } },
        { isActive: { not_equals: false } },
      ],
    },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })

  return (wallets.docs[0] as Wallet | undefined) ?? null
}

export const getWalletSetupState = async (payload: Payload, userId: number) => {
  const wallets = await listUserWallets(payload, userId)
  const defaultWallet = wallets.find((wallet) => wallet.isDefault) ?? null
  const savingsWallets = wallets.filter((wallet) => wallet.walletType === 'savings')
  const needsDefaultWallet = !defaultWallet
  const needsMonthlySpendingLimit = !defaultWallet?.monthlySpendingLimit || defaultWallet.monthlySpendingLimit <= 0

  return {
    defaultWallet,
    wallets,
    savingsWallets,
    needsDefaultWallet,
    needsMonthlySpendingLimit,
    needsSetup: needsDefaultWallet || needsMonthlySpendingLimit,
  }
}

export const createInitialWallets = async (
  payload: Payload,
  user: User,
  rawInput: WalletSetupInput,
): Promise<{ defaultWallet: Wallet; savingsWallet?: Wallet }> => {
  const input = normalizeWalletSetupInput(rawInput)
  const userId = getUserId(user)
  const existingDefault = await getDefaultWallet(payload, userId)

  await payload.update({
    collection: 'wallets',
    where: {
      and: [{ user: { equals: userId } }, { isDefault: { equals: true } }],
    },
    data: {
      isDefault: false,
    },
    overrideAccess: true,
  })

  const defaultWallet = existingDefault
    ? await payload.update({
        collection: 'wallets',
        id: existingDefault.id,
        data: {
          name: input.name,
          currency: input.currency,
          balance: input.balance,
          monthlySpendingLimit: input.monthlySpendingLimit,
          walletType: existingDefault.walletType === 'savings' ? 'main' : existingDefault.walletType,
          isDefault: true,
          isActive: true,
        },
        user,
        overrideAccess: false,
      })
    : await payload.create({
        collection: 'wallets',
        data: {
          user: userId,
          name: input.name,
          walletType: 'main',
          currency: input.currency,
          balance: input.balance,
          monthlySpendingLimit: input.monthlySpendingLimit,
          isDefault: true,
          isActive: true,
        },
        user,
        overrideAccess: false,
      })

  let savingsWallet: Wallet | undefined
  if (input.createSavingsWallet) {
    savingsWallet = (await payload.create({
      collection: 'wallets',
      data: {
        user: userId,
        name: input.savingsName,
        walletType: 'savings',
        currency: input.currency,
        balance: input.savingsBalance,
        isDefault: false,
        isActive: true,
      },
      user,
      overrideAccess: false,
    })) as Wallet
  }

  return {
    defaultWallet: defaultWallet as Wallet,
    savingsWallet,
  }
}
