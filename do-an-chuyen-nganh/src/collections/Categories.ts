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
      if (user.role === 'admin') return true
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
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return { user: { equals: user.id } }
    },
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
    beforeDelete: [
      async ({ req, id }) => {
        try {
          const categoryToDelete = await req.payload.findByID({
            collection: 'categories',
            id,
          })

          if (!categoryToDelete) return

          // 1. Không cho phép xóa danh mục mặc định (trừ admin)
          if (categoryToDelete.isDefault && req.user?.role !== 'admin') {
            throw new Error('Không thể xóa danh mục mặc định của hệ thống.')
          }

          // 2. Kiểm tra xem có giao dịch nào liên quan không
          const transactionsCount = await req.payload.find({
            collection: 'transactions',
            where: {
              category: { equals: id }
            },
            limit: 1,
          })

          if (transactionsCount.totalDocs > 0) {
            // 3. Chỉ tìm danh mục thay thế khi thực sự có giao dịch
            const fallbackCategory = await req.payload.find({
              collection: 'categories',
              where: {
                and: [
                  { isDefault: { equals: true } },
                  { type: { equals: categoryToDelete.type } },
                  { id: { not_equals: id } }
                ]
              },
              limit: 1,
            })

            let targetId = fallbackCategory.totalDocs > 0 ? fallbackCategory.docs[0].id : null

            // Nếu không có danh mục mặc định, tìm bất kỳ danh mục nào khác cùng loại
            if (!targetId) {
              const anyOtherCategory = await req.payload.find({
                collection: 'categories',
                where: {
                  and: [
                    { type: { equals: categoryToDelete.type } },
                    { id: { not_equals: id } }
                  ]
                },
                limit: 1,
              })
              if (anyOtherCategory.totalDocs > 0) {
                targetId = anyOtherCategory.docs[0].id
              }
            }

            if (!targetId) {
              throw new Error('Không tìm thấy danh mục thay thế để chuyển giao dịch sang. Vui lòng tạo một danh mục khác cùng loại trước khi xóa.')
            }

            // 4. Chuyển toàn bộ giao dịch sang danh mục thay thế
            const allTransactions = await req.payload.find({
              collection: 'transactions',
              where: {
                category: { equals: id }
              },
              limit: 5000,
            })

            console.log(`Đang chuyển ${allTransactions.totalDocs} giao dịch sang danh mục thay thế...`)
            for (const doc of allTransactions.docs) {
              await req.payload.update({
                collection: 'transactions',
                id: doc.id,
                data: {
                  category: targetId
                }
              })
            }
          }
        } catch (error: any) {
          console.error('Lỗi khi xử lý xóa danh mục:', error.message)
          throw error
        }
      }
    ],
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
