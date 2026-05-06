'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { CalendarDays } from 'lucide-react'

interface MonthFilterProps {
  currentMonth: number
  currentYear: number
}

export default function MonthFilter({ currentMonth, currentYear }: MonthFilterProps) {
  const router = useRouter()
  const pathname = usePathname()

  const months = Array.from({ length: 12 }, (_, index) => index + 1)
  const years = Array.from({ length: 3 }, (_, index) => new Date().getFullYear() - index)

  const updateFilter = (month: number, year: number) => {
    const params = new URLSearchParams()
    params.set('month', month.toString())
    params.set('year', year.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="filter-bar" style={{ display: 'flex', gap: '8px', padding: '0', background: 'transparent', marginBottom: '8px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <CalendarDays size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <select
          className="form-select"
          value={currentMonth}
          onChange={(event) => updateFilter(parseInt(event.target.value, 10), currentYear)}
          style={{ paddingLeft: '38px', width: 'auto', minWidth: '140px', height: '40px', fontSize: '14px' }}
        >
          {months.map((month) => (
            <option key={month} value={month}>
              Tháng {month}
            </option>
          ))}
        </select>
      </div>

      <select
        className="form-select"
        value={currentYear}
        onChange={(event) => updateFilter(currentMonth, parseInt(event.target.value, 10))}
        style={{ width: 'auto', minWidth: '100px', height: '40px', fontSize: '14px' }}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            Năm {year}
          </option>
        ))}
      </select>
    </div>
  )
}
