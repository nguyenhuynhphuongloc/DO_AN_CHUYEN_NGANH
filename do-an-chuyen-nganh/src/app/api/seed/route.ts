import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'

import { isAdmin } from '@/access/roles'
import config from '@payload-config'

const DEFAULT_CATEGORIES = [
  { name: 'Ăn uống', type: 'expense', icon: 'Utensils', color: '#ef4444', isDefault: true },
  { name: 'Đi lại', type: 'expense', icon: 'Car', color: '#f59e0b', isDefault: true },
  { name: 'Giải trí', type: 'expense', icon: 'Gamepad2', color: '#8b5cf6', isDefault: true },
  { name: 'Mua sắm', type: 'expense', icon: 'ShoppingCart', color: '#ec4899', isDefault: true },
  { name: 'Nhà cửa', type: 'expense', icon: 'House', color: '#14b8a6', isDefault: true },
  { name: 'Y tế', type: 'expense', icon: 'HeartPulse', color: '#06b6d4', isDefault: true },
  { name: 'Giáo dục', type: 'expense', icon: 'GraduationCap', color: '#6366f1', isDefault: true },
  { name: 'Quà tặng', type: 'expense', icon: 'Gift', color: '#f97316', isDefault: true },
  { name: 'Hóa đơn', type: 'expense', icon: 'ReceiptText', color: '#84cc16', isDefault: true },
  { name: 'Thú cưng', type: 'expense', icon: 'PawPrint', color: '#a16207', isDefault: true },
  { name: 'Sức khỏe', type: 'expense', icon: 'HeartPulse', color: '#0ea5e9', isDefault: true },
  { name: 'Du lịch', type: 'expense', icon: 'Plane', color: '#2563eb', isDefault: true },
  { name: 'Làm đẹp', type: 'expense', icon: 'Shirt', color: '#db2777', isDefault: true },
  { name: 'Khác', type: 'expense', icon: 'Package', color: '#64748b', isDefault: true },
  { name: 'Lương', type: 'income', icon: 'BriefcaseBusiness', color: '#10b981', isDefault: true },
  { name: 'Thưởng', type: 'income', icon: 'Gift', color: '#f59e0b', isDefault: true },
  { name: 'Đầu tư', type: 'income', icon: 'TrendingUp', color: '#6366f1', isDefault: true },
  { name: 'Freelance', type: 'income', icon: 'Laptop', color: '#8b5cf6', isDefault: true },
  { name: 'Kinh doanh', type: 'income', icon: 'BriefcaseBusiness', color: '#0f766e', isDefault: true },
  { name: 'Thu nhập khác', type: 'income', icon: 'CircleDollarSign', color: '#14b8a6', isDefault: true },
]

export async function GET() {
  try {
    const headers = await getHeaders()
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers })

    if (!isAdmin(user)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existing = await payload.find({
      collection: 'categories',
      where: { isDefault: { equals: true } },
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      return Response.json({ message: 'Default categories already exist', count: existing.totalDocs })
    }

    let created = 0
    for (const category of DEFAULT_CATEGORIES) {
      await payload.create({
        collection: 'categories',
        data: category as any,
      })
      created++
    }

    return Response.json({ message: `Created ${created} default categories`, created })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
