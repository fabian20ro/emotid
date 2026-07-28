import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

test.describe('Introduction replay', () => {
  test('replays from Settings, stays dismissible, and preserves preferences', async ({ page }) => {
    await openApp(page, { language: 'ro', theme: 'dark' })
    await page.getByRole('button', { name: 'Setări' }).click()
    await page.getByRole('button', { name: 'Reluați introducerea' }).click()

    const introduction = page.getByRole('dialog')
    await expect(introduction).toContainText('Aceasta este o explorare')
    await expect(introduction.getByRole('group', { name: 'Limbă' })).toHaveCount(0)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.getByRole('button', { name: 'Închideți introducerea' }).click()
    await expect(page.getByTestId('settings-screen')).toBeVisible()

    await page.getByRole('button', { name: 'Reluați introducerea' }).click()
    await page.getByRole('button', { name: 'Înainte' }).click()
    await page.getByRole('button', { name: 'Înainte' }).click()
    await expect(page.getByRole('group', { name: 'Limbă' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Gata' }).click()

    await expect(page.getByTestId('settings-screen')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.getByRole('button', { name: 'RO', exact: true })).toHaveAttribute('aria-pressed', 'true')
  })
})
