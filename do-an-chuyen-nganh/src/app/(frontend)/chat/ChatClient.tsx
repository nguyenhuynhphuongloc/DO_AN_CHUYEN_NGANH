'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, Check, Edit3, Lightbulb, Send, WalletCards } from 'lucide-react'

import CategoryIcon from '@/components/CategoryIcon'
import Sidebar from '@/components/Sidebar'
import { normalizeCategoryName } from '@/lib/category-normalization'

type Message = {
  role: 'user' | 'bot'
  text: string
  data?: any
}

type ChatClientProps = {
  user: any
  initialCategories: any[]
  wallets: any[]
  defaultWalletId: number | null
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

const safeFormatDate = (dateValue: string) => {
  const parsed = dateValue ? new Date(dateValue) : new Date()
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed
  return new Intl.DateTimeFormat('vi-VN').format(date)
}

export default function ChatClient({ user, initialCategories, wallets, defaultWalletId }: ChatClientProps) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: 'Xin chào! Bạn có thể nhập nhanh như "chi 50k ăn sáng" hoặc "hôm qua nhận lương 20tr".',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState<number | null>(null)
  const [isAdvisor, setIsAdvisor] = useState(false)

  const visibleCategories = useMemo(() => {
    const deduped = new Map<string, any>()
    for (const category of initialCategories) {
      if (!category?.name || !category?.type) continue
      const key = `${normalizeCategoryName(category.name)}|${category.type}`
      if (!deduped.has(key)) deduped.set(key, category)
    }
    return Array.from(deduped.values()).sort((left, right) => left.name.localeCompare(right.name, 'vi'))
  }, [initialCategories])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const findMatchingCategory = (type: string, requestedCategory?: string) => {
    const normalizedRequested = normalizeCategoryName(requestedCategory || '')
    if (!normalizedRequested) return null

    return (
      visibleCategories.find((category) => {
        if (category.type !== type) return false
        const normalizedName = normalizeCategoryName(category.name || '')
        return normalizedName.includes(normalizedRequested) || normalizedRequested.includes(normalizedName)
      }) || null
    )
  }

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((previous) => [...previous, { role: 'user', text: userMessage }])
    setLoading(true)

    try {
      if (isAdvisor) {
        const response = await fetch('/api/ai/advisor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: userMessage }),
        })
        const data = await response.json()
        setMessages((previous) => [
          ...previous,
          { role: 'bot', text: data.advice || 'Tôi chưa thể đưa ra tư vấn lúc này.' },
        ])
        return
      }

      const response = await fetch('/api/ai/nlp/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userMessage }),
      })
      const data = await response.json()

      if (data.error) {
        setMessages((previous) => [...previous, { role: 'bot', text: `Lỗi AI: ${data.error}` }])
        return
      }

      if (!data.amount || data.amount <= 0) {
        setMessages((previous) => [
          ...previous,
          { role: 'bot', text: 'Tôi đã nhận nội dung nhưng chưa nhận diện được số tiền. Vui lòng nhập rõ số tiền.' },
        ])
        return
      }

      const matchedCategory = findMatchingCategory(data.type, data.category)
      if (!matchedCategory) {
        setMessages((previous) => [
          ...previous,
          {
            role: 'bot',
            text: `Tôi nhận diện ${data.type === 'income' ? 'thu nhập' : 'chi tiêu'} ${formatCurrency(Number(data.amount))} ngày ${safeFormatDate(data.date)}. Vui lòng chọn danh mục có sẵn để lưu giao dịch.`,
            data: { ...data, originalText: userMessage, isPicking: true },
          },
        ])
        return
      }

      setMessages((previous) => [
        ...previous,
        {
          role: 'bot',
          text: `Bạn muốn lưu **${data.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}** ${formatCurrency(Number(data.amount))} vào danh mục **${matchedCategory.name}** ngày **${safeFormatDate(data.date)}**?`,
          data: { ...data, category: matchedCategory.name, originalText: userMessage },
        },
      ])
    } catch {
      setMessages((previous) => [...previous, { role: 'bot', text: 'Có lỗi khi kết nối dịch vụ AI.' }])
    } finally {
      setLoading(false)
    }
  }

  const selectCategory = (categoryName: string, messageIndex: number) => {
    setMessages((previous) => {
      const next = [...previous]
      const message = next[messageIndex]
      if (message?.data) {
        message.data.category = categoryName
        message.data.isPicking = false
        message.text = `Đã chọn danh mục **${categoryName}**. Bạn có muốn lưu giao dịch này không?`
      }
      return next
    })
  }

  const confirmTransaction = async (data: any, messageIndex: number) => {
    if (!user) {
      setMessages((previous) => [...previous, { role: 'bot', text: 'Bạn cần đăng nhập để lưu giao dịch.' }])
      return
    }

    const matchedCategory = findMatchingCategory(data.type, data.category)
    if (!matchedCategory) {
      setMessages((previous) => {
        const next = [...previous]
        if (next[messageIndex]?.data) {
          next[messageIndex].data.isPicking = true
          next[messageIndex].text = 'Danh mục chưa khớp với danh mục có sẵn. Vui lòng chọn danh mục trước khi lưu.'
        }
        return next
      })
      return
    }

    setIsSaving(messageIndex)
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: data.type,
          amount: Number(data.amount),
          description: data.description || data.text || 'Giao dịch từ chatbot',
          date: Number.isNaN(new Date(data.date).getTime()) ? new Date().toISOString() : new Date(data.date).toISOString(),
          category: Number(matchedCategory.id),
          wallet: defaultWalletId || wallets[0]?.id,
          sourceType: 'chatbot',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setMessages((previous) => [
          ...previous,
          { role: 'bot', text: `Không thể lưu giao dịch: ${errorData.error || 'Lỗi không xác định'}` },
        ])
        return
      }

      setMessages((previous) => previous.filter((_, index) => index !== messageIndex))
      setMessages((previous) => [
        ...previous,
        { role: 'bot', text: `Đã lưu giao dịch vào danh mục **${matchedCategory.name}**.` },
      ])
      router.refresh()
    } catch {
      setMessages((previous) => [...previous, { role: 'bot', text: 'Lỗi kết nối khi lưu giao dịch.' }])
    } finally {
      setIsSaving(null)
    }
  }

  if (!user) {
    return (
      <div className="app-layout">
        <Sidebar user={null} />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ textAlign: 'center', padding: 40, maxWidth: 420 }}>
            <Bot size={58} color="var(--primary)" style={{ marginBottom: 18 }} />
            <h2 style={{ marginBottom: 12 }}>Yêu cầu đăng nhập</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Vui lòng đăng nhập để dùng trợ lý AI.</p>
            <Link href="/auth/login" className="btn btn-primary" style={{ width: '100%' }}>
              Đăng nhập
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        <div className="page-container chat-container">
          <div className="page-header">
            <div>
              <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                Trợ lý AI <Bot size={30} color="var(--primary)" />
              </h1>
            </div>
            <div className="advisor-toggle-card">
              <button className={`btn ${!isAdvisor ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setIsAdvisor(false)}>
                <Edit3 size={16} /> Nhập liệu
              </button>
              <button className={`btn ${isAdvisor ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setIsAdvisor(true)}>
                <Lightbulb size={16} /> Tư vấn
              </button>
            </div>
          </div>

          <div className="chat-messages card">
            {messages.map((message, index) => (
              <div key={index} className={`chat-bubble-wrapper ${message.role}`}>
                <div className={`chat-bubble ${message.role}`}>
                  {message.role === 'bot' ? (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                      {message.data?.isPicking && (
                        <div className="category-picker-grid">
                          {visibleCategories
                            .filter((category) => category.type === message.data.type)
                            .map((category) => (
                              <button
                                key={category.id}
                                className="category-picker-btn"
                                onClick={() => selectCategory(category.name, index)}
                              >
                                <span className="category-picker-icon">
                                  <CategoryIcon icon={category.icon || 'Package'} size={20} />
                                </span>
                                <span className="category-picker-label">{category.name}</span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    message.text
                  )}

                  {message.data && !message.data.isPicking && (
                    <div className="chat-action" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button className="btn btn-primary" onClick={() => confirmTransaction(message.data, index)} disabled={isSaving === index}>
                        <Check size={16} /> {isSaving === index ? 'Đang lưu...' : 'Xác nhận & lưu'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setMessages((previous) => {
                            const next = [...previous]
                            if (next[index]?.data) next[index].data.isPicking = true
                            return next
                          })
                        }}
                        disabled={isSaving === index}
                      >
                        <Edit3 size={16} /> Đổi danh mục
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="chat-loading">FinTrack đang xử lý...</div>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="chat-input-wrapper">
            <input
              type="text"
              className="form-input chat-input"
              placeholder={isAdvisor ? 'Hỏi về tài chính của bạn...' : 'Ví dụ: chi 50k ăn sáng'}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn btn-primary chat-send-btn" disabled={loading}>
              <Send size={18} /> Gửi
            </button>
          </form>

          <div className="chat-wallet-note">
            <WalletCards size={16} /> Giao dịch chatbot sẽ lưu vào ví mặc định.
          </div>
        </div>
      </main>
    </div>
  )
}
