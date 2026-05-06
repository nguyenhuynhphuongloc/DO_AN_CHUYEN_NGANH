import type { CollectionConfig } from 'payload'

import { ownerOnly } from '../access/roles'

export const Budgets: CollectionConfig = {
  slug: 'budgets',
  admin: {
    useAsTitle: 'period',
    defaultColumns: ['category', 'wallet', 'amount', 'period', 'month', 'year'],
  },
  access: {
    read: ownerOnly('user'),
    create: ({ req: { user } }) => Boolean(user),
    update: ownerOnly('user'),
    delete: ownerOnly('user'),
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
      name: 'wallet',
      type: 'relationship',
      relationTo: 'wallets' as any,
      label: 'Vi',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      label: 'Danh muc',
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: 'Han muc (VND)',
      min: 0,
    },
    {
      name: 'period',
      type: 'select',
      required: true,
      index: true,
      label: 'Ky han',
      options: [
        { label: 'Hang ngay', value: 'daily' },
        { label: 'Hang tuan', value: 'weekly' },
        { label: 'Hang thang', value: 'monthly' },
        { label: 'Hang nam', value: 'yearly' },
      ],
      defaultValue: 'monthly',
    },
    {
      name: 'month',
      type: 'number',
      index: true,
      label: 'Thang',
      min: 1,
      max: 12,
    },
    {
      name: 'year',
      type: 'number',
      index: true,
      label: 'Nam',
      min: 2000,
    },
    {
      name: 'note',
      type: 'textarea',
      label: 'Ghi chu',
    },
    {
      name: 'alertThresholds',
      type: 'json',
      label: 'Nguong canh bao',
      defaultValue: [80, 100],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      index: true,
      label: 'Dang su dung',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Nguoi dung',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
