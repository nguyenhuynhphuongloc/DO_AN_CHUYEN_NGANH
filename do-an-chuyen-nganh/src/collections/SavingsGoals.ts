import type { CollectionConfig } from 'payload'

export const SavingsGoals: CollectionConfig = {
  slug: 'savings-goals',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'targetAmount', 'currentAmount', 'status'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        or: [
          { owner: { equals: user.id } },
          { participants: { contains: user.id } },
        ],
      }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { owner: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { owner: { equals: user.id } }
    },
  },
  hooks: {
    beforeValidate: [
      ({ req, operation, data }) => {
        if (operation === 'create' && req.user) {
          data.owner = req.user.id
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Tên mục tiêu',
    },
    {
      name: 'targetAmount',
      type: 'number',
      required: true,
      label: 'Số tiền mục tiêu (VND)',
      min: 0,
    },
    {
      name: 'currentAmount',
      type: 'number',
      defaultValue: 0,
      label: 'Số tiền hiện có (VND)',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Đang thực hiện', value: 'active' },
        { label: 'Đã hoàn thành', value: 'completed' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'icon',
      type: 'text',
      label: 'Icon',
      defaultValue: '🎯',
    },
    {
      name: 'color',
      type: 'text',
      label: 'Mã màu',
      defaultValue: '#6366f1',
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      label: 'Chủ sở hữu',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'participants',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      label: 'Thành viên tham gia',
    },
  ],
  timestamps: true,
}
