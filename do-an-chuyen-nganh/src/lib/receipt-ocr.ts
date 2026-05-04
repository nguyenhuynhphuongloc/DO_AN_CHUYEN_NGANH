export { normalizeCategoryName } from './category-normalization'
import { normalizeCategoryName } from './category-normalization'

export interface AllowedCategoryCandidate {
  id: string
  name: string
  type: 'income' | 'expense'
}

export interface ReceiptOcrRequestMetadata {
  user_id: string
  currency_preference?: string | null
  include_debug?: boolean
  allowed_categories: AllowedCategoryCandidate[]
}

export interface ReceiptOcrReviewFields {
  merchant_name: string | null
  transaction_date: string | null
  total_amount: number | null
  total_amount_display: string | null
  currency: string | null
  category_id: string | null
  category_name: string | null
  category_reason: string | null
  description: string | null
  user_note: string
}

export interface ReceiptOcrLineItem {
  name: string | null
  quantity: number | null
  unit_price: number | null
  line_total: number | null
  confidence: number | null
}

export interface ReceiptOcrNormalizedReceipt {
  fields: {
    merchant_name: string | null
    transaction_date: string | null
    transaction_datetime: string | null
    total_amount: number | null
    currency: string | null
    payment_method?: string | null
  }
  items: ReceiptOcrLineItem[]
  receipt_summary: {
    merchant_name: string | null
    transaction_date: string | null
    transaction_datetime: string | null
    total_amount: number | null
    currency: string | null
    provider_category: string | null
    line_items: ReceiptOcrLineItem[]
  }
}

export interface ReceiptOcrError {
  code: string
  message: string
}

export interface ReceiptOcrSuccessResponse {
  success: true
  provider: 'veryfi'
  transaction_type: 'expense'
  source_type: 'receipt_ai'
  raw_text: string
  review_fields: ReceiptOcrReviewFields
  normalized_receipt: ReceiptOcrNormalizedReceipt
  debug?: {
    provider_document_id?: string | number | null
    provider_payload_summary?: Record<string, unknown> | null
  } | null
  errors: ReceiptOcrError[]
}

export interface ReceiptOcrFailureResponse {
  success: false
  provider: 'veryfi'
  transaction_type: 'expense'
  source_type: 'receipt_ai'
  raw_text: null
  review_fields: null
  normalized_receipt: null
  debug: null
  errors: ReceiptOcrError[]
}

export type ReceiptOcrResponse = ReceiptOcrSuccessResponse | ReceiptOcrFailureResponse

export interface ReceiptOcrConfirmPayload {
  transaction_type: 'expense'
  source_type: 'receipt_ai'
  review_fields: {
    merchant_name: string
    transaction_date: string
    total_amount: number
    currency: string
    category_id: string
    description: string
    user_note: string
  }
}

export interface RawCategoryCandidate {
  id: number | string
  name?: string | null
  type?: 'income' | 'expense' | null
  user?: number | { id: number | string } | null
}

function selectPreferredCategory(
  current: RawCategoryCandidate,
  candidate: RawCategoryCandidate,
  userId: number | string,
): RawCategoryCandidate {
  const currentOwned = typeof current.user === 'object' ? current.user?.id === userId : current.user === userId
  const candidateOwned = typeof candidate.user === 'object' ? candidate.user?.id === userId : candidate.user === userId

  if (currentOwned !== candidateOwned) {
    return candidateOwned ? candidate : current
  }

  return Number(candidate.id) > Number(current.id) ? candidate : current
}

export function buildAllowedExpenseCategories(
  categories: RawCategoryCandidate[],
  userId: number | string,
): AllowedCategoryCandidate[] {
  const deduped = new Map<string, RawCategoryCandidate>()

  for (const category of categories) {
    if (category.type !== 'expense' || !category.name) continue
    const key = `${normalizeCategoryName(category.name)}|expense`
    const existing = deduped.get(key)
    if (!existing) {
      deduped.set(key, category)
      continue
    }
    deduped.set(key, selectPreferredCategory(existing, category, userId))
  }

  return Array.from(deduped.values())
    .sort((left, right) => (left.name || '').localeCompare(right.name || '', 'vi'))
    .map((category) => ({
      id: String(category.id),
      name: category.name || '',
      type: 'expense' as const,
    }))
}

export function parseLocaleAmount(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const normalized = trimmed.replace(/\./g, '').replace(/,/g, '.')
  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : null
}

export function formatAmountDisplay(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return ''
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 2,
  }).format(value)
}
