'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles, WalletCards } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.errors?.[0]?.message || 'Đăng nhập thất bại')
        setLoading(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Có lỗi xảy ra, vui lòng thử lại')
      setLoading(false)
    }
  }

  return (
    <main className="auth-page auth-shell">
      <section className="auth-visual" aria-label="FinTrack overview">
        <Link href="/" className="auth-brand" aria-label="FinTrack">
          <span className="auth-brand-mark">
            <WalletCards size={24} strokeWidth={2.2} />
          </span>
          <span>
            FinTrack
            <small>Personal finance workspace</small>
          </span>
        </Link>

        <div className="auth-hero-copy">
          <span className="auth-kicker">
            <Sparkles size={16} /> Tài chính cá nhân rõ ràng hơn
          </span>
          <h1>Theo dõi thu chi, mục tiêu và hóa đơn trong một không gian gọn gàng.</h1>
          <p>
            FinTrack giúp bạn kiểm soát dòng tiền hằng tháng, xem báo cáo trực quan và nhập liệu nhanh bằng AI.
          </p>
        </div>

        <div className="auth-insight-card">
          <div>
            <span>Số dư tháng này</span>
            <strong>+12.450.000đ</strong>
          </div>
          <div className="auth-mini-chart" aria-hidden="true">
            <i style={{ height: '42%' }} />
            <i style={{ height: '64%' }} />
            <i style={{ height: '52%' }} />
            <i style={{ height: '78%' }} />
            <i style={{ height: '60%' }} />
            <i style={{ height: '86%' }} />
          </div>
        </div>
      </section>

      <section className="auth-card auth-form-panel" aria-label="Đăng nhập">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <ShieldCheck size={28} strokeWidth={2.1} />
          </div>
          <h2 className="auth-title">Đăng nhập</h2>
          <p className="auth-subtitle">Tiếp tục quản lý tài chính cá nhân của bạn.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Mật khẩu
            </label>
            <div className="input-with-icon">
              <LockKeyhole size={18} />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          Chưa có tài khoản? <Link href="/auth/register">Đăng ký ngay</Link>
        </div>
      </section>
    </main>
  )
}
