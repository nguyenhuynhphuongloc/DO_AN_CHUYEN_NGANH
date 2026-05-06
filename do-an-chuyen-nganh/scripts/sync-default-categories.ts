import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const defaultCategories = [
  { aliases: ['An uong', 'Ăn uống'], name: 'Ăn uống', type: 'expense', icon: 'Utensils', color: '#ef4444' },
  { aliases: ['Di lai', 'Đi lại'], name: 'Đi lại', type: 'expense', icon: 'Car', color: '#f59e0b' },
  { aliases: ['Giai tri', 'Giải trí'], name: 'Giải trí', type: 'expense', icon: 'Gamepad2', color: '#8b5cf6' },
  { aliases: ['Mua sam', 'Mua sắm'], name: 'Mua sắm', type: 'expense', icon: 'ShoppingCart', color: '#ec4899' },
  { aliases: ['Nha cua', 'Nhà cửa'], name: 'Nhà cửa', type: 'expense', icon: 'House', color: '#14b8a6' },
  { aliases: ['Y te', 'Y tế'], name: 'Y tế', type: 'expense', icon: 'HeartPulse', color: '#06b6d4' },
  { aliases: ['Giao duc', 'Giáo dục'], name: 'Giáo dục', type: 'expense', icon: 'GraduationCap', color: '#6366f1' },
  { aliases: ['Qua tang', 'Quà tặng'], name: 'Quà tặng', type: 'expense', icon: 'Gift', color: '#f97316' },
  { aliases: ['Hoa don', 'Hóa đơn'], name: 'Hóa đơn', type: 'expense', icon: 'ReceiptText', color: '#84cc16' },
  { aliases: ['Thu cung', 'Thú cưng'], name: 'Thú cưng', type: 'expense', icon: 'PawPrint', color: '#a16207' },
  { aliases: ['Suc khoe', 'Sức khỏe'], name: 'Sức khỏe', type: 'expense', icon: 'HeartPulse', color: '#0ea5e9' },
  { aliases: ['Du lich', 'Du lịch'], name: 'Du lịch', type: 'expense', icon: 'Plane', color: '#2563eb' },
  { aliases: ['Lam dep', 'Làm đẹp'], name: 'Làm đẹp', type: 'expense', icon: 'Shirt', color: '#db2777' },
  { aliases: ['Khac', 'Khác'], name: 'Khác', type: 'expense', icon: 'Package', color: '#64748b' },
  { aliases: ['Luong', 'Lương'], name: 'Lương', type: 'income', icon: 'BriefcaseBusiness', color: '#10b981' },
  { aliases: ['Thuong', 'Thưởng'], name: 'Thưởng', type: 'income', icon: 'Gift', color: '#f59e0b' },
  { aliases: ['Dau tu', 'Đầu tư'], name: 'Đầu tư', type: 'income', icon: 'TrendingUp', color: '#6366f1' },
  { aliases: ['Freelance'], name: 'Freelance', type: 'income', icon: 'Laptop', color: '#8b5cf6' },
  { aliases: ['kinh doanh', 'Kinh doanh'], name: 'Kinh doanh', type: 'income', icon: 'BriefcaseBusiness', color: '#0f766e' },
  {
    aliases: ['Thu nhap khac', 'Thu nhập khác'],
    name: 'Thu nhập khác',
    type: 'income',
    icon: 'CircleDollarSign',
    color: '#14b8a6',
  },
] as const

const main = async () => {
  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'categories',
    where: { isDefault: { equals: true } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  let created = 0
  let updated = 0

  for (const category of defaultCategories) {
    const doc = existing.docs.find((item) => {
      return item.type === category.type && category.aliases.includes(item.name as never)
    })

    if (doc) {
      await payload.update({
        collection: 'categories',
        id: doc.id,
        data: {
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color,
          isDefault: true,
        },
        overrideAccess: true,
      })
      updated++
      continue
    }

    await payload.create({
      collection: 'categories',
      data: {
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
        isDefault: true,
      },
      overrideAccess: true,
    })
    created++
  }

  const synced = await payload.find({
    collection: 'categories',
    where: { isDefault: { equals: true } },
    limit: 1000,
    depth: 0,
    sort: 'type,name',
    overrideAccess: true,
  })

  console.log(`Synced default categories. Updated: ${updated}. Created: ${created}.`)
  console.log(synced.docs.map((category) => `${category.type}: ${category.name}`).join('\n'))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
