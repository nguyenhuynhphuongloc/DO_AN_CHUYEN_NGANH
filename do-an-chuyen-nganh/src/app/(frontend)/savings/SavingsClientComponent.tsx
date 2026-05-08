'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  Check,
  CircleDollarSign,
  Flag,
  Laptop,
  PiggyBank,
  Plane,
  Plus,
  Target,
  WalletCards,
  X,
} from 'lucide-react'

import { formatMoneyInput, parseMoneyInput } from '@/lib/money-input'

interface User {
  id: string | number
  name?: string | null
  email: string
}

interface Wallet {
  id: string | number
  name: string
  walletType: 'main' | 'cash' | 'bank' | 'savings'
  balance: number
  currency?: string | null
  isDefault?: boolean | null
}

interface Goal {
  id: string | number
  title: string
  targetAmount: number
  currentAmount: number
  status: 'active' | 'completed'
  icon: string
  color: string
  owner: User | string | number
  participants?: (User | string | number)[]
  createdAt: string
}

interface Contribution {
  id: string | number
  goal?: Goal | string | number | null
  sourceWallet?: Wallet | string | number | null
  amount: number
  date: string
  movementType?: 'contribution' | 'withdrawal'
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
  categories: unknown[]
  wallets: Wallet[]
  contributions: Contribution[]
  currentUser: User
}

const formatCurrency = (value: number, currency = 'VND') => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0)
}

const getRelationId = (value: unknown) => {
  if (typeof value === 'object' && value && 'id' in value) return String((value as { id: string | number }).id)
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return ''
}

const goalIconMap = {
  Target,
  Laptop,
  Plane,
  CircleDollarSign,
} as const

const renderGoalIcon = (icon: string, size = 24) => {
  const Icon = goalIconMap[icon as keyof typeof goalIconMap] || Target
  return <Icon size={size} strokeWidth={2.1} />
}

export default function SavingsClient({
  initialGoals,
  initialNotifications,
  wallets,
  contributions,
  currentUser,
}: Props) {
  const router = useRouter()
  const [showAddGoalModal, setShowAddGoalModal] = useState(false)
  const [showAddWalletModal, setShowAddWalletModal] = useState(false)
  const [showContributeModal, setShowContributeModal] = useState<Goal | null>(null)
  const [showSavingsDepositModal, setShowSavingsDepositModal] = useState(false)
  const [showSavingsWithdrawModal, setShowSavingsWithdrawModal] = useState(false)
  const [showGoalWithdrawModal, setShowGoalWithdrawModal] = useState<Goal | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(initialGoals[0] ?? null)
  const [selectedSavingsWalletId, setSelectedSavingsWalletId] = useState('')
  const [selectedSourceWalletId, setSelectedSourceWalletId] = useState('')
  const [selectedDestinationWalletId, setSelectedDestinationWalletId] = useState('')
  const [walletName, setWalletName] = useState('')
  const [walletBalance, setWalletBalance] = useState('')
  const [savingsDepositAmount, setSavingsDepositAmount] = useState('')
  const [savingsWithdrawAmount, setSavingsWithdrawAmount] = useState('')
  const [goalWithdrawAmount, setGoalWithdrawAmount] = useState('')
  const [contributeAmount, setContributeAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [goalForm, setGoalForm] = useState({
    title: '',
    targetAmount: '',
    icon: 'Target',
    color: '#2563eb',
  })

  const primaryWallet = wallets.find((wallet) => wallet.isDefault) ?? wallets.find((wallet) => wallet.walletType !== 'savings') ?? null
  const savingsWallets = wallets.filter((wallet) => wallet.walletType === 'savings')
  const activeSavingsWallet =
    savingsWallets.find((wallet) => String(wallet.id) === selectedSavingsWalletId) ?? savingsWallets[0] ?? null
  const currency = primaryWallet?.currency || activeSavingsWallet?.currency || 'VND'
  const activeGoals = initialGoals.filter((goal) => goal.status === 'active')
  const totalSavingsBalance = savingsWallets.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0)

  const selectedGoalContributions = useMemo(() => {
    if (!selectedGoal) return []
    return contributions.filter((contribution) => getRelationId(contribution.goal) === String(selectedGoal.id))
  }, [contributions, selectedGoal])

  const sourceWallets = [primaryWallet, ...savingsWallets].filter(Boolean) as Wallet[]

  const handleCreateSavingsWallet = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    const response = await fetch('/api/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-savings',
        name: walletName,
        balance: parseMoneyInput(walletBalance),
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      setError(data.error || 'Không thể tạo ví tiết kiệm.')
      setLoading(false)
      return
    }

    setShowAddWalletModal(false)
    setWalletName('')
    setWalletBalance('')
    setLoading(false)
    router.refresh()
  }

  const handleCreateGoal = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    const response = await fetch('/api/savings-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: goalForm.title,
        targetAmount: parseMoneyInput(goalForm.targetAmount),
        icon: goalForm.icon,
        color: goalForm.color,
        status: 'active',
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      setError(data.errors?.[0]?.message || data.error || 'Không thể tạo mục tiêu.')
      setLoading(false)
      return
    }

    setShowAddGoalModal(false)
    setGoalForm({ title: '', targetAmount: '', icon: 'Target', color: '#2563eb' })
    setLoading(false)
    router.refresh()
  }

  const handleContribute = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!showContributeModal) return
    setError('')
    setLoading(true)

    const response = await fetch('/api/savings-contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: showContributeModal.id,
        sourceWallet: selectedSourceWalletId,
        amount: parseMoneyInput(contributeAmount),
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      setError(data.error || 'Không thể nạp vào mục tiêu.')
      setLoading(false)
      return
    }

    setSelectedGoal(showContributeModal)
    setShowContributeModal(null)
    setContributeAmount('')
    setSelectedSourceWalletId('')
    setLoading(false)
    router.refresh()
  }

  const openContribution = (goal: Goal) => {
    setSelectedGoal(goal)
    setShowContributeModal(goal)
    setSelectedSourceWalletId(sourceWallets[0]?.id ? String(sourceWallets[0].id) : '')
  }

  const handleSavingsDeposit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!activeSavingsWallet) return
    setError('')
    setLoading(true)

    const response = await fetch('/api/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deposit',
        wallet: String(activeSavingsWallet.id),
        amount: parseMoneyInput(savingsDepositAmount),
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      setError(data.error || 'Không thể nạp tiền vào ví tiết kiệm.')
      setLoading(false)
      return
    }

    setShowSavingsDepositModal(false)
    setSavingsDepositAmount('')
    setLoading(false)
    router.refresh()
  }

  const handleSavingsWithdraw = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!activeSavingsWallet || !selectedDestinationWalletId) return
    setError('')
    setLoading(true)

    const response = await fetch('/api/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'transfer',
        sourceWallet: String(activeSavingsWallet.id),
        destinationWallet: selectedDestinationWalletId,
        amount: parseMoneyInput(savingsWithdrawAmount),
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      setError(data.error || 'Không thể rút tiền từ ví tiết kiệm.')
      setLoading(false)
      return
    }

    setShowSavingsWithdrawModal(false)
    setSavingsWithdrawAmount('')
    setSelectedDestinationWalletId('')
    setLoading(false)
    router.refresh()
  }

  const handleGoalWithdraw = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!showGoalWithdrawModal || !selectedDestinationWalletId) return
    setError('')
    setLoading(true)

    const response = await fetch('/api/savings-contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'withdraw',
        goal: showGoalWithdrawModal.id,
        destinationWallet: selectedDestinationWalletId,
        amount: parseMoneyInput(goalWithdrawAmount),
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      setError(data.error || 'Không thể rút tiền khỏi mục tiêu.')
      setLoading(false)
      return
    }

    setShowGoalWithdrawModal(null)
    setGoalWithdrawAmount('')
    setSelectedDestinationWalletId('')
    setLoading(false)
    router.refresh()
  }

  const openSavingsDepositModal = () => {
    setError('')
    setSavingsDepositAmount('')
    setShowSavingsDepositModal(true)
  }

  const openSavingsWithdrawModal = () => {
    const mainWallet = sourceWallets.find((w) => w.walletType !== 'savings')
    setError('')
    setSavingsWithdrawAmount('')
    setSelectedDestinationWalletId(mainWallet?.id ? String(mainWallet.id) : '')
    setShowSavingsWithdrawModal(true)
  }

  const openGoalWithdrawModal = (goal: Goal) => {
    const mainWallet = sourceWallets.find((w) => w.walletType !== 'savings')
    setError('')
    setGoalWithdrawAmount('')
    setSelectedDestinationWalletId(mainWallet?.id ? String(mainWallet.id) : '')
    setShowGoalWithdrawModal(goal)
  }

  return (
    <>
      <div className="page-header savings-header">
        <div>
          <h1 className="page-title">Tiết kiệm</h1>
        </div>
        <div className="transaction-header-actions">
          <button className="btn btn-secondary" onClick={() => setShowAddWalletModal(true)}>
            <WalletCards size={18} /> Tạo ví tiết kiệm
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddGoalModal(true)}>
            <Plus size={18} /> Tạo mục tiêu
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card balance">
          <div className="stat-card-header">
            <span className="stat-card-label">Số dư tiết kiệm</span>
            <div className="stat-card-icon balance">
              <PiggyBank size={24} />
            </div>
          </div>
          <div className="stat-card-value balance">{formatCurrency(totalSavingsBalance, currency)}</div>
          <div className="stat-card-note">{savingsWallets.length} ví tiết kiệm</div>
        </div>
        <div className="stat-card income">
          <div className="stat-card-header">
            <span className="stat-card-label">Mục tiêu đang có</span>
            <div className="stat-card-icon income">
              <Flag size={24} />
            </div>
          </div>
          <div className="stat-card-value income">{activeGoals.length}</div>
          <div className="stat-card-note">{initialGoals.length} tổng mục tiêu</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-card-header">
            <span className="stat-card-label">Thông báo mới</span>
            <div className="stat-card-icon expense">
              <Banknote size={24} />
            </div>
          </div>
          <div className="stat-card-value expense">{initialNotifications.length}</div>
        </div>
      </div>

      <div className="charts-grid">
        <section className="card">
          <div className="card-header">
            <h3 className="card-title">Quản lý ví tiết kiệm</h3>
          </div>
          {savingsWallets.length > 0 ? (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="savings-wallet-switcher">
                  Ví tiết kiệm
                </label>
                <select
                  id="savings-wallet-switcher"
                  className="form-select"
                  value={activeSavingsWallet?.id ? String(activeSavingsWallet.id) : ''}
                  onChange={(event) => setSelectedSavingsWalletId(event.target.value)}
                >
                  {savingsWallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </option>
                  ))}
                </select>
              </div>
              {activeSavingsWallet && (
                <>
                  <div className="stat-card balance" style={{ marginTop: 16 }}>
                    <div className="stat-card-header">
                      <span className="stat-card-label">Số dư Ví "{activeSavingsWallet.name}"</span>
                      <div className="stat-card-icon balance">
                        <WalletCards size={22} />
                      </div>
                    </div>
                    <div className="stat-card-value balance">{formatCurrency(activeSavingsWallet.balance, currency)}</div>
                  </div>
                  <div className="savings-wallet-actions" style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={openSavingsDepositModal}>
                      <Plus size={16} /> Nạp tiền
                    </button>
                    <button className="btn btn-secondary" onClick={() => {
                      const mainWallet = sourceWallets.find((w) => w.walletType !== 'savings')
                      if (mainWallet) {
                        setSelectedDestinationWalletId(String(mainWallet.id))
                      }
                      openSavingsWithdrawModal()
                    }}>
                      <ArrowUpFromLine size={16} /> Chuyển ra
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h3 className="empty-state-title">Chưa có ví tiết kiệm</h3>
              <button className="btn btn-primary" onClick={() => setShowAddWalletModal(true)}>
                <Plus size={18} /> Tạo ví tiết kiệm
              </button>
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-header">
            <h3 className="card-title">Danh sách mục tiêu</h3>
            <span className="category-tag">{initialGoals.length} mục tiêu</span>
          </div>
          <div className="savings-goal-list">
            {initialGoals.map((goal) => {
              const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0
              return (
                <button
                  key={goal.id}
                  type="button"
                  className={`savings-goal-row ${selectedGoal?.id === goal.id ? 'active' : ''}`}
                  onClick={() => setSelectedGoal(goal)}
                >
                  <span className="savings-goal-icon" style={{ color: goal.color }}>
                    {renderGoalIcon(goal.icon, 20)}
                  </span>
                  <span>
                    <strong>{goal.title}</strong>
                    <small>
                      {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
                    </small>
                  </span>
                  <span className="category-tag">{Math.round(progress)}%</span>
                </button>
              )
            })}
          </div>
        </section>
      </div>

      {selectedGoal && (
        <section className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <h3 className="card-title">{selectedGoal.title}</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => openContribution(selectedGoal)}>
                <Plus size={18} /> Nạp
              </button>
              {selectedGoal.status === 'active' && selectedGoal.currentAmount > 0 && (
                <button className="btn btn-secondary" onClick={() => openGoalWithdrawModal(selectedGoal)}>
                  <ArrowDownToLine size={18} /> Rút
                </button>
              )}
            </div>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Loại</th>
                  <th>Ví nạp</th>
                  <th>Ngày</th>
                  <th style={{ textAlign: 'right' }}>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {selectedGoalContributions.length > 0 ? (
                  selectedGoalContributions.map((contribution) => {
                    const sourceWallet = typeof contribution.sourceWallet === 'object' ? contribution.sourceWallet : null
                    return (
                      <tr key={contribution.id}>
                        <td>
                          <span className={`type-badge ${contribution.movementType === 'withdrawal' ? 'expense' : 'income'}`}>
                            {contribution.movementType === 'withdrawal' ? <ArrowUpFromLine size={14} /> : <Plus size={14} />}
                            {contribution.movementType === 'withdrawal' ? 'Rút' : 'Nạp'}
                          </span>
                        </td>
                        <td>{sourceWallet?.name || '-'}</td>
                        <td>{new Date(contribution.date).toLocaleDateString('vi-VN')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: contribution.movementType === 'withdrawal' ? 'var(--income-color)' : 'var(--income-color)' }}>
                          {contribution.movementType === 'withdrawal' ? '+' : '+'}
                          {formatCurrency(contribution.amount, currency)}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4}>Chưa có lịch sử.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showAddWalletModal && (
        <div className="modal-overlay" onClick={() => setShowAddWalletModal(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Tạo ví tiết kiệm</h2>
              <button className="modal-close" onClick={() => setShowAddWalletModal(false)} aria-label="Đóng">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleCreateSavingsWallet}>
              <div className="modal-body">
                {error && <div className="auth-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label" htmlFor="savings-wallet-name">
                    Tên ví
                  </label>
                  <input
                    id="savings-wallet-name"
                    className="form-input"
                    value={walletName}
                    onChange={(event) => setWalletName(event.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="savings-wallet-balance">
                    Số dư ban đầu
                  </label>
                  <input
                    id="savings-wallet-balance"
                    className="form-input"
                    inputMode="numeric"
                    value={walletBalance}
                    onChange={(event) => setWalletBalance(formatMoneyInput(event.target.value))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddWalletModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang tạo...' : 'Tạo ví'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddGoalModal && (
        <div className="modal-overlay" onClick={() => setShowAddGoalModal(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Tạo mục tiêu tiết kiệm</h2>
              <button className="modal-close" onClick={() => setShowAddGoalModal(false)} aria-label="Đóng">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleCreateGoal}>
              <div className="modal-body">
                {error && <div className="auth-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label" htmlFor="goal-title">
                    Tên mục tiêu
                  </label>
                  <input
                    id="goal-title"
                    className="form-input"
                    value={goalForm.title}
                    onChange={(event) => setGoalForm({ ...goalForm, title: event.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="goal-target">
                      Số tiền mục tiêu
                    </label>
                    <input
                      id="goal-target"
                      className="form-input"
                      inputMode="numeric"
                      value={goalForm.targetAmount}
                      onChange={(event) => setGoalForm({ ...goalForm, targetAmount: formatMoneyInput(event.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="goal-icon">
                      Biểu tượng
                    </label>
                    <select
                      id="goal-icon"
                      className="form-select"
                      value={goalForm.icon}
                      onChange={(event) => setGoalForm({ ...goalForm, icon: event.target.value })}
                    >
                      <option value="Target">Mục tiêu</option>
                      <option value="Laptop">Công nghệ</option>
                      <option value="Plane">Du lịch</option>
                      <option value="CircleDollarSign">Tích lũy</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddGoalModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang tạo...' : 'Tạo mục tiêu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showContributeModal && (
        <div className="modal-overlay" onClick={() => setShowContributeModal(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nạp vào mục tiêu</h2>
              <button className="modal-close" onClick={() => setShowContributeModal(null)} aria-label="Đóng">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleContribute}>
              <div className="modal-body">
                {error && <div className="auth-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label" htmlFor="contribution-source-wallet">
                    Ví nạp
                  </label>
                  <select
                    id="contribution-source-wallet"
                    className="form-select"
                    value={selectedSourceWalletId}
                    onChange={(event) => setSelectedSourceWalletId(event.target.value)}
                    required
                  >
                    <option value="">Chọn ví nạp</option>
                    {sourceWallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name} - {formatCurrency(wallet.balance, currency)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contribution-amount">
                    Số tiền nạp
                  </label>
                  <input
                    id="contribution-amount"
                    className="form-input"
                    inputMode="numeric"
                    value={contributeAmount}
                    onChange={(event) => setContributeAmount(formatMoneyInput(event.target.value))}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowContributeModal(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Xác nhận nạp'} <Check size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSavingsDepositModal && activeSavingsWallet && (
        <div className="modal-overlay" onClick={() => setShowSavingsDepositModal(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nạp tiền vào ví tiết kiệm</h2>
              <button className="modal-close" onClick={() => setShowSavingsDepositModal(false)} aria-label="Đóng">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSavingsDeposit}>
              <div className="modal-body">
                {error && <div className="auth-error">{error}</div>}
                <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
                  Nạp tiền từ ngân hàng ngoài vào ví "{activeSavingsWallet.name}"
                </p>
                <div className="form-group">
                  <label className="form-label" htmlFor="savings-deposit-amount">
                    Số tiền nạp
                  </label>
                  <input
                    id="savings-deposit-amount"
                    className="form-input"
                    inputMode="numeric"
                    value={savingsDepositAmount}
                    onChange={(event) => setSavingsDepositAmount(formatMoneyInput(event.target.value))}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSavingsDepositModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Nạp tiền'} <Check size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSavingsWithdrawModal && activeSavingsWallet && (
        <div className="modal-overlay" onClick={() => setShowSavingsWithdrawModal(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Chuyển tiền từ ví tiết kiệm</h2>
              <button className="modal-close" onClick={() => setShowSavingsWithdrawModal(false)} aria-label="Đóng">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSavingsWithdraw}>
              <div className="modal-body">
                {error && <div className="auth-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label" htmlFor="savings-withdraw-source">
                    Ví nguồn
                  </label>
                  <select id="savings-withdraw-source" className="form-select" disabled>
                    <option value={activeSavingsWallet.id}>{activeSavingsWallet.name}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="savings-withdraw-destination">
                    Ví nhận tiền
                  </label>
                  <select
                    id="savings-withdraw-destination"
                    className="form-select"
                    value={selectedDestinationWalletId}
                    onChange={(event) => setSelectedDestinationWalletId(event.target.value)}
                    required
                  >
                    <option value="">Chọn ví nhận</option>
                    {sourceWallets.filter((w) => w.walletType !== 'savings').map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name} - {formatCurrency(wallet.balance, currency)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="savings-withdraw-amount">
                    Số tiền chuyển
                  </label>
                  <input
                    id="savings-withdraw-amount"
                    className="form-input"
                    inputMode="numeric"
                    value={savingsWithdrawAmount}
                    onChange={(event) => setSavingsWithdrawAmount(formatMoneyInput(event.target.value))}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSavingsWithdrawModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading || !selectedDestinationWalletId}>
                  {loading ? 'Đang xử lý...' : 'Chuyển tiền'} <Check size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGoalWithdrawModal && (
        <div className="modal-overlay" onClick={() => setShowGoalWithdrawModal(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Rút tiền khỏi mục tiêu</h2>
              <button className="modal-close" onClick={() => setShowGoalWithdrawModal(null)} aria-label="Đóng">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleGoalWithdraw}>
              <div className="modal-body">
                {error && <div className="auth-error">{error}</div>}
                <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
                  Rút tiền từ mục tiêu "{showGoalWithdrawModal.title}" vào ví của bạn.
                  <br />
                  Số tiền có thể rút: {formatCurrency(showGoalWithdrawModal.currentAmount, currency)}
                </p>
                <div className="form-group">
                  <label className="form-label" htmlFor="goal-withdraw-destination">
                    Ví nhận tiền
                  </label>
                  <select
                    id="goal-withdraw-destination"
                    className="form-select"
                    value={selectedDestinationWalletId}
                    onChange={(event) => setSelectedDestinationWalletId(event.target.value)}
                    required
                  >
                    <option value="">Chọn ví nhận</option>
                    {sourceWallets.filter((w) => w.walletType !== 'savings').map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name} - {formatCurrency(wallet.balance, currency)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="goal-withdraw-amount">
                    Số tiền rút
                  </label>
                  <input
                    id="goal-withdraw-amount"
                    className="form-input"
                    inputMode="numeric"
                    value={goalWithdrawAmount}
                    onChange={(event) => setGoalWithdrawAmount(formatMoneyInput(event.target.value))}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGoalWithdrawModal(null)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading || !selectedDestinationWalletId}>
                  {loading ? 'Đang xử lý...' : 'Rút tiền'} <Check size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
