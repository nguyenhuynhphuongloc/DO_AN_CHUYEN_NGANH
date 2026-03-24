import { getPayload } from 'payload'
import config from '@payload-config'
import { headers as getHeaders } from 'next/headers.js'

const DEFAULT_CATEGORIES = [
  // Expense categories
  { name: 'Ăn uống', type: 'expense', icon: '🍔', color: '#ef4444', isDefault: true },
  { name: 'Di chuyển', type: 'expense', icon: '🚗', color: '#f59e0b', isDefault: true },
  { name: 'Giải trí', type: 'expense', icon: '🎮', color: '#8b5cf6', isDefault: true },
  { name: 'Mua sắm', type: 'expense', icon: '🛒', color: '#ec4899', isDefault: true },
  { name: 'Nhà ở', type: 'expense', icon: '🏠', color: '#14b8a6', isDefault: true },
  { name: 'Y tế', type: 'expense', icon: '💊', color: '#06b6d4', isDefault: true },
  { name: 'Giáo dục', type: 'expense', icon: '📚', color: '#6366f1', isDefault: true },
  { name: 'Quà tặng', type: 'expense', icon: '🎁', color: '#f97316', isDefault: true },
  { name: 'Hóa đơn', type: 'expense', icon: '💡', color: '#84cc16', isDefault: true },
  { name: 'Khác', type: 'expense', icon: '📦', color: '#64748b', isDefault: true },
  // Income categories
  { name: 'Lương', type: 'income', icon: '💼', color: '#10b981', isDefault: true },
  { name: 'Thưởng', type: 'income', icon: '🎁', color: '#f59e0b', isDefault: true },
  { name: 'Đầu tư', type: 'income', icon: '📈', color: '#6366f1', isDefault: true },
  { name: 'Freelance', type: 'income', icon: '💻', color: '#8b5cf6', isDefault: true },
  { name: 'Thu nhập khác', type: 'income', icon: '💰', color: '#14b8a6', isDefault: true },
]

export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Check if default categories already exist
    const existing = await payload.find({
      collection: 'categories' as any,
      where: { isDefault: { equals: true } },
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      return Response.json({ message: 'Default categories already exist', count: existing.totalDocs })
    }

    // Create default categories
    let created = 0
    for (const cat of DEFAULT_CATEGORIES) {
      await payload.create({
        collection: 'categories' as any,
        data: cat as any,
      })
      created++
    }

    return Response.json({ message: `Created ${created} default categories`, created })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
