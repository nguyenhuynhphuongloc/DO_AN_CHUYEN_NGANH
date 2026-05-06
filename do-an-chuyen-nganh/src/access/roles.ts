import type { Access, FieldAccess } from 'payload'

type RoleUser = {
  id?: number | string
  role?: string | null
} | null | undefined

export const isAdmin = (user: RoleUser): boolean => user?.role === 'admin'

export const authenticated: Access = ({ req: { user } }) => Boolean(user)

export const adminOnly: Access = ({ req: { user } }) => isAdmin(user)

export const adminOnlyBoolean = ({ req: { user } }: { req: { user?: RoleUser } }): boolean => isAdmin(user)

export const adminFieldOnly: FieldAccess = ({ req: { user } }) => isAdmin(user)

export const adminOrSelf: Access = ({ req: { user }, id }) => {
  if (!user) return false
  if (isAdmin(user)) return true

  const targetId = id ?? user.id
  return {
    id: {
      equals: targetId,
    },
  }
}

export const ownerOnly = (fieldName = 'user'): Access => {
  return ({ req: { user } }) => {
    if (!user) return false
    if (isAdmin(user)) return true

    return {
      [fieldName]: {
        equals: user.id,
      },
    }
  }
}
