import type { CollectionConfig } from 'payload'

export const AIChatLogs: CollectionConfig = {
  slug: 'ai-chat-logs',
  admin: {
    useAsTitle: 'kind',
    defaultColumns: ['kind', 'direction', 'status', 'redactedText', 'user', 'createdAt'],
    group: 'System',
  },
  access: {
    read: ({ req: { user } }) => {
      // Admin can read all; normal user can read own logs only if needed
      if (!user) return false
      if (user.role === 'admin') return true
      // Normal users can read own logs for future UI
      return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => {
      // Server and admin controlled; normal users cannot create
      return user?.role === 'admin'
    },
    update: ({ req: { user } }) => {
      // Admin controlled
      return user?.role === 'admin'
    },
    delete: ({ req: { user } }) => {
      // Admin controlled
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The user associated with this chat/advisor interaction.',
      },
    },
    {
      name: 'kind',
      type: 'select',
      options: ['advisor', 'chatbot', 'other'],
      required: true,
      admin: {
        description: 'The type of AI interaction (advisor, chatbot, etc).',
      },
    },
    {
      name: 'direction',
      type: 'select',
      options: [
        { label: 'Incoming', value: 'incoming' },
        { label: 'Outgoing', value: 'outgoing' },
      ],
      required: true,
      admin: {
        description: 'Whether this is a user message (incoming) or AI response (outgoing).',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Success', value: 'success' },
        { label: 'Error', value: 'error' },
      ],
      required: true,
      admin: {
        description: 'Whether the interaction succeeded or errored.',
      },
    },
    {
      name: 'redactedText',
      type: 'textarea',
      admin: {
        description: 'Redacted or summarized text for admin visibility. Sensitive PII removed.',
      },
    },
    {
      name: 'rawText',
      type: 'textarea',
      admin: {
        condition: ({ siblingData }) => siblingData?.role === 'admin',
        description: 'Full raw text. Only visible to admins with advanced permissions.',
      },
    },
    {
      name: 'intent',
      type: 'text',
      admin: {
        description: 'Detected intent or category of the message (e.g., "spending_inquiry", "advice_request").',
      },
    },
    {
      name: 'linkedTransaction',
      type: 'relationship',
      relationTo: 'transactions',
      admin: {
        description: 'If the chat/advisor interaction resulted in a transaction creation, link it here.',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional structured data (request/response tokens, model used, etc).',
      },
    },
    {
      name: 'errorMessage',
      type: 'textarea',
      admin: {
        description: 'If status is error, capture the error message for debugging.',
      },
    },
  ],
  timestamps: true,
}
