import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { Client } from 'pg'

const SYSTEM_CATEGORIES = [
  { key: 'food', name: 'An uong', type: 'expense', icon: 'Utensils', color: '#ef4444' },
  { key: 'transport', name: 'Di lai', type: 'expense', icon: 'Car', color: '#f59e0b' },
  { key: 'shopping', name: 'Mua sam', type: 'expense', icon: 'ShoppingCart', color: '#ec4899' },
  { key: 'housing', name: 'Nha cua', type: 'expense', icon: 'Home', color: '#14b8a6' },
  { key: 'bills', name: 'Hoa don', type: 'expense', icon: 'ReceiptText', color: '#84cc16' },
  { key: 'health', name: 'Suc khoe', type: 'expense', icon: 'HeartPulse', color: '#06b6d4' },
  { key: 'education', name: 'Giao duc', type: 'expense', icon: 'BookOpen', color: '#6366f1' },
  { key: 'entertainment', name: 'Giai tri', type: 'expense', icon: 'Gamepad2', color: '#8b5cf6' },
  { key: 'travel', name: 'Du lich', type: 'expense', icon: 'Plane', color: '#0ea5e9' },
  { key: 'gifts', name: 'Qua tang', type: 'expense', icon: 'Gift', color: '#f97316' },
  { key: 'beauty', name: 'Lam dep', type: 'expense', icon: 'Sparkles', color: '#d946ef' },
  { key: 'pets', name: 'Thu cung', type: 'expense', icon: 'PawPrint', color: '#a855f7' },
  { key: 'other-expense', name: 'Khac', type: 'expense', icon: 'Package', color: '#64748b' },
  { key: 'salary', name: 'Luong', type: 'income', icon: 'Briefcase', color: '#10b981' },
  { key: 'bonus', name: 'Thuong', type: 'income', icon: 'Gift', color: '#f59e0b' },
  { key: 'business', name: 'Kinh doanh', type: 'income', icon: 'Store', color: '#14b8a6' },
  { key: 'investment-income', name: 'Dau tu', type: 'income', icon: 'TrendingUp', color: '#6366f1' },
  { key: 'other-income', name: 'Thu nhap khac', type: 'income', icon: 'CircleDollarSign', color: '#64748b' },
]

const CATEGORY_ID_MAP = new Map([
  [1, 'food'],
  [2, 'food'],
  [9, 'food'],
  [65, 'food'],
  [69, 'food'],
  [70, 'food'],
  [74, 'food'],
  [78, 'food'],
  [82, 'food'],
  [86, 'food'],
  [5, 'transport'],
  [10, 'transport'],
  [42, 'transport'],
  [67, 'transport'],
  [72, 'transport'],
  [76, 'transport'],
  [80, 'transport'],
  [84, 'transport'],
  [88, 'transport'],
  [17, 'shopping'],
  [66, 'shopping'],
  [71, 'shopping'],
  [75, 'shopping'],
  [79, 'shopping'],
  [83, 'shopping'],
  [87, 'shopping'],
  [4, 'entertainment'],
  [22, 'entertainment'],
  [3, 'entertainment'],
  [27, 'housing'],
  [28, 'bills'],
  [34, 'health'],
  [35, 'education'],
  [15, 'travel'],
  [29, 'gifts'],
  [43, 'beauty'],
  [63, 'pets'],
  [32, 'other-expense'],
  [49, 'other-expense'],
  [68, 'other-expense'],
  [73, 'other-expense'],
  [77, 'other-expense'],
  [81, 'other-expense'],
  [85, 'other-expense'],
  [89, 'other-expense'],
  [45, 'other-expense'],
  [44, 'other-expense'],
  [21, 'other-expense'],
  [7, 'salary'],
  [8, 'business'],
  [39, 'other-income'],
])

function loadEnv() {
  const envPath = path.resolve('.env')
  if (!fs.existsSync(envPath)) return

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue
    const index = line.indexOf('=')
    if (index < 0) continue
    const key = line.slice(0, index)
    const value = line.slice(index + 1)
    process.env[key] ||= value
  }
}

function getClient() {
  loadEnv()
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required')
  }

  return new Client({ connectionString: process.env.DATABASE_URL })
}

async function backup() {
  const client = getClient()
  await client.connect()
  try {
    const tables = ['users', 'wallets', 'categories', 'transactions', 'receipts', 'receipt_parse_sessions', 'receipt_parser_results']
    const output = {}
    for (const table of tables) {
      const result = await client.query(`select * from ${table} order by 1`)
      output[table] = result.rows
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outputDir = path.resolve('tmp', 'db-backups')
    fs.mkdirSync(outputDir, { recursive: true })
    const outputPath = path.join(outputDir, `finance-backup-${timestamp}.json`)
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2))
    console.log(`Backup written: ${outputPath}`)
  } finally {
    await client.end()
  }
}

async function ensureSystemCategories(client) {
  const byKey = new Map()
  for (const category of SYSTEM_CATEGORIES) {
    const existing = await client.query(
      'select id from categories where lower(name) = lower($1) and type = $2 and is_default = true order by id limit 1',
      [category.name, category.type],
    )
    if (existing.rows[0]) {
      byKey.set(category.key, existing.rows[0].id)
      continue
    }

    const inserted = await client.query(
      `insert into categories (name, type, icon, color, user_id, is_default, updated_at, created_at)
       values ($1, $2, $3, $4, null, true, now(), now())
       returning id`,
      [category.name, category.type, category.icon, category.color],
    )
    byKey.set(category.key, inserted.rows[0].id)
  }
  return byKey
}

async function categoryDryRun() {
  const client = getClient()
  await client.connect()
  try {
    const usage = await client.query(`
      select c.id, c.name, c.type, c.user_id, c.is_default, count(t.id)::int as transaction_count
      from categories c
      left join transactions t on t.category_id = c.id
      group by c.id
      order by c.id
    `)

    const rows = usage.rows.map((category) => {
      const targetKey = CATEGORY_ID_MAP.get(category.id)
      const target = targetKey ? SYSTEM_CATEGORIES.find((item) => item.key === targetKey) : null
      return {
        id: category.id,
        name: category.name,
        type: category.type,
        user_id: category.user_id,
        is_default: category.is_default,
        transaction_count: category.transaction_count,
        target_key: targetKey ?? null,
        target_name: target?.name ?? null,
      }
    })

    console.table(rows)
  } finally {
    await client.end()
  }
}

async function applyCategoryMap() {
  if (!process.argv.includes('--apply')) {
    throw new Error('Refusing to mutate data without --apply')
  }

  const client = getClient()
  await client.connect()
  try {
    await client.query('begin')
    const targetIds = await ensureSystemCategories(client)

    for (const [sourceId, targetKey] of CATEGORY_ID_MAP.entries()) {
      const targetId = targetIds.get(targetKey)
      if (!targetId || sourceId === targetId) continue
      await client.query('update transactions set category_id = $1 where category_id = $2', [targetId, sourceId])
    }

    const obsoleteIds = Array.from(CATEGORY_ID_MAP.keys())
    const obsoleteWithoutTransactions = await client.query(
      `delete from categories
       where id = any($1::int[])
       and not exists (select 1 from transactions where transactions.category_id = categories.id)
       returning id, name`,
      [obsoleteIds],
    )

    await client.query('commit')
    console.log('Deleted obsolete categories with zero remaining transactions:')
    console.table(obsoleteWithoutTransactions.rows)
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    await client.end()
  }
}

async function backfillWallets() {
  if (!process.argv.includes('--apply')) {
    throw new Error('Refusing to mutate data without --apply')
  }

  const client = getClient()
  await client.connect()
  try {
    await client.query('begin')

    const usersWithoutDefaultWallet = await client.query(`
      select u.id, coalesce(u.currency::text, 'VND') as currency
      from users u
      where not exists (
        select 1 from wallets w where w.user_id = u.id and w.is_default = true
      )
    `)

    for (const user of usersWithoutDefaultWallet.rows) {
      await client.query(
        `insert into wallets (user_id, name, wallet_type, currency, balance, is_default, updated_at, created_at)
         values ($1, 'Vi chinh', 'cash', $2, 0, true, now(), now())`,
        [user.id, user.currency || 'VND'],
      )
    }

    const backfilledTransactions = await client.query(`
      update transactions t
      set wallet_id = w.id
      from wallets w
      where t.wallet_id is null
      and w.user_id = t.user_id
      and w.is_default = true
      returning t.id
    `)

    await client.query('commit')
    console.log(`Created default wallets: ${usersWithoutDefaultWallet.rowCount}`)
    console.log(`Backfilled transaction wallets: ${backfilledTransactions.rowCount}`)
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    await client.end()
  }
}

async function normalizeSources() {
  if (!process.argv.includes('--apply')) {
    throw new Error('Refusing to mutate data without --apply')
  }

  const client = getClient()
  await client.connect()
  try {
    await client.query('begin')
    const normalized = await client.query(`
      update transactions
      set source_type = case
        when source_type in ('manual', 'chatbot', 'receipt_ai', 'transfer', 'adjustment') then source_type
        when source_type is null or source_type = '' then 'manual'
        else 'manual'
      end
      where source_type is null
      or source_type = ''
      or source_type not in ('manual', 'chatbot', 'receipt_ai', 'transfer', 'adjustment')
      returning id, source_type
    `)
    await client.query('commit')
    console.log(`Normalized transaction source_type rows: ${normalized.rowCount}`)
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    await client.end()
  }
}

async function verify() {
  const client = getClient()
  await client.connect()
  try {
    const queries = {
      categories: 'select count(*)::int as count from categories',
      transactionsWithoutCategory:
        'select count(*)::int as count from transactions t left join categories c on c.id = t.category_id where c.id is null',
      transactionsWithoutWallet:
        'select count(*)::int as count from transactions where wallet_id is null',
      invalidCategoryType: `
        select count(*)::int as count
        from transactions t
        join categories c on c.id = t.category_id
        where c.type::text <> t.type::text
      `,
      usersWithoutDefaultWallet: `
        select count(*)::int as count
        from users u
        where not exists (
          select 1 from wallets w where w.user_id = u.id and w.is_default = true
        )
      `,
    }

    for (const [name, sql] of Object.entries(queries)) {
      const result = await client.query(sql)
      console.log(`${name}: ${result.rows[0].count}`)
    }
  } finally {
    await client.end()
  }
}

const command = process.argv[2]

if (command === 'backup') {
  await backup()
} else if (command === 'category-dry-run') {
  await categoryDryRun()
} else if (command === 'apply-category-map') {
  await applyCategoryMap()
} else if (command === 'backfill-wallets') {
  await backfillWallets()
} else if (command === 'normalize-sources') {
  await normalizeSources()
} else if (command === 'verify') {
  await verify()
} else {
  console.log('Usage: node scripts/finance-data-maintenance.mjs <backup|category-dry-run|apply-category-map|backfill-wallets|normalize-sources|verify> [--apply]')
}
