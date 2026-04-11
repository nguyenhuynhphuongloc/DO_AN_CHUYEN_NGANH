'use client'
import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area,
} from 'recharts'
import { 
  MdTrendingUp, 
  MdTrendingDown, 
  MdAccountBalanceWallet, 
  MdInsertChart, 
  MdPieChart, 
  MdListAlt,
  MdCelebration,
  MdWarning
} from 'react-icons/md'
import CategoryIcon from '@/components/CategoryIcon'

interface ChartDataPoint {
  month: string
  income: number
  expense: number
}

interface CategoryData {
  name: string
  icon: string
  color: string
  income: number
  expense: number
}

interface Props {
  chartData: ChartDataPoint[]
  categoryData: CategoryData[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

const COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

const tooltipStyle = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#f1f5f9',
}

export default function ReportsClient({ chartData, categoryData }: Props) {
  const totalIncome = chartData.reduce((s, d) => s + d.income, 0)
  const totalExpense = chartData.reduce((s, d) => s + d.expense, 0)
  const netSavings = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0'

  const expenseByCategory = categoryData
    .filter((c) => c.expense > 0)
    .sort((a, b) => b.expense - a.expense)

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Báo cáo & Thống kê</h1>
        <p className="page-subtitle">Phân tích tài chính 12 tháng gần nhất</p>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-card-header">
            <span className="stat-card-label">Tổng thu 12 tháng</span>
            <div className="stat-card-icon income">
              <MdTrendingUp size={24} />
            </div>
          </div>
          <div className="stat-card-value income">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-card-header">
            <span className="stat-card-label">Tổng chi 12 tháng</span>
            <div className="stat-card-icon expense">
              <MdTrendingDown size={24} />
            </div>
          </div>
          <div className="stat-card-value expense">{formatCurrency(totalExpense)}</div>
        </div>
        <div className="stat-card balance">
          <div className="stat-card-header">
            <span className="stat-card-label">Tiết kiệm ròng</span>
            <div className="stat-card-icon balance">
              <MdAccountBalanceWallet size={24} />
            </div>
          </div>
          <div className="stat-card-value balance">{formatCurrency(netSavings)}</div>
        </div>
      </div>

      {/* Savings Rate */}
      <div className="card" style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Tỷ lệ tiết kiệm</div>
        <div style={{ fontSize: '48px', fontWeight: 800, color: parseFloat(savingsRate) >= 20 ? 'var(--income-color)' : 'var(--expense-color)' }}>
          {savingsRate}%
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          {parseFloat(savingsRate) >= 20 ? (
            <>
              <MdCelebration color="#10b981" size={18} /> Tuyệt vời! Bạn đang tiết kiệm tốt
            </>
          ) : (
            <>
              <MdWarning color="#ef4444" size={18} /> Hãy cố gắng tiết kiệm thêm nhé
            </>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Area Chart - Trend */}
        <div className="chart-card">
          <div className="chart-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdInsertChart size={20} color="var(--primary)" /> Xu hướng thu chi theo thời gian
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Area type="monotone" dataKey="income" name="Thu nhập" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name="Chi tiêu" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Comparison */}
        <div className="chart-card">
          <div className="chart-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdInsertChart size={20} color="var(--primary)" /> So sánh thu chi hàng tháng
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Chi tiêu" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdPieChart size={20} color="var(--primary)" /> Phân bổ chi tiêu tháng này
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
                  {expenseByCategory.map((entry, i) => (
                    <Cell key={entry.name} fill={entry.color || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <p className="empty-state-desc">Chưa có dữ liệu chi tiêu tháng này</p>
            </div>
          )}
        </div>

        {/* Category Table */}
        <div className="chart-card">
          <div className="chart-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdListAlt size={20} color="var(--primary)" /> Chi tiết theo danh mục
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
                  {expenseByCategory.map((c) => {
                    const totalExp = expenseByCategory.reduce((s, x) => s + x.expense, 0)
                    const pct = totalExp > 0 ? ((c.expense / totalExp) * 100).toFixed(1) : '0'
                    return (
                      <tr key={c.name}>
                        <td>
                          <span className="category-tag">
                            <CategoryIcon icon={c.icon} size={16} /> {c.name}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(c.expense)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{pct}%</td>
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
