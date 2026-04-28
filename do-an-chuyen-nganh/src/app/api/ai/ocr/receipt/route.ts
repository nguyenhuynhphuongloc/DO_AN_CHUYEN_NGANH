import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@payload-config'

import { buildAllowedExpenseCategories, type RawCategoryCandidate, type ReceiptOcrRequestMetadata } from '@/lib/receipt-ocr'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

export async function POST(request: Request) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File) || file.size <= 0) {
      return Response.json(
        { success: false, errors: [{ code: 'INVALID_FILE', message: 'Receipt image is required' }] },
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
      {
        success: false,
        errors: [{ code: 'OCR_ROUTE_FAILED', message: 'Failed to process receipt OCR request' }],
      },
      { status: 500 },
    )
  }
}
