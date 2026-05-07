import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Transactions } from './collections/Transactions'
import { Budgets } from './collections/Budgets'
import { Wallets } from './collections/Wallets'
import { SavingsGoals } from './collections/SavingsGoals'
import { SavingsContributions } from './collections/SavingsContributions'
import { Notifications } from './collections/Notifications'
import { AIChatLogs } from './collections/AIChatLogs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterNavLinks: ['/components/admin/FinanceAdminNavLinks#FinanceAdminNavLinks'],
      views: {
        dashboard: {
          Component: '/components/admin/FinanceAdminDashboard',
        },
        financeUserSection: {
          Component: '/components/admin/FinanceAdminDashboard',
          path: '/finance/users/:userId/:userSection',
        },
        financeUser: {
          Component: '/components/admin/FinanceAdminDashboard',
          path: '/finance/users/:userId',
        },
        finance: {
          Component: '/components/admin/FinanceAdminDashboard',
          path: '/finance/:section',
        },
      },
    },
  },
  collections: [Users, Media, Wallets, Categories, Transactions, Budgets, SavingsGoals, SavingsContributions, Notifications, AIChatLogs],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    push: false,
    disableCreateDatabase: true,
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})
