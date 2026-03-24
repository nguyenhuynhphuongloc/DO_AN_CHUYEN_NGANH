import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers.js'

export async function GET(request: Request) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const months = parseInt(searchParams.get('months') || '6', 10)

  const now = new Date()
  const data: { month: string; income: number; expense: number }[] = []

  for (let i = months - 1; i >= 0; i--) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

    const monthTx = await payload.find({
      collection: 'transactions' as any,
      where: {
        and: [
          { user: { equals: user.id } },
          { date: { greater_than_equal: startDate.toISOString() } },
          { date: { less_than_equal: endDate.toISOString() } },
        ],
      },
      limit: 0,
    })

    const inc = (monthTx.docs as any[])
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + (t.amount || 0), 0)

    const exp = (monthTx.docs as any[])
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + (t.amount || 0), 0)

    const monthLabel = `${startDate.getMonth() + 1}/${startDate.getFullYear()}`

    data.push({ month: monthLabel, income: inc, expense: exp })
  }

  return Response.json({ data })
}
