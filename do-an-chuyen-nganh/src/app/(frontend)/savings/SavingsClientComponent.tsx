'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Banknote as MdAttachMoney,
  Bell as MdNotifications,
  Car,
  Check as MdCheck,
  CircleDollarSign,
  Flag as MdFlag,
  House,
  Laptop,
  Plane,
  Plus as MdAdd,
  Search as MdSearch,
  Target,
  TrendingUp as MdTrendingUp,
  User as MdPerson,
  Users as MdGroups,
  X as MdClose,
} from 'lucide-react'
import { formatMoneyInput, parseMoneyInput } from '@/lib/money-input'

interface User {
  id: string
  name?: string
  email: string
}

interface Goal {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
  status: 'active' | 'completed'
  icon: string
  color: string
  owner: User | string
  participants?: (User | string)[]
  createdAt: string
}

interface Notification {
  id: string
  message: string
  read: boolean
  link?: string
}

interface Props {
  initialGoals: Goal[]
  allUsers: User[]
  initialNotifications: Notification[]
  categories: any[]
  currentUser: any
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

const goalIconMap = {
  Target,
  Laptop,
  House,
  Car,
  Plane,
  CircleDollarSign,
  '🎯': Target,
  '💻': Laptop,
  '🏠': House,
  '🚗': Car,
  '✈️': Plane,
  '💰': CircleDollarSign,
} as const

const renderGoalIcon = (icon: string, size = 24) => {
  const Icon = goalIconMap[icon as keyof typeof goalIconMap] || Target
  return <Icon size={size} strokeWidth={2.1} />
}

export default function SavingsClient({ initialGoals, allUsers, initialNotifications, categories, currentUser }: Props) {
  const router = useRouter()
  const [goals, setGoals] = useState(initialGoals)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showContributeModal, setShowContributeModal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [error, setError] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '')

  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    icon: 'Target',
    color: '#6366f1',
  })

  const [contributeAmount, setContributeAmount] = useState('')

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      title: formData.title,
      targetAmount: parseMoneyInput(formData.targetAmount),
      icon: formData.icon,
      color: formData.color,
      participants: selectedParticipants,
      status: 'active'
    }

    try {
      const res = await fetch('/api/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.errors?.[0]?.message || 'Không thể tạo mục tiêu')
      }
      
      setShowAddModal(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showContributeModal) return
    setLoading(true)

    try {
      if (!selectedCategoryId) {
        throw new Error('Vui lòng chọn danh mục để trừ tiền')
      }

      // 1. Tạo giao dịch chi tiêu liên kết với mục tiêu tiết kiệm
      const transactionPayload = {
        type: 'expense',
        amount: parseMoneyInput(contributeAmount),
        category: selectedCategoryId,
        description: `Đóng góp tích lũy: ${showContributeModal.title}`,
        savingsGoal: showContributeModal.id,
        date: new Date().toISOString(),
        user: currentUser.id
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Đảm bảo gửi kèm cookie xác thực
        body: JSON.stringify(transactionPayload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.errors?.[0]?.message || 'Lỗi khi thực hiện đóng góp')
      }

      setShowContributeModal(null)
      setContributeAmount('')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = allUsers.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Mục tiêu tiết kiệm</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdAdd size={20} /> Tạo mục tiêu mới
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card balance">
          <div className="stat-card-header">
            <span className="stat-card-label">Tổng tích lũy hiện tại</span>
            <div className="stat-card-icon balance"><MdTrendingUp size={24} /></div>
          </div>
          <div className="stat-card-value balance">
            {formatCurrency(goals.reduce((s, g) => s + g.currentAmount, 0))}
          </div>
        </div>
        <div className="stat-card income">
          <div className="stat-card-header">
            <span className="stat-card-label">Mục tiêu đang thực hiện</span>
            <div className="stat-card-icon income"><MdFlag size={24} /></div>
          </div>
          <div className="stat-card-value income">{goals.filter(g => g.status === 'active').length}</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-card-header">
            <span className="stat-card-label">Thông báo mới</span>
            <div className="stat-card-icon expense"><MdNotifications size={24} /></div>
          </div>
          <div className="stat-card-value expense">{initialNotifications.length}</div>
        </div>
      </div>

      {/* Goals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {goals.map(goal => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
          const isOwner = typeof goal.owner === 'object' ? goal.owner.id === currentUser.id : goal.owner === currentUser.id
          
          return (
            <div key={goal.id} className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ padding: '12px', background: `${goal.color}15`, borderRadius: '12px', fontSize: '24px' }}>
                  {renderGoalIcon(goal.icon)}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                   {goal.participants && goal.participants.length > 0 && (
                     <span className="type-badge income" title="Mục tiêu nhóm"><MdGroups size={16} /> Nhóm</span>
                   )}
                   {goal.status === 'completed' && (
                     <span className="type-badge income"><MdCheck size={16} /> Hoàn thành</span>
                   )}
                </div>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{goal.title}</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tiến độ: {progress.toFixed(1)}%</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', marginBottom: '20px' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${progress}%`, 
                  background: goal.color, 
                  borderRadius: '4px',
                  transition: 'width 1s ease-in-out'
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '-8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px' }} title="Chủ sở hữu">
                    <MdPerson size={16} />
                  </div>
                  {goal.participants?.map((p: any, i) => (
                    <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px solid var(--bg-primary)', marginLeft: '-8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }} title={p.name || p.email}>
                      {p.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  ))}
                </div>
                
                {goal.status === 'active' && (
                  <button className="btn btn-secondary" onClick={() => setShowContributeModal(goal)} style={{ fontSize: '13px', padding: '8px 16px' }}>
                    Đóng góp
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Tạo mục tiêu tiết kiệm mới</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}><MdClose size={24} /></button>
            </div>
            <form onSubmit={handleCreateGoal}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tên mục tiêu</label>
                  <input type="text" className="form-input" placeholder="Ví dụ: Mua Macbook Pro" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Số tiền cần tiết kiệm (VND)</label>
                    <input inputMode="numeric" className="form-input" placeholder="1.000.000" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: formatMoneyInput(e.target.value)})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Biểu tượng</label>
                    <select className="form-select" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})}>
                      <option value="Target">Mục tiêu</option>
                      <option value="Laptop">Công nghệ</option>
                      <option value="House">Nhà cửa</option>
                      <option value="Car">Xe cộ</option>
                      <option value="Plane">Du lịch</option>
                      <option value="CircleDollarSign">Tích lũy</option>
                    </select>
                  </div>
                </div>

                {/* Participant Selection */}
                <div className="form-group">
                  <label className="form-label">Mời thành viên (Ví chung)</label>
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <MdSearch size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" className="form-input" placeholder="Tìm kiếm theo tên hoặc email..." style={{ paddingLeft: '40px' }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px' }}>
                    {filteredUsers.length > 0 ? filteredUsers.map(u => (
                      <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: '1px solid var(--bg-secondary)' }}>
                        <span style={{ fontSize: '13px' }}>{u.name || u.email}</span>
                        <input type="checkbox" checked={selectedParticipants.includes(u.id)} onChange={(e) => {
                          if (e.target.checked) setSelectedParticipants([...selectedParticipants, u.id])
                          else setSelectedParticipants(selectedParticipants.filter(id => id !== u.id))
                        }} />
                      </div>
                    )) : <p style={{ fontSize: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>Không tìm thấy người dùng</p>}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo mục tiêu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {showContributeModal && (
        <div className="modal-overlay" onClick={() => setShowContributeModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Đóng góp tích lũy</h2>
              <button className="modal-close" onClick={() => setShowContributeModal(null)}><MdClose size={24} /></button>
            </div>
            <form onSubmit={handleContribute}>
              <div className="modal-body">
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>Bạn đang đóng góp vào mục tiêu: <strong>{showContributeModal.title}</strong></p>
                <div className="form-group">
                  <label className="form-label">Số tiền đóng góp (VND)</label>
                  <input inputMode="numeric" className="form-input" placeholder="1.000.000" value={contributeAmount} onChange={e => setContributeAmount(formatMoneyInput(e.target.value))} required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Chi tiêu từ danh mục</label>
                  <select 
                    className="form-select" 
                    value={selectedCategoryId} 
                    onChange={e => setSelectedCategoryId(e.target.value)}
                    required
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowContributeModal(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MdAttachMoney size={18} /> {loading ? 'Đang xử lý...' : 'Xác nhận đóng góp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
