'use client'
import React, { useState, useRef, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MdSmartToy, MdSend, MdLightbulb, MdEditNote, MdCheck } from 'react-icons/md'
import { useRouter } from 'next/navigation'
import CategoryIcon from '@/components/CategoryIcon'

interface Message {
  role: 'user' | 'bot'
  text: string
  data?: any
}

interface ChatClientProps {
  user: any
  initialCategories: any[]
}

export default function ChatClient({ user, initialCategories }: ChatClientProps) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Sử dụng dữ liệu khởi tạo từ props (Server-side passed down)
  const [userData] = useState<any>(user)
  const [categories, setCategories] = useState<any[]>(initialCategories)
  
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Xin chào! Tôi là trợ lý FinTrack. Bạn có thể nhập thu chi nhanh như "chi 50k ăn sáng" hoặc "hôm qua nhận lương 20tr".' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState<number | null>(null)
  const [isAdvisor, setIsAdvisor] = useState(false)

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
      if (isAdvisor) {
        const res = await fetch('/api/ai/advisor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: userMsg }),
        })
        const advisorData = await res.json()
        
        setMessages(prev => [...prev, {
          role: 'bot',
          text: advisorData.advice || 'Xin lỗi, tôi không thể đưa ra lời khuyên lúc này.'
        }])
      } else {
        const res = await fetch('/api/ai/nlp/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: userMsg }),
        })
        const nlpData = await res.json()

        if (nlpData.error) {
          setMessages(prev => [...prev, { role: 'bot', text: `❌ **Lỗi:** ${nlpData.error}. Vui lòng kiểm tra xem AI Service đã được bật chưa.` }])
        } else if (nlpData.amount > 0) {
          if (!nlpData.category) {
            setMessages(prev => [...prev, {
              role: 'bot',
              text: `Tôi đã nhận được số tiền **${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(nlpData.amount)}**. Vui lòng chọn danh mục phù hợp cho khoản **${nlpData.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}** này:`,
              data: { ...nlpData, isPicking: true }
            }])
          } else {
            setMessages(prev => [...prev, {
              role: 'bot',
              text: `Tôi đã hiểu! Bạn muốn ghi nhận: **${nlpData.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}** - **${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(nlpData.amount)}** vào mục "${nlpData.category}".`,
              data: nlpData
            }])
          }
        } else {
          setMessages(prev => [...prev, { role: 'bot', text: 'Xin lỗi, tôi không tìm thấy thông tin số tiền trong câu của bạn.' }])
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Có lỗi khi kết nối với dịch vụ AI.' }])
    } finally {
      setLoading(false)
    }
  }

  const getSmartIcon = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes('ăn') || n.includes('uống') || n.includes('nhà hàng') || n.includes('cf') || n.includes('phở')) return 'MdRestaurant'
    if (n.includes('lương') || n.includes('thưởng') || n.includes('thu nhập') || n.includes('tiền')) return 'MdAttachMoney'
    if (n.includes('xe') || n.includes('xăng') || n.includes('taxi') || n.includes('grab')) return 'MdDirectionsCar'
    if (n.includes('điện') || n.includes('nước') || n.includes('internet') || n.includes('wifi')) return 'MdLightbulb'
    if (n.includes('học') || n.includes('sách') || n.includes('khóa học')) return 'MdMenuBook'
    if (n.includes('quần') || n.includes('áo') || n.includes('giày') || n.includes('mua sắm')) return 'MdShoppingCart'
    if (n.includes('giải trí') || n.includes('phim') || n.includes('game')) return 'MdGames'
    return 'MdInventory2'
  }

  const confirmTransaction = async (data: any, index: number) => {
    if (!userData) {
      setMessages(prev => [...prev, { role: 'bot', text: '⚠️ Bạn cần đăng nhập để thực hiện chức năng này.' }])
      return
    }

    setIsSaving(index)

    let categoryId = ''
    let matchedCatName = ''
    
    const matched = categories.find(c => 
      c.name.toLowerCase().includes(data.category.toLowerCase()) || 
      data.category.toLowerCase().includes(c.name.toLowerCase())
    )

    if (matched) {
      categoryId = matched.id
      matchedCatName = matched.name
    } else {
      try {
        const catRes = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.category,
            type: data.type,
            icon: getSmartIcon(data.category),
            color: data.type === 'income' ? '#22c55e' : '#ef4444'
          }),
        })
        const newCat = await catRes.json()
        if (newCat.id) {
          categoryId = newCat.id
          matchedCatName = newCat.name
          setCategories(prev => [...prev, newCat])
        } else {
          throw new Error('Lỗi tạo danh mục')
        }
      } catch (err) {
        setMessages(prev => [...prev, { role: 'bot', text: '❌ Không thể tự động tạo danh mục mới. Vui lòng thử lại.' }])
        return
      }
    }

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: data.type,
          amount: Number(data.amount),
          description: data.description || data.text || 'Giao dịch từ AI',
          date: new Date(data.date).toISOString(),
          category: Number(categoryId),
          user: Number(userData.id),
        }),
      })

      if (res.ok) {
        // Xóa tin nhắn xác nhận cũ
        setMessages(prev => prev.filter((_, i) => i !== index))
        setMessages(prev => [...prev, { role: 'bot', text: `Lưu giao dịch thành công vào danh mục **${matchedCatName}**` }])
        router.refresh()
      } else {
        const errorData = await res.json()
        const errorMsg = errorData.errors?.[0]?.message || 'Lỗi không xác định'
        setMessages(prev => [...prev, { role: 'bot', text: `❌ Không thể lưu giao dịch: ${errorMsg}` }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: '❌ Lỗi kết nối khi lưu giao dịch.' }])
    } finally {
      setIsSaving(null)
    }
  }

  const selectCategory = (categoryName: string, msgIndex: number) => {
    setMessages(prev => {
      const newMessages = [...prev]
      const msg = newMessages[msgIndex]
      if (msg && msg.data) {
        msg.data.category = categoryName
        msg.data.isPicking = false
        msg.text = `Tôi đã cập nhật danh mục: **${categoryName}**. Bạn có muốn lưu giao dịch này không?`
      }
      return newMessages
    })
  }

  if (!userData) {
    return (
      <div className="app-layout">
        <Sidebar user={null} />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="auth-required card" style={{ textAlign: 'center', padding: '40px', maxWidth: '400px' }}>
            <MdSmartToy size={64} color="var(--primary)" style={{ marginBottom: '20px' }} />
            <h2 style={{ marginBottom: '12px' }}>Yêu cầu đăng nhập</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Vui lòng đăng nhập để sử dụng Trợ lý AI và quản lý tài chính thông minh.</p>
            <Link href="/auth/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Đăng nhập ngay
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar user={userData} />
      <main className="main-content">
        <div className="page-container chat-container">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                Trợ lý AI <MdSmartToy size={32} color="var(--primary)" />
              </h1>
              <p className="page-subtitle">Nhập liệu và tư vấn tài chính thông minh</p>
            </div>
            
            <div className="advisor-toggle-card" style={{ display: 'flex', gap: '8px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <button 
                className={`btn btn-sm ${!isAdvisor ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setIsAdvisor(false)}
                style={{ borderRadius: '8px', fontSize: '12px', padding: '6px 12px', border: 'none' }}
              >
                <MdEditNote size={16} /> Nhập liệu
              </button>
              <button 
                className={`btn btn-sm ${isAdvisor ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setIsAdvisor(true)}
                style={{ borderRadius: '8px', fontSize: '12px', padding: '6px 12px', border: 'none' }}
              >
                <MdLightbulb size={16} /> Tư vấn AI
              </button>
            </div>
          </div>

          <div className="chat-messages card">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble-wrapper ${m.role}`}>
                <div className={`chat-bubble ${m.role}`}>
                  {m.role === 'bot' ? (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                      
                      {m.data?.isPicking && (
                        <div className="category-picker-grid">
                          {categories
                            .filter(c => c.type === m.data.type)
                            .map(cat => (
                              <button 
                                key={cat.id} 
                                className="category-picker-btn"
                                onClick={() => selectCategory(cat.name, i)}
                              >
                                <span className="category-picker-icon">
                                  <CategoryIcon icon={cat.icon || 'MdAttachMoney'} size={20} />
                                </span>
                                <span className="category-picker-label">{cat.name}</span>
                              </button>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  ) : m.text}
                  
                  {m.data && !m.data.isPicking && (
                    <div className="chat-action">
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => confirmTransaction(m.data, i)}
                        disabled={isSaving === i}
                      >
                        {isSaving === i ? 'Đang lưu...' : 'Xác nhận & Lưu'}
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
              placeholder={isAdvisor ? "Hỏi bất cứ điều gì về tài chính của bạn..." : "Nhập nội dung... (ví dụ: chi 50k ăn sáng)"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="btn btn-primary chat-send-btn" 
              disabled={loading} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <MdSend size={18} /> Gửi
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
