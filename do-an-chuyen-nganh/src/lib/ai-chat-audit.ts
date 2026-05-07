import type { Payload } from 'payload'

/**
 * Create a redacted audit log for an AI/advisor/chat interaction.
 * Redaction removes sensitive PII by default.
 */
export interface AiAuditLogInput {
  userId: string | number
  kind: 'advisor' | 'chatbot' | 'other'
  direction: 'incoming' | 'outgoing'
  status: 'success' | 'error'
  fullText: string // Raw full text
  redactedText?: string // If provided, use as-is; otherwise auto-redact
  intent?: string
  linkedTransactionId?: string | number
  errorMessage?: string
  metadata?: Record<string, any>
}

/**
 * Auto-redact sensitive content by removing email addresses, phone numbers, etc.
 */
function redactSensitiveContent(text: string): string {
  let redacted = text
  // Remove email addresses
  redacted = redacted.replace(/[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
  // Remove phone numbers
  redacted = redacted.replace(/(\+?1[-.\s]?)?(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g, '[PHONE]')
  // Remove common SSN patterns
  redacted = redacted.replace(/\d{3}-\d{2}-\d{4}/g, '[SSN]')
  // Remove credit card patterns
  redacted = redacted.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')
  return redacted
}

/**
 * Create an AI/advisor/chat audit log entry.
 * Only call from server-side code (routes, hooks, etc).
 */
export async function createAiAuditLog(payload: Payload, input: AiAuditLogInput): Promise<void> {
  try {
    const redactedText = input.redactedText ?? redactSensitiveContent(input.fullText)

    await payload.create({
      collection: 'ai-chat-logs' as any,
      data: {
        user: input.userId,
        kind: input.kind,
        direction: input.direction,
        status: input.status,
        rawText: input.fullText,
        redactedText,
        intent: input.intent ?? null,
        linkedTransaction: input.linkedTransactionId ? { relationTo: 'transactions', value: input.linkedTransactionId } : null,
        errorMessage: input.errorMessage ?? null,
        metadata: input.metadata ?? null,
      },
      overrideAccess: true,
    })
  } catch (error) {
    // Log audit creation failures but don't break the main operation
    console.error('Failed to create AI audit log:', error)
  }
}

/**
 * Summarize AI interaction text for display in admin UI.
 * Return first N characters and add ellipsis if truncated.
 */
export function summarizeAiText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}
