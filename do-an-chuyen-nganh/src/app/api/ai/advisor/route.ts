import { headers as getHeaders } from 'next/headers.js'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'

import { buildFinanceAdvisorContext, getFinanceStats } from '@/lib/finance-stats'
import { createAiAuditLog, summarizeAiText } from '@/lib/ai-chat-audit'
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

    // Log incoming user message
    await createAiAuditLog(payload, {
      userId: user.id,
      kind: 'advisor',
      direction: 'incoming',
      status: 'success',
      fullText: text,
      redactedText: summarizeAiText(text, 200),
      intent: 'user_query',
    })

    const response = await fetch(`${AI_SERVICE_URL}/api/ai/advisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        context: financialContext,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      // Log successful AI response
      await createAiAuditLog(payload, {
        userId: user.id,
        kind: 'advisor',
        direction: 'outgoing',
        status: 'success',
        fullText: data.response ?? JSON.stringify(data),
        redactedText: summarizeAiText(data.response ?? JSON.stringify(data), 200),
        intent: 'advisor_response',
      })
    } else {
      // Log error response
      await createAiAuditLog(payload, {
        userId: user.id,
        kind: 'advisor',
        direction: 'outgoing',
        status: 'error',
        fullText: JSON.stringify(data),
        errorMessage: data.error || 'Advisor service returned error',
      })
    }

    return Response.json(data, { status: response.status })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Log error
    await createAiAuditLog(payload, {
      userId: user.id,
      kind: 'advisor',
      direction: 'outgoing',
      status: 'error',
      fullText: errorMessage,
      errorMessage: errorMessage,
    })

    console.error('Advisor API error:', error)
    return Response.json({ error: 'Failed to get financial advice' }, { status: 500 })
  }
}
