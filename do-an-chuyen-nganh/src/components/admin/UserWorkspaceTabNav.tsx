import Link from 'next/link'

const tabs = [
  { key: 'overview', label: 'Tổng quan', suffix: '' },
  { key: 'wallets', label: 'Ví tiền', suffix: '/wallets' },
  { key: 'transactions', label: 'Giao dịch', suffix: '/transactions' },
  { key: 'categories', label: 'Danh mục', suffix: '/categories' },
  { key: 'budgets', label: 'Hũ chi', suffix: '/budgets' },
  { key: 'savings', label: 'Tiết kiệm', suffix: '/savings' },
  { key: 'receipts', label: 'Hóa đơn/OCR', suffix: '/receipts' },
  { key: 'ai', label: 'AI/chat', suffix: '/ai' },
  { key: 'notifications', label: 'Thông báo', suffix: '/notifications' },
]

export function UserWorkspaceTabNav({
  activeSection,
  userId,
}: {
  activeSection: string
  userId: string
}) {
  return (
    <nav className="fin-admin-user-tabs" aria-label="Các phân hệ của người dùng">
      {tabs.map(({ key, label, suffix }) => (
        <Link
          key={key}
          className={activeSection === key ? 'is-active' : ''}
          href={`/admin/finance/users/${userId}${suffix}`}
          scroll={false}
        >
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
