import { getPayload } from 'payload'
import type { Payload } from 'payload'
import type { NextRequest } from 'next/server'

import { isAdmin } from '@/access/roles'
import config from '@payload-config'

type MaybeUser = {
  id?: number | string
  role?: string | null
} | null | undefined

export async function resolveAdminUser(payload: Payload, user: MaybeUser) {
  if (isAdmin(user)) return user

  if (!user?.id) return null
  if (typeof payload.findByID !== 'function') return null

  const fullUser = await payload.findByID({
    collection: 'users',
    depth: 0,
    id: user.id,
    overrideAccess: true,
  })

  return isAdmin(fullUser) ? fullUser : null
}

export async function getAdminContext(request: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  const adminUser = await resolveAdminUser(payload, user)

  if (!adminUser) {
    return {
      error: Response.json({ error: 'Admin access required' }, { status: user ? 403 : 401 }),
      payload,
      user,
    }
  }

  return {
    payload,
    user: adminUser,
  }
}

export function isAdminUser(user: unknown): boolean {
  return isAdmin(user as any)
}
