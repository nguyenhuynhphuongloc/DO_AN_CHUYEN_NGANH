import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/FinTrack/)
    await expect(page.getByRole('region', { name: /Đăng nhập|Dang nhap/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Đăng nhập|Dang nhap/i })).toBeVisible()
  })
})
