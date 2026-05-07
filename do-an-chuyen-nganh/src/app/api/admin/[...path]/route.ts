import type { NextRequest } from 'next/server'

import { getAdminContext } from '@/lib/admin/auth'
import {
  // Aggregate/compatibility helpers (global scope) - legacy, now de-emphasized
  getAdminBudgets,
  getAdminCategories,
  getAdminDataQuality,
  getAdminNotifications,
  getAdminOverview,
  getAdminReceiptDetail,
  getAdminReceipts,
  getAdminSavings,
  getAdminTransactions,
  getAdminUserFinanceSummary,
  getAdminUsers,
  getAdminWallets,
  // New user-scoped service helpers
  getAdminUserProfile,
  getAdminUserWorkspaceOverview,
  getAdminUserWallets,
  getAdminUserTransactions,
  getAdminUserCategories,
  getAdminUserBudgets,
  getAdminUserSavings,
  getAdminUserReceipts,
  getAdminUserNotifications,
  getAdminUserAiLogs,
} from '@/lib/admin/service'

type Args = {
  params: Promise<{
    path: string[]
  }>
}

const json = (data: unknown, status = 200) => Response.json(data, { status })

async function route(request: NextRequest, { params }: Args) {
  const context = await getAdminContext(request)
  if (context.error) return context.error

  const path = (await params).path || []
  const routePath = path.join('/')
  const searchParams = request.nextUrl.searchParams
  const { payload } = context

  // ROUTE MATCHING: check user-scoped routes FIRST (more specific), then global routes
  
  // User-scoped admin routes: /api/admin/users/:id/{section}
  if (path[0] === 'users' && path[1] && !path[2]) {
    const userId = path[1]
    // No section = error
    return json({ error: 'User ID provided but no section specified. Use /api/admin/users/:id/{profile,finance-summary,wallets,transactions,categories,budgets,savings,receipts,notifications,ai-logs}' }, 400)
  }

  if (path[0] === 'users' && path[1] && path[2]) {
    const userId = path[1]
    const section = path[2]
    
    if (section === 'profile') {
      return json(await getAdminUserProfile(payload, userId))
    }
    
    if (section === 'finance-summary') {
      return json(await getAdminUserWorkspaceOverview(payload, userId))
    }
    
    if (section === 'wallets') {
      return json(await getAdminUserWallets(payload, userId, searchParams))
    }
    
    if (section === 'transactions') {
      return json(await getAdminUserTransactions(payload, userId, searchParams))
    }
    
    if (section === 'categories') {
      return json(await getAdminUserCategories(payload, userId, searchParams))
    }
    
    if (section === 'budgets') {
      return json(await getAdminUserBudgets(payload, userId, searchParams))
    }
    
    if (section === 'savings') {
      return json(await getAdminUserSavings(payload, userId, searchParams))
    }
    
    if (section === 'receipts') {
      return json(await getAdminUserReceipts(payload, userId, searchParams))
    }
    
    if (section === 'notifications') {
      return json(await getAdminUserNotifications(payload, userId, searchParams))
    }
    
    if (section === 'ai-logs') {
      return json(await getAdminUserAiLogs(payload, userId, searchParams))
    }
    
    // Unknown section
    return json({ error: `Unknown user section: ${section}` }, 404)
  }

  // Global aggregate routes (de-emphasized, kept for compatibility)
  if (routePath === 'overview') return json(await getAdminOverview(payload))
  if (routePath === 'users') return json(await getAdminUsers(payload, searchParams))
  // Legacy route: kept for backwards compatibility
  if (path[0] === 'users' && path[2] === 'finance-summary' && path[1]) {
    return json(await getAdminUserFinanceSummary(payload, path[1]))
  }
  
  // Global finance table browsing (de-emphasized for primary workflow)
  if (routePath === 'wallets') return json(await getAdminWallets(payload, searchParams))
  if (routePath === 'transactions') return json(await getAdminTransactions(payload, searchParams))
  if (routePath === 'categories') return json(await getAdminCategories(payload, searchParams))
  if (routePath === 'budgets') return json(await getAdminBudgets(payload, searchParams))
  if (routePath === 'savings') return json(await getAdminSavings(payload, searchParams))
  if (routePath === 'receipts') return json(await getAdminReceipts(payload, searchParams))
  if (path[0] === 'receipts' && path[1]) return json(await getAdminReceiptDetail(payload, path[1]))
  if (routePath === 'notifications') return json(await getAdminNotifications(payload, searchParams))
  
  // Data quality (still useful as aggregate)
  if (routePath === 'data-quality') return json({ findings: await getAdminDataQuality(payload) })
  
  // AI diagnostics
  if (routePath === 'ai/advisor-logs') {
    return json({
      service: 'advisor',
      status: 'available',
      message: 'Use /api/admin/users/:id/ai-logs for individual user AI interaction logs.',
    })
  }

  return json({ error: 'Admin route not found' }, 404)
}

export async function GET(request: NextRequest, args: Args) {
  try {
    return await route(request, args)
  } catch (error) {
    console.error('Admin API error:', error)
    return json({ error: 'Admin API request failed' }, 500)
  }
}

export async function POST(request: NextRequest, { params }: Args) {
  const context = await getAdminContext(request)
  if (context.error) return context.error

  const pathSegments = (await params).path
  const path = pathSegments.join('/')
  if (path === 'data-quality/recheck') {
    return json({
      findings: await getAdminDataQuality(context.payload),
      mode: 'live',
    })
  }

  if (pathSegments[0] === 'users' && pathSegments[2] === 'role' && pathSegments[1]) {
    const body = await request.json().catch(() => ({}))
    if (body.role !== 'admin' && body.role !== 'user') {
      return json({ error: 'Invalid role' }, 400)
    }

    const updated = await context.payload.update({
      collection: 'users' as any,
      id: pathSegments[1],
      data: { role: body.role },
      context: { allowRoleOverride: true },
      overrideAccess: true,
    })

    return json({
      id: (updated as any).id,
      role: (updated as any).role,
    })
  }

  return json({ error: 'Admin route not found' }, 404)
}
