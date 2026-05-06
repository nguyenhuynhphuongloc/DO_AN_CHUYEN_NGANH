import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import config from '@payload-config'
import { cleanCategoryName } from '@/lib/category-normalization'

type RouteContext = {
  params: Promise<{ id: string }>
}

const canEditCategory = (category: any, userId: number) => {
  const ownerId = typeof category.user === 'object' ? category.user?.id : category.user
  return !category.isDefault && Number(ownerId) === Number(userId)
}

export async function PATCH(request: Request, context: RouteContext) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const existing = await payload.findByID({
    collection: 'categories' as any,
    id,
    depth: 0,
    overrideAccess: true,
  })

  if (!canEditCategory(existing, user.id)) {
    return Response.json({ error: 'Không thể chỉnh sửa danh mục hệ thống hoặc danh mục của người khác.' }, { status: 403 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? cleanCategoryName(body.name) : existing.name
  const type = body.type === 'income' || body.type === 'expense' ? body.type : existing.type

  const updated = await payload.update({
    collection: 'categories' as any,
    id,
    data: {
      name,
      type,
      icon: body.icon || existing.icon,
      color: body.color || existing.color,
      note: typeof body.note === 'string' ? body.note : existing.note,
    },
    user,
    overrideAccess: false,
  })

  return Response.json(updated)
}

export async function DELETE(_request: Request, context: RouteContext) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const existing = await payload.findByID({
    collection: 'categories' as any,
    id,
    depth: 0,
    overrideAccess: true,
  })

  if (!canEditCategory(existing, user.id)) {
    return Response.json({ error: 'Không thể xóa danh mục hệ thống hoặc danh mục của người khác.' }, { status: 403 })
  }

  await payload.delete({
    collection: 'categories' as any,
    id,
    user,
    overrideAccess: false,
  })

  return Response.json({ ok: true })
}
