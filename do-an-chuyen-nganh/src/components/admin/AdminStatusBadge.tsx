type AdminStatusBadgeProps = {
  children: React.ReactNode
  tone?: 'neutral' | 'good' | 'warning' | 'danger' | 'info'
}

export function AdminStatusBadge({ children, tone = 'neutral' }: AdminStatusBadgeProps) {
  return <span className={`fin-admin-badge fin-admin-badge--${tone}`}>{children}</span>
}
