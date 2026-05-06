import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import { getFinanceStats } from '@/lib/finance-stats'
import config from '@payload-config'

export async function GET(request: Request) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const now = new Date()
  const months = parseInt(searchParams.get('months') || '6', 10)
  const month = parseInt(searchParams.get('month') || `${now.getMonth() + 1}`, 10)
  const year = parseInt(searchParams.get('year') || `${now.getFullYear()}`, 10)

  const stats = await getFinanceStats(payload, user.id, {
    month,
    year,
    chartMonths: months,
    recentLimit: 1,
  })

  return Response.json({ data: stats.chartData })
}
