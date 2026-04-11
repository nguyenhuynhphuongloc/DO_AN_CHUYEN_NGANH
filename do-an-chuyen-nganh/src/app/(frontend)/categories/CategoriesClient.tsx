'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdClose, 
  MdTrendingUp, 
  MdTrendingDown,
  MdFilterList
} from 'react-icons/md'
import CategoryIcon from '@/components/CategoryIcon'

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

const ICON_OPTIONS = [
  'MdRestaurant', 'MdDirectionsCar', 'MdGames', 'MdAttachMoney', 'MdHome', 
  'MdMenuBook', 'MdMedicalServices', 'MdCardGiftcard', 'MdFlight', 'MdCheckroom', 
  'MdWork', 'MdPhoneAndroid', 'MdMovie', 'MdLocalCafe', 'MdShoppingCart', 
  'MdLightbulb', 'MdFitnessCenter', 'MdMusicNote', 'MdCreditCard', 'MdInventory2',
  'MdSchool', 'MdPets', 'MdPhonelink', 'MdSelfImprovement', 'MdVolunteerActivism', 'MdPaid'
]

const COLOR_OPTIONS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16']

export default function CategoriesClient({ initialCategories }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [deleteConfirmData, setDeleteConfirmData] = useState<Category | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    icon: 'MdInventory2',
    color: '#6366f1',
  })

  const resetForm = () => {
    setFormData({ name: '', type: 'expense', icon: 'MdInventory2', color: '#6366f1' })
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

  const confirmDelete = async () => {
    if (!deleteConfirmData) return
    setLoading(true)
    try {
      const res = await fetch(`/api/categories/${deleteConfirmData.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const errData = await res.json()
        const message = errData.errors?.[0]?.message || errData.message || 'Không thể xóa danh mục'
        alert(`Lỗi: ${message}`)
      }
      setDeleteConfirmData(null)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
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
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true) }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdAdd size={20} /> Thêm danh mục
        </button>
      </div>

      <div className="filter-bar" style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <MdFilterList size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <select
            className="form-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: 'auto', minWidth: '150px', paddingLeft: '36px' }}
          >
            <option value="all">Tất cả</option>
            <option value="income">Thu nhập</option>
            <option value="expense">Chi tiêu</option>
          </select>
        </div>
      </div>

      {filterType === 'all' || filterType === 'expense' ? (
        <>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--expense-color)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdTrendingDown size={20} /> Chi tiêu ({expenseCategories.length})
          </h3>
          <div className="category-grid" style={{ marginBottom: '32px' }}>
            {expenseCategories.map((c) => (
              <div className="category-card" key={c.id}>
                <div className="category-card-icon" style={{ background: `${c.color}20`, color: c.color }}>
                  <CategoryIcon icon={c.icon} size={24} />
                </div>
                <div>
                  <div className="category-card-name">{c.name}</div>
                  <div className="category-card-type">{c.isDefault ? 'Mặc định' : 'Tùy chỉnh'}</div>
                </div>
                {!c.isDefault && (
                  <div className="category-card-actions">
                    <button className="btn-icon" onClick={() => openEditModal(c)} style={{ color: '#f59e0b' }} title="Sửa">
                      <MdEdit size={18} />
                    </button>
                    <button className="btn-icon" onClick={() => setDeleteConfirmData(c)} style={{ color: 'var(--danger)' }} title="Xóa">
                      <MdClose size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {filterType === 'all' || filterType === 'income' ? (
        <>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--income-color)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdTrendingUp size={20} /> Thu nhập ({incomeCategories.length})
          </h3>
          <div className="category-grid">
            {incomeCategories.map((c) => (
              <div className="category-card" key={c.id}>
                <div className="category-card-icon" style={{ background: `${c.color}20`, color: c.color }}>
                  <CategoryIcon icon={c.icon} size={24} />
                </div>
                <div>
                  <div className="category-card-name">{c.name}</div>
                  <div className="category-card-type">{c.isDefault ? 'Mặc định' : 'Tùy chỉnh'}</div>
                </div>
                {!c.isDefault && (
                  <div className="category-card-actions">
                    <button className="btn-icon" onClick={() => openEditModal(c)} style={{ color: '#f59e0b' }} title="Sửa">
                      <MdEdit size={18} />
                    </button>
                    <button className="btn-icon" onClick={() => setDeleteConfirmData(c)} style={{ color: 'var(--danger)' }} title="Xóa">
                      <MdClose size={18} />
                    </button>
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
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <MdClose size={24} />
              </button>
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
                          width: '44px', height: '44px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '8px',
                          border: formData.icon === icon ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: formData.icon === icon ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)',
                          color: formData.icon === icon ? 'var(--primary)' : 'var(--text-primary)',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        title={icon}
                      >
                        <CategoryIcon icon={icon} size={24} />
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmData && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmData(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Xác nhận xóa</h2>
              <button className="modal-close" onClick={() => setDeleteConfirmData(null)}>
                <MdClose size={24} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  color: '#ef4444'
                }}>
                  <MdDelete size={32} />
                </div>
                <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Xác nhận xóa?
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                  Bạn có chắc chắn muốn xóa danh mục <strong>"{deleteConfirmData.name}"</strong>? Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: 'none', display: 'flex', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteConfirmData(null)}>
                Hủy
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none' }} 
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
