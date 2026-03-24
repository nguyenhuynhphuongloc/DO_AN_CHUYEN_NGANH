import type { CollectionConfig } from 'payload'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  admin: {
    useAsTitle: 'description',
    defaultColumns: ['type', 'amount', 'category', 'date', 'description'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      return { user: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return { user: { equals: user.id } }
    },
  },
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === 'create' && req.user) {
          data.user = req.user.id
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      label: 'Loại giao dịch',
      options: [
        { label: 'Thu nhập', value: 'income' },
        { label: 'Chi tiêu', value: 'expense' },
      ],
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: 'Số tiền (VND)',
      min: 0,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      label: 'Danh mục',
    },
    {
      name: 'description',
      type: 'text',
      label: 'Mô tả',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      label: 'Ngày giao dịch',
      defaultValue: () => new Date().toISOString(),
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd/MM/yyyy',
        },
      },
    },
    {
      name: 'note',
      type: 'textarea',
      label: 'Ghi chú',
    },
    {
      name: 'receipt',
      type: 'upload',
      relationTo: 'media',
      label: 'Hóa đơn',
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Người dùng',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
