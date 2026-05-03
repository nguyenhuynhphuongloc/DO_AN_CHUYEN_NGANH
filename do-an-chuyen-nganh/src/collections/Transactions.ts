import type { CollectionConfig } from 'payload'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  admin: {
    useAsTitle: 'description',
    defaultColumns: ['type', 'amount', 'merchantName', 'category', 'date'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => Boolean(user), // Chỉ cần đã đăng nhập là có thể tạo
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
  },
  hooks: {
    beforeValidate: [
      ({ req, operation, data }) => {
        if (operation === 'create' && req.user && data) {
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
      label: 'Số tiền',
      min: 0,
    },
    {
      name: 'merchantName',
      type: 'text',
      label: 'Tên cửa hàng',
    },
    {
      name: 'currency',
      type: 'text',
      label: 'Loại tiền',
      defaultValue: 'VND',
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
      name: 'sourceType',
      type: 'select',
      label: 'Nguồn tạo giao dịch',
      defaultValue: 'manual',
      options: [
        { label: 'Nhập tay', value: 'manual' },
        { label: 'Quét hóa đơn AI', value: 'receipt_ai' },
      ],
      admin: {
        position: 'sidebar',
      },
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
