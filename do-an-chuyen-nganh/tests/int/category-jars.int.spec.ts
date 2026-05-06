import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Categories } from '@/collections/Categories'

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

describe('category jars', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders.mockResolvedValue(new Headers())
  })

  it('shows normal users only system categories and their private categories', async () => {
    const result = await Categories.access?.read?.({
      req: {
        user: { id: 9, role: 'user' },
      },
    } as any)

    expect(result).toEqual({
      or: [{ isDefault: { equals: true } }, { user: { equals: 9 } }],
    })
  })

  it('rejects category jar allocations that exceed the wallet monthly limit', async () => {
    const mockPayload = {
      auth: vi.fn().mockResolvedValue({ user: { id: 5, role: 'user' } }),
      findByID: vi
        .fn()
        .mockResolvedValueOnce({
          id: 2,
          user: 5,
          walletType: 'main',
          monthlySpendingLimit: 1000000,
        })
        .mockResolvedValueOnce({
          id: 7,
          type: 'expense',
          isDefault: true,
        }),
      find: vi
        .fn()
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({
          docs: [{ id: 11, amount: 700000 }],
        }),
      create: vi.fn(),
    }

    mockGetPayload.mockResolvedValue(mockPayload)
    const { POST } = await import('@/app/api/budgets/route')
    const response = await POST(
      new Request('http://localhost/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          walletId: 2,
          categoryId: 7,
          amount: 400000,
          month: 5,
          year: 2026,
        }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Tổng hạn mức danh mục vượt mức chi tiêu tháng của ví.',
      allocatedAmount: 700000,
      monthlyLimit: 1000000,
    })
    expect(mockPayload.create).not.toHaveBeenCalled()
  })

  it('creates a monthly category jar for an allowed expense category', async () => {
    const mockPayload = {
      auth: vi.fn().mockResolvedValue({ user: { id: 5, role: 'user' } }),
      findByID: vi
        .fn()
        .mockResolvedValueOnce({
          id: 2,
          user: 5,
          walletType: 'main',
          monthlySpendingLimit: 1000000,
        })
        .mockResolvedValueOnce({
          id: 7,
          type: 'expense',
          isDefault: true,
        }),
      find: vi.fn().mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({ docs: [] }),
      create: vi.fn().mockResolvedValue({ id: 21, amount: 300000 }),
    }

    mockGetPayload.mockResolvedValue(mockPayload)
    const { POST } = await import('@/app/api/budgets/route')
    const response = await POST(
      new Request('http://localhost/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          walletId: 2,
          categoryId: 7,
          amount: 300000,
          month: 5,
          year: 2026,
        }),
      }),
    )

    expect(response.status).toBe(200)
    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'budgets',
        data: expect.objectContaining({
          user: 5,
          wallet: 2,
          category: 7,
          amount: 300000,
          period: 'monthly',
          month: 5,
          year: 2026,
          isActive: true,
        }),
        overrideAccess: false,
      }),
    )
  })

  it('persists a notification when a category jar is already above the warning threshold', async () => {
    const mockPayload = {
      auth: vi.fn().mockResolvedValue({ user: { id: 5, role: 'user' } }),
      findByID: vi
        .fn()
        .mockResolvedValueOnce({
          id: 2,
          user: 5,
          walletType: 'main',
          monthlySpendingLimit: 2000000,
        })
        .mockResolvedValueOnce({
          id: 7,
          name: 'Ăn uống',
          type: 'expense',
          isDefault: true,
        }),
      find: vi
        .fn()
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [{ id: 91, amount: 850000 }] }),
      create: vi.fn().mockResolvedValueOnce({ id: 21, amount: 1000000 }).mockResolvedValueOnce({ id: 31 }),
    }

    mockGetPayload.mockResolvedValue(mockPayload)
    const { POST } = await import('@/app/api/budgets/route')
    const response = await POST(
      new Request('http://localhost/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          walletId: 2,
          categoryId: 7,
          amount: 1000000,
          month: 5,
          year: 2026,
        }),
      }),
    )

    expect(response.status).toBe(200)
    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'notifications',
        data: expect.objectContaining({
          recipient: 5,
          type: 'system',
          read: false,
          link: '/categories',
          message: 'Hũ Ăn uống đã dùng 85% hạn mức tháng.',
        }),
        overrideAccess: true,
      }),
    )
  })
})
