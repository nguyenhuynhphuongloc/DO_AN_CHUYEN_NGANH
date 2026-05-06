import type { CollectionConfig } from 'payload'

import { isAdmin, ownerOnly } from '../access/roles'

const getRelationshipId = (value: unknown): number | string | undefined => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: number | string }).id
    if (typeof id === 'number' || typeof id === 'string') return id
  }
  return undefined
}

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  admin: {
    useAsTitle: 'description',
    defaultColumns: ['type', 'amount', 'wallet', 'merchantName', 'category', 'date'],
  },
  access: {
    read: ownerOnly('user'),
    create: ({ req: { user } }) => Boolean(user),
    update: ownerOnly('user'),
    delete: ownerOnly('user'),
  },
  hooks: {
    beforeValidate: [
      async ({ req, operation, data, originalDoc }) => {
        if (operation === 'create' && req.user && data) {
          data.user = req.user.id
        }

        if (!data || !req.user) return data

        const transactionUserId = getRelationshipId(data.user) ?? getRelationshipId(originalDoc?.user) ?? req.user.id

        if (operation === 'create' && !data.wallet) {
          const defaultWallet = await req.payload.find({
            collection: 'wallets' as any,
            where: {
              and: [
                { user: { equals: transactionUserId } },
                { isDefault: { equals: true } },
              ],
            },
            limit: 1,
            depth: 0,
            req,
            overrideAccess: true,
          })

          if (defaultWallet.docs[0]) {
            data.wallet = defaultWallet.docs[0].id
          }
        }

        const walletId = getRelationshipId(data.wallet) ?? getRelationshipId(originalDoc?.wallet)
        if (walletId) {
          const wallet = await req.payload.findByID({
            collection: 'wallets' as any,
            id: walletId,
            depth: 0,
            req,
            overrideAccess: true,
          })

          const walletUserId = getRelationshipId((wallet as any).user)
          if (!isAdmin(req.user) && String(walletUserId) !== String(transactionUserId)) {
            throw new Error('Vi khong thuoc nguoi dung hien tai.')
          }
        }

        const categoryId = getRelationshipId(data.category) ?? getRelationshipId(originalDoc?.category)
        const transactionType = data.type ?? originalDoc?.type
        if (categoryId) {
          const category = await req.payload.findByID({
            collection: 'categories' as any,
            id: categoryId,
            depth: 0,
            req,
            overrideAccess: true,
          })

          const categoryUserId = getRelationshipId((category as any).user)
          const isVisibleCategory = (category as any).isDefault || !categoryUserId || String(categoryUserId) === String(transactionUserId)
          if (!isAdmin(req.user) && !isVisibleCategory) {
            throw new Error('Danh muc khong thuoc nguoi dung hien tai.')
          }

          if (transactionType && (category as any).type !== transactionType) {
            throw new Error('Loai danh muc khong khop voi loai giao dich.')
          }
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
      index: true,
      label: 'Loai giao dich',
      options: [
        { label: 'Thu nhap', value: 'income' },
        { label: 'Chi tieu', value: 'expense' },
      ],
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      label: 'So tien',
      min: 0,
    },
    {
      name: 'merchantName',
      type: 'text',
      label: 'Ten cua hang',
    },
    {
      name: 'currency',
      type: 'text',
      label: 'Loai tien',
      defaultValue: 'VND',
    },
    {
      name: 'wallet',
      type: 'relationship',
      relationTo: 'wallets' as any,
      required: true,
      label: 'Vi',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      label: 'Danh muc',
    },
    {
      name: 'description',
      type: 'text',
      label: 'Mo ta',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
      label: 'Ngay giao dich',
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
      label: 'Ghi chu',
    },
    {
      name: 'receipt',
      type: 'upload',
      relationTo: 'media',
      label: 'Hoa don',
    },
    {
      name: 'sourceType',
      type: 'select',
      index: true,
      label: 'Nguon tao giao dich',
      defaultValue: 'manual',
      options: [
        { label: 'Nhap tay', value: 'manual' },
        { label: 'Chatbot', value: 'chatbot' },
        { label: 'Quet hoa don AI', value: 'receipt_ai' },
        { label: 'Chuyen vi', value: 'transfer' },
        { label: 'Dieu chinh', value: 'adjustment' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sourceRefId',
      type: 'text',
      label: 'Ma tham chieu nguon',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'savingsGoal',
      type: 'relationship',
      relationTo: 'savings-goals' as any,
      label: 'Muc tieu tiet kiem',
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
