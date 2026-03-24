'use client'
import React, { useState } from 'react'
import Sidebar from '@/components/Sidebar'

export default function ScanPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)

    try {
      const res = await fetch('/api/ai/ocr/receipt', {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      alert('Lỗi khi quét hóa đơn')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-layout">
      <Sidebar user={{ email: 'user@example.com', name: 'User' }} />
      <main className="main-content">
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">Quét hóa đơn 📸</h1>
            <p className="page-subtitle">Sử dụng AI để tự động trích xuất thông tin từ hóa đơn</p>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <div className="form-group">
                <label className="form-label">Chọn ảnh hóa đơn</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="form-input" />
              </div>
              
              {preview && (
                <div className="preview-container" style={{ marginTop: '16px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={preview} alt="Receipt preview" style={{ width: '100%', display: 'block' }} />
                </div>
              )}

              <button 
                className="btn btn-primary" 
                style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
                onClick={handleUpload}
                disabled={!file || loading}
              >
                {loading ? 'Đang phân tích...' : 'Bắt đầu quét'}
              </button>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '16px' }}>Kết quả phân tích</h3>
              {result ? (
                <div className="ocr-result">
                  <div className="stat-card income" style={{ marginBottom: '16px' }}>
                    <div className="stat-card-label">Số tiền phát hiện</div>
                    <div className="stat-card-value">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(result.amount)}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Nội dung trích xuất</label>
                    <textarea 
                      className="form-input" 
                      rows={10} 
                      value={result.raw_text} 
                      readOnly
                      style={{ fontSize: '12px', fontFamily: 'monospace' }}
                    />
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
                    Tạo giao dịch ngay
                  </button>
                </div>
              ) : (
                <div className="empty-state">
                  <p className="empty-state-desc">Vui lòng tải ảnh lên để xem kết quả</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
