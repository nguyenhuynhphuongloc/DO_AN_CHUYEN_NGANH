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

describe('receipt OCR confirm route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a safe 500 response and cleans up uploaded media when transaction creation fails', async () => {
    const mockPayload = {
      auth: vi.fn().mockResolvedValue({
        user: { id: 7, currency: 'VND' },
      }),
      find: vi.fn().mockResolvedValue({
        docs: [{ id: 9, type: 'expense' }],
      }),
      create: vi
        .fn()
        .mockResolvedValueOnce({ id: 321 })
        .mockRejectedValueOnce(new Error('transaction create failed')),
      delete: vi.fn().mockResolvedValue({}),
    }

    mockHeaders.mockResolvedValue(new Headers())
    mockGetPayload.mockResolvedValue(mockPayload)

    const { POST } = await import('@/app/api/ai/ocr/receipt/confirm/route')

    const formData = new FormData()
    const file = new File(['receipt-image'], 'receipt.png', { type: 'image/png' })
    Object.defineProperty(file, 'arrayBuffer', {
      value: async () => new TextEncoder().encode('receipt-image').buffer,
    })
    formData.append('file', file)
    formData.append(
      'payload',
      JSON.stringify({
        transaction_type: 'expense',
        source_type: 'receipt_ai',
        review_fields: {
          merchant_name: 'Circle K',
          transaction_date: '2026-04-28',
          total_amount: 100000,
          currency: 'VND',
          category_id: '9',
          description: 'Chi tai Circle K so tien 100.000 VND',
          user_note: 'test note',
        },
      }),
    )

    const response = await POST({
      formData: async () => formData,
    } as Request)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: 'Có lỗi xảy ra trong quá trình lưu giao dịch.',
      errors: [
        {
          code: 'CONFIRM_FAILED',
          message: 'Có lỗi xảy ra trong quá trình lưu giao dịch.',
        },
      ],
    })
    expect(mockPayload.create).toHaveBeenCalledTimes(2)
    expect(mockPayload.delete).toHaveBeenCalledWith({
      collection: 'media',
      id: 321,
      user: { id: 7, currency: 'VND' },
    })
  })
})
