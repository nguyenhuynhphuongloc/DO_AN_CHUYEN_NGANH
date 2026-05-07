'use client'

type AdminConfirmDialogProps = {
  actionLabel: string
  message: string
  title: string
}

export function AdminConfirmDialog({ actionLabel, message, title }: AdminConfirmDialogProps) {
  return (
    <details className="fin-admin-confirm">
      <summary>{title}</summary>
      <p>{message}</p>
      <button type="button" onClick={() => window.alert('Thao tác quản trị này chưa được kết nối.')}>
        {actionLabel}
      </button>
    </details>
  )
}
