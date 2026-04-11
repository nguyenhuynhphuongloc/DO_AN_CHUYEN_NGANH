import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers.js'

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

    if (!name || !type) {
      return Response.json({ error: 'Tên và loại danh mục là bắt buộc' }, { status: 400 })
    }

    // Kiểm tra xem danh mục đã tồn tại cho người dùng này chưa
    const existing = await payload.find({
      collection: 'categories' as any,
      where: {
        and: [
          { user: { equals: user.id } },
          { name: { equals: name } },
          { type: { equals: type } }
        ]
      }
    })

    if (existing.docs.length > 0) {
      return Response.json(existing.docs[0])
    }

    const category = await payload.create({
      collection: 'categories' as any,
      data: {
        name,
        type,
        icon: icon || '📦',
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
