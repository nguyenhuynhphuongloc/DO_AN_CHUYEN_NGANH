'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { MdCalendarMonth } from 'react-icons/md'

interface MonthFilterProps {
  currentMonth: number
  currentYear: number
}

export default function MonthFilter({ currentMonth, currentYear }: MonthFilterProps) {
  const router = useRouter()
  
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i)

  const updateFilter = (month: number, year: number) => {
    const params = new URLSearchParams()
    params.set('month', month.toString())
    params.set('year', year.toString())
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="filter-bar" style={{ display: 'flex', gap: '8px', padding: '0', background: 'transparent', marginBottom: '8px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <MdCalendarMonth size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <select 
          className="form-select"
          value={currentMonth}
          onChange={(e) => updateFilter(parseInt(e.target.value), currentYear)}
          style={{ paddingLeft: '38px', width: 'auto', minWidth: '140px', height: '40px', fontSize: '14px' }}
        >
          {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
        </select>
      </div>
      
      <select 
        className="form-select"
        value={currentYear}
        onChange={(e) => updateFilter(currentMonth, parseInt(e.target.value))}
        style={{ width: 'auto', minWidth: '100px', height: '40px', fontSize: '14px' }}
      >
        {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
      </select>
    </div>
  )
}
