import Link from 'next/link'
import { Search } from 'lucide-react'

import type { AdminUserRow } from '@/lib/admin/types'

import { AdminStatusBadge } from './AdminStatusBadge'

const sectionSuffix = (section: string) => (section && section !== 'overview' ? `/${section}` : '')

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa có'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

const initials = (row: Pick<AdminUserRow, 'email' | 'name' | 'id'>) => {
  const source = row.name || row.email || String(row.id)
  return (
    source
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U'
  )
}

export function UserListSidebar({
  activeSection,
  activeUserId,
  users,
}: {
  activeSection: string
  activeUserId: string
  users: AdminUserRow[]
}) {
  return (
    <aside className="fin-admin-user-sidebar" aria-label="Danh sách người dùng">
      <div className="fin-admin-user-sidebar__header">
        <div>
          <span>Người dùng</span>
          <strong>{users.length}</strong>
        </div>
        <Link href="/admin/finance/users">Tất cả</Link>
      </div>

      <form action={`/admin/finance/users/${activeUserId}${sectionSuffix(activeSection)}`} className="fin-admin-sidebar-search">
        <Search size={15} />
        <input name="userSearch" placeholder="Tìm email hoặc tên" type="search" />
      </form>

      <div className="fin-admin-user-sidebar__list">
        {users.map((row) => {
          const isActive = String(row.id) === String(activeUserId)
          return (
            <Link
              key={row.id}
              className={isActive ? 'fin-admin-user-sidebar-row is-active' : 'fin-admin-user-sidebar-row'}
              href={`/admin/finance/users/${row.id}${sectionSuffix(activeSection)}`}
              scroll={false}
            >
              <span className="fin-admin-avatar">{initials(row)}</span>
              <span className="fin-admin-user-sidebar-row__main">
                <strong>{row.email || row.id}</strong>
                <small>{row.name || formatDate(row.latestTransactionDate)}</small>
                <span className="fin-admin-user-sidebar-row__badges">
                  <AdminStatusBadge tone={row.role === 'admin' ? 'info' : 'neutral'}>
                    {row.role === 'admin' ? 'Admin' : 'User'}
                  </AdminStatusBadge>
                  <AdminStatusBadge tone={row.hasDefaultWallet ? 'good' : 'warning'}>
                    {row.hasDefaultWallet ? 'Có ví' : 'Thiếu ví'}
                  </AdminStatusBadge>
                </span>
              </span>
            </Link>
          )
        })}
        {users.length === 0 && <div className="fin-admin-empty">Không có người dùng phù hợp.</div>}
      </div>
    </aside>
  )
}
