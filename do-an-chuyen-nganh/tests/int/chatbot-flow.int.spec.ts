import { beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('chatbot flow API safeguards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    mockHeaders.mockResolvedValue(new Headers())
  })

  it('saves chatbot transactions with sourceType chatbot and the selected wallet', async () => {
    const mockPayload = {
      auth: vi.fn().mockResolvedValue({ user: { id: 5, role: 'user' } }),
      create: vi.fn().mockResolvedValue({
        id: 44,
        type: 'expense',
        amount: 50000,
        wallet: 2,
        sourceType: 'chatbot',
      }),
      findByID: vi.fn().mockResolvedValue({
        id: 2,
        balance: 500000,
      }),
      update: vi.fn().mockResolvedValue({ id: 2, balance: 450000 }),
    }
    mockGetPayload.mockResolvedValue(mockPayload)

    const { POST } = await import('@/app/api/transactions/route')
    const response = await POST(
      new Request('http://localhost/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'expense',
          amount: 50000,
          wallet: 2,
          category: 7,
          sourceType: 'chatbot',
          date: '2026-05-05T00:00:00.000Z',
        }),
      }),
    )

    expect(response.status).toBe(200)
    expect(mockPayload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'transactions',
        data: expect.objectContaining({
          wallet: 2,
          category: 7,
          sourceType: 'chatbot',
        }),
        overrideAccess: false,
      }),
    )
  })

  it('requires authentication for AI proxy parse requests', async () => {
    mockGetPayload.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({ user: null }),
    })

    const { POST } = await import('@/app/api/ai/[...path]/route')
    const response = await POST(new Request('http://localhost/api/ai/nlp/parse') as any, {
      params: Promise.resolve({ path: ['nlp', 'parse'] }),
    })

    expect(response.status).toBe(401)
  })

  it('does not expose removed learning endpoint through the AI proxy', async () => {
    const { POST } = await import('@/app/api/ai/[...path]/route')
    const response = await POST(new Request('http://localhost/api/ai/learn') as any, {
      params: Promise.resolve({ path: ['learn'] }),
    })

    expect(response.status).toBe(404)
  })
})
