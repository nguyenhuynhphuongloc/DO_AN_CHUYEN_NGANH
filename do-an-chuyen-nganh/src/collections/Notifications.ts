import type { CollectionConfig } from 'payload'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'message',
    defaultColumns: ['recipient', 'message', 'type', 'read'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { recipient: { equals: user.id } }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      return { recipient: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return { recipient: { equals: user.id } }
    },
  },
  fields: [
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Người nhận',
    },
    {
      name: 'message',
      type: 'text',
      required: true,
      label: 'Nội dung thông báo',
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Lời mời', value: 'invitation' },
        { label: 'Đóng góp mới', value: 'contribution' },
        { label: 'Hoàn thành', value: 'completion' },
        { label: 'Hệ thống', value: 'system' },
      ],
      label: 'Loại thông báo',
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      label: 'Đã đọc',
    },
    {
      name: 'link',
      type: 'text',
      label: 'Đường dẫn liên kết',
    },
  ],
  timestamps: true,
}
