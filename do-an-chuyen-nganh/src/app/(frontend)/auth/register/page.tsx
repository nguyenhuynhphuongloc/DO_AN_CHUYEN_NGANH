'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react'
import AppLogo from '@/components/AppLogo'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.errors?.[0]?.message || 'Đăng ký thất bại')
        setLoading(false)
        return
      }

      await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Có lỗi xảy ra, vui lòng thử lại')
      setLoading(false)
    }
  }

  return (
    <main className="auth-page auth-shell auth-single">
      <section className="auth-card auth-form-panel" aria-label="Đăng ký">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <AppLogo className="app-logo-image" size={52} priority />
          </div>
          <h2 className="auth-title">Tạo tài khoản</h2>
          <p className="auth-subtitle">Thiết lập không gian tài chính cá nhân của bạn.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Họ và tên
            </label>
            <div className="input-with-icon">
              <UserRound size={18} />
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>
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
          <div className="form-row">
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
                  placeholder="Ít nhất 8 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Xác nhận
              </label>
              <div className="input-with-icon">
                <LockKeyhole size={18} />
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input"
                  placeholder="Nhập lại"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          Đã có tài khoản? <Link href="/auth/login">Đăng nhập</Link>
        </div>
      </section>
    </main>
  )
}
