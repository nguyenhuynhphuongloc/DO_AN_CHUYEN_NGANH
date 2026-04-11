import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers.js'
import ChatClient from './ChatClient'

export default async function ChatPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  let initialCategories: any[] = []
  
  if (user) {
    // Lấy danh sách danh mục (mặc định + của người dùng) ngay tại server
    const categoriesData = await payload.find({
      collection: 'categories' as any,
      where: {
        or: [
          { isDefault: { equals: true } },
          { user: { equals: user.id } },
        ],
      },
      limit: 100,
    })
    initialCategories = categoriesData.docs
  }

  return <ChatClient user={user} initialCategories={initialCategories} />
}
