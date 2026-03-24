import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'icon', 'isDefault'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      return {
        or: [
          { isDefault: { equals: true } },
          { user: { equals: user.id } },
        ],
      } as any
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
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Tên danh mục',
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      label: 'Loại',
      options: [
        { label: 'Thu nhập', value: 'income' },
        { label: 'Chi tiêu', value: 'expense' },
      ],
    },
    {
      name: 'icon',
      type: 'text',
      label: 'Icon',
      defaultValue: '📦',
    },
    {
      name: 'color',
      type: 'text',
      label: 'Mã màu',
      defaultValue: '#6366f1',
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      label: 'Người tạo',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      label: 'Danh mục mặc định',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
