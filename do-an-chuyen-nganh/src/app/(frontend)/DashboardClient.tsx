'use client'

import React, { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChartPie,
  FileBarChart,
  History,
  PiggyBank,
  Plus,
  ReceiptText,
  TrendingDown,
  Wallet,
  WalletCards,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import CategoryIcon from '@/components/CategoryIcon'
import type { FinanceStats } from '@/lib/finance-stats'
import { formatMoneyInput, parseMoneyInput } from '@/lib/money-input'

type DashboardClientProps = {
  stats: FinanceStats
}

const formatCurrency = (value: number, currency = 'VND') => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(value || 0)
}

const percentText = (value: number) => `${Math.round(value || 0)}%`

const sourceLabels: Record<string, string> = {
  manual: 'Thủ công',
  chatbot: 'Chatbot',
  receipt_ai: 'OCR',
  receipt_AI: 'OCR',
  transfer: 'Chuyển ví',
  adjustment: 'Điều chỉnh',
}

const formatSource = (source?: string | null) => sourceLabels[source || 'manual'] || 'Thủ công'

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function DashboardClient({ stats }: DashboardClientProps) {
  const router = useRouter()
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositWalletId, setDepositWalletId] = useState(
    stats.walletSummary.defaultWallet?.id ? String(stats.walletSummary.defaultWallet.id) : '',
  )
  const [depositAmount, setDepositAmount] = useState('')
  const [depositError, setDepositError] = useState('')
  const [depositLoading, setDepositLoading] = useState(false)
  const primaryWallet = stats.walletSummary.defaultWallet ?? stats.walletSummary.spendingWallets[0] ?? null
  const currency = primaryWallet?.currency || 'VND'
  const topJarWarnings = stats.jarUsage.filter((jar) => jar.status !== 'ok').slice(0, 3)
  const depositWallets = [primaryWallet, ...stats.walletSummary.savingsWallets].filter(
    (wallet): wallet is NonNullable<typeof wallet> => Boolean(wallet),
  )

  const handleDeposit = async (event: React.FormEvent) => {
    event.preventDefault()
    setDepositError('')
    setDepositLoading(true)

    const response = await fetch('/api/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deposit',
        wallet: depositWalletId,
        amount: parseMoneyInput(depositAmount),
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      setDepositError(data.error || 'Không thể nạp tiền.')
      setDepositLoading(false)
      return
    }

    setShowDepositModal(false)
    setDepositAmount('')
    setDepositLoading(false)
    router.refresh()
  }

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card balance">
          <div className="stat-card-header">
            <span className="stat-card-label">Tổng số dư</span>
            <div className="stat-card-icon balance">
              <WalletCards size={24} strokeWidth={2.1} />
            </div>
          </div>
          <div className="stat-card-value balance">{formatCurrency(stats.walletSummary.totalBalance, currency)}</div>
        </div>

        <div className="stat-card balance">
          <div className="stat-card-header">
            <span className="stat-card-label">Số dư ví {primaryWallet?.name || 'chính'}</span>
            <div className="stat-card-icon balance">
              <Wallet size={24} strokeWidth={2.1} />
            </div>
          </div>
          <div className="stat-card-value balance">{formatCurrency(primaryWallet?.balance || 0, currency)}</div>
          <div className="stat-card-note">Ví chi tiêu mặc định</div>
        </div>

        <div className="stat-card balance">
          <div className="stat-card-header">
            <span className="stat-card-label">Số dư tiết kiệm</span>
            <div className="stat-card-icon balance">
              <PiggyBank size={24} strokeWidth={2.1} />
            </div>
          </div>
          <div className="stat-card-value balance">{formatCurrency(stats.walletSummary.savingsBalance, currency)}</div>
          <div className="stat-card-note">{stats.walletSummary.savingsWallets.length} ví tiết kiệm</div>
        </div>

        <div className="stat-card income">
          <div className="stat-card-header">
            <span className="stat-card-label">Thu nhập trong tháng</span>
            <div className="stat-card-icon income">
              <ArrowUp size={24} strokeWidth={2.1} />
            </div>
          </div>
          <div className="stat-card-value income">{formatCurrency(stats.totals.totalIncome, currency)}</div>
        </div>

        <div className="stat-card expense">
          <div className="stat-card-header">
            <span className="stat-card-label">Chi tiêu trong tháng</span>
            <div className="stat-card-icon expense">
              <TrendingDown size={24} strokeWidth={2.1} />
            </div>
          </div>
          <div className="stat-card-value expense">{formatCurrency(stats.totals.totalExpense, currency)}</div>
        </div>
      </div>

      <div className="dashboard-actions card">
        <button className="btn btn-primary" onClick={() => setShowDepositModal(true)}>
          <Plus size={18} /> Nạp tiền
        </button>
        <a className="btn btn-secondary" href="/transactions">
          <History size={18} /> Lịch sử giao dịch
        </a>
        <a className="btn btn-secondary" href="/reports">
          <FileBarChart size={18} /> Báo cáo thu chi
        </a>
        <a className="btn btn-secondary" href="/savings">
          <WalletCards size={18} /> Quản lý ví
        </a>
      </div>

      {topJarWarnings.length > 0 && (
        <div className="card finance-warning-card">
          <div className="card-header">
            <h3 className="card-title">Cảnh báo ngân sách danh mục</h3>
            <AlertTriangle size={20} color="var(--expense-color)" />
          </div>
          <div className="jar-warning-list">
            {topJarWarnings.map((jar) => (
              <div key={jar.budgetId} className="jar-warning-item">
                <span className="category-tag">
                  <CategoryIcon icon={jar.icon} size={16} /> {jar.categoryName}
                </span>
                <div className="jar-warning-meter">
                  <span>{formatCurrency(jar.spent, currency)}</span>
                  <span>{percentText(jar.percent)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-title">Thu - chi 6 tháng gần nhất</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
              <Legend />
              <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Chi tiêu" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-title">Phân bổ chi tiêu theo danh mục</div>
          {stats.categoryBreakdown.filter((item) => item.expense > 0).length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.categoryBreakdown.filter((item) => item.expense > 0)}
                  dataKey="expense"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {stats.categoryBreakdown.map((entry, index) => (
                    <Cell key={entry.id} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <div className="empty-state-icon">
                <ChartPie size={48} color="var(--text-muted)" />
              </div>
              <p className="empty-state-desc">Chưa có dữ liệu chi tiêu</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Giao dịch gần đây</h3>
          <a
            href="/transactions"
            className="btn btn-secondary"
            style={{ fontSize: '13px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Xem tất cả <ArrowRight size={16} />
          </a>
        </div>
        {stats.recentTransactions.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Loại</th>
                  <th>Mô tả</th>
                  <th>Danh mục</th>
                  <th>Nguồn</th>
                  <th>Ngày</th>
                  <th style={{ textAlign: 'right' }}>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions.map((transaction) => {
                  const category = typeof transaction.category === 'object' ? transaction.category : null
                  return (
                    <tr key={transaction.id}>
                      <td>
                        <span className={`type-badge ${transaction.type}`}>
                          {transaction.type === 'income' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                          {transaction.type === 'income' ? 'Thu' : 'Chi'}
                        </span>
                      </td>
                      <td>{transaction.description || transaction.merchantName || '-'}</td>
                      <td>
                        {category ? (
                          <span className="category-tag">
                            <CategoryIcon icon={category.icon || 'Wallet'} size={16} /> {category.name}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{formatSource(transaction.sourceType)}</td>
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
                        {formatCurrency(transaction.amount, currency)}
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
              <ReceiptText size={48} color="var(--text-muted)" />
            </div>
            <h3 className="empty-state-title">Chưa có giao dịch nào</h3>
            <a href="/transactions" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ReceiptText size={18} /> Thêm giao dịch
            </a>
          </div>
        )}
      </div>

      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nạp tiền</h2>
              <button className="modal-close" onClick={() => setShowDepositModal(false)} aria-label="Đóng">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleDeposit}>
              <div className="modal-body">
                {depositError && <div className="auth-error">{depositError}</div>}
                <div className="form-group">
                  <label className="form-label" htmlFor="deposit-wallet">
                    Ví nhận tiền
                  </label>
                  <select
                    id="deposit-wallet"
                    className="form-select"
                    value={depositWalletId}
                    onChange={(event) => setDepositWalletId(event.target.value)}
                    required
                  >
                    <option value="">Chọn ví</option>
                    {depositWallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="deposit-amount">
                    Số tiền nạp
                  </label>
                  <input
                    id="deposit-amount"
                    className="form-input"
                    inputMode="numeric"
                    value={depositAmount}
                    onChange={(event) => setDepositAmount(formatMoneyInput(event.target.value))}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDepositModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={depositLoading}>
                  {depositLoading ? 'Đang nạp...' : 'Nạp tiền'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
