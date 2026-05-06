import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Transactions } from '@/collections/Transactions'

const mockHeaders = vi.fn()
const mockGetPayload = vi.fn()

vi.mock('next/headers.js', () => ({
  headers: mockHeaders,
}))

vi.mock('payload', () => ({
  getPayload: mockGetPayload,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

const runTransactionBeforeValidate = async (args: Record<string, unknown>) => {
  const hook = Transactions.hooks?.beforeValidate?.[0]
  if (!hook) throw new Error('transactions beforeValidate hook not found')
  return hook(args as any)
}

describe('transactions API and validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    mockHeaders.mockResolvedValue(new Headers())
  })

  it('creates a transaction and applies its balance effect to the wallet', async () => {
    const mockPayload = {
      auth: vi.fn().mockResolvedValue({ user: { id: 5, role: 'user' } }),
      create: vi.fn().mockResolvedValue({
        id: 21,
        type: 'expense',
        amount: 120000,
        wallet: 2,
      }),
      findByID: vi.fn().mockResolvedValue({
        id: 2,
        balance: 1000000,
      }),
      update: vi.fn().mockResolvedValue({ id: 2, balance: 880000 }),
    }
    mockGetPayload.mockResolvedValue(mockPayload)

    const { POST } = await import('@/app/api/transactions/route')
    const response = await POST(
      new Request('http://localhost/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'expense',
          amount: 120000,
          wallet: 2,
          category: 7,
          date: '2026-05-01T00:00:00.000Z',
        }),
      }),
    )

    expect(response.status).toBe(200)
    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'transactions',
        data: expect.objectContaining({
          type: 'expense',
          amount: 120000,
          wallet: 2,
          category: 7,
          sourceType: 'manual',
        }),
        overrideAccess: false,
      }),
    )
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'wallets',
        id: 2,
        data: {
          balance: 880000,
        },
        overrideAccess: true,
      }),
    )
  })

  it('updates wallet balance by the edit delta for the same wallet', async () => {
    const mockPayload = {
      auth: vi.fn().mockResolvedValue({ user: { id: 5, role: 'user' } }),
      findByID: vi
        .fn()
        .mockResolvedValueOnce({
          id: 21,
          type: 'expense',
          amount: 100000,
          wallet: 2,
        })
        .mockResolvedValueOnce({
          id: 2,
          balance: 900000,
        }),
      update: vi
        .fn()
        .mockResolvedValueOnce({
          id: 21,
          type: 'expense',
          amount: 150000,
          wallet: 2,
        })
        .mockResolvedValueOnce({ id: 2, balance: 850000 }),
    }
    mockGetPayload.mockResolvedValue(mockPayload)

    const { PATCH } = await import('@/app/api/transactions/[id]/route')
    const response = await PATCH(
      new Request('http://localhost/api/transactions/21', {
        method: 'PATCH',
        body: JSON.stringify({
          type: 'expense',
          amount: 150000,
          wallet: 2,
          category: 7,
          date: '2026-05-01T00:00:00.000Z',
        }),
      }),
      { params: Promise.resolve({ id: '21' }) },
    )

    expect(response.status).toBe(200)
    expect(mockPayload.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        collection: 'wallets',
        id: 2,
        data: {
          balance: 850000,
        },
      }),
    )
  })

  it('reverts wallet balance when a transaction is deleted', async () => {
    const mockPayload = {
      auth: vi.fn().mockResolvedValue({ user: { id: 5, role: 'user' } }),
      findByID: vi
        .fn()
        .mockResolvedValueOnce({
          id: 21,
          type: 'expense',
          amount: 100000,
          wallet: 2,
        })
        .mockResolvedValueOnce({
          id: 2,
          balance: 900000,
        }),
      delete: vi.fn().mockResolvedValue({ id: 21 }),
      update: vi.fn().mockResolvedValue({ id: 2, balance: 1000000 }),
    }
    mockGetPayload.mockResolvedValue(mockPayload)

    const { DELETE } = await import('@/app/api/transactions/[id]/route')
    const response = await DELETE(new Request('http://localhost/api/transactions/21'), {
      params: Promise.resolve({ id: '21' }),
    })

    expect(response.status).toBe(200)
    expect(mockPayload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'wallets',
        id: 2,
        data: {
          balance: 1000000,
        },
      }),
    )
  })

  it('rejects another user wallet in transaction hook', async () => {
    await expect(
      runTransactionBeforeValidate({
        operation: 'create',
        data: {
          user: 5,
          wallet: 2,
          category: 7,
          type: 'expense',
        },
        req: {
          user: { id: 5, role: 'user' },
          payload: {
            findByID: vi
              .fn()
              .mockResolvedValueOnce({ id: 2, user: 9 })
              .mockResolvedValueOnce({ id: 7, type: 'expense', isDefault: true }),
          },
        },
      }),
    ).rejects.toThrow('Vi khong thuoc nguoi dung hien tai.')
  })

  it('rejects a category that does not match transaction type', async () => {
    await expect(
      runTransactionBeforeValidate({
        operation: 'create',
        data: {
          user: 5,
          wallet: 2,
          category: 7,
          type: 'expense',
        },
        req: {
          user: { id: 5, role: 'user' },
          payload: {
            findByID: vi
              .fn()
              .mockResolvedValueOnce({ id: 2, user: 5 })
              .mockResolvedValueOnce({ id: 7, type: 'income', isDefault: true }),
          },
        },
      }),
    ).rejects.toThrow('Loai danh muc khong khop voi loai giao dich.')
  })
})
