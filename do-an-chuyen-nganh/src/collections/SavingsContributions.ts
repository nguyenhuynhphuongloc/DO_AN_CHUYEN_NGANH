import type { CollectionConfig } from 'payload'

import { ownerOnly } from '../access/roles'

export const SavingsContributions: CollectionConfig = {
  slug: 'savings-contributions',
  tableName: 'savings_contributions',
  admin: {
    useAsTitle: 'description',
    defaultColumns: ['goal', 'sourceWallet', 'amount', 'date'],
    group: 'Finance Operations',
  },
  lockDocuments: false,
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
      name: 'goal',
      type: 'relationship',
      relationTo: 'savings-goals' as any,
      required: true,
      label: 'Muc tieu tiet kiem',
    },
    {
      name: 'sourceWallet',
      type: 'relationship',
      relationTo: 'wallets' as any,
      required: true,
      label: 'Vi nap',
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
      label: 'So tien nap',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      label: 'Ngay nap',
      defaultValue: () => new Date().toISOString(),
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd/MM/yyyy',
        },
      },
    },
    {
      name: 'movementType',
      type: 'select',
      defaultValue: 'contribution',
      options: [
        { label: 'Nạp tiền', value: 'contribution' },
        { label: 'Rút tiền', value: 'withdrawal' },
      ],
      label: 'Loại giao dịch',
      admin: {
        description: 'Phân biệt nạp tiền và rút tiền khỏi mục tiêu.',
      },
    },
    {
      name: 'description',
      type: 'text',
      label: 'Mo ta',
    },
  ],
  timestamps: true,
}
