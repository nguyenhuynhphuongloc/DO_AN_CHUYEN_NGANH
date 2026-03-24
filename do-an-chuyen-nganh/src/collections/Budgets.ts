import type { CollectionConfig } from 'payload'

export const Budgets: CollectionConfig = {
  slug: 'budgets',
  admin: {
    useAsTitle: 'period',
    defaultColumns: ['category', 'amount', 'period'],
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
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      label: 'Danh mục',
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: 'Hạn mức (VND)',
      min: 0,
    },
    {
      name: 'period',
      type: 'select',
      required: true,
      label: 'Kỳ hạn',
      options: [
        { label: 'Hàng ngày', value: 'daily' },
        { label: 'Hàng tuần', value: 'weekly' },
        { label: 'Hàng tháng', value: 'monthly' },
        { label: 'Hàng năm', value: 'yearly' },
      ],
      defaultValue: 'monthly',
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
