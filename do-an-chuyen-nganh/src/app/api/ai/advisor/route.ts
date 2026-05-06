import { headers as getHeaders } from 'next/headers.js'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'

import { buildFinanceAdvisorContext, getFinanceStats } from '@/lib/finance-stats'
import config from '@payload-config'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { text } = await request.json()
    const now = new Date()
    const stats = await getFinanceStats(payload, user.id, {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      chartMonths: 3,
      recentLimit: 5,
    })

    const financialContext = buildFinanceAdvisorContext(stats)

    const response = await fetch(`${AI_SERVICE_URL}/api/ai/advisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        context: financialContext,
      }),
    })

    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (error) {
    console.error('Advisor API error:', error)
    return Response.json({ error: 'Failed to get financial advice' }, { status: 500 })
  }
}
