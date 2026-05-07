type AdminDetailDrawerProps = {
  children: React.ReactNode
  title: string
}

export function AdminDetailDrawer({ children, title }: AdminDetailDrawerProps) {
  return (
    <aside className="fin-admin-detail">
      <h3>{title}</h3>
      {children}
    </aside>
  )
}
