'use client'

import React from 'react'
import {
  Area,
  AreaChart,
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
import { AlertTriangle, ChartColumn, ChartPie, PiggyBank, TrendingDown, TrendingUp, WalletCards } from 'lucide-react'

import CategoryIcon from '@/components/CategoryIcon'
import type { FinanceStats } from '@/lib/finance-stats'

type Props = {
  stats: FinanceStats
}

const formatCurrency = (value: number, currency = 'VND') => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(value || 0)
}

const sourceLabels: Record<string, string> = {
  manual: 'Nhập tay',
  chatbot: 'Chatbot',
  receipt_ai: 'OCR',
  receipt_AI: 'OCR',
  transfer: 'Chuyển ví',
  adjustment: 'Điều chỉnh',
}

const COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function ReportsClient({ stats }: Props) {
  const currency = stats.walletSummary.defaultWallet?.currency || 'VND'
  const totalIncome = stats.chartData.reduce((sum, item) => sum + item.income, 0)
  const totalExpense = stats.chartData.reduce((sum, item) => sum + item.expense, 0)
  const netSavings = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0
  const expenseByCategory = stats.categoryBreakdown.filter((category) => category.expense > 0)
  const sourceData = stats.sourceBreakdown
    .filter((source) => source.total > 0)
    .map((source) => ({ ...source, label: sourceLabels[source.sourceType] || source.sourceType }))

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Báo cáo và thống kê</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-card-header">
            <span className="stat-card-label">Tổng thu 12 tháng</span>
            <div className="stat-card-icon income">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="stat-card-value income">{formatCurrency(totalIncome, currency)}</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-card-header">
            <span className="stat-card-label">Tổng chi 12 tháng</span>
            <div className="stat-card-icon expense">
              <TrendingDown size={24} />
            </div>
          </div>
          <div className="stat-card-value expense">{formatCurrency(totalExpense, currency)}</div>
        </div>
        <div className="stat-card balance">
          <div className="stat-card-header">
            <span className="stat-card-label">Tiết kiệm ròng</span>
            <div className="stat-card-icon balance">
              <PiggyBank size={24} />
            </div>
          </div>
          <div className={netSavings >= 0 ? 'stat-card-value balance' : 'stat-card-value expense'}>
            {formatCurrency(netSavings, currency)}
          </div>
        </div>
        <div className="stat-card balance">
          <div className="stat-card-header">
            <span className="stat-card-label">Số dư hiện tại</span>
            <div className="stat-card-icon balance">
              <WalletCards size={24} />
            </div>
          </div>
          <div className="stat-card-value balance">{formatCurrency(stats.walletSummary.totalBalance, currency)}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Tỷ lệ tiết kiệm 12 tháng</div>
        <div
          style={{
            fontSize: '48px',
            fontWeight: 800,
            color: savingsRate >= 20 ? 'var(--income-color)' : 'var(--expense-color)',
          }}
        >
          {savingsRate.toFixed(1)}%
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Đã dùng {Math.round(stats.walletSummary.limitPercent)}% hạn mức tháng hiện tại
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-title">
            <ChartColumn size={20} color="var(--primary)" /> Xu hướng thu chi theo thời gian
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
              <Legend />
              <Area type="monotone" dataKey="income" name="Thu nhập" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name="Chi tiêu" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-title">
            <ChartColumn size={20} color="var(--primary)" /> So sánh thu chi hằng tháng
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
              <Legend />
              <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Chi tiêu" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-title">
            <ChartPie size={20} color="var(--primary)" /> Phân bổ chi tiêu tháng này
          </div>
          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  dataKey="expense"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={entry.id} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <p className="empty-state-desc">Chưa có dữ liệu chi tiêu tháng này</p>
            </div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-card-title">
            <ChartPie size={20} color="var(--primary)" /> Nguồn tạo giao dịch
          </div>
          {sourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={sourceData} dataKey="total" nameKey="label" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={3}>
                  {sourceData.map((entry, index) => (
                    <Cell key={entry.sourceType} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <p className="empty-state-desc">Chưa có dữ liệu nguồn giao dịch</p>
            </div>
          )}
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-title">
            <AlertTriangle size={20} color="var(--primary)" /> Tình trạng hũ chi tiêu
          </div>
          {stats.jarUsage.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Danh mục</th>
                    <th style={{ textAlign: 'right' }}>Đã chi</th>
                    <th style={{ textAlign: 'right' }}>Hạn mức</th>
                    <th style={{ textAlign: 'right' }}>Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.jarUsage.map((jar) => (
                    <tr key={jar.budgetId}>
                      <td>
                        <span className="category-tag">
                          <CategoryIcon icon={jar.icon} size={16} /> {jar.categoryName}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(jar.spent, currency)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(jar.amount, currency)}</td>
                      <td style={{ textAlign: 'right', color: jar.status === 'ok' ? 'var(--income-color)' : 'var(--expense-color)' }}>
                        {Math.round(jar.percent)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <p className="empty-state-desc">Chưa có hũ chi tiêu nào cho tháng này</p>
            </div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-card-title">
            <ChartPie size={20} color="var(--primary)" /> Chi tiết theo danh mục
          </div>
          {expenseByCategory.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Danh mục</th>
                    <th style={{ textAlign: 'right' }}>Số tiền</th>
                    <th style={{ textAlign: 'right' }}>Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseByCategory.map((category) => {
                    const pct = stats.totals.totalExpense > 0 ? (category.expense / stats.totals.totalExpense) * 100 : 0
                    return (
                      <tr key={category.id}>
                        <td>
                          <span className="category-tag">
                            <CategoryIcon icon={category.icon} size={16} /> {category.name}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(category.expense, currency)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{pct.toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <p className="empty-state-desc">Chưa có dữ liệu</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
