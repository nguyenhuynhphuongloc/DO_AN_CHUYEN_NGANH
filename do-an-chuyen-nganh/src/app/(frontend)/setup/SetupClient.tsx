'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, PiggyBank } from 'lucide-react'

type SetupClientProps = {
  initialName?: string
  initialCurrency?: string
  initialBalance?: number
  initialMonthlySpendingLimit?: number | null
}

const onlyDigits = (value: string) => value.replace(/[^\d]/g, '')

const formatNumberInput = (value: string) => {
  const digits = onlyDigits(value)
  if (!digits) return ''
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(digits))
}

const toMoneyNumber = (value: string) => Number(onlyDigits(value) || 0)

const formatMoney = (value: number, currency: string) => {
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value || 0)} ${currency}`
}

export default function SetupClient({
  initialName = 'Ví chi tiêu',
  initialCurrency = 'VND',
  initialBalance = 0,
  initialMonthlySpendingLimit,
}: SetupClientProps) {
  const router = useRouter()
  const defaultLimit = initialMonthlySpendingLimit || 5000000
  const [name, setName] = useState(initialName)
  const [currency, setCurrency] = useState(initialCurrency)
  const [totalBalance, setTotalBalance] = useState(formatNumberInput(String(initialBalance || 0)))
  const [monthlySpendingLimit, setMonthlySpendingLimit] = useState(formatNumberInput(String(defaultLimit)))
  const [createSavingsWallet, setCreateSavingsWallet] = useState(true)
  const [savingsName, setSavingsName] = useState('Ví tiết kiệm')
  const [savingsBalance, setSavingsBalance] = useState(
    formatNumberInput(String(Math.max((initialBalance || 0) - defaultLimit, 0))),
  )
  const [savingsManuallyEdited, setSavingsManuallyEdited] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const totalBalanceNumber = toMoneyNumber(totalBalance)
  const spendingLimitNumber = toMoneyNumber(monthlySpendingLimit)
  const savingsBalanceNumber = createSavingsWallet ? toMoneyNumber(savingsBalance) : 0

  const allocation = useMemo(() => {
    return {
      spendingWalletBalance: spendingLimitNumber,
      savingsBalance: savingsBalanceNumber,
      totalBalance: spendingLimitNumber + savingsBalanceNumber,
    }
  }, [savingsBalanceNumber, spendingLimitNumber])

  const syncAutomaticSavings = (nextTotal: number, nextLimit: number) => {
    if (!savingsManuallyEdited) {
      setSavingsBalance(formatNumberInput(String(Math.max(nextTotal - nextLimit, 0))))
    }
  }

  const handleTotalBalanceChange = (value: string) => {
    const formatted = formatNumberInput(value)
    const nextTotal = toMoneyNumber(formatted)
    setTotalBalance(formatted)
    syncAutomaticSavings(nextTotal, spendingLimitNumber)
  }

  const handleSpendingLimitChange = (value: string) => {
    const formatted = formatNumberInput(value)
    const nextLimit = toMoneyNumber(formatted)
    setMonthlySpendingLimit(formatted)
    if (savingsManuallyEdited || createSavingsWallet) {
      setTotalBalance(formatNumberInput(String(nextLimit + savingsBalanceNumber)))
      return
    }

    syncAutomaticSavings(totalBalanceNumber, nextLimit)
  }

  const handleSavingsBalanceChange = (value: string) => {
    setSavingsManuallyEdited(true)
    const formatted = formatNumberInput(value)
    const nextSavings = toMoneyNumber(formatted)
    setSavingsBalance(formatted)
    setTotalBalance(formatNumberInput(String(spendingLimitNumber + nextSavings)))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    if (allocation.totalBalance <= 0) {
      setError('Tổng số dư phải lớn hơn 0.')
      setLoading(false)
      return
    }

    if (spendingLimitNumber <= 0) {
      setError('Mức chi tiêu tháng phải lớn hơn 0.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/wallets/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          currency,
          balance: allocation.spendingWalletBalance,
          monthlySpendingLimit: spendingLimitNumber,
          createSavingsWallet,
          savingsName,
          savingsBalance: allocation.savingsBalance,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Không thể lưu thiết lập ví.')
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Có lỗi xảy ra khi lưu thiết lập ví.')
      setLoading(false)
    }
  }

  return (
    <main className="setup-shell setup-shell-centered">
      <form onSubmit={handleSubmit} className="setup-unified-card" aria-label="Thiết lập ví chi tiêu">
        <div className="setup-unified-header">
          <h1>Thiết lập dòng tiền cá nhân</h1>
        </div>

        <section className="setup-unified-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="setup-field-grid">
            <div className="setup-field-card">
              <label className="form-label" htmlFor="wallet-name">
                Tên ví chi tiêu
              </label>
              <input
                id="wallet-name"
                className="setup-text-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="setup-field-card">
              <label className="form-label" htmlFor="currency">
                Đơn vị tiền tệ
              </label>
              <select
                id="currency"
                className="setup-text-input"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="money-input-grid">
            <div className="money-input-card">
              <label className="form-label" htmlFor="total-balance">
                Số dư hiện có
              </label>
              <div className="money-input">
                <input
                  id="total-balance"
                  inputMode="numeric"
                  value={totalBalance}
                  onChange={(event) => handleTotalBalanceChange(event.target.value)}
                  placeholder="0"
                  required
                />
                <span>{currency}</span>
              </div>
            </div>

            <div className="money-input-card">
              <label className="form-label" htmlFor="monthly-limit">
                Hạn mức chi tiêu tháng
              </label>
              <div className="money-input">
                <input
                  id="monthly-limit"
                  inputMode="numeric"
                  value={monthlySpendingLimit}
                  onChange={(event) => handleSpendingLimitChange(event.target.value)}
                  placeholder="0"
                  required
                />
                <span>{currency}</span>
              </div>
            </div>
          </div>

          <label className="setup-savings-toggle" htmlFor="create-savings-wallet">
            <input
              id="create-savings-wallet"
              type="checkbox"
              checked={createSavingsWallet}
              onChange={(event) => setCreateSavingsWallet(event.target.checked)}
            />
            <span className="setup-savings-icon">
              <PiggyBank size={20} strokeWidth={2.1} />
            </span>
            <span>
              <strong>Tạo Ví Tiết Kiệm</strong>
            </span>
          </label>

          {createSavingsWallet && (
            <div className="setup-field-grid setup-savings-grid">
              <div className="setup-field-card">
                <label className="form-label" htmlFor="savings-name">
                  Tên ví tiết kiệm
                </label>
                <input
                  id="savings-name"
                  className="setup-text-input"
                  value={savingsName}
                  onChange={(event) => setSavingsName(event.target.value)}
                />
              </div>

              <div className="money-input-card">
                <label className="form-label" htmlFor="savings-balance">
                  Số dư tiết kiệm
                </label>
                <div className="money-input">
                  <input
                    id="savings-balance"
                    inputMode="numeric"
                    value={savingsBalance}
                    onChange={(event) => handleSavingsBalanceChange(event.target.value)}
                    placeholder="0"
                  />
                  <span>{currency}</span>
                </div>
              </div>
            </div>
          )}

          <div className="setup-allocation setup-allocation-light">
            <div>
              <span>Chi tiêu</span>
              <strong>{formatMoney(allocation.spendingWalletBalance, currency)}</strong>
            </div>
            <div>
              <span>Tiết kiệm</span>
              <strong>{formatMoney(allocation.savingsBalance, currency)}</strong>
            </div>
            <div>
              <span>Tổng số dư</span>
              <strong>{formatMoney(allocation.totalBalance, currency)}</strong>
            </div>
          </div>

          <button type="submit" className="btn btn-primary setup-submit" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Hoàn tất thiết lập'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </section>
      </form>
    </main>
  )
}
