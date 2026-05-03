'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { 
  MdDashboard, 
  MdAttachMoney, 
  MdCategory, 
  MdBarChart, 
  MdSmartToy, 
  MdDocumentScanner,
  MdAccountBalanceWallet,
  MdFlag,
  MdLogout
} from 'react-icons/md'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  user: {
    email: string
    name?: string | null
  } | null
}

const navItems = [
  { href: '/', icon: <MdDashboard size={20} />, label: 'Tổng quan' },
  { href: '/transactions', icon: <MdAttachMoney size={20} />, label: 'Giao dịch' },
  { href: '/categories', icon: <MdCategory size={20} />, label: 'Danh mục' },
  { href: '/reports', icon: <MdBarChart size={20} />, label: 'Báo cáo' },
  { href: '/savings', icon: <MdFlag size={20} />, label: 'Tiết kiệm' },
  { href: '/chat', icon: <MdSmartToy size={20} />, label: 'Trợ lý AI' },
  { href: '/scan', icon: <MdDocumentScanner size={20} />, label: 'Quét hóa đơn' },
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
        <Link href="/" className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <MdAccountBalanceWallet size={24} />
          </div>
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
            <button 
              onClick={handleLogout}
              className="btn-icon" 
              title="Đăng xuất"
              style={{ border: 'none', background: 'transparent', color: 'var(--danger)', opacity: 0.7 }}
            >
              <MdLogout size={18} />
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
