import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import config from '@/payload.config'
import Sidebar from '@/components/Sidebar'
import SavingsClient from './SavingsClientComponent'

export default async function SavingsPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  // 1. Lấy các mục tiêu tiết kiệm mà user là chủ sở hữu hoặc là thành viên tham gia
  const goals = await payload.find({
    collection: 'savings-goals' as any,
    where: {
      or: [
        { owner: { equals: user.id } },
        { participants: { contains: user.id } },
      ],
    },
    sort: '-createdAt',
    depth: 1,
  })

  // 2. Lấy danh sách người dùng khác để mời
  const allUsers = await payload.find({
    collection: 'users' as any,
    where: {
      id: { not_equals: user.id }
    },
    limit: 50,
  })

  // 3. Lấy danh sách thông báo chưa đọc
  const notifications = await payload.find({
    collection: 'notifications' as any,
    where: {
      and: [
        { recipient: { equals: user.id } },
        { read: { equals: false } }
      ]
    },
    sort: '-createdAt'
  })

  // 4. Lấy danh sách danh mục để phục vụ đóng góp tiết kiệm
  const categories = await payload.find({
    collection: 'categories' as any,
    where: {
      or: [
        { isDefault: { equals: true } },
        { user: { equals: user.id } },
      ],
    },
    limit: 100,
  })

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        <div className="page-container">
          <SavingsClient
            initialGoals={JSON.parse(JSON.stringify(goals.docs))}
            allUsers={JSON.parse(JSON.stringify(allUsers.docs))}
            initialNotifications={JSON.parse(JSON.stringify(notifications.docs))}
            categories={JSON.parse(JSON.stringify(categories.docs))}
            currentUser={user}
          />
        </div>
      </main>
    </div>
  )
}
