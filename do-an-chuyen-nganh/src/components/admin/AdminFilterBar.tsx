import Link from 'next/link'

type FilterOption = {
  label: string
  name: string
  options?: Array<{ label: string; value: string }>
  placeholder?: string
  type?: 'date' | 'number' | 'search' | 'select' | 'text'
}

type AdminFilterBarProps = {
  action?: string
  filters: FilterOption[]
}

export function AdminFilterBar({ action, filters }: AdminFilterBarProps) {
  const resetHref = action || '/admin'

  return (
    <form action={action} className="fin-admin-filterbar">
      {filters.map((filter) => (
        <label key={filter.name}>
          <span>{filter.label}</span>
          {filter.type === 'select' ? (
            <select name={filter.name} defaultValue="">
              <option value="">{filter.placeholder || 'Tất cả'}</option>
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input name={filter.name} placeholder={filter.placeholder} type={filter.type || 'text'} />
          )}
        </label>
      ))}
      <button type="submit">Lọc</button>
      <Link href={resetHref} scroll={false}>
        Đặt lại
      </Link>
    </form>
  )
}
