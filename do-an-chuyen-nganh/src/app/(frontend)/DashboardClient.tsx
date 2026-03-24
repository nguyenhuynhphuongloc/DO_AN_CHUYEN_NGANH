'use client'
import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface CategoryBreakdown {
  name: string
  icon: string
  color: string
  total: number
}

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  description?: string
  date: string
  category?: { name: string; icon: string; color: string } | string
}

interface DashboardClientProps {
  totalIncome: number
  totalExpense: number
  balance: number
  categoryBreakdown: CategoryBreakdown[]
  recentTransactions: Transaction[]
  chartData: { month: string; income: number; expense: number }[]
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

export default function DashboardClient({
  totalIncome,
  totalExpense,
  balance,
  categoryBreakdown,
  recentTransactions,
  chartData,
}: DashboardClientProps) {
  return (
    <>
      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-card-header">
            <span className="stat-card-label">Tổng thu nhập</span>
            <div className="stat-card-icon income">📈</div>
          </div>
          <div className="stat-card-value income">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-card-header">
            <span className="stat-card-label">Tổng chi tiêu</span>
            <div className="stat-card-icon expense">📉</div>
          </div>
          <div className="stat-card-value expense">{formatCurrency(totalExpense)}</div>
        </div>
        <div className="stat-card balance">
          <div className="stat-card-header">
            <span className="stat-card-label">Số dư</span>
            <div className="stat-card-icon balance">💰</div>
          </div>
          <div className="stat-card-value balance">{formatCurrency(balance)}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-card-title">Thu - Chi 6 tháng gần nhất</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Legend />
              <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Chi tiêu" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-title">Phân bổ chi tiêu theo danh mục</div>
          {categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9',
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <div className="empty-state-icon">📊</div>
              <p className="empty-state-desc">Chưa có dữ liệu chi tiêu</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Giao dịch gần đây</h3>
          <a href="/transactions" className="btn btn-secondary" style={{ fontSize: '13px', padding: '8px 16px' }}>
            Xem tất cả →
          </a>
        </div>
        {recentTransactions.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Loại</th>
                  <th>Mô tả</th>
                  <th>Danh mục</th>
                  <th>Ngày</th>
                  <th style={{ textAlign: 'right' }}>Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => {
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
            <a href="/transactions" className="btn btn-primary">Thêm giao dịch</a>
          </div>
        )}
      </div>
    </>
  )
}
