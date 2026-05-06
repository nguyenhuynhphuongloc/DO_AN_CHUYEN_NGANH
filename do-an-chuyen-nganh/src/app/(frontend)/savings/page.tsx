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

  const [goals, allUsers, notifications, categories] = await Promise.all([
    payload.find({
      collection: 'savings-goals' as any,
      where: {
        or: [
          { owner: { equals: user.id } },
          { participants: { contains: user.id } },
        ],
      },
      sort: '-createdAt',
      limit: 100,
      depth: 1,
      select: {
        id: true,
        title: true,
        targetAmount: true,
        currentAmount: true,
        status: true,
        icon: true,
        color: true,
        owner: true,
        participants: true,
        createdAt: true,
      },
      overrideAccess: true,
    }),
    payload.find({
      collection: 'users' as any,
      where: {
        id: { not_equals: user.id },
      },
      limit: 50,
      depth: 0,
      select: {
        id: true,
        name: true,
        email: true,
      },
      overrideAccess: true,
    }),
    payload.find({
      collection: 'notifications' as any,
      where: {
        and: [{ recipient: { equals: user.id } }, { read: { equals: false } }],
      },
      sort: '-createdAt',
      limit: 50,
      depth: 0,
      select: {
        id: true,
        message: true,
        read: true,
        link: true,
      },
      overrideAccess: true,
    }),
    payload.find({
      collection: 'categories' as any,
      where: {
        or: [{ isDefault: { equals: true } }, { user: { equals: user.id } }],
      },
      limit: 100,
      depth: 0,
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
        type: true,
      },
      overrideAccess: true,
    }),
  ])

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
