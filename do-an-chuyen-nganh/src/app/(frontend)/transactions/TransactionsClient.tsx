'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { 
  MdEdit, 
  MdDelete, 
  MdSearch, 
  MdAdd, 
  MdClose, 
  MdWarning,
  MdArrowUpward,
  MdArrowDownward,
  MdReceipt,
  MdFilterList,
  MdCheck
} from 'react-icons/md'
import CategoryIcon from '@/components/CategoryIcon'

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
  currentMonth: number
  currentYear: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

export default function TransactionsClient({ initialTransactions, totalDocs, categories, currentMonth, currentYear }: Props) {
  const router = useRouter()
  const [transactions, setTransactions] = useState(initialTransactions)
  
  // Đồng bộ hóa state khi initialTransactions từ server thay đổi (do điều hướng tháng/năm)
  React.useEffect(() => {
    setTransactions(initialTransactions)
  }, [initialTransactions])

  const [showModal, setShowModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')

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
    setError('')
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
    setError('')
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ lớn hơn 0')
      setLoading(false)
      return
    }

    if (!formData.category) {
      setError('Vui lòng chọn danh mục')
      setLoading(false)
      return
    }

    const payload = {
      type: formData.type,
      amount,
      category: Number(formData.category),
      description: formData.description,
      date: new Date(formData.date).toISOString(),
      note: formData.note,
    }

    try {
      let res: Response
      if (editingId) {
        res = await fetch(`/api/transactions/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        const errorMsg = data.errors?.[0]?.message || 'Không thể lưu giao dịch. Vui lòng kiểm tra lại.'
        setError(errorMsg)
        return
      }

      setShowModal(false)
      resetForm()
      router.refresh()
    } catch (err) {
      console.error(err)
      setError('Có lỗi xảy ra khi kết nối đến máy chủ')
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

  const updateDateFilter = (month: number, year: number) => {
    const params = new URLSearchParams()
    params.set('month', month.toString())
    params.set('year', year.toString())
    router.push(`/transactions?${params.toString()}`)
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false
    if (filterCategory !== 'all') {
      const catId = typeof t.category === 'object' ? t.category?.id : t.category
      if (String(catId) !== filterCategory) return false
    }
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
          <p className="page-subtitle">Quản lý giao dịch tháng {currentMonth}/{currentYear} ({totalDocs} giao dịch)</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="month-selector" style={{ display: 'flex', gap: '8px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <select 
              className="form-select" 
              value={currentMonth}
              onChange={(e) => updateDateFilter(parseInt(e.target.value), currentYear)}
              style={{ border: 'none', background: 'transparent', height: '32px', padding: '0 8px', fontSize: '13px', width: 'auto' }}
            >
              {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
            </select>
            <select 
              className="form-select" 
              value={currentYear}
              onChange={(e) => updateDateFilter(currentMonth, parseInt(e.target.value))}
              style={{ border: 'none', background: 'transparent', height: '32px', padding: '0 8px', fontSize: '13px', width: 'auto' }}
            >
              {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdAdd size={20} /> Thêm
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div className="search-input-wrapper" style={{ flex: 1, position: 'relative' }}>
          <MdSearch size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Tìm kiếm giao dịch..."
            style={{ paddingLeft: '40px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <MdFilterList size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <select
            className="form-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: 'auto', minWidth: '150px', paddingLeft: '36px' }}
          >
            <option value="all">Tất cả loại</option>
            <option value="income">Thu nhập</option>
            <option value="expense">Chi tiêu</option>
          </select>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            className="form-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="all">Tất cả danh mục</option>
            {categories
              .filter(c => filterType === 'all' || c.type === filterType)
              .map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))
            }
          </select>
        </div>
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
                        <span className={`type-badge ${t.type}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                          {t.type === 'income' ? <MdArrowUpward size={14} /> : <MdArrowDownward size={14} />}
                          {t.type === 'income' ? 'Thu' : 'Chi'}
                        </span>
                      </td>
                      <td>{t.description || '—'}</td>
                      <td>
                        {cat ? (
                          <span className="category-tag">
                            {cat.name}
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
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="btn-icon" onClick={() => openEditModal(t)} title="Sửa">
                            <MdEdit size={18} color="#eab308" />
                          </button>
                          <button className="btn-icon" onClick={() => setShowDeleteConfirm(t.id)} title="Xóa" style={{ borderColor: 'rgba(239,68,68,0.2)', color: 'var(--danger)' }}>
                            <MdClose size={18} />
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
              <MdReceipt size={48} color="var(--bg-secondary)" />
            </div>
            <h3 className="empty-state-title">Chưa có giao dịch nào</h3>
            <p className="empty-state-desc">Bắt đầu bằng cách thêm giao dịch đầu tiên</p>
            <button className="btn btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MdAdd size={18} /> Thêm giao dịch
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <MdClose size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--danger)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '20px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    {error}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Loại giao dịch</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className={`btn ${formData.type === 'expense' ? 'btn-danger' : 'btn-secondary'}`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                    >
                      <MdArrowDownward size={18} /> Chi tiêu
                    </button>
                    <button
                      type="button"
                      className={`btn ${formData.type === 'income' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                    >
                      <MdArrowUpward size={18} /> Thu nhập
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
                      <option key={c.id} value={c.id}>{c.name}</option>
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
              <div className="confirm-dialog" style={{ textAlign: 'center', padding: '20px' }}>
                <div className="confirm-dialog-icon" style={{ marginBottom: '16px' }}>
                  <MdWarning size={48} color="var(--danger)" />
                </div>
                <h3 className="confirm-dialog-title">Xác nhận xóa</h3>
                <p className="confirm-dialog-message">Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể hoàn tác.</p>
                <div className="confirm-dialog-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
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
