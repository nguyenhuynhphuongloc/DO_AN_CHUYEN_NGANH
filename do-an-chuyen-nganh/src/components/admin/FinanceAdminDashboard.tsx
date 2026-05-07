import type { AdminViewServerProps, Payload } from 'payload'
import type React from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  DatabaseZap,
  FolderTree,
  LayoutDashboard,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react'

import { resolveAdminUser } from '@/lib/admin/auth'
import {
  getAdminDataQuality,
  getAdminOverview,
  getAdminUserAiLogs,
  getAdminUserBudgets,
  getAdminUserCategories,
  getAdminUserNotifications,
  getAdminUserProfile,
  getAdminUserReceipts,
  getAdminUsers,
  getAdminUserSavings,
  getAdminUserTransactions,
  getAdminUserWallets,
  getAdminUserWorkspaceOverview,
} from '@/lib/admin/service'
import type { AdminDataQualityFinding, AdminUserProfile, AdminUserRow } from '@/lib/admin/types'

import { AdminDataTable } from './AdminDataTable'
import { AdminFilterBar } from './AdminFilterBar'
import { AdminKpiCard } from './AdminKpiCard'
import { AdminLogoutButton } from './AdminLogoutButton'
import { AdminRoleChangeForm } from './AdminRoleChangeForm'
import { AdminStatusBadge } from './AdminStatusBadge'
import { UserListSidebar } from './UserListSidebar'
import { UserWorkspaceHeader } from './UserWorkspaceHeader'
import { UserWorkspaceTabNav } from './UserWorkspaceTabNav'

type HeaderAction = {
  href?: string
  icon?: React.ComponentType<{ size?: number }>
  label: string
  tone?: 'primary' | 'secondary'
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    currency: 'VND',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value || 0)

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa có'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

const toParams = (searchParams: AdminViewServerProps['searchParams']) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams || {})) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item)
    } else if (value != null) {
      params.set(key, String(value))
    }
  }
  return params
}

const getRoute = (params: AdminViewServerProps['params']) => {
  const routeParams = (params || {}) as Record<string, unknown>
  const segments = Array.isArray(routeParams.segments) ? routeParams.segments.map(String) : []

  if (segments[0] === 'finance') {
    if (segments[1] === 'users' && segments[2]) {
      return {
        isUserRoute: true,
        section: segments[3] || 'overview',
        userId: segments[2],
      }
    }

    return {
      isUserRoute: false,
      section: segments[1] || 'overview',
      userId: null,
    }
  }

  const section = typeof routeParams.section === 'string' ? routeParams.section : 'overview'
  const userId = typeof routeParams.userId === 'string' ? routeParams.userId : null
  const userSection = typeof routeParams.userSection === 'string' ? routeParams.userSection : 'overview'

  if (userId) {
    return {
      isUserRoute: true,
      section: userSection || 'overview',
      userId,
    }
  }

  return {
    isUserRoute: false,
    section,
    userId: null,
  }
}

const modules = [
  { href: '/admin', icon: LayoutDashboard, key: 'overview', label: 'Tổng quan' },
  { href: '/admin/finance/users', icon: Users, key: 'users', label: 'Người dùng' },
  { href: '/admin/finance/data-quality', icon: DatabaseZap, key: 'data-quality', label: 'Cảnh báo dữ liệu' },
  { href: '/admin/collections', icon: FolderTree, key: 'raw-data', label: 'Dữ liệu gốc' },
]

const blockedGlobalSections = new Set([
  'wallets',
  'transactions',
  'categories',
  'budgets',
  'savings',
  'receipts',
  'notifications',
  'ai',
])

function AdminHeader({
  actions = [],
  badges,
  label,
}: {
  actions?: HeaderAction[]
  badges?: React.ReactNode
  label: string
}) {
  return (
    <header className="fin-admin-header">
      <div className="fin-admin-title-row">
        <span>FinTrack Admin</span>
        <h1>{label}</h1>
        {badges && <div className="fin-admin-title-badges">{badges}</div>}
      </div>
      <div className="fin-admin-header-actions">
        {actions.map(({ href, icon: Icon, label: actionLabel, tone = 'primary' }) =>
          href ? (
            <Link
              key={`${href}-${actionLabel}`}
              className={tone === 'secondary' ? 'fin-admin-secondary-link' : 'fin-admin-primary-link'}
              href={href}
              scroll={false}
            >
              {Icon && <Icon size={16} />}
              <span>{actionLabel}</span>
            </Link>
          ) : null,
        )}
        <AdminLogoutButton />
      </div>
    </header>
  )
}

function ModuleNav({ active }: { active: string }) {
  return (
    <nav className="fin-admin-module-nav" aria-label="Điều hướng quản trị">
      {modules.map(({ href, icon: Icon, key, label }) => (
        <Link key={key} className={active === key ? 'is-active' : ''} href={href}>
          <Icon size={16} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}

function severityLabel(severity: AdminDataQualityFinding['severity']) {
  return severity === 'danger' ? 'Nghiêm trọng' : 'Cảnh báo'
}

function areaLabel(area: AdminDataQualityFinding['area']) {
  const labels: Record<AdminDataQualityFinding['area'], string> = {
    budgets: 'Hũ chi',
    categories: 'Danh mục',
    media: 'Media',
    receipts: 'Hóa đơn',
    savings: 'Tiết kiệm',
    transactions: 'Giao dịch',
    users: 'Người dùng',
    wallets: 'Ví tiền',
  }
  return labels[area] || area
}

function setupBadge(row: Pick<AdminUserRow, 'hasDefaultWallet' | 'walletCount'>) {
  if (row.walletCount === 0) {
    return <AdminStatusBadge tone="warning">Chưa có ví</AdminStatusBadge>
  }
  return (
    <AdminStatusBadge tone={row.hasDefaultWallet ? 'good' : 'warning'}>
      {row.hasDefaultWallet ? 'Đã thiết lập' : 'Thiếu ví mặc định'}
    </AdminStatusBadge>
  )
}

async function Overview({ payload }: { payload: Payload }) {
  const overview = await getAdminOverview(payload)
  const warnings = overview.dataQuality

  return (
    <>
      <section className="fin-admin-kpi-grid" aria-label="Chỉ số tổng quan">
        {overview.kpis.map((kpi) => (
          <AdminKpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="fin-admin-panel fin-admin-panel--wide">
        <div className="fin-admin-panel__header">
          <h2>Cảnh báo dữ liệu</h2>
          <AdminStatusBadge tone={warnings.length > 0 ? 'warning' : 'good'}>{warnings.length}</AdminStatusBadge>
        </div>
        <AdminDataTable
          emptyText="Không có cảnh báo dữ liệu đang mở."
          columns={[
            {
              key: 'severity',
              label: 'Mức',
              render: (row) => (
                <AdminStatusBadge tone={row.severity === 'danger' ? 'danger' : 'warning'}>
                  {severityLabel(row.severity)}
                </AdminStatusBadge>
              ),
            },
            { key: 'area', label: 'Khu vực', render: (row) => areaLabel(row.area) },
            { key: 'title', label: 'Vấn đề' },
            {
              key: 'userId',
              label: 'Người dùng',
              render: (row) =>
                row.userId ? (
                  <Link href={`/admin/finance/users/${row.userId}`}>Mở workspace</Link>
                ) : (
                  <span>Chưa xác định</span>
                ),
            },
            {
              key: 'action',
              label: 'Thao tác',
              render: (row) => (
                <Link href={row.userId ? `/admin/finance/users/${row.userId}` : '/admin/finance/data-quality'}>
                  Xem
                </Link>
              ),
            },
          ]}
          rows={warnings}
        />
      </section>
    </>
  )
}

function UserSelectionRequired({ section }: { section: string }) {
  return (
    <section className="fin-admin-panel fin-admin-blocked">
      <div className="fin-admin-panel__header">
        <h2>Cần chọn người dùng trước</h2>
        <AdminStatusBadge tone="warning">{section}</AdminStatusBadge>
      </div>
      <div className="fin-admin-blocked-actions">
        <Link className="fin-admin-primary-link" href="/admin/finance/users">
          <Search size={16} />
          <span>Chọn người dùng</span>
        </Link>
        <Link className="fin-admin-secondary-link" href="/admin">
          <LayoutDashboard size={16} />
          <span>Về tổng quan</span>
        </Link>
      </div>
    </section>
  )
}

function UserFilters({ action }: { action: string }) {
  return (
    <AdminFilterBar
      action={action}
      filters={[
        { label: 'Tìm kiếm', name: 'search', placeholder: 'Email hoặc tên', type: 'search' },
        {
          label: 'Vai trò',
          name: 'role',
          options: [
            { label: 'Quản trị viên', value: 'admin' },
            { label: 'Người dùng', value: 'user' },
          ],
          placeholder: 'Tất cả vai trò',
          type: 'select',
        },
        {
          label: 'Thiết lập ví',
          name: 'setup',
          options: [
            { label: 'Hoàn tất', value: 'complete' },
            { label: 'Chưa hoàn tất', value: 'incomplete' },
          ],
          placeholder: 'Tất cả trạng thái',
          type: 'select',
        },
      ]}
    />
  )
}

async function UsersModule({
  payload,
  searchParams,
}: {
  payload: Payload
  searchParams: AdminViewServerProps['searchParams']
}) {
  const data = await getAdminUsers(payload, toParams(searchParams))

  return (
    <>
      <AdminHeader
        actions={[
          { href: '/admin/finance/users', icon: RefreshCw, label: 'Tải lại', tone: 'secondary' },
        ]}
        label="Người dùng"
      />
      <UserFilters action="/admin/finance/users" />
      <AdminDataTable
        emptyText="Không tìm thấy người dùng phù hợp."
        columns={[
          {
            key: 'profile',
            label: 'Người dùng',
            render: (row) => (
              <Link className="fin-admin-user-cell" href={`/admin/finance/users/${row.id}`}>
                <span className="fin-admin-avatar">{initials(row)}</span>
                <span>
                  <strong>{row.email || row.id}</strong>
                  <small>{row.name || 'Chưa có tên'}</small>
                </span>
              </Link>
            ),
          },
          {
            key: 'role',
            label: 'Vai trò',
            render: (row) => (
              <AdminStatusBadge tone={row.role === 'admin' ? 'info' : 'neutral'}>
                {row.role === 'admin' ? 'Quản trị' : 'Người dùng'}
              </AdminStatusBadge>
            ),
          },
          { key: 'walletCount', label: 'Ví' },
          { key: 'transactionCount', label: 'Giao dịch' },
          { key: 'setup', label: 'Thiết lập', render: (row) => setupBadge(row) },
          { key: 'latestTransactionDate', label: 'Hoạt động', render: (row) => formatDate(row.latestTransactionDate) },
          {
            key: 'workspace',
            label: 'Mở',
            render: (row) => <Link href={`/admin/finance/users/${row.id}`}>Mở</Link>,
          },
          {
            key: 'actions',
            label: 'Quyền',
            render: (row) => <AdminRoleChangeForm currentRole={row.role} userId={row.id} />,
          },
        ]}
        rows={data.docs}
      />
    </>
  )
}

function WarningImpactPanel() {
  const rows = [
    {
      area: 'Ví tiền',
      impact: 'Sai số dư, không chọn được ví mặc định, giao dịch có thể không ghi nhận đúng.',
      action: 'Mở workspace người dùng và kiểm tra tab Ví tiền.',
    },
    {
      area: 'Giao dịch',
      impact: 'Báo cáo thu chi, hũ chi, tiết kiệm và AI tư vấn có thể sai.',
      action: 'Mở workspace người dùng và kiểm tra tab Giao dịch.',
    },
    {
      area: 'Danh mục / Hũ chi',
      impact: 'Phân loại chi tiêu và cảnh báo vượt ngân sách không đáng tin cậy.',
      action: 'Kiểm tra tab Danh mục hoặc Hũ chi của người dùng.',
    },
    {
      area: 'Hóa đơn / OCR / Media',
      impact: 'Người dùng không đối soát được hóa đơn hoặc mất bằng chứng giao dịch.',
      action: 'Kiểm tra tab Hóa đơn/OCR và media liên quan.',
    },
    {
      area: 'AI/chat',
      impact: 'Nhật ký tư vấn thiếu ngữ cảnh hoặc liên kết giao dịch không chính xác.',
      action: 'Kiểm tra tab AI/chat của người dùng.',
    },
  ]

  return (
    <section className="fin-admin-panel">
      <div className="fin-admin-panel__header">
        <h2>Tác động với người dùng</h2>
      </div>
      <div className="fin-admin-impact-list">
        {rows.map((row) => (
          <div key={row.area}>
            <strong>{row.area}</strong>
            <span>{row.impact}</span>
            <small>{row.action}</small>
          </div>
        ))}
      </div>
    </section>
  )
}

async function DataQualityModule({
  payload,
  searchParams,
}: {
  payload: Payload
  searchParams: AdminViewServerProps['searchParams']
}) {
  const params = toParams(searchParams)
  const area = params.get('area')
  const severity = params.get('severity')
  const hasUser = params.get('hasUser')
  const findings = (await getAdminDataQuality(payload)).filter((finding) => {
    if (area && finding.area !== area) return false
    if (severity && finding.severity !== severity) return false
    if (hasUser === 'true' && !finding.userId) return false
    if (hasUser === 'false' && finding.userId) return false
    return true
  })

  return (
    <>
      <AdminHeader
        actions={[
          { href: '/admin/finance/data-quality', icon: RefreshCw, label: 'Chạy kiểm tra lại', tone: 'secondary' },
          { href: '/admin/finance/users', icon: Users, label: 'Chọn người dùng' },
        ]}
        label="Cảnh báo dữ liệu"
      />
      <section className="fin-admin-grid">
        <WarningImpactPanel />
        <section className="fin-admin-panel fin-admin-panel--wide">
          <div className="fin-admin-panel__header">
            <h2>Danh sách cảnh báo</h2>
            <AdminStatusBadge tone={findings.length ? 'warning' : 'good'}>{findings.length}</AdminStatusBadge>
          </div>
          <AdminFilterBar
            action="/admin/finance/data-quality"
            filters={[
              {
                label: 'Khu vực',
                name: 'area',
                options: ['users', 'wallets', 'transactions', 'categories', 'budgets', 'receipts', 'media', 'savings'].map(
                  (value) => ({ label: areaLabel(value as AdminDataQualityFinding['area']), value }),
                ),
                placeholder: 'Tất cả khu vực',
                type: 'select',
              },
              {
                label: 'Mức',
                name: 'severity',
                options: [
                  { label: 'Cảnh báo', value: 'warning' },
                  { label: 'Nghiêm trọng', value: 'danger' },
                ],
                placeholder: 'Tất cả mức',
                type: 'select',
              },
              {
                label: 'Có người dùng',
                name: 'hasUser',
                options: [
                  { label: 'Có', value: 'true' },
                  { label: 'Không', value: 'false' },
                ],
                placeholder: 'Tất cả',
                type: 'select',
              },
            ]}
          />
          <AdminDataTable
            emptyText="Không có cảnh báo dữ liệu đang mở."
            columns={[
              {
                key: 'severity',
                label: 'Mức',
                render: (row) => (
                  <AdminStatusBadge tone={row.severity === 'danger' ? 'danger' : 'warning'}>
                    {severityLabel(row.severity)}
                  </AdminStatusBadge>
                ),
              },
              { key: 'area', label: 'Khu vực', render: (row) => areaLabel(row.area) },
              { key: 'title', label: 'Vấn đề' },
              { key: 'detail', label: 'Chi tiết' },
              {
                key: 'userId',
                label: 'Người dùng',
                render: (row) =>
                  row.userId ? (
                    <Link href={`/admin/finance/users/${row.userId}`}>Mở workspace</Link>
                  ) : (
                    <span>Chưa xác định</span>
                  ),
              },
              { key: 'recordId', label: 'Bản ghi', render: (row) => row.recordId || 'Không rõ' },
              { key: 'nextStep', label: 'Bước tiếp theo' },
              {
                key: 'action',
                label: 'Thao tác',
                render: (row) => (
                  <Link href={row.userId ? `/admin/finance/users/${row.userId}` : '/admin/finance/data-quality'}>
                    Xem
                  </Link>
                ),
              },
            ]}
            rows={findings}
          />
        </section>
      </section>
    </>
  )
}

async function UserWorkspace({
  payload,
  searchParams,
  section,
  userId,
}: {
  payload: Payload
  searchParams: AdminViewServerProps['searchParams']
  section: string
  userId: string
}) {
  const params = toParams(searchParams)
  const sidebarParams = new URLSearchParams()
  const userSearch = params.get('userSearch')
  if (userSearch) sidebarParams.set('search', userSearch)
  const [profile, users] = await Promise.all([
    getAdminUserProfile(payload, userId),
    getAdminUsers(payload, sidebarParams),
  ])

  return (
    <main className="fin-admin-shell fin-admin-shell--workspace">
      <div className="fin-admin-two-pane">
        <UserListSidebar activeSection={section} activeUserId={userId} users={users.docs} />
        <section className="fin-admin-workspace">
          <UserWorkspaceHeader profile={profile} />
          <UserWorkspaceTabNav activeSection={section} userId={userId} />
          <UserWorkspaceContent payload={payload} profile={profile} searchParams={searchParams} section={section} userId={userId} />
        </section>
      </div>
    </main>
  )
}

async function UserWorkspaceContent({
  payload,
  profile,
  searchParams,
  section,
  userId,
}: {
  payload: Payload
  profile: AdminUserProfile
  searchParams: AdminViewServerProps['searchParams']
  section: string
  userId: string
}) {
  const params = toParams(searchParams)

  if (section === 'overview') {
    return <UserOverview payload={payload} profile={profile} userId={userId} />
  }

  if (section === 'wallets') {
    const wallets = await getAdminUserWallets(payload, userId, params)
    return (
      <ScopedPanel title="Ví tiền">
        <AdminFilterBar
          action={`/admin/finance/users/${userId}/wallets`}
          filters={[
            {
              label: 'Loại ví',
              name: 'walletType',
              options: ['cash', 'bank', 'e-wallet', 'credit', 'savings'].map((value) => ({ label: value, value })),
              placeholder: 'Tất cả loại ví',
              type: 'select',
            },
            {
              label: 'Mặc định',
              name: 'isDefault',
              options: [
                { label: 'Có', value: 'true' },
                { label: 'Không', value: 'false' },
              ],
              placeholder: 'Tất cả',
              type: 'select',
            },
          ]}
        />
        <AdminDataTable
          emptyText="Người dùng này chưa tạo ví tiền nào."
          columns={[
            { key: 'name', label: 'Ví' },
            { key: 'walletType', label: 'Loại' },
            { key: 'balance', label: 'Số dư', render: (row) => formatCurrency(row.balance) },
            { key: 'currency', label: 'Tiền tệ' },
            {
              key: 'isDefault',
              label: 'Mặc định',
              render: (row) => <AdminStatusBadge tone={row.isDefault ? 'good' : 'neutral'}>{row.isDefault ? 'Có' : 'Không'}</AdminStatusBadge>,
            },
            {
              key: 'isActive',
              label: 'Trạng thái',
              render: (row) => <AdminStatusBadge tone={row.isActive === false ? 'warning' : 'good'}>{row.isActive === false ? 'Tắt' : 'Bật'}</AdminStatusBadge>,
            },
          ]}
          rows={wallets.docs}
        />
      </ScopedPanel>
    )
  }

  if (section === 'transactions') {
    const transactions = await getAdminUserTransactions(payload, userId, params)
    return (
      <ScopedPanel title="Giao dịch">
        <AdminFilterBar
          action={`/admin/finance/users/${userId}/transactions`}
          filters={[
            { label: 'Tìm kiếm', name: 'search', placeholder: 'Mô tả, cửa hàng, ghi chú', type: 'search' },
            {
              label: 'Loại',
              name: 'type',
              options: [
                { label: 'Thu nhập', value: 'income' },
                { label: 'Chi tiêu', value: 'expense' },
              ],
              placeholder: 'Tất cả',
              type: 'select',
            },
            {
              label: 'Nguồn',
              name: 'sourceType',
              options: ['manual', 'chatbot', 'receipt_ai', 'transfer', 'adjustment'].map((value) => ({ label: value, value })),
              placeholder: 'Tất cả',
              type: 'select',
            },
            { label: 'Từ ngày', name: 'from', type: 'date' },
            { label: 'Đến ngày', name: 'to', type: 'date' },
          ]}
        />
        <AdminDataTable
          emptyText="Người dùng này chưa có giao dịch nào theo bộ lọc hiện tại."
          columns={[
            { key: 'date', label: 'Ngày', render: (row) => formatDate(row.date) },
            { key: 'wallet', label: 'Ví', render: (row) => row.wallet?.label || row.wallet?.id || 'Không rõ' },
            { key: 'type', label: 'Loại' },
            { key: 'amount', label: 'Số tiền', render: (row) => formatCurrency(row.amount) },
            { key: 'category', label: 'Danh mục', render: (row) => row.category?.label || row.category?.id || 'Không rõ' },
            { key: 'merchantName', label: 'Cửa hàng' },
            { key: 'sourceType', label: 'Nguồn' },
            {
              key: 'receipt',
              label: 'Hóa đơn',
              render: (row) => (row.receipt ? <AdminStatusBadge tone="good">Đã liên kết</AdminStatusBadge> : <AdminStatusBadge>Không có</AdminStatusBadge>),
            },
          ]}
          rows={transactions.docs}
        />
      </ScopedPanel>
    )
  }

  if (section === 'categories') {
    const categories = await getAdminUserCategories(payload, userId, params)
    return (
      <ScopedPanel title="Danh mục">
        <AdminFilterBar
          action={`/admin/finance/users/${userId}/categories`}
          filters={[
            { label: 'Tìm kiếm', name: 'search', placeholder: 'Tên danh mục', type: 'search' },
            {
              label: 'Loại',
              name: 'type',
              options: [
                { label: 'Thu nhập', value: 'income' },
                { label: 'Chi tiêu', value: 'expense' },
              ],
              placeholder: 'Tất cả',
              type: 'select',
            },
          ]}
        />
        <AdminDataTable
          emptyText="Người dùng này chưa có danh mục riêng; chỉ có danh mục hệ thống nếu đã cấu hình."
          columns={[
            { key: 'name', label: 'Tên' },
            { key: 'type', label: 'Loại' },
            { key: 'icon', label: 'Icon' },
            { key: 'color', label: 'Màu' },
            {
              key: 'scope',
              label: 'Phạm vi',
              render: (row) => <AdminStatusBadge tone={row.isDefault ? 'info' : 'neutral'}>{row.isDefault ? 'Hệ thống' : 'Người dùng này'}</AdminStatusBadge>,
            },
            {
              key: 'duplicateKey',
              label: 'Cảnh báo',
              render: (row) => (row.duplicateKey ? <AdminStatusBadge tone="warning">Trùng lặp</AdminStatusBadge> : <span>Ổn định</span>),
            },
          ]}
          rows={categories.docs}
        />
      </ScopedPanel>
    )
  }

  if (section === 'budgets') {
    const budgets = await getAdminUserBudgets(payload, userId, params)
    return (
      <ScopedPanel title="Hũ chi">
        <AdminFilterBar
          action={`/admin/finance/users/${userId}/budgets`}
          filters={[
            {
              label: 'Chu kỳ',
              name: 'period',
              options: ['daily', 'weekly', 'monthly', 'yearly'].map((value) => ({ label: value, value })),
              placeholder: 'Tất cả',
              type: 'select',
            },
            { label: 'Tháng', name: 'month', type: 'number' },
            { label: 'Năm', name: 'year', type: 'number' },
          ]}
        />
        <AdminDataTable
          emptyText="Người dùng này chưa tạo hũ chi hoặc ngân sách nào."
          columns={[
            { key: 'category', label: 'Danh mục', render: (row) => row.category?.label || row.category?.id || 'Không rõ' },
            { key: 'wallet', label: 'Ví', render: (row) => row.wallet?.label || row.wallet?.id || 'Tất cả ví' },
            { key: 'amount', label: 'Hạn mức', render: (row) => formatCurrency(row.amount) },
            { key: 'spent', label: 'Đã dùng', render: (row) => formatCurrency(row.spent) },
            { key: 'remaining', label: 'Còn lại', render: (row) => formatCurrency(row.remaining) },
            {
              key: 'usagePercent',
              label: 'Tỷ lệ',
              render: (row) => (
                <AdminStatusBadge tone={row.usagePercent >= 100 ? 'danger' : row.usagePercent >= 80 ? 'warning' : 'good'}>
                  {row.usagePercent}%
                </AdminStatusBadge>
              ),
            },
          ]}
          rows={budgets.docs}
        />
      </ScopedPanel>
    )
  }

  if (section === 'savings') {
    const savings = await getAdminUserSavings(payload, userId, params)
    return (
      <ScopedPanel title="Tiết kiệm">
        <AdminFilterBar
          action={`/admin/finance/users/${userId}/savings`}
          filters={[
            { label: 'Tìm kiếm', name: 'search', placeholder: 'Mục tiêu', type: 'search' },
            {
              label: 'Trạng thái',
              name: 'status',
              options: ['active', 'completed', 'paused', 'cancelled'].map((value) => ({ label: value, value })),
              placeholder: 'Tất cả',
              type: 'select',
            },
          ]}
        />
        <AdminDataTable
          emptyText="Người dùng này chưa tạo mục tiêu tiết kiệm nào."
          columns={[
            { key: 'title', label: 'Mục tiêu' },
            { key: 'targetAmount', label: 'Mục tiêu tiền', render: (row) => formatCurrency(row.targetAmount) },
            { key: 'currentAmount', label: 'Hiện có', render: (row) => formatCurrency(row.currentAmount) },
            { key: 'contributionTotal', label: 'Đã nạp', render: (row) => formatCurrency(row.contributionTotal) },
            { key: 'status', label: 'Trạng thái' },
            {
              key: 'inconsistent',
              label: 'Đối soát',
              render: (row) => <AdminStatusBadge tone={row.inconsistent ? 'warning' : 'good'}>{row.inconsistent ? 'Cần kiểm tra' : 'Ổn định'}</AdminStatusBadge>,
            },
          ]}
          rows={savings.docs}
        />
      </ScopedPanel>
    )
  }

  if (section === 'receipts') {
    const receipts = await getAdminUserReceipts(payload, userId, params)
    return (
      <ScopedPanel title="Hóa đơn/OCR">
        <AdminFilterBar
          action={`/admin/finance/users/${userId}/receipts`}
          filters={[
            { label: 'Cửa hàng', name: 'merchant', placeholder: 'Tên cửa hàng', type: 'search' },
            {
              label: 'Trạng thái',
              name: 'status',
              options: [
                { label: 'Thiếu media', value: 'missing_media' },
              ],
              placeholder: 'Tất cả',
              type: 'select',
            },
            { label: 'Từ ngày', name: 'from', type: 'date' },
            { label: 'Đến ngày', name: 'to', type: 'date' },
          ]}
        />
        <AdminDataTable
          emptyText="Người dùng này chưa có hóa đơn/OCR nào."
          columns={[
            { key: 'date', label: 'Ngày', render: (row) => formatDate(row.date) },
            { key: 'merchantName', label: 'Cửa hàng' },
            { key: 'amount', label: 'Số tiền', render: (row) => formatCurrency(row.amount) },
            { key: 'sourceType', label: 'Nguồn' },
            { key: 'receipt', label: 'Media', render: (row) => row.receipt?.label || row.receipt?.id || 'Thiếu media' },
            {
              key: 'status',
              label: 'Trạng thái',
              render: (row) => <AdminStatusBadge tone={row.status === 'linked' ? 'good' : 'warning'}>{row.status === 'linked' ? 'Đã liên kết' : 'Thiếu media'}</AdminStatusBadge>,
            },
          ]}
          rows={receipts.docs}
        />
      </ScopedPanel>
    )
  }

  if (section === 'ai') {
    const aiLogs = await getAdminUserAiLogs(payload, userId, params)
    return (
      <ScopedPanel title="AI/chat">
        <AdminFilterBar
          action={`/admin/finance/users/${userId}/ai`}
          filters={[
            {
              label: 'Loại',
              name: 'kind',
              options: ['advisor', 'receipt', 'system'].map((value) => ({ label: value, value })),
              placeholder: 'Tất cả',
              type: 'select',
            },
            {
              label: 'Trạng thái',
              name: 'status',
              options: [
                { label: 'Thành công', value: 'success' },
                { label: 'Lỗi', value: 'error' },
              ],
              placeholder: 'Tất cả',
              type: 'select',
            },
            {
              label: 'Hướng',
              name: 'direction',
              options: ['user', 'assistant', 'system'].map((value) => ({ label: value, value })),
              placeholder: 'Tất cả',
              type: 'select',
            },
          ]}
        />
        <AdminDataTable
          emptyText="Người dùng này chưa có nhật ký AI/chat nào được lưu."
          columns={[
            { key: 'createdAt', label: 'Thời gian', render: (row) => formatDate(row.createdAt) },
            { key: 'kind', label: 'Loại' },
            { key: 'direction', label: 'Hướng' },
            {
              key: 'status',
              label: 'Trạng thái',
              render: (row) => <AdminStatusBadge tone={row.status === 'success' ? 'good' : 'warning'}>{row.status || 'unknown'}</AdminStatusBadge>,
            },
            { key: 'intent', label: 'Ý định' },
            { key: 'redactedText', label: 'Nội dung đã làm sạch' },
          ]}
          rows={aiLogs.docs}
        />
      </ScopedPanel>
    )
  }

  if (section === 'notifications') {
    const notifications = await getAdminUserNotifications(payload, userId, params)
    return (
      <ScopedPanel title="Thông báo">
        <AdminFilterBar
          action={`/admin/finance/users/${userId}/notifications`}
          filters={[
            { label: 'Loại', name: 'type', placeholder: 'Loại thông báo', type: 'text' },
            {
              label: 'Đã đọc',
              name: 'read',
              options: [
                { label: 'Đã đọc', value: 'true' },
                { label: 'Chưa đọc', value: 'false' },
              ],
              placeholder: 'Tất cả',
              type: 'select',
            },
          ]}
        />
        <AdminDataTable
          emptyText="Người dùng này chưa có thông báo nào."
          columns={[
            { key: 'createdAt', label: 'Thời gian tạo', render: (row) => formatDate(row.createdAt) },
            { key: 'type', label: 'Loại' },
            { key: 'message', label: 'Nội dung' },
            { key: 'link', label: 'Liên kết' },
            {
              key: 'read',
              label: 'Đã đọc',
              render: (row) => <AdminStatusBadge tone={row.read ? 'good' : 'warning'}>{row.read ? 'Đã đọc' : 'Chưa đọc'}</AdminStatusBadge>,
            },
          ]}
          rows={notifications.docs}
        />
      </ScopedPanel>
    )
  }

  return <UserOverview payload={payload} profile={profile} userId={userId} />
}

function ScopedPanel({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="fin-admin-panel fin-admin-panel--wide">
      <div className="fin-admin-panel__header">
        <h2>{title}</h2>
        <AdminStatusBadge tone="info">Người dùng này</AdminStatusBadge>
      </div>
      {children}
    </section>
  )
}

async function UserOverview({
  payload,
  profile,
  userId,
}: {
  payload: Payload
  profile: AdminUserProfile
  userId: string
}) {
  const overview = await getAdminUserWorkspaceOverview(payload, userId)

  return (
    <>
      <section className="fin-admin-kpi-grid" aria-label="Chỉ số người dùng">
        {overview.kpis.map((kpi) => (
          <AdminKpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="fin-admin-grid">
        <div className="fin-admin-panel">
          <div className="fin-admin-panel__header">
            <h2>Thông tin</h2>
          </div>
          <div className="fin-admin-user-info">
            <div>
              <strong>Email</strong>
              <span>{profile.email || profile.id}</span>
            </div>
            <div>
              <strong>Vai trò</strong>
              <AdminStatusBadge tone={profile.role === 'admin' ? 'info' : 'neutral'}>
                {profile.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
              </AdminStatusBadge>
            </div>
            <div>
              <strong>Ngày tạo</strong>
              <span>{formatDate(profile.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="fin-admin-panel">
          <div className="fin-admin-panel__header">
            <h2>Dòng tiền tháng này</h2>
            <AdminStatusBadge tone={overview.netCashflow >= 0 ? 'good' : 'danger'}>
              {overview.netCashflow >= 0 ? 'Dương' : 'Âm'}
            </AdminStatusBadge>
          </div>
          <div className="fin-admin-cashflow-bars">
            <div>
              <span>Thu nhập</span>
              <strong>{formatCurrency(overview.monthlyIncome)}</strong>
            </div>
            <div>
              <span>Chi tiêu</span>
              <strong>{formatCurrency(overview.monthlyExpense)}</strong>
            </div>
            <div>
              <span>Còn lại</span>
              <strong>{formatCurrency(overview.netCashflow)}</strong>
            </div>
          </div>
        </div>

        <div className="fin-admin-panel">
          <div className="fin-admin-panel__header">
            <h2>Cảnh báo của người dùng này</h2>
          </div>
          <div className="fin-admin-warning-list">
            <Link href={`/admin/finance/users/${userId}/budgets`}>
              <AlertTriangle size={16} />
              <span>{overview.budgetWarnings.atRisk + overview.budgetWarnings.exceeded} hũ chi cần theo dõi</span>
            </Link>
            <Link href={`/admin/finance/users/${userId}/receipts`}>
              <AlertTriangle size={16} />
              <span>{overview.receiptCount} hóa đơn OCR</span>
            </Link>
            <Link href={`/admin/finance/users/${userId}/ai`}>
              <AlertTriangle size={16} />
              <span>{overview.aiChatCount} nhật ký AI/chat</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function initials(row: Pick<AdminUserRow, 'email' | 'name' | 'id'>) {
  const source = row.name || row.email || String(row.id)
  return source
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U'
}

export default async function FinanceAdminDashboard(props: AdminViewServerProps) {
  const { payload, user } = props
  const route = getRoute(props.params)
  const sessionUser = user || props.initPageResult?.req?.user
  const adminUser = await resolveAdminUser(payload, sessionUser as any)

  if (!adminUser) {
    return (
      <main className="fin-admin-shell">
        <section className="fin-admin-panel">
          <div className="fin-admin-panel__header">
            <h2>Cần quyền quản trị</h2>
          </div>
          <p>Tài khoản của bạn không có quyền xem khu vực vận hành FinTrack.</p>
        </section>
      </main>
    )
  }

  if (route.isUserRoute && route.userId) {
    return <UserWorkspace payload={payload} searchParams={props.searchParams} section={route.section} userId={route.userId} />
  }

  const active = route.section === 'overview' ? 'overview' : route.section

  if (active === 'users') {
    return (
      <main className="fin-admin-shell">
        <ModuleNav active={active} />
        <UsersModule payload={payload} searchParams={props.searchParams} />
      </main>
    )
  }

  if (active === 'data-quality') {
    return (
      <main className="fin-admin-shell">
        <ModuleNav active={active} />
        <DataQualityModule payload={payload} searchParams={props.searchParams} />
      </main>
    )
  }

  if (blockedGlobalSections.has(active)) {
    return (
      <main className="fin-admin-shell">
        <ModuleNav active={active} />
        <UserSelectionRequired section={active} />
      </main>
    )
  }

  return (
    <main className="fin-admin-shell">
      <AdminHeader
        actions={[
          { href: '/admin/finance/users', icon: Users, label: 'Chọn người dùng' },
          { href: '/admin/finance/data-quality', icon: DatabaseZap, label: 'Cảnh báo dữ liệu', tone: 'secondary' },
        ]}
        label="Tổng quan"
      />
      <ModuleNav active="overview" />
      <Overview payload={payload} />
    </main>
  )
}
