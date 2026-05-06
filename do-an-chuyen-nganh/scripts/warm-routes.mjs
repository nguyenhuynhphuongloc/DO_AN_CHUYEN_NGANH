const baseUrl = process.env.WARM_BASE_URL || 'http://localhost:3000'
const routes = (process.env.WARM_ROUTES || '/dashboard,/categories,/transactions,/reports,/savings,/chat,/scan')
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean)

const warmRoute = async (route) => {
  const url = new URL(route, baseUrl)
  const startedAt = Date.now()

  try {
    const response = await fetch(url, { redirect: 'manual' })
    const elapsed = Date.now() - startedAt
    console.log(`${route} -> ${response.status} (${elapsed}ms)`)
  } catch (error) {
    const elapsed = Date.now() - startedAt
    console.error(`${route} -> failed (${elapsed}ms): ${error.message}`)
    process.exitCode = 1
  }
}

for (const route of routes) {
  await warmRoute(route)
}
