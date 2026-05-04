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
        type: { equals: type },
      },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })

    const matchedCategory = existing.docs.find((category: any) => {
      return normalizeCategoryName(category.name || '') === normalizedName
    })

    if (matchedCategory) {
      const isAccessible =
        matchedCategory.isDefault ||
        !matchedCategory.user ||
        matchedCategory.user === user.id ||
        matchedCategory.user?.id === user.id

      if (isAccessible) {
        return Response.json(matchedCategory)
      }

      const sharedCategory = await payload.update({
        collection: 'categories' as any,
        id: matchedCategory.id,
        data: {
          user: null,
          isDefault: true,
        },
        overrideAccess: true,
      })

      return Response.json(sharedCategory)
    }

    const category = await payload.create({
      collection: 'categories' as any,
      data: {
        name: cleanedName,
        type,
        icon: icon || 'MdInventory2',
        color: color || '#6366f1',
        user: user.id,
        isDefault: false,
      },
    })

    return Response.json(category)
  } catch (error) {
    console.error('Lỗi khi tạo danh mục:', error)
    return Response.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 })
  }
}
