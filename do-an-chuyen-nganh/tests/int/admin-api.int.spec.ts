import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockGetPayload = vi.fn()
const mockGetAdminOverview = vi.fn()
const mockGetAdminUsers = vi.fn()
const mockGetAdminUserProfile = vi.fn()
const mockGetAdminUserWorkspaceOverview = vi.fn()
const mockGetAdminUserWallets = vi.fn()
const mockGetAdminUserTransactions = vi.fn()
const mockGetAdminUserCategories = vi.fn()
const mockGetAdminUserBudgets = vi.fn()
const mockGetAdminUserSavings = vi.fn()
const mockGetAdminUserReceipts = vi.fn()
const mockGetAdminUserNotifications = vi.fn()
const mockGetAdminUserAiLogs = vi.fn()

vi.mock('payload', () => ({
  getPayload: mockGetPayload,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('@/lib/admin/service', () => ({
  getAdminBudgets: vi.fn(),
  getAdminCategories: vi.fn(),
  getAdminDataQuality: vi.fn().mockResolvedValue([]),
  getAdminNotifications: vi.fn(),
  getAdminOverview: mockGetAdminOverview,
  getAdminReceiptDetail: vi.fn(),
  getAdminReceipts: vi.fn(),
  getAdminSavings: vi.fn(),
  getAdminTransactions: vi.fn(),
  getAdminUserAiLogs: mockGetAdminUserAiLogs,
  getAdminUserBudgets: mockGetAdminUserBudgets,
  getAdminUserCategories: mockGetAdminUserCategories,
  getAdminUserFinanceSummary: vi.fn(),
  getAdminUserNotifications: mockGetAdminUserNotifications,
  getAdminUserProfile: mockGetAdminUserProfile,
  getAdminUserReceipts: mockGetAdminUserReceipts,
  getAdminUsers: mockGetAdminUsers,
  getAdminUserSavings: mockGetAdminUserSavings,
  getAdminUserTransactions: mockGetAdminUserTransactions,
  getAdminUserWallets: mockGetAdminUserWallets,
  getAdminUserWorkspaceOverview: mockGetAdminUserWorkspaceOverview,
  getAdminWallets: vi.fn(),
}))

const request = (url: string) => new NextRequest(url)

const adminPayload = () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 1, role: 'admin' } }),
})

const page = { docs: [], pagination: { limit: 20, page: 1, totalDocs: 0, totalPages: 0 } }

describe('admin API safeguards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('denies unauthenticated admin API requests', async () => {
    mockGetPayload.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({ user: null }),
    })

    const { GET } = await import('@/app/api/admin/[...path]/route')
    const response = await GET(request('http://localhost/api/admin/overview'), {
      params: Promise.resolve({ path: ['overview'] }),
    })

    expect(response.status).toBe(401)
    expect(mockGetAdminOverview).not.toHaveBeenCalled()
  })

  it('denies normal users from admin API requests', async () => {
    mockGetPayload.mockResolvedValue({
      auth: vi.fn().mockResolvedValue({ user: { id: 2, role: 'user' } }),
    })

    const { GET } = await import('@/app/api/admin/[...path]/route')
    const response = await GET(request('http://localhost/api/admin/users/12/wallets'), {
      params: Promise.resolve({ path: ['users', '12', 'wallets'] }),
    })

    expect(response.status).toBe(403)
    expect(mockGetAdminUserWallets).not.toHaveBeenCalled()
  })

  it('returns overview metrics for admin users', async () => {
    const payload = adminPayload()
    mockGetPayload.mockResolvedValue(payload)
    mockGetAdminOverview.mockResolvedValue({
      budgetWarnings: { atRisk: 0, exceeded: 0 },
      cashflow: [],
      dataQuality: [],
      kpis: [{ label: 'Users', value: 3 }],
      receiptWarnings: [],
      recentTransactions: [],
      transactionSourceMix: [],
    })

    const { GET } = await import('@/app/api/admin/[...path]/route')
    const response = await GET(request('http://localhost/api/admin/overview'), {
      params: Promise.resolve({ path: ['overview'] }),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      kpis: [{ label: 'Users', value: 3 }],
    })
    expect(mockGetAdminOverview).toHaveBeenCalledWith(payload)
  })

  it('passes table filters to admin user listing', async () => {
    const payload = adminPayload()
    mockGetPayload.mockResolvedValue(payload)
    mockGetAdminUsers.mockResolvedValue(page)

    const { GET } = await import('@/app/api/admin/[...path]/route')
    const response = await GET(request('http://localhost/api/admin/users?role=admin&search=a'), {
      params: Promise.resolve({ path: ['users'] }),
    })

    expect(response.status).toBe(200)
    const params = mockGetAdminUsers.mock.calls[0][1] as URLSearchParams
    expect(params.get('role')).toBe('admin')
    expect(params.get('search')).toBe('a')
  })

  it.each([
    ['profile', mockGetAdminUserProfile],
    ['finance-summary', mockGetAdminUserWorkspaceOverview],
    ['wallets', mockGetAdminUserWallets],
    ['transactions', mockGetAdminUserTransactions],
    ['categories', mockGetAdminUserCategories],
    ['budgets', mockGetAdminUserBudgets],
    ['savings', mockGetAdminUserSavings],
    ['receipts', mockGetAdminUserReceipts],
    ['notifications', mockGetAdminUserNotifications],
    ['ai-logs', mockGetAdminUserAiLogs],
  ])('routes /api/admin/users/:id/%s to a user-scoped service', async (section, service) => {
    const payload = adminPayload()
    mockGetPayload.mockResolvedValue(payload)
    service.mockResolvedValue(section === 'profile' || section === 'finance-summary' ? { id: 12 } : page)

    const { GET } = await import('@/app/api/admin/[...path]/route')
    const response = await GET(request(`http://localhost/api/admin/users/12/${section}?user=99`), {
      params: Promise.resolve({ path: ['users', '12', section] }),
    })

    expect(response.status).toBe(200)
    expect(service).toHaveBeenCalled()
    expect(service.mock.calls[0][1]).toBe('12')
  })

  it('does not let a conflicting user query param change the selected user route', async () => {
    const payload = adminPayload()
    mockGetPayload.mockResolvedValue(payload)
    mockGetAdminUserTransactions.mockResolvedValue({
      docs: [{ id: 't-12', user: { id: '12' } }],
      pagination: { limit: 20, page: 1, totalDocs: 1, totalPages: 1 },
    })

    const { GET } = await import('@/app/api/admin/[...path]/route')
    const response = await GET(request('http://localhost/api/admin/users/12/transactions?user=99'), {
      params: Promise.resolve({ path: ['users', '12', 'transactions'] }),
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.docs).toEqual([{ id: 't-12', user: { id: '12' } }])
    expect(mockGetAdminUserTransactions.mock.calls[0][1]).toBe('12')
    expect((mockGetAdminUserTransactions.mock.calls[0][2] as URLSearchParams).get('user')).toBe('99')
  })

  it('updates roles only through admin-gated role endpoint', async () => {
    const update = vi.fn().mockResolvedValue({ id: 2, role: 'admin' })
    const payload = {
      auth: vi.fn().mockResolvedValue({ user: { id: 1, role: 'admin' } }),
      update,
    }
    mockGetPayload.mockResolvedValue(payload)

    const { POST } = await import('@/app/api/admin/[...path]/route')
    const response = await POST(
      new NextRequest('http://localhost/api/admin/users/2/role', {
        body: JSON.stringify({ role: 'admin' }),
        method: 'POST',
      }),
      {
        params: Promise.resolve({ path: ['users', '2', 'role'] }),
      },
    )

    expect(response.status).toBe(200)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'users',
        context: { allowRoleOverride: true },
        data: { role: 'admin' },
        id: '2',
        overrideAccess: true,
      }),
    )
  })
})

describe('AI audit helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a success log with redacted text and no caller-visible failure', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 })
    const { createAiAuditLog } = await import('@/lib/ai-chat-audit')

    await createAiAuditLog(
      { create } as any,
      {
        direction: 'incoming',
        fullText: 'Email user@example.com spent 120000 VND',
        kind: 'advisor',
        status: 'success',
        userId: 12,
      },
    )

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'ai-chat-logs',
        data: expect.objectContaining({
          kind: 'advisor',
          redactedText: expect.stringContaining('[EMAIL]'),
          status: 'success',
          user: 12,
        }),
        overrideAccess: true,
      }),
    )
  })

  it('creates an error log with a support-safe message', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 })
    const { createAiAuditLog } = await import('@/lib/ai-chat-audit')

    await createAiAuditLog(
      { create } as any,
      {
        direction: 'outgoing',
        errorMessage: 'Advisor service timeout',
        fullText: 'Advisor service timeout',
        kind: 'advisor',
        status: 'error',
        userId: '12',
      },
    )

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          errorMessage: 'Advisor service timeout',
          status: 'error',
          user: '12',
        }),
      }),
    )
  })
})
