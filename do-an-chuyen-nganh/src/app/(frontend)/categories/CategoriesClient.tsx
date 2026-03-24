'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  icon: string
  color: string
  isDefault: boolean
  user?: string | { id: string }
}

interface Props {
  initialCategories: Category[]
}

const ICON_OPTIONS = ['🍔', '🚗', '🎮', '💰', '🏠', '📚', '💊', '🎁', '✈️', '👕', '💼', '📱', '🎬', '☕', '🛒', '💡', '🏋️', '🎵', '💳', '📦']

const COLOR_OPTIONS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16']

export default function CategoriesClient({ initialCategories }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    icon: '📦',
    color: '#6366f1',
  })

  const resetForm = () => {
    setFormData({ name: '', type: 'expense', icon: '📦', color: '#6366f1' })
    setEditingId(null)
  }

  const openEditModal = (c: Category) => {
    setFormData({ name: c.name, type: c.type, icon: c.icon, color: c.color })
    setEditingId(c.id)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingId) {
        await fetch(`/api/categories/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      } else {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
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
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const filteredCategories = initialCategories.filter((c) => {
    if (filterType !== 'all' && c.type !== filterType) return false
    return true
  })

  const expenseCategories = filteredCategories.filter((c) => c.type === 'expense')
  const incomeCategories = filteredCategories.filter((c) => c.type === 'income')

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Danh mục</h1>
          <p className="page-subtitle">Quản lý danh mục thu chi của bạn</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }}>
          + Thêm danh mục
        </button>
      </div>

      <div className="filter-bar">
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

      {filterType === 'all' || filterType === 'expense' ? (
        <>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--expense-color)', marginBottom: '16px' }}>
            📉 Chi tiêu ({expenseCategories.length})
          </h3>
          <div className="category-grid" style={{ marginBottom: '32px' }}>
            {expenseCategories.map((c) => (
              <div className="category-card" key={c.id}>
                <div className="category-card-icon" style={{ background: `${c.color}20` }}>
                  {c.icon}
                </div>
                <div>
                  <div className="category-card-name">{c.name}</div>
                  <div className="category-card-type">{c.isDefault ? 'Mặc định' : 'Tùy chỉnh'}</div>
                </div>
                {!c.isDefault && (
                  <div className="category-card-actions">
                    <button className="btn-icon" onClick={() => openEditModal(c)}>✏️</button>
                    <button className="btn-icon" onClick={() => handleDelete(c.id)} style={{ color: 'var(--danger)' }}>🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {filterType === 'all' || filterType === 'income' ? (
        <>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--income-color)', marginBottom: '16px' }}>
            📈 Thu nhập ({incomeCategories.length})
          </h3>
          <div className="category-grid">
            {incomeCategories.map((c) => (
              <div className="category-card" key={c.id}>
                <div className="category-card-icon" style={{ background: `${c.color}20` }}>
                  {c.icon}
                </div>
                <div>
                  <div className="category-card-name">{c.name}</div>
                  <div className="category-card-type">{c.isDefault ? 'Mặc định' : 'Tùy chỉnh'}</div>
                </div>
                {!c.isDefault && (
                  <div className="category-card-actions">
                    <button className="btn-icon" onClick={() => openEditModal(c)}>✏️</button>
                    <button className="btn-icon" onClick={() => handleDelete(c.id)} style={{ color: 'var(--danger)' }}>🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Loại</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className={`btn ${formData.type === 'expense' ? 'btn-danger' : 'btn-secondary'}`}
                      style={{ flex: 1 }}
                      onClick={() => setFormData({ ...formData, type: 'expense' })}
                    >
                      Chi tiêu
                    </button>
                    <button
                      type="button"
                      className={`btn ${formData.type === 'income' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1 }}
                      onClick={() => setFormData({ ...formData, type: 'income' })}
                    >
                      Thu nhập
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Tên danh mục</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ví dụ: Cà phê"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Icon</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        style={{
                          width: '40px', height: '40px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '20px', borderRadius: '8px',
                          border: formData.icon === icon ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: formData.icon === icon ? 'rgba(99,102,241,0.1)' : 'transparent',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Màu sắc</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        style={{
                          width: '32px', height: '32px',
                          borderRadius: '50%',
                          background: color,
                          border: formData.color === color ? '3px solid white' : '2px solid transparent',
                          cursor: 'pointer',
                          boxShadow: formData.color === color ? `0 0 0 2px ${color}` : 'none',
                          transition: 'all 0.2s',
                        }}
                      />
                    ))}
                  </div>
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
    </>
  )
}
