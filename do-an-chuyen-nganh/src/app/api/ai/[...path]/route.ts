import { NextRequest } from 'next/server'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const path = (await params).path.join('/')
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
