'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Edit3,
  Eye,
  Filter,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { formatMoneyInput, parseMoneyInput } from '@/lib/money-input'

type Category = {
  id: string | number
  name: string
  icon?: string | null
  color?: string | null
  type: 'income' | 'expense'
}

type Wallet = {
  id: string | number
  name: string
  walletType: string
}

type Transaction = {
  id: string | number
  type: 'income' | 'expense'
  amount: number
  description?: string | null
  date: string
  note?: string | null
  category?: Category | string | number | null
  wallet?: Wallet | string | number | null
  sourceType?: 'manual' | 'chatbot' | 'receipt_ai' | 'transfer' | 'adjustment' | null
  receipt?: { id: string | number; url?: string | null; filename?: string | null } | string | number | null
}

type Props = {
  initialTransactions: Transaction[]
  totalDocs: number
  categories: Category[]
  wallets: Wallet[]
  currentMonth: number
  currentYear: number
  filters: {
    wallet: string
    type: string
    category: string
    source: string
    search: string
  }
}

const sourceLabels: Record<string, string> = {
  manual: 'Nhập tay',
  chatbot: 'Chatbot',
  receipt_ai: 'OCR',
  receipt_AI: 'OCR',
  transfer: 'Chuyển ví',
  adjustment: 'Điều chỉnh',
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

const getRelationId = (value: unknown) => {
  if (typeof value === 'object' && value && 'id' in value) return String((value as { id: string | number }).id)
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return ''
}

export default function TransactionsClient({
  initialTransactions,
  totalDocs,
  categories,
  wallets,
  currentMonth,
  currentYear,
  filters,
}: Props) {
  const router = useRouter()
  const [transactions, setTransactions] = useState(initialTransactions)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState(filters.type)
  const [filterCategory, setFilterCategory] = useState(filters.category)
  const [filterWallet, setFilterWallet] = useState(filters.wallet)
  const [filterSource, setFilterSource] = useState(filters.source)
  const [searchQuery, setSearchQuery] = useState(filters.search)
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    wallet: wallets[0]?.id ? String(wallets[0].id) : '',
    category: '',
    sourceType: 'manual',
    description: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  })

  useEffect(() => {
    setTransactions(initialTransactions)
  }, [initialTransactions])

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => category.type === formData.type)
  }, [categories, formData.type])

  const months = Array.from({ length: 12 }, (_, index) => index + 1)
  const years = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - index)

  const resetForm = () => {
    setEditingId(null)
    setError('')
    setFormData({
      type: 'expense',
      amount: '',
      wallet: wallets[0]?.id ? String(wallets[0].id) : '',
      category: '',
      sourceType: 'manual',
      description: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    })
  }

  const pushFilters = (next: Partial<Props['filters']> & { month?: number; year?: number }) => {
    const merged = {
      wallet: filterWallet,
      type: filterType,
      category: filterCategory,
      source: filterSource,
      search: searchQuery,
      ...next,
    }
    const params = new URLSearchParams()
    params.set('month', String(next.month ?? currentMonth))
    params.set('year', String(next.year ?? currentYear))
    params.set('wallet', merged.wallet)
    params.set('type', merged.type)
    params.set('category', merged.category)
    params.set('source', merged.source)
    if (merged.search.trim()) params.set('search', merged.search.trim())
    router.push(`/transactions?${params.toString()}`)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (transaction: Transaction) => {
    const categoryId = getRelationId(transaction.category)
    const walletId = getRelationId(transaction.wallet)
    setEditingId(String(transaction.id))
    setError('')
    setFormData({
      type: transaction.type,
      amount: formatMoneyInput(transaction.amount),
      wallet: walletId || (wallets[0]?.id ? String(wallets[0].id) : ''),
      category: categoryId,
      sourceType: transaction.sourceType || 'manual',
      description: transaction.description || '',
      date: transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
      note: transaction.note || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    const amount = parseMoneyInput(formData.amount)
    if (!amount || amount <= 0) {
      setError('Số tiền phải lớn hơn 0.')
      setLoading(false)
      return
    }

    if (!formData.wallet || !formData.category) {
      setError('Vui lòng chọn ví và danh mục.')
      setLoading(false)
      return
    }

    const response = await fetch(editingId ? `/api/transactions/${editingId}` : '/api/transactions', {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: formData.type,
        amount,
        wallet: Number(formData.wallet),
        category: Number(formData.category),
        sourceType: formData.sourceType,
        description: formData.description,
        date: new Date(formData.date).toISOString(),
        note: formData.note,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      setError(data.error || data.errors?.[0]?.message || 'Không thể lưu giao dịch.')
      setLoading(false)
      return
    }

    setShowModal(false)
    setLoading(false)
    resetForm()
    router.refresh()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setLoading(true)
    await fetch(`/api/transactions/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Giao dịch</h1>
        </div>
        <div className="transaction-header-actions">
          <div className="month-selector">
            <CalendarDays size={17} />
            <select
              className="form-select"
              value={currentMonth}
              onChange={(event) => pushFilters({ month: Number(event.target.value) })}
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  Tháng {month}
                </option>
              ))}
            </select>
            <select
              className="form-select"
              value={currentYear}
              onChange={(event) => pushFilters({ year: Number(event.target.value) })}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Thêm giao dịch
          </button>
        </div>
      </div>

      <div className="filter-bar transaction-filter-bar">
        <div className="transaction-search">
          <Search size={18} />
          <input
            type="text"
            className="form-input"
            placeholder="Tìm mô tả, cửa hàng, ghi chú..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') pushFilters({ search: searchQuery })
            }}
          />
        </div>
        <select
          className="form-select"
          value={filterWallet}
          onChange={(event) => {
            setFilterWallet(event.target.value)
            pushFilters({ wallet: event.target.value })
          }}
        >
          <option value="all">Tất cả ví</option>
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </select>
        <select
          className="form-select"
          value={filterType}
          onChange={(event) => {
            setFilterType(event.target.value)
            setFilterCategory('all')
            pushFilters({ type: event.target.value, category: 'all' })
          }}
        >
          <option value="all">Tất cả loại</option>
          <option value="income">Thu nhập</option>
          <option value="expense">Chi tiêu</option>
        </select>
        <select
          className="form-select"
          value={filterCategory}
          onChange={(event) => {
            setFilterCategory(event.target.value)
            pushFilters({ category: event.target.value })
          }}
        >
          <option value="all">Tất cả danh mục</option>
          {categories
            .filter((category) => filterType === 'all' || category.type === filterType)
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
        <select
          className="form-select"
          value={filterSource}
          onChange={(event) => {
            setFilterSource(event.target.value)
            pushFilters({ source: event.target.value })
          }}
        >
          <option value="all">Tất cả nguồn</option>
          {Object.entries(sourceLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="btn btn-secondary" onClick={() => pushFilters({ search: searchQuery })}>
          <Filter size={17} /> Lọc
        </button>
      </div>

      <div className="card">
        {transactions.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Loại</th>
                  <th>Mô tả</th>
                  <th>Ví</th>
                  <th>Danh mục</th>
                  <th>Nguồn</th>
                  <th>Ngày</th>
                  <th style={{ textAlign: 'right' }}>Số tiền</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const category = typeof transaction.category === 'object' ? transaction.category : null
                  const wallet = typeof transaction.wallet === 'object' ? transaction.wallet : null
                  const receipt = typeof transaction.receipt === 'object' ? transaction.receipt : null
                  const receiptUrl = receipt?.url ? `/receipts/${transaction.id}` : null

                  return (
                    <tr key={transaction.id}>
                      <td>
                        <span className={`type-badge ${transaction.type}`}>
                          {transaction.type === 'income' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                          {transaction.type === 'income' ? 'Thu' : 'Chi'}
                        </span>
                      </td>
                      <td>{transaction.description || '—'}</td>
                      <td>{wallet?.name || '—'}</td>
                      <td>{category ? <span className="category-tag">{category.name}</span> : '—'}</td>
                      <td>
                        <span className="category-tag">{sourceLabels[transaction.sourceType || 'manual'] || 'Nhập tay'}</span>
                        {receiptUrl && (
                          <a className="receipt-link" href={receiptUrl} target="_blank" rel="noreferrer">
                            <Eye size={14} /> Xem hóa đơn
                          </a>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: vi })}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: transaction.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)',
                        }}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-icon" onClick={() => openEditModal(transaction)} title="Sửa giao dịch">
                            <Edit3 size={17} />
                          </button>
                          <button className="btn-icon" onClick={() => setDeleteId(String(transaction.id))} title="Xóa giao dịch">
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ReceiptText size={48} />
            </div>
            <h3 className="empty-state-title">Chưa có giao dịch</h3>
            <p className="empty-state-desc">Thêm giao dịch thủ công hoặc lưu từ chatbot/OCR.</p>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={18} /> Thêm giao dịch
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Sửa giao dịch' : 'Thêm giao dịch'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Đóng">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="auth-error">{error}</div>}
                <div className="segmented-control">
                  <button
                    type="button"
                    className={formData.type === 'expense' ? 'active danger' : ''}
                    onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                  >
                    Chi tiêu
                  </button>
                  <button
                    type="button"
                    className={formData.type === 'income' ? 'active' : ''}
                    onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                  >
                    Thu nhập
                  </button>
                </div>

                <div className="form-row" style={{ marginTop: 18 }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="transaction-amount">
                      Số tiền
                    </label>
                    <input
                      id="transaction-amount"
                      className="form-input"
                      inputMode="numeric"
                      value={formData.amount}
                      onChange={(event) => setFormData({ ...formData, amount: formatMoneyInput(event.target.value) })}
                      placeholder="1.000.000"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="transaction-date">
                      Ngày
                    </label>
                    <input
                      id="transaction-date"
                      className="form-input"
                      type="date"
                      value={formData.date}
                      onChange={(event) => setFormData({ ...formData, date: event.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="transaction-wallet">
                      Ví
                    </label>
                    <select
                      id="transaction-wallet"
                      className="form-select"
                      value={formData.wallet}
                      onChange={(event) => setFormData({ ...formData, wallet: event.target.value })}
                      required
                    >
                      <option value="">Chọn ví</option>
                      {wallets.map((wallet) => (
                        <option key={wallet.id} value={wallet.id}>
                          {wallet.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="transaction-category">
                      Danh mục
                    </label>
                    <select
                      id="transaction-category"
                      className="form-select"
                      value={formData.category}
                      onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                      required
                    >
                      <option value="">Chọn danh mục</option>
                      {filteredCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="transaction-source">
                    Nguồn
                  </label>
                  <select
                    id="transaction-source"
                    className="form-select"
                    value={formData.sourceType}
                    onChange={(event) => setFormData({ ...formData, sourceType: event.target.value })}
                    disabled={Boolean(editingId)}
                  >
                    <option value="manual">Nhập tay</option>
                    <option value="chatbot">Chatbot</option>
                    <option value="receipt_ai">OCR</option>
                    <option value="transfer">Chuyển ví</option>
                    <option value="adjustment">Điều chỉnh</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="transaction-description">
                    Mô tả
                  </label>
                  <input
                    id="transaction-description"
                    className="form-input"
                    value={formData.description}
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="transaction-note">
                    Ghi chú
                  </label>
                  <textarea
                    id="transaction-note"
                    className="form-textarea"
                    value={formData.note}
                    onChange={(event) => setFormData({ ...formData, note: event.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu giao dịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Xóa giao dịch</h2>
              <button className="modal-close" onClick={() => setDeleteId(null)} aria-label="Đóng">
                <X size={22} />
              </button>
            </div>
            <div className="modal-body">
              <p>Giao dịch sẽ bị xóa và số dư ví sẽ được hoàn lại theo loại giao dịch.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>
                Hủy
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={loading}>
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
