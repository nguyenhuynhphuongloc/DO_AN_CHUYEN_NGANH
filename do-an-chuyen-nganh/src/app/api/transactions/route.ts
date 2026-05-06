import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@payload-config'
import { applyTransactionCreateBalance } from '@/lib/transaction-balance'

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0
  const parsed = Number(value.replace(/[^\d-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export async function POST(request: Request) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const amount = toNumber(body.amount)
  const type = body.type === 'income' || body.type === 'expense' ? body.type : null
  const category = Number(body.category)
  const wallet = body.wallet ? Number(body.wallet) : undefined

  if (!type || amount <= 0 || !category) {
    return Response.json({ error: 'Loại, số tiền và danh mục là bắt buộc.' }, { status: 400 })
  }

  try {
    const transaction = await payload.create({
      collection: 'transactions' as any,
      data: {
        type,
        amount,
        category,
        wallet,
        description: body.description || '',
        date: body.date || new Date().toISOString(),
        note: body.note || '',
        sourceType: body.sourceType || 'manual',
      },
      user,
      overrideAccess: false,
    })

    await applyTransactionCreateBalance(payload, transaction as any)

    return Response.json(transaction)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể lưu giao dịch.'
    return Response.json({ error: message }, { status: 400 })
  }
}
