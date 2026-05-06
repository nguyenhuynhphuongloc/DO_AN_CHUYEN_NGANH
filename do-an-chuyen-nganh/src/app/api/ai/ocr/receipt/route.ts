import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@payload-config'

import { buildAllowedExpenseCategories, type RawCategoryCandidate, type ReceiptOcrRequestMetadata } from '@/lib/receipt-ocr'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : ''
}

function isAllowedReceiptImage(file: File): boolean {
  const mimeType = (file.type || '').toLowerCase()
  const extension = getExtension(file.name || '')
  return ALLOWED_IMAGE_MIME_TYPES.has(mimeType) && ALLOWED_IMAGE_EXTENSIONS.has(extension)
}

function ocrFailure(code: string, message: string) {
  return {
    success: false,
    provider: 'veryfi',
    transaction_type: 'expense',
    source_type: 'receipt_ai',
    raw_text: null,
    review_fields: null,
    normalized_receipt: null,
    debug: null,
    errors: [{ code, message }],
  }
}

export async function POST(request: Request) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json(ocrFailure('UNAUTHORIZED', 'Vui lòng đăng nhập để quét hóa đơn.'), { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File) || file.size <= 0) {
      return Response.json(
        ocrFailure('INVALID_FILE', 'Vui lòng tải lên ảnh hóa đơn hợp lệ.'),
        { status: 400 },
      )
    }

    if (!isAllowedReceiptImage(file)) {
      return Response.json(
        ocrFailure('INVALID_FILE_TYPE', 'File không hợp lệ. Vui lòng tải lên ảnh JPG, PNG hoặc WEBP.'),
        { status: 400 },
      )
    }

    const categories = await payload.find({
      collection: 'categories' as any,
      where: {
        or: [{ isDefault: { equals: true } }, { user: { equals: user.id } }],
      },
      limit: 200,
      depth: 0,
      user,
      overrideAccess: false,
    })

    const allowedCategories = buildAllowedExpenseCategories(categories.docs as RawCategoryCandidate[], user.id)
    const metadata: ReceiptOcrRequestMetadata = {
      user_id: String(user.id),
      currency_preference: user.currency || 'VND',
      include_debug: false,
      allowed_categories: allowedCategories,
    }

    const aiFormData = new FormData()
    aiFormData.append('file', file, file.name)
    aiFormData.append('metadata', JSON.stringify(metadata))

    const response = await fetch(`${AI_SERVICE_URL}/api/ocr/receipt`, {
      method: 'POST',
      body: aiFormData,
    })

    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (error) {
    console.error('Receipt OCR parse route failed:', error)
    return Response.json(
      ocrFailure('OCR_ROUTE_FAILED', 'Dịch vụ OCR đang gặp sự cố. Vui lòng thử lại sau.'),
      { status: 500 },
    )
  }
}
