import { headers as getHeaders } from 'next/headers.js'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'

import Sidebar from '@/components/Sidebar'
import config from '@payload-config'

const formatCurrency = (value: number, currency = 'VND') => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/auth/login')
  }

  const { id } = await params
  const transaction = await payload.findByID({
    collection: 'transactions' as any,
    id,
    depth: 2,
    user,
    overrideAccess: false,
  })

  if (!transaction || (transaction as any).sourceType !== 'receipt_ai' || !(transaction as any).receipt) {
    notFound()
  }

  const receipt = (transaction as any).receipt
  const category = (transaction as any).category
  const wallet = (transaction as any).wallet
  const receiptUrl = typeof receipt === 'object' ? receipt.url : null

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="main-content">
        <div className="page-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Chi tiết hóa đơn</h1>
            </div>
          </div>

          <div className="grid grid-2" style={{ alignItems: 'start' }}>
            <div className="card">
              {receiptUrl ? (
                <img
                  src={receiptUrl}
                  alt={(receipt as any).alt || 'Receipt image'}
                  style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)' }}
                />
              ) : (
                <div className="empty-state">
                  <p className="empty-state-desc">Không tìm thấy ảnh hóa đơn.</p>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="card-title">{(transaction as any).merchantName || 'Hóa đơn OCR'}</h2>
              </div>
              <div className="receipt-detail-list">
                <div>
                  <span>Tổng tiền</span>
                  <strong>{formatCurrency((transaction as any).amount, (transaction as any).currency || 'VND')}</strong>
                </div>
                <div>
                  <span>Ngày giao dịch</span>
                  <strong>{new Intl.DateTimeFormat('vi-VN').format(new Date((transaction as any).date))}</strong>
                </div>
                <div>
                  <span>Danh mục</span>
                  <strong>{typeof category === 'object' ? category.name : '—'}</strong>
                </div>
                <div>
                  <span>Ví</span>
                  <strong>{typeof wallet === 'object' ? wallet.name : '—'}</strong>
                </div>
                <div>
                  <span>Mô tả</span>
                  <strong>{(transaction as any).description || '—'}</strong>
                </div>
                <div>
                  <span>Ghi chú</span>
                  <strong>{(transaction as any).note || '—'}</strong>
                </div>
                <div>
                  <span>Mã tham chiếu OCR</span>
                  <strong>{(transaction as any).sourceRefId || '—'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
