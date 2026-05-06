import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers.js'

import { cleanCategoryName, normalizeCategoryName } from '@/lib/category-normalization'

export async function POST(request: Request) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    const { name, type, icon, color } = data
    const cleanedName = typeof name === 'string' ? cleanCategoryName(name) : ''

    if (!cleanedName || (type !== 'income' && type !== 'expense')) {
      return Response.json({ error: 'Tên và loại danh mục là bắt buộc' }, { status: 400 })
    }

    const normalizedName = normalizeCategoryName(cleanedName)
    const existing = await payload.find({
      collection: 'categories' as any,
      where: {
        and: [
          { type: { equals: type } },
          {
            or: [
              { isDefault: { equals: true } },
              { user: { equals: user.id } },
            ],
          },
        ],
      },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    const matchedCategory = existing.docs.find((category: any) => {
      return normalizeCategoryName(category.name || '') === normalizedName
    })

    if (matchedCategory) {
      return Response.json(matchedCategory)
    }

    const category = await payload.create({
      collection: 'categories' as any,
      data: {
        name: cleanedName,
        type,
        icon: icon || 'Package',
        color: color || '#6366f1',
        note: typeof data.note === 'string' ? data.note : '',
        user: user.id,
        isDefault: false,
      },
      user,
      overrideAccess: false,
    })

    return Response.json(category)
  } catch (error) {
    console.error('Lỗi khi tạo danh mục:', error)
    return Response.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 })
  }
}
