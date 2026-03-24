import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
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
