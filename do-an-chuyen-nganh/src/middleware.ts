import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const systemPaths = [
  '/auth',
  '/dashboard',
  '/transactions',
  '/categories',
  '/chat',
  '/reports',
  '/receipts',
  '/savings',
  '/scan',
  '/setup',
]

function decodePayloadTokenRole(token?: string) {
  if (!token) return null

  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const decoded = JSON.parse(atob(padded))

    return typeof decoded?.role === 'string' ? decoded.role : null
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return NextResponse.next()
  }

  const isSystemPath = systemPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  if (!isSystemPath) {
    return NextResponse.next()
  }

  const role = decodePayloadTokenRole(request.cookies.get('payload-token')?.value)
  if (role === 'admin') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|img|media).*)'],
}
