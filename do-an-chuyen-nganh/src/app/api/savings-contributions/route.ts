import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@payload-config'
import { createSavingsGoalContribution, createSavingsGoalWithdrawal } from '@/lib/wallet-balance-service'

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
  const action = body.action || 'contribute'

  try {
    if (action === 'contribute') {
      const amount = toNumber(body.amount)
      const goalId = Number(body.goal || body.goalId)
      const sourceWalletId = Number(body.sourceWallet || body.sourceWalletId)

      if (!goalId || !sourceWalletId || amount <= 0) {
        return Response.json({ error: 'Mục tiêu, ví nạp và số tiền là bắt buộc.' }, { status: 400 })
      }

      const contribution = await createSavingsGoalContribution({
        payload,
        user,
        goalId,
        sourceWalletId,
        amount,
        date: body.date || new Date().toISOString(),
        description: body.description,
      })

      return Response.json({ contribution })
    }

    if (action === 'withdraw') {
      const amount = toNumber(body.amount)
      const goalId = Number(body.goal || body.goalId)
      const destinationWalletId = Number(body.destinationWallet || body.destinationWalletId)

      if (!goalId || !destinationWalletId || amount <= 0) {
        return Response.json({ error: 'Mục tiêu, ví nhận tiền và số tiền là bắt buộc.' }, { status: 400 })
      }

      const result = await createSavingsGoalWithdrawal({
        payload,
        user,
        goalId,
        destinationWalletId,
        amount,
        date: body.date || new Date().toISOString(),
        description: body.description,
      })

      return Response.json(result)
    }

    return Response.json({ error: 'Hành động không hợp lệ.' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể nạp vào mục tiêu tiết kiệm.'
    return Response.json({ error: message }, { status: 400 })
  }
}
