'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { MdCheckCircle, MdCloudUpload, MdDocumentScanner, MdReceiptLong, MdWarning } from 'react-icons/md'

import { normalizeCategoryName } from '@/lib/category-normalization'
import type { ReceiptOcrResponse } from '@/lib/receipt-ocr'
import { formatAmountDisplay, parseLocaleAmount } from '@/lib/receipt-ocr'

type Category = {
  id: number | string
  name: string
  type: 'income' | 'expense'
}

type UserSummary = {
  email: string
  name?: string | null
  currency?: string | null
}

type ReviewFormState = {
  merchantName: string
  transactionDate: string
  totalAmountInput: string
  currency: string
  categoryId: string
  description: string
  userNote: string
}

const emptyForm = (currency = 'VND'): ReviewFormState => ({
  merchantName: '',
  transactionDate: '',
  totalAmountInput: '',
  currency,
  categoryId: '',
  description: '',
  userNote: '',
})

export default function ScanClient({ user, categories }: { user: UserSummary; categories: Category[] }) {
  const expenseCategories = useMemo(() => {
    const deduped = new Map<string, Category>()

    for (const category of categories) {
      if (category.type !== 'expense') continue
      const key = normalizeCategoryName(category.name)
      if (!deduped.has(key)) {
        deduped.set(key, category)
      }
    }

    return Array.from(deduped.values()).sort((left, right) => left.name.localeCompare(right.name, 'vi'))
  }, [categories])

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<ReceiptOcrResponse | null>(null)
  const [formState, setFormState] = useState<ReviewFormState>(() => emptyForm(user.currency || 'VND'))
  const [isParsing, setIsParsing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  function resetScanState(options?: { preserveSuccess?: boolean }) {
    setFile(null)
    setPreview(null)
    setOcrResult(null)
    setFormState(emptyForm(user.currency || 'VND'))
    setParseError(null)
    setSaveError(null)
    if (!options?.preserveSuccess) {
      setSaveSuccess(null)
    }
  }

  function applyOcrResult(data: ReceiptOcrResponse) {
    setOcrResult(data)
    if (!data.success) {
      const firstError = data.errors[0]?.message || 'Không thể phân tích hóa đơn.'
      setParseError(firstError)
      setFormState(emptyForm(user.currency || 'VND'))
      return
    }

    setParseError(null)
    setFormState({
      merchantName: data.review_fields.merchant_name || '',
      transactionDate: data.review_fields.transaction_date || new Date().toISOString().split('T')[0],
      totalAmountInput:
        data.review_fields.total_amount_display || formatAmountDisplay(data.review_fields.total_amount) || '',
      currency: data.review_fields.currency || user.currency || 'VND',
      categoryId: data.review_fields.category_id || '',
      description: data.review_fields.description || '',
      userNote: data.review_fields.user_note || '',
    })
  }

  async function handleParse() {
    if (!file) return

    setIsParsing(true)
    setParseError(null)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const requestBody = new FormData()
      requestBody.append('file', file, file.name)

      const response = await fetch('/api/ai/ocr/receipt', {
        method: 'POST',
        body: requestBody,
      })

      const data = (await response.json()) as ReceiptOcrResponse
      applyOcrResult(data)
    } catch (error) {
      console.error(error)
      setParseError('Có lỗi xảy ra khi phân tích hóa đơn.')
      setOcrResult(null)
    } finally {
      setIsParsing(false)
    }
  }

  async function handleConfirm() {
    if (!file) return

    const amount = parseLocaleAmount(formState.totalAmountInput)
    if (!amount || amount <= 0) {
      setSaveError('Vui lòng nhập tổng tiền hợp lệ.')
      return
    }

    if (!formState.transactionDate || !formState.categoryId) {
      setSaveError('Vui lòng kiểm tra ngày giao dịch và danh mục trước khi lưu.')
      return
    }

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const requestBody = new FormData()
      requestBody.append('file', file, file.name)
      requestBody.append(
        'payload',
        JSON.stringify({
          transaction_type: 'expense',
          source_type: 'receipt_ai',
          review_fields: {
            merchant_name: formState.merchantName,
            transaction_date: formState.transactionDate,
            total_amount: amount,
            currency: formState.currency,
            category_id: formState.categoryId,
            description: formState.description,
            user_note: formState.userNote,
          },
        }),
      )

      const response = await fetch('/api/ai/ocr/receipt/confirm', {
        method: 'POST',
        body: requestBody,
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        setSaveError(data.message || 'Có lỗi xảy ra trong quá trình lưu giao dịch.')
        return
      }

      setSaveSuccess('Lưu giao dịch thành công.')
      resetScanState({ preserveSuccess: true })
    } catch (error) {
      console.error(error)
      setSaveError('Có lỗi xảy ra trong quá trình lưu giao dịch.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          Quét hóa đơn <MdDocumentScanner size={32} color="var(--primary)" />
        </h1>
        <p className="page-subtitle">Veryfi trích xuất hóa đơn, Groq gợi ý danh mục, bạn xác nhận trước khi lưu.</p>
      </div>

      {(saveSuccess || parseError || saveError) && (
        <div
          className="card"
          style={{
            marginBottom: '16px',
            borderColor: saveSuccess ? 'var(--income-color)' : 'var(--danger-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {saveSuccess ? (
              <MdCheckCircle size={22} color="var(--income-color)" />
            ) : (
              <MdWarning size={22} color="var(--danger-color)" />
            )}
            <span>{saveSuccess || parseError || saveError}</span>
          </div>
        </div>
      )}

      <div className="grid grid-2" style={{ alignItems: 'flex-start' }}>
        <div className="card">
          <div className="form-group">
            <label className="form-label">Ảnh hóa đơn</label>
            <input
              type="file"
              accept="image/*"
              className="form-input"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] || null
                setFile(nextFile)
                setOcrResult(null)
                setParseError(null)
                setSaveError(null)
                setSaveSuccess(null)
                setFormState(emptyForm(user.currency || 'VND'))
              }}
            />
          </div>

          {preview ? (
            <div
              style={{
                marginTop: '16px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
              }}
            >
              <img src={preview} alt="Receipt preview" style={{ width: '100%', display: 'block' }} />
            </div>
          ) : (
            <div
              className="empty-state"
              style={{
                marginTop: '16px',
                minHeight: '280px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <MdReceiptLong size={42} color="var(--text-muted)" />
              <p className="empty-state-desc">Chọn ảnh hóa đơn để bắt đầu phân tích.</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
              disabled={!file || isParsing}
              onClick={handleParse}
            >
              {isParsing ? 'Đang phân tích...' : <><MdCloudUpload size={20} /> Bắt đầu quét</>}
            </button>
            <button
              className="btn btn-secondary"
              style={{ minWidth: '120px', justifyContent: 'center' }}
              disabled={isParsing || isSaving}
              onClick={() => resetScanState()}
            >
              Làm mới
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Xác nhận thông tin hóa đơn</h3>

          {!ocrResult?.success ? (
            <div className="empty-state" style={{ minHeight: '360px', display: 'flex', justifyContent: 'center' }}>
              <p className="empty-state-desc">Sau khi quét xong, các trường OCR sẽ xuất hiện ở đây để bạn chỉnh sửa.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Tên cửa hàng</label>
                <input
                  className="form-input"
                  value={formState.merchantName}
                  onChange={(event) => setFormState((current) => ({ ...current, merchantName: event.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ngày tạo</label>
                <input
                  type="date"
                  className="form-input"
                  value={formState.transactionDate}
                  onChange={(event) => setFormState((current) => ({ ...current, transactionDate: event.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tổng tiền</label>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <input
                    className="form-input"
                    value={formState.totalAmountInput}
                    onChange={(event) => setFormState((current) => ({ ...current, totalAmountInput: event.target.value }))}
                    placeholder="100.000"
                  />
                  <input
                    className="form-input"
                    value={formState.currency}
                    onChange={(event) => setFormState((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
                    placeholder="VND"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Loại</label>
                <select
                  className="form-select"
                  value={formState.categoryId}
                  onChange={(event) => setFormState((current) => ({ ...current, categoryId: event.target.value }))}
                >
                  <option value="">Chọn danh mục</option>
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={String(category.id)}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Ghi chú</label>
                <input
                  className="form-input"
                  value={formState.description}
                  onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Người dùng ghi chú</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={formState.userNote}
                  onChange={(event) => setFormState((current) => ({ ...current, userNote: event.target.value }))}
                />
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={isSaving}
                onClick={handleConfirm}
              >
                {isSaving ? 'Đang lưu...' : 'Xác nhận và lưu giao dịch'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
