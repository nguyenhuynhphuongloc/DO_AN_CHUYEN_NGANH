'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  user: {
    email: string
    name?: string | null
  } | null
}

const navItems = [
  { href: '/', icon: '📊', label: 'Tổng quan' },
  { href: '/transactions', icon: '💸', label: 'Giao dịch' },
  { href: '/categories', icon: '📁', label: 'Danh mục' },
  { href: '/reports', icon: '📈', label: 'Báo cáo' },
  { href: '/chat', icon: '🤖', label: 'Trợ lý AI' },
  { href: '/scan', icon: '📸', label: 'Quét hóa đơn' },
]

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const getInitials = (name?: string | null, email?: string) => {
    if (name) return name.charAt(0).toUpperCase()
    if (email) return email.charAt(0).toUpperCase()
    return '?'
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/" className="sidebar-logo">
          <div className="sidebar-logo-icon">💰</div>
          <span className="sidebar-logo-text">FinTrack</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Menu chính</div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {getInitials(user.name, user.email)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name || 'Người dùng'}</div>
              <div className="sidebar-user-email">{user.email}</div>
            </div>
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
