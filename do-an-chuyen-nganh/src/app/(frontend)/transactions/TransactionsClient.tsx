'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: 'income' | 'expense'
}

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description?: string
  date: string
  note?: string
  category?: Category | string
}

interface Props {
  initialTransactions: Transaction[]
  totalDocs: number
  categories: Category[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

export default function TransactionsClient({ initialTransactions, totalDocs, categories }: Props) {
  const router = useRouter()
  const [transactions, setTransactions] = useState(initialTransactions)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  })

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    })
    setEditingId(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (t: Transaction) => {
    const catId = typeof t.category === 'object' ? t.category?.id : t.category
    setFormData({
      type: t.type,
      amount: String(t.amount),
      category: catId || '',
      description: t.description || '',
      date: t.date ? t.date.split('T')[0] : '',
      note: t.note || '',
    })
    setEditingId(t.id)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      date: new Date(formData.date).toISOString(),
      note: formData.note,
    }

    try {
      if (editingId) {
        await fetch(`/api/transactions/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      setShowModal(false)
      resetForm()
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      setShowDeleteConfirm(null)
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const filteredCategories = formData.type
    ? categories.filter((c) => c.type === formData.type)
    : categories

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const desc = (t.description || '').toLowerCase()
      const catName = typeof t.category === 'object' ? (t.category?.name || '').toLowerCase() : ''
      if (!desc.includes(q) && !catName.includes(q)) return false
    }
    return true
  })

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Giao dịch</h1>
          <p className="page-subtitle">Quản lý các khoản thu chi của bạn ({totalDocs} giao dịch)</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          + Thêm giao dịch
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="form-input"
          placeholder="🔍 Tìm kiếm giao dịch..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="form-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ width: 'auto', minWidth: '150px' }}
        >
          <option value="all">Tất cả</option>
          <option value="income">Thu nhập</option>
          <option value="expense">Chi tiêu</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {filteredTransactions.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Loại</th>
                  <th>Mô tả</th>
                  <th>Danh mục</th>
                  <th>Ngày</th>
                  <th style={{ textAlign: 'right' }}>Số tiền</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => {
                  const cat = typeof t.category === 'object' ? t.category : null
                  return (
                    <tr key={t.id}>
                      <td>
                        <span className={`type-badge ${t.type}`}>
                          {t.type === 'income' ? '↗ Thu' : '↘ Chi'}
                        </span>
                      </td>
                      <td>{t.description || '—'}</td>
                      <td>
                        {cat ? (
                          <span className="category-tag">
                            {cat.icon} {cat.name}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {format(new Date(t.date), 'dd/MM/yyyy', { locale: vi })}
                      </td>
                      <td style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: t.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)',
                      }}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button className="btn-icon" onClick={() => openEditModal(t)} title="Sửa">✏️</button>
                          <button className="btn-icon" onClick={() => setShowDeleteConfirm(t.id)} title="Xóa" style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--danger)' }}>🗑️</button>
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
            <div className="empty-state-icon">💸</div>
            <h3 className="empty-state-title">Chưa có giao dịch nào</h3>
            <p className="empty-state-desc">Bắt đầu bằng cách thêm giao dịch đầu tiên</p>
            <button className="btn btn-primary" onClick={openAddModal}>+ Thêm giao dịch</button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Loại giao dịch</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className={`btn ${formData.type === 'expense' ? 'btn-danger' : 'btn-secondary'}`}
                      style={{ flex: 1 }}
                      onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                    >
                      ↘ Chi tiêu
                    </button>
                    <button
                      type="button"
                      className={`btn ${formData.type === 'income' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1 }}
                      onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                    >
                      ↗ Thu nhập
                    </button>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Số tiền (VND)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ngày</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Danh mục</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Chọn danh mục</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ví dụ: Cà phê sáng"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ghi chú</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Ghi chú thêm (tùy chọn)"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-body">
              <div className="confirm-dialog">
                <div className="confirm-dialog-icon">⚠️</div>
                <h3 className="confirm-dialog-title">Xác nhận xóa</h3>
                <p className="confirm-dialog-message">Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể hoàn tác.</p>
                <div className="confirm-dialog-actions">
                  <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Hủy</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(showDeleteConfirm)}>Xóa</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
