'use client'
import React, { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import { format } from 'date-fns'

interface Message {
  role: 'user' | 'bot'
  text: string
  data?: any
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Xin chào! Tôi là trợ lý FinTrack. Bạn có thể nhập thu chi nhanh như "chi 50k ăn sáng" hoặc "hôm qua nhận lương 20tr".' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      // 1. Parse NLP
      const res = await fetch('/api/ai/nlp/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userMsg }),
      })
      const nlpData = await res.json()

      if (nlpData.amount > 0) {
        // 2. Ask for confirmation or auto-create (here we show preview)
        setMessages(prev => [...prev, {
          role: 'bot',
          text: `Tôi đã hiểu! Bạn muốn ghi nhận: ${nlpData.type === 'income' ? 'Thu nhập' : 'Chi tiêu'} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(nlpData.amount)} cho "${nlpData.category}".`,
          data: nlpData
        }])
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: 'Xin lỗi, tôi không tìm thấy thông tin số tiền trong câu của bạn.' }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Có lỗi khi kết nối với dịch vụ AI.' }])
    } finally {
      setLoading(false)
    }
  }

  const confirmTransaction = async (data: any) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: data.type,
          amount: data.amount,
          description: data.description,
          date: new Date(data.date).toISOString(),
          // We'd need to map category name to ID in a real app
          // For now, let's assume "Khác" or fetch categories
          category: '64f7...', // Placeholder
        }),
      })
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'bot', text: '✅ Đã lưu giao dịch thành công!' }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Không thể lưu giao dịch.' }])
    }
  }

  return (
    <div className="app-layout">
      {/* Sidebar - we'd need to fetch user but placeholder for now */}
      <Sidebar user={{ email: 'user@example.com', name: 'User' }} />
      <main className="main-content">
        <div className="page-container chat-container">
          <div className="page-header">
            <h1 className="page-title">Trợ lý AI 🤖</h1>
            <p className="page-subtitle">Nhập liệu và truy vấn bằng ngôn ngữ tự nhiên</p>
          </div>

          <div className="chat-messages card">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble-wrapper ${m.role}`}>
                <div className={`chat-bubble ${m.role}`}>
                  {m.text}
                  {m.data && (
                    <div className="chat-action">
                      <button className="btn btn-primary btn-sm" onClick={() => confirmTransaction(m.data)}>
                        Xác nhận & Lưu
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="chat-loading">FinTrack đang suy nghĩ...</div>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="chat-input-wrapper">
            <input
              type="text"
              className="form-input chat-input"
              placeholder="Nhập nội dung... (ví dụ: chi 50k ăn sáng)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>Gửi</button>
          </form>
        </div>
      </main>
    </div>
  )
}
