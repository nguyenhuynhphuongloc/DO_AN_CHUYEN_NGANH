import { describe, expect, it } from 'vitest'

import { Users } from '@/collections/Users'

const getRoleField = () => {
  const roleField = Users.fields.find((field) => 'name' in field && field.name === 'role')
  if (!roleField || !('access' in roleField)) {
    throw new Error('role field not found')
  }
  return roleField
}

const runBeforeValidate = (args: Record<string, unknown>) => {
  const hook = Users.hooks?.beforeValidate?.[0]
  if (!hook) throw new Error('users beforeValidate hook not found')
  return hook(args as any)
}

describe('users access control', () => {
  it('denies Payload admin access to normal users', async () => {
    const adminAccess = Users.access?.admin
    expect(adminAccess).toBeTypeOf('function')

    const result = await adminAccess?.({
      req: {
        user: { id: 1, role: 'user' },
      },
    } as any)

    expect(result).toBe(false)
  })

  it('allows Payload admin access to admin users', async () => {
    const result = await Users.access?.admin?.({
      req: {
        user: { id: 1, role: 'admin' },
      },
    } as any)

    expect(result).toBe(true)
  })

  it('forces public registration role to user', async () => {
    const data = await runBeforeValidate({
      operation: 'create',
      data: {
        email: 'new-user@example.com',
        password: 'password123',
        role: 'admin',
      },
      req: {
        user: null,
      },
      context: {},
    })

    expect(data).toMatchObject({ role: 'user' })
  })

  it('removes normal user self-promotion on update', async () => {
    const data = await runBeforeValidate({
      operation: 'update',
      data: {
        role: 'admin',
        name: 'Normal User',
      },
      req: {
        user: { id: 1, role: 'user' },
      },
      context: {},
    })

    expect(data).toEqual({ name: 'Normal User' })
  })

  it('restricts normal user reads to their own document', async () => {
    const result = await Users.access?.read?.({
      req: {
        user: { id: 12, role: 'user' },
      },
    } as any)

    expect(result).toEqual({
      id: {
        equals: 12,
      },
    })
  })

  it('protects role field create and update access from normal users', async () => {
    const roleField = getRoleField()
    const createAccess = await roleField.access?.create?.({
      req: {
        user: { id: 1, role: 'user' },
      },
    } as any)
    const updateAccess = await roleField.access?.update?.({
      req: {
        user: { id: 1, role: 'user' },
      },
    } as any)

    expect(createAccess).toBe(false)
    expect(updateAccess).toBe(false)
  })
})
