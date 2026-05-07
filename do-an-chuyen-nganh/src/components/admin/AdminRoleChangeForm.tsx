'use client'

import { useState } from 'react'

type AdminRoleChangeFormProps = {
  currentRole?: string | null
  userId: number | string
}

export function AdminRoleChangeForm({ currentRole, userId }: AdminRoleChangeFormProps) {
  const [role, setRole] = useState(currentRole || 'user')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  return (
    <details className="fin-admin-confirm">
      <summary>Đổi vai trò</summary>
      <label>
        <span>Vai trò mới</span>
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="user">Người dùng</option>
          <option value="admin">Quản trị viên</option>
        </select>
      </label>
      <button
        type="button"
        disabled={status === 'saving'}
        onClick={async () => {
          setStatus('saving')
          const response = await fetch(`/api/admin/users/${userId}/role`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role }),
          })
          setStatus(response.ok ? 'saved' : 'error')
        }}
      >
        {status === 'saving' ? 'Đang lưu...' : 'Xác nhận đổi vai trò'}
      </button>
      {status === 'saved' && <p>Đã cập nhật vai trò. Tải lại danh sách để kiểm tra.</p>}
      {status === 'error' && <p>Cập nhật vai trò thất bại.</p>}
    </details>
  )
}
