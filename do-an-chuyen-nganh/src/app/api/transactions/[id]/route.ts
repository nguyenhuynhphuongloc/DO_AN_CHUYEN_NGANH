import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@payload-config'
import { applyTransactionDeleteBalance, applyTransactionUpdateBalance } from '@/lib/transaction-balance'

type RouteContext = {
  params: Promise<{ id: string }>
}

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0
  const parsed = Number(value.replace(/[^\d-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export async function PATCH(request: Request, context: RouteContext) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const body = await request.json()
  const amount = toNumber(body.amount)
  const type = body.type === 'income' || body.type === 'expense' ? body.type : null
  const category = Number(body.category)
  const wallet = body.wallet ? Number(body.wallet) : undefined

  if (!type || amount <= 0 || !category) {
    return Response.json({ error: 'Loại, số tiền và danh mục là bắt buộc.' }, { status: 400 })
  }

  try {
    const previousTransaction = await payload.findByID({
      collection: 'transactions' as any,
      id,
      depth: 0,
      user,
      overrideAccess: false,
    })

    const transaction = await payload.update({
      collection: 'transactions' as any,
      id,
      data: {
        type,
        amount,
        category,
        wallet,
        description: body.description || '',
        date: body.date,
        note: body.note || '',
      },
      user,
      overrideAccess: false,
    })

    await applyTransactionUpdateBalance(payload, previousTransaction as any, transaction as any)

    return Response.json(transaction)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể cập nhật giao dịch.'
    return Response.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const previousTransaction = await payload.findByID({
    collection: 'transactions' as any,
    id,
    depth: 0,
    user,
    overrideAccess: false,
  })

  await payload.delete({
    collection: 'transactions' as any,
    id,
    user,
    overrideAccess: false,
  })

  await applyTransactionDeleteBalance(payload, previousTransaction as any)

  return Response.json({ ok: true })
}
