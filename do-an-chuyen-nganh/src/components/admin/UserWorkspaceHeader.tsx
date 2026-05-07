import type { AdminUserProfile } from '@/lib/admin/types'

import { AdminStatusBadge } from './AdminStatusBadge'

const setupLabels: Record<AdminUserProfile['walletSetupState'], { label: string; tone: 'good' | 'warning' }> = {
  'has-default': { label: 'Đã có ví mặc định', tone: 'good' },
  'multiple-wallets': { label: 'Nhiều ví', tone: 'good' },
  'no-wallet': { label: 'Chưa có ví', tone: 'warning' },
}

export function UserWorkspaceHeader({ profile }: { profile: AdminUserProfile }) {
  const setup = setupLabels[profile.walletSetupState] || setupLabels['no-wallet']

  return (
    <header className="fin-admin-user-header">
      <div className="fin-admin-user-primary">
        <span>Workspace người dùng</span>
        <h1>{profile.email || profile.name || `Người dùng ${profile.id}`}</h1>
      </div>
      <div className="fin-admin-user-meta">
        <AdminStatusBadge tone={profile.role === 'admin' ? 'info' : 'neutral'}>
          {profile.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
        </AdminStatusBadge>
        {profile.currency && <span>{profile.currency}</span>}
        <span>{profile.walletCount} ví</span>
        <span>{profile.transactionCount} giao dịch</span>
        <AdminStatusBadge tone={setup.tone}>{setup.label}</AdminStatusBadge>
      </div>
    </header>
  )
}
