import type { AdminKpi } from '@/lib/admin/types'

import { AdminStatusBadge } from './AdminStatusBadge'

const formatValue = (value: number | string) => {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value)
  }
  return value
}

const toneLabels = {
  danger: 'cần chú ý',
  good: 'ổn định',
  info: 'thông tin',
  neutral: 'bình thường',
  warning: 'cảnh báo',
}

export function AdminKpiCard({ helper, label, tone = 'neutral', value }: AdminKpi) {
  return (
    <div className="fin-admin-kpi">
      <div className="fin-admin-kpi__top">
        <span>{label}</span>
        <AdminStatusBadge tone={tone}>{toneLabels[tone]}</AdminStatusBadge>
      </div>
      <strong>{formatValue(value)}</strong>
      {helper && <p>{helper}</p>}
    </div>
  )
}
