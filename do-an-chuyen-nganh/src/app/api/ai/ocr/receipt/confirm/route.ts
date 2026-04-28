import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@payload-config'

import type { ReceiptOcrConfirmPayload } from '@/lib/receipt-ocr'

function isConfirmPayload(value: unknown): value is ReceiptOcrConfirmPayload {
  if (!value || typeof value !== 'object') return false
  const payload = value as Partial<ReceiptOcrConfirmPayload>
  const review = payload.review_fields
  return (
    payload.transaction_type === 'expense' &&
    payload.source_type === 'receipt_ai' &&
    !!review &&
    typeof review.merchant_name === 'string' &&
    typeof review.transaction_date === 'string' &&
    typeof review.total_amount === 'number' &&
    typeof review.currency === 'string' &&
    typeof review.category_id === 'string' &&
    typeof review.description === 'string' &&
    typeof review.user_note === 'string'
  )
}

function toIsoDate(value: string): string | null {
  const candidate = new Date(value)
  if (Number.isNaN(candidate.getTime())) {
    return null
  }
  return candidate.toISOString()
}

export async function POST(request: Request) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  let mediaId: number | string | null = null

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const rawPayload = formData.get('payload')

    if (!(file instanceof File) || file.size <= 0) {
      return Response.json({ success: false, message: 'Co loi xay ra trong qua trinh luu giao dich' }, { status: 400 })
    }

    if (typeof rawPayload !== 'string') {
      return Response.json({ success: false, message: 'Co loi xay ra trong qua trinh luu giao dich' }, { status: 400 })
    }

    const parsedPayload = JSON.parse(rawPayload)
    if (!isConfirmPayload(parsedPayload)) {
      return Response.json({ success: false, message: 'Co loi xay ra trong qua trinh luu giao dich' }, { status: 400 })
    }

    const { review_fields: reviewFields } = parsedPayload
    if (reviewFields.total_amount <= 0) {
      return Response.json({ success: false, message: 'Co loi xay ra trong qua trinh luu giao dich' }, { status: 400 })
    }

    const isoDate = toIsoDate(reviewFields.transaction_date)
    if (!isoDate) {
      return Response.json({ success: false, message: 'Co loi xay ra trong qua trinh luu giao dich' }, { status: 400 })
    }

    const categoryId = Number(reviewFields.category_id)
    if (!Number.isFinite(categoryId)) {
      return Response.json({ success: false, message: 'Co loi xay ra trong qua trinh luu giao dich' }, { status: 400 })
    }

    const categoryLookup = await payload.find({
      collection: 'categories' as any,
      where: {
        and: [
          { id: { equals: categoryId } },
          { type: { equals: 'expense' } },
          {
            or: [{ isDefault: { equals: true } }, { user: { equals: user.id } }],
          },
        ],
      },
      limit: 1,
      depth: 0,
      user,
    })

    const category = categoryLookup.docs[0]
    if (!category) {
      return Response.json({ success: false, message: 'Co loi xay ra trong qua trinh luu giao dich' }, { status: 404 })
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const media = await payload.create({
      collection: 'media' as any,
      data: {
        alt: reviewFields.merchant_name || file.name || 'Receipt image',
      },
      file: {
        data: fileBuffer,
        mimetype: file.type || 'application/octet-stream',
        name: file.name || `receipt-${Date.now()}.jpg`,
        size: file.size,
      },
      user,
    })
    mediaId = media.id

    const transaction = await payload.create({
      collection: 'transactions' as any,
      data: {
        type: 'expense',
        amount: reviewFields.total_amount,
        category: category.id,
        description: reviewFields.description,
        date: isoDate,
        note: reviewFields.user_note,
        receipt: media.id,
        merchantName: reviewFields.merchant_name,
        currency: reviewFields.currency,
        sourceType: 'receipt_ai',
        user: user.id,
      },
      user,
    })

    return Response.json({
      success: true,
      message: 'Luu giao dich thanh cong',
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        category: category.id,
        merchantName: (transaction as any).merchantName,
        currency: (transaction as any).currency,
        receipt: (transaction as any).receipt,
      },
    })
  } catch (error) {
    console.error('Receipt OCR confirm route failed:', error)

    if (mediaId != null) {
      try {
        await payload.delete({
          collection: 'media' as any,
          id: mediaId,
          user,
        })
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded media after confirm error:', cleanupError)
      }
    }

    return Response.json({ success: false, message: 'Co loi xay ra trong qua trinh luu giao dich' }, { status: 500 })
  }
}
