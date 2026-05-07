import Link from 'next/link'
import { DatabaseZap, FolderTree, LayoutDashboard, Users } from 'lucide-react'

const primaryLinks = [
  { href: '/admin', icon: LayoutDashboard, label: 'Tổng quan' },
  { href: '/admin/finance/users', icon: Users, label: 'Người dùng' },
  { href: '/admin/finance/data-quality', icon: DatabaseZap, label: 'Cảnh báo dữ liệu' },
]

const secondaryLinks = [
  { href: '/admin/collections', icon: FolderTree, label: 'Dữ liệu gốc' },
]

export function FinanceAdminNavLinks() {
  return (
    <div className="fin-admin-navlinks">
      {primaryLinks.map(({ href, icon: Icon, label }) => (
        <Link key={href} href={href}>
          <Icon size={16} />
          <span>{label}</span>
        </Link>
      ))}
      <div className="fin-admin-navlinks__secondary">
        {secondaryLinks.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}>
            <Icon size={16} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
