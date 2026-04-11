import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    create: () => true,
    read: ({ req: { user } }) => {
      if (user) return true
      return false
    },
    update: ({ req: { user } }) => {
      if (user) return { id: { equals: user.id } }
      return false
    },
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      defaultValue: 'user',
      required: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'name',
      type: 'text',
      label: 'Họ và tên',
    },
    {
      name: 'currency',
      type: 'select',
      label: 'Đơn vị tiền tệ',
      options: [
        { label: 'VND (₫)', value: 'VND' },
        { label: 'USD ($)', value: 'USD' },
      ],
      defaultValue: 'VND',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: 'Ảnh đại diện',
    },
  ],
}
