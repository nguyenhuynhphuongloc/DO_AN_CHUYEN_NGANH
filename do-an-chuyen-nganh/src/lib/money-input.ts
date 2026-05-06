export const onlyMoneyDigits = (value: string) => value.replace(/[^\d]/g, '')

export const formatMoneyInput = (value: string | number | null | undefined) => {
  const digits = onlyMoneyDigits(String(value ?? ''))
  if (!digits) return ''

  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(digits))
}

export const parseMoneyInput = (value: string | number | null | undefined) => {
  const parsed = Number(onlyMoneyDigits(String(value ?? '')))
  return Number.isFinite(parsed) ? parsed : 0
}
