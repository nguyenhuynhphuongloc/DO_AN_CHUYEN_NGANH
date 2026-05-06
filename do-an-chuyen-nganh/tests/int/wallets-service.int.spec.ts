import { describe, expect, it, vi } from 'vitest'

import { Wallets } from '@/collections/Wallets'
import { createInitialWallets, normalizeWalletSetupInput } from '@/lib/wallets'

describe('wallet setup and access', () => {
  it('restricts normal wallet reads to the owning user', async () => {
    const result = await Wallets.access?.read?.({
      req: {
        user: { id: 7, role: 'user' },
      },
    } as any)

    expect(result).toEqual({
      user: {
        equals: 7,
      },
    })
  })

  it('requires a positive monthly spending limit', () => {
    expect(() =>
      normalizeWalletSetupInput({
        name: 'Ví chính',
        balance: 1000000,
        monthlySpendingLimit: 0,
      }),
    ).toThrow('Mức chi tiêu tháng phải lớn hơn 0.')
  })

  it('normalizes initial wallet setup values', () => {
    const input = normalizeWalletSetupInput({
      name: '  Ví Techcombank  ',
      currency: 'vnd',
      balance: '2.500.000',
      monthlySpendingLimit: '7.000.000',
      createSavingsWallet: true,
      savingsName: '',
      savingsBalance: '1500000',
    })

    expect(input).toEqual({
      name: 'Ví Techcombank',
      currency: 'VND',
      balance: 2500000,
      monthlySpendingLimit: 7000000,
      createSavingsWallet: true,
      savingsName: 'Ví tiết kiệm',
      savingsBalance: 1500000,
    })
  })

  it('creates a default spending wallet and separate savings wallet', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
      update: vi.fn().mockResolvedValue({}),
      create: vi
        .fn()
        .mockResolvedValueOnce({
          id: 11,
          user: 3,
          name: 'Ví chính',
          walletType: 'main',
          balance: 2000000,
          monthlySpendingLimit: 8000000,
          isDefault: true,
        })
        .mockResolvedValueOnce({
          id: 12,
          user: 3,
          name: 'Ví tiết kiệm',
          walletType: 'savings',
          balance: 1000000,
          isDefault: false,
        }),
    }

    const result = await createInitialWallets(
      payload as any,
      { id: 3, email: 'user@example.com', role: 'user', createdAt: '', updatedAt: '' } as any,
      {
        name: 'Ví chính',
        currency: 'VND',
        balance: 2000000,
        monthlySpendingLimit: 8000000,
        createSavingsWallet: true,
        savingsBalance: 1000000,
      },
    )

    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'wallets',
        data: expect.objectContaining({
          user: 3,
          walletType: 'main',
          isDefault: true,
          monthlySpendingLimit: 8000000,
        }),
        overrideAccess: false,
      }),
    )
    expect(payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user: 3,
          walletType: 'savings',
          isDefault: false,
        }),
      }),
    )
    expect(result.defaultWallet.walletType).toBe('main')
    expect(result.savingsWallet?.walletType).toBe('savings')
  })

  it('splits money above the monthly limit into the savings wallet', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({ docs: [], totalDocs: 0 }),
      update: vi.fn().mockResolvedValue({}),
      create: vi
        .fn()
        .mockResolvedValueOnce({
          id: 11,
          user: 3,
          name: 'Ví chính',
          walletType: 'main',
          balance: 5000000,
          monthlySpendingLimit: 5000000,
          isDefault: true,
        })
        .mockResolvedValueOnce({
          id: 12,
          user: 3,
          name: 'Ví tiết kiệm',
          walletType: 'savings',
          balance: 5000000,
          isDefault: false,
        }),
    }

    await createInitialWallets(
      payload as any,
      { id: 3, email: 'user@example.com', role: 'user', createdAt: '', updatedAt: '' } as any,
      {
        name: 'Ví chính',
        currency: 'VND',
        balance: 10000000,
        monthlySpendingLimit: 5000000,
        createSavingsWallet: true,
      },
    )

    expect(payload.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          walletType: 'main',
          balance: 5000000,
          monthlySpendingLimit: 5000000,
        }),
      }),
    )
    expect(payload.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          walletType: 'savings',
          balance: 5000000,
        }),
      }),
    )
  })
})
