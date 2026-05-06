import { headers as getHeaders } from 'next/headers.js'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'

import config from '@payload-config'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'
const ALLOWED_AI_PROXY_PATHS = new Set(['nlp/parse'])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const path = (await params).path.join('/')
  if (!ALLOWED_AI_PROXY_PATHS.has(path)) {
    return Response.json({ error: 'AI path is not allowed' }, { status: 404 })
  }

  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = `${AI_SERVICE_URL}/api/${path}`

  try {
    const body = await request.blob()
    const contentType = request.headers.get('content-type')

    const response = await fetch(url, {
      method: 'POST',
      headers: contentType ? { 'Content-Type': contentType } : {},
      body: body,
    })

    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (error) {
    console.error('Proxy error:', error)
    return Response.json({ error: 'AI Service connection failed' }, { status: 502 })
  }
}
