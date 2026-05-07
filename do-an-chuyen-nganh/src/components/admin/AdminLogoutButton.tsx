'use client'

import { LogOut } from 'lucide-react'

export function AdminLogoutButton() {
  return (
    <button
      className="fin-admin-logout"
      type="button"
      onClick={async () => {
        await fetch('/api/users/logout', { method: 'POST' })
        window.location.href = '/admin/login'
      }}
    >
      <LogOut size={16} />
      Đăng xuất
    </button>
  )
}
