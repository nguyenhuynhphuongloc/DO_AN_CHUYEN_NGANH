'use client'

import React from 'react'
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
  PiggyBank,
  ReceiptText,
  Target,
  TrendingDown,
  WalletCards,
} from 'lucide-react'

import CategoryIcon from '@/components/CategoryIcon'
import type { FinanceStats } from '@/lib/finance-stats'

type DashboardClientProps = {
  stats: FinanceStats
}

const formatCurrency = (value: number, currency = 'VND') => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(value || 0)
}

const percentText = (value: number) => `${Math.round(value || 0)}%`

const sourceLabels: Record<string, string> = {
  manual: 'Nhập tay',
  chatbot: 'Chatbot',
  receipt_ai: 'OCR',
  receipt_AI: 'OCR',
  transfer: 'Chuyển ví',
  adjustment: 'Điều chỉnh',
}

const formatSource = (source?: string | null) => sourceLabels[source || 'manual'] || 'Nhập tay'

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function DashboardClient({ stats }: DashboardClientProps) {
  const currency = stats.walletSummary.defaultWallet?.currency || 'VND'
  const remainingLimit = stats.walletSummary.remainingLimit
  const topJarWarnings = stats.jarUsage.filter((jar) => jar.status !== 'ok').slice(0, 3)

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

        <div className="stat-card expense">
          <div className="stat-card-header">
            <span className="stat-card-label">Chi tiêu tháng này</span>
            <div className="stat-card-icon expense">
              <TrendingDown size={24} strokeWidth={2.1} />
            </div>
          </div>
          <div className="stat-card-value expense">{formatCurrency(stats.totals.totalExpense, currency)}</div>
          <div className="stat-card-note">{percentText(stats.walletSummary.limitPercent)} hạn mức tháng</div>
        </div>

        <div className="stat-card income">
          <div className="stat-card-header">
            <span className="stat-card-label">Hạn mức còn lại</span>
            <div className="stat-card-icon income">
              <Target size={24} strokeWidth={2.1} />
            </div>
          </div>
          <div className={remainingLimit >= 0 ? 'stat-card-value income' : 'stat-card-value expense'}>
            {formatCurrency(remainingLimit, currency)}
          </div>
          <div className="stat-card-note">Hạn mức: {formatCurrency(stats.walletSummary.monthlySpendingLimit, currency)}</div>
        </div>

        <div className="stat-card balance">
          <div className="stat-card-header">
            <span className="stat-card-label">Tiết kiệm</span>
            <div className="stat-card-icon balance">
              <PiggyBank size={24} strokeWidth={2.1} />
            </div>
          </div>
          <div className="stat-card-value balance">{formatCurrency(stats.walletSummary.savingsBalance, currency)}</div>
          <div className="stat-card-note">{stats.walletSummary.savingsWallets.length} ví tiết kiệm</div>
        </div>
      </div>

      {topJarWarnings.length > 0 && (
        <div className="card finance-warning-card">
          <div className="card-header">
            <h3 className="card-title">Cảnh báo hũ chi tiêu</h3>
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
    </>
  )
}
