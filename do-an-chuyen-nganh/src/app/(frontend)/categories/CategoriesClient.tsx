'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CircleAlert,
  CirclePlus,
  Edit3,
  Filter,
  Save,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'

import CategoryIcon from '@/components/CategoryIcon'
import { formatMoneyInput, parseMoneyInput } from '@/lib/money-input'

type Category = {
  id: number
  name: string
  type: 'income' | 'expense'
  icon?: string | null
  note?: string | null
  color?: string | null
  isDefault?: boolean | null
  user?: number | { id: number } | null
}

type Budget = {
  id: number
  category: number | Category
  wallet?: number | null
  amount: number
  month?: number | null
  year?: number | null
  isActive?: boolean | null
}

type Wallet = {
  id: number
  name: string
  walletType: string
  monthlySpendingLimit?: number | null
}

type Props = {
  initialCategories: Category[]
  initialBudgets: Budget[]
  wallets: Wallet[]
  defaultWalletId: number | null
  monthlySpendingLimit: number
  spentByCategory: Record<string, number>
  currentMonth: number
  currentYear: number
}

const ICON_OPTIONS = [
  'Utensils',
  'Car',
  'ShoppingCart',
  'House',
  'HeartPulse',
  'GraduationCap',
  'Clapperboard',
  'Plane',
  'Gift',
  'Shirt',
  'Coffee',
  'PawPrint',
  'Banknote',
  'Package',
]

const COLOR_OPTIONS = ['#2563eb', '#ef4444', '#059669', '#d97706', '#7c3aed', '#db2777', '#0f766e', '#ea580c']

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0)

const getCategoryId = (budget: Budget) => {
  return typeof budget.category === 'object' ? budget.category.id : budget.category
}

export default function CategoriesClient({
  initialCategories,
  initialBudgets,
  wallets,
  defaultWalletId,
  monthlySpendingLimit,
  spentByCategory,
  currentMonth,
  currentYear,
}: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteConfirmData, setDeleteConfirmData] = useState<Category | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('expense')
  const [savingCategoryId, setSavingCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jarInputs, setJarInputs] = useState<Record<string, string>>(() => {
    return initialBudgets.reduce<Record<string, string>>((result, budget) => {
      result[String(getCategoryId(budget))] = formatMoneyInput(budget.amount || 0)
      return result
    }, {})
  })
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'expense' | 'income',
    icon: 'Package',
    note: '',
    color: '#2563eb',
  })

  const budgetByCategory = useMemo(() => {
    return initialBudgets.reduce<Record<string, Budget>>((result, budget) => {
      result[String(getCategoryId(budget))] = budget
      return result
    }, {})
  }, [initialBudgets])

  const allocatedAmount = useMemo(() => {
    return Object.values(jarInputs).reduce((sum, value) => sum + parseMoneyInput(value), 0)
  }, [jarInputs])

  const resetForm = () => {
    setFormData({ name: '', type: 'expense', icon: 'Package', note: '', color: '#2563eb' })
    setEditingId(null)
    setError('')
  }

  const openEditModal = (category: Category) => {
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon || 'Package',
      note: category.note || '',
      color: category.color || '#2563eb',
    })
    setEditingId(category.id)
    setError('')
    setShowModal(true)
  }

  const handleCategorySubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const response = await fetch(editingId ? `/api/categories/${editingId}` : '/api/categories', {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    const data = await response.json()
    if (!response.ok) {
      setError(data.error || 'Không thể lưu danh mục.')
      setLoading(false)
      return
    }

    setShowModal(false)
    resetForm()
    setLoading(false)
    router.refresh()
  }

  const saveJarLimit = async (category: Category) => {
    if (!defaultWalletId) return
    const amount = parseMoneyInput(jarInputs[String(category.id)])
    setSavingCategoryId(category.id)
    setError('')

    const response = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletId: defaultWalletId,
        categoryId: category.id,
        amount,
        month: currentMonth,
        year: currentYear,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      setError(data.error || 'Không thể lưu hũ chi tiêu.')
      setSavingCategoryId(null)
      return
    }

    setSavingCategoryId(null)
    router.refresh()
  }

  const confirmDelete = async () => {
    if (!deleteConfirmData) return
    setLoading(true)
    const response = await fetch(`/api/categories/${deleteConfirmData.id}`, { method: 'DELETE' })
    if (!response.ok) {
      const data = await response.json()
      setError(data.error || 'Không thể xóa danh mục.')
    }
    setDeleteConfirmData(null)
    setLoading(false)
    router.refresh()
  }

  const categories = initialCategories.filter((category) => filterType === 'all' || category.type === filterType)
  const expenseCategories = categories.filter((category) => category.type === 'expense')
  const incomeCategories = categories.filter((category) => category.type === 'income')
  const defaultWallet = wallets.find((wallet) => wallet.id === defaultWalletId)
  const allocationPercent = monthlySpendingLimit > 0 ? Math.round((allocatedAmount / monthlySpendingLimit) * 100) : 0

  const renderCategoryCard = (category: Category) => {
    const limit = parseMoneyInput(jarInputs[String(category.id)] ?? String(budgetByCategory[String(category.id)]?.amount || 0))
    const spent = Number(spentByCategory[String(category.id)] || 0)
    const percent = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 999) : 0
    const remaining = Math.max(limit - spent, 0)
    const isWarning = limit > 0 && percent >= 80
    const isExceeded = limit > 0 && percent >= 100

    return (
      <article className={`jar-card ${isExceeded ? 'exceeded' : isWarning ? 'warning' : ''}`} key={category.id}>
        <div className="jar-card-main">
          <div className="category-card-icon" style={{ background: `${category.color || '#2563eb'}20`, color: category.color || '#2563eb' }}>
            <CategoryIcon icon={category.icon || 'Package'} size={23} />
          </div>
          <div className="jar-card-title">
            <strong>{category.name}</strong>
            <span>{category.isDefault ? 'Danh mục hệ thống' : 'Danh mục riêng'}</span>
          </div>
          {!category.isDefault && (
            <div className="category-card-actions">
              <button className="btn-icon" onClick={() => openEditModal(category)} title="Sửa danh mục">
                <Edit3 size={17} />
              </button>
              <button className="btn-icon" onClick={() => setDeleteConfirmData(category)} title="Xóa danh mục">
                <Trash2 size={17} />
              </button>
            </div>
          )}
        </div>

        {category.type === 'expense' && (
          <div className="jar-budget">
            <div className="jar-budget-row">
              <span>Đã chi</span>
              <strong>{formatCurrency(spent)}</strong>
            </div>
            <div className="jar-progress" aria-label={`Đã dùng ${percent}% hạn mức ${category.name}`}>
              <span style={{ width: `${Math.min(percent, 100)}%` }} />
            </div>
            <div className="jar-budget-meta">
              <span>Còn lại {formatCurrency(remaining)}</span>
              <span>{percent}%</span>
            </div>
            <div className="jar-limit-editor">
              <input
                className="form-input"
                inputMode="numeric"
                value={jarInputs[String(category.id)] ?? ''}
                onChange={(event) => setJarInputs({ ...jarInputs, [String(category.id)]: formatMoneyInput(event.target.value) })}
                aria-label={`Hạn mức tháng cho ${category.name}`}
                placeholder="Hạn mức tháng"
              />
              <button className="btn btn-secondary" onClick={() => saveJarLimit(category)} disabled={savingCategoryId === category.id}>
                <Save size={16} />
                {savingCategoryId === category.id ? 'Đang lưu' : 'Lưu'}
              </button>
            </div>
            {isWarning && (
              <div className={`jar-alert ${isExceeded ? 'danger' : ''}`}>
                <CircleAlert size={16} />
                {isExceeded ? 'Đã vượt hạn mức danh mục' : 'Đã dùng trên 80% hạn mức'}
              </div>
            )}
          </div>
        )}
      </article>
    )
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Danh mục & hũ chi tiêu</h1>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
          <CirclePlus size={18} /> Thêm danh mục
        </button>
      </div>

      <section className="jar-summary">
        <div>
          <span>Ví đang phân bổ</span>
          <strong>{defaultWallet?.name || 'Ví chính'}</strong>
        </div>
        <div>
          <span>Hạn mức ví tháng</span>
          <strong>{formatCurrency(monthlySpendingLimit)}</strong>
        </div>
        <div>
          <span>Đã phân bổ vào hũ</span>
          <strong className={allocatedAmount > monthlySpendingLimit ? 'danger-text' : ''}>
            {formatCurrency(allocatedAmount)} ({allocationPercent}%)
          </strong>
        </div>
      </section>

      {error && <div className="auth-error">{error}</div>}

      <div className="filter-bar">
        <Filter size={18} />
        <select className="form-select" value={filterType} onChange={(event) => setFilterType(event.target.value as any)}>
          <option value="expense">Chi tiêu</option>
          <option value="income">Thu nhập</option>
          <option value="all">Tất cả</option>
        </select>
      </div>

      {(filterType === 'all' || filterType === 'expense') && (
        <section className="jar-section">
          <h2>
            <TrendingDown size={20} /> Chi tiêu ({expenseCategories.length})
          </h2>
          <div className="jar-grid">{expenseCategories.map(renderCategoryCard)}</div>
        </section>
      )}

      {(filterType === 'all' || filterType === 'income') && (
        <section className="jar-section">
          <h2>
            <TrendingUp size={20} /> Thu nhập ({incomeCategories.length})
          </h2>
          <div className="jar-grid">{incomeCategories.map(renderCategoryCard)}</div>
        </section>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Sửa danh mục' : 'Thêm danh mục riêng'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Đóng">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit}>
              <div className="modal-body">
                {error && <div className="auth-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Loại danh mục</label>
                  <div className="segmented-control">
                    <button
                      type="button"
                      className={formData.type === 'expense' ? 'active danger' : ''}
                      onClick={() => setFormData({ ...formData, type: 'expense' })}
                    >
                      Chi tiêu
                    </button>
                    <button
                      type="button"
                      className={formData.type === 'income' ? 'active' : ''}
                      onClick={() => setFormData({ ...formData, type: 'income' })}
                    >
                      Thu nhập
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="category-name">Tên danh mục</label>
                  <input
                    id="category-name"
                    className="form-input"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="category-note">Ghi chú</label>
                  <textarea
                    id="category-note"
                    className="form-textarea"
                    value={formData.note}
                    onChange={(event) => setFormData({ ...formData, note: event.target.value })}
                    placeholder="Mục đích hoặc quy tắc dùng danh mục này"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Icon</label>
                  <div className="icon-picker">
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        className={formData.icon === icon ? 'active' : ''}
                        onClick={() => setFormData({ ...formData, icon })}
                        title={icon}
                      >
                        <CategoryIcon icon={icon} size={22} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Màu sắc</label>
                  <div className="color-picker">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={formData.color === color ? 'active' : ''}
                        style={{ background: color }}
                        onClick={() => setFormData({ ...formData, color })}
                        aria-label={`Chọn màu ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmData && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmData(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Xóa danh mục</h2>
              <button className="modal-close" onClick={() => setDeleteConfirmData(null)} aria-label="Đóng">
                <X size={22} />
              </button>
            </div>
            <div className="modal-body">
              <p>Bạn muốn xóa danh mục “{deleteConfirmData.name}”?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmData(null)}>
                Hủy
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={loading}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
