import { describe, expect, it, vi } from 'vitest'

import { buildFinanceAdvisorContext, buildFinanceStatsFromDocs, getFinanceStats } from '@/lib/finance-stats'

const categoryFood = {
  id: 10,
  name: 'An uong',
  type: 'expense',
  icon: 'Utensils',
  color: '#ef4444',
  createdAt: '',
  updatedAt: '',
} as any

const mainWallet = {
  id: 1,
  user: 7,
  name: 'Vi chinh',
  walletType: 'main',
  balance: 3000000,
  currency: 'VND',
  monthlySpendingLimit: 5000000,
  isDefault: true,
  isActive: true,
  createdAt: '',
  updatedAt: '',
} as any

const savingsWallet = {
  id: 2,
  user: 7,
  name: 'Vi tiet kiem',
  walletType: 'savings',
  balance: 2000000,
  currency: 'VND',
  isDefault: false,
  isActive: true,
  createdAt: '',
  updatedAt: '',
} as any

describe('finance stats', () => {
  it('combines wallet balances, spending limit, categories, sources, and jars', () => {
    const stats = buildFinanceStatsFromDocs({
      month: 5,
      year: 2026,
      wallets: [mainWallet, savingsWallet],
      periodTransactions: [
        {
          id: 100,
          user: 7,
          type: 'expense',
          amount: 1200000,
          wallet: mainWallet,
          category: categoryFood,
          sourceType: 'receipt_ai',
          date: '2026-05-03T00:00:00.000Z',
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 101,
          user: 7,
          type: 'income',
          amount: 7000000,
          wallet: mainWallet,
          category: { ...categoryFood, id: 11, type: 'income', name: 'Luong' },
          sourceType: 'manual',
          date: '2026-05-01T00:00:00.000Z',
          createdAt: '',
          updatedAt: '',
        },
      ] as any,
      chartTransactions: [
        {
          id: 100,
          user: 7,
          type: 'expense',
          amount: 1200000,
          wallet: 1,
          category: 10,
          date: '2026-05-03T00:00:00.000Z',
          createdAt: '',
          updatedAt: '',
        },
      ] as any,
      recentTransactions: [],
      budgets: [
        {
          id: 50,
          user: 7,
          wallet: mainWallet,
          category: categoryFood,
          amount: 1000000,
          period: 'monthly',
          month: 5,
          year: 2026,
          isActive: true,
          createdAt: '',
          updatedAt: '',
        },
      ] as any,
    })

    expect(stats.totals.totalIncome).toBe(7000000)
    expect(stats.totals.totalExpense).toBe(1200000)
    expect(stats.walletSummary.totalBalance).toBe(5000000)
    expect(stats.walletSummary.spendingBalance).toBe(3000000)
    expect(stats.walletSummary.savingsBalance).toBe(2000000)
    expect(stats.walletSummary.remainingLimit).toBe(3800000)
    expect(stats.categoryBreakdown[0]).toMatchObject({ id: 10, expense: 1200000 })
    expect(stats.sourceBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceType: 'receipt_ai', count: 1, total: 1200000 }),
      ]),
    )
    expect(stats.jarUsage[0]).toMatchObject({
      categoryName: 'An uong',
      amount: 1000000,
      spent: 1200000,
      status: 'exceeded',
    })

    const advisorContext = buildFinanceAdvisorContext(stats)
    expect(advisorContext.totals).toEqual(stats.totals)
    expect(advisorContext.walletSummary.spentAmount).toBe(stats.walletSummary.spentAmount)
    expect(advisorContext.monthlyStats).toEqual(stats.chartData)
  })

  it('loads chart data with one aggregated transaction query instead of one query per month', async () => {
    const payload = {
      find: vi
        .fn()
        .mockResolvedValueOnce({ docs: [mainWallet, savingsWallet] })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] })
        .mockResolvedValueOnce({ docs: [] }),
    }

    const stats = await getFinanceStats(payload as any, 7, {
      month: 5,
      year: 2026,
      chartMonths: 6,
      recentLimit: 5,
    })

    expect(payload.find).toHaveBeenCalledTimes(5)
    expect(stats.chartData).toHaveLength(6)
    expect(payload.find.mock.calls[2][0]).toMatchObject({
      collection: 'transactions',
      limit: 0,
      depth: 0,
      overrideAccess: true,
    })
  })
})
