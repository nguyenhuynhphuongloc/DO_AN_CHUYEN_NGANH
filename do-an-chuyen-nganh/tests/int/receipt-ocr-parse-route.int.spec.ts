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

describe('receipt OCR parse route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('rejects non-image files before calling the OCR service', async () => {
    const mockPayload = {
      auth: vi.fn().mockResolvedValue({
        user: { id: 7, currency: 'VND' },
      }),
      find: vi.fn(),
    }
    const fetchSpy = vi.fn()

    mockHeaders.mockResolvedValue(new Headers())
    mockGetPayload.mockResolvedValue(mockPayload)
    vi.stubGlobal('fetch', fetchSpy)

    const { POST } = await import('@/app/api/ai/ocr/receipt/route')

    const formData = new FormData()
    formData.append('file', new File(['not an image'], 'IMG10.txt', { type: 'text/plain' }))

    const response = await POST({
      formData: async () => formData,
    } as Request)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      errors: [
        {
          code: 'INVALID_FILE_TYPE',
          message: 'File không hợp lệ. Vui lòng tải lên ảnh JPG, PNG hoặc WEBP.',
        },
      ],
    })
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(mockPayload.find).not.toHaveBeenCalled()
  })
})
