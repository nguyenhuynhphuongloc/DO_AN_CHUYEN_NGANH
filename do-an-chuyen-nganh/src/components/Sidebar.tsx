'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bot,
  ChartNoAxesCombined,
  Flag,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  ScanLine,
} from 'lucide-react'
import AppLogo from './AppLogo'

interface SidebarProps {
  user: {
    email: string
    name?: string | null
  } | null
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { href: '/transactions', icon: ReceiptText, label: 'Giao dịch' },
  { href: '/categories', icon: FolderKanban, label: 'Danh mục' },
  { href: '/reports', icon: ChartNoAxesCombined, label: 'Báo cáo' },
  { href: '/savings', icon: Flag, label: 'Tiết kiệm' },
  { href: '/chat', icon: Bot, label: 'Trợ lý AI' },
  { href: '/scan', icon: ScanLine, label: 'Quét hóa đơn' },
]

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST' })
      router.push('/auth/login')
      router.refresh()
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const getInitials = (name?: string | null, email?: string) => {
    if (name) return name.charAt(0).toUpperCase()
    if (email) return email.charAt(0).toUpperCase()
    return '?'
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/dashboard" className="sidebar-logo" aria-label="FinTrack">
          <div className="sidebar-logo-icon">
            <AppLogo className="app-logo-image" size={40} priority />
          </div>
          <span className="sidebar-logo-text">
            FinTrack
            <small>Personal finance</small>
          </span>
        </Link>
      </div>

      <nav className="sidebar-nav" aria-label="Điều hướng chính">
        <div className="sidebar-section-title">Không gian làm việc</div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="sidebar-link-icon">
                <Icon size={19} strokeWidth={2.15} />
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitials(user.name, user.email)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name || 'Người dùng'}</div>
              <div className="sidebar-user-email">{user.email}</div>
            </div>
            <button onClick={handleLogout} className="btn-icon sidebar-logout" title="Đăng xuất">
              <LogOut size={18} strokeWidth={2.1} />
            </button>
          </div>
        ) : (
          <Link href="/auth/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Đăng nhập
          </Link>
        )}
      </div>
    </aside>
  )
}
