import type { CollectionConfig } from 'payload'

import { ownerOnly } from '../access/roles'

export const Wallets: CollectionConfig = {
  slug: 'wallets',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'walletType', 'balance', 'currency', 'isDefault'],
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
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Ten vi',
    },
    {
      name: 'walletType',
      type: 'select',
      required: true,
      label: 'Loai vi',
      defaultValue: 'cash',
      options: [
        { label: 'Vi chinh', value: 'main' },
        { label: 'Tien mat', value: 'cash' },
        { label: 'Ngan hang', value: 'bank' },
        { label: 'Tiet kiem', value: 'savings' },
      ],
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
      label: 'Tien te',
      defaultValue: 'VND',
    },
    {
      name: 'balance',
      type: 'number',
      required: true,
      label: 'So du',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'monthlySpendingLimit',
      type: 'number',
      label: 'Muc chi tieu thang',
      min: 0,
      admin: {
        description: 'Ap dung cho vi chi tieu chinh cua nguoi dung.',
      },
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      label: 'Vi mac dinh',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Dang su dung',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
