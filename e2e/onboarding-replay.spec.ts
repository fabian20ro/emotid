import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

test.describe('Introduction replay', () => {
  test('replays from Settings, stays dismissible, and preserves preferences', async ({ page }) => {
    await openApp(page, { language: 'ro', theme: 'dark' })
    await page.getByRole('button', { name: 'Setări' }).click()
    const replay = page.getByRole('button', { name: 'Reluați introducerea' })
    await replay.click()

    const introduction = page.getByRole('dialog')
    await expect(introduction.evaluate((element) => element.parentElement === document.body)).resolves.toBe(true)
    await expect(page.locator('.app-shell')).toHaveAttribute('aria-hidden', 'true')
    await expect(page.locator('.app-shell')).toHaveAttribute('inert', '')
    const overlayBounds = await introduction.boundingBox()
    const viewport = page.viewportSize()
    expect(overlayBounds).not.toBeNull()
    expect(viewport).not.toBeNull()
    expect(Math.abs(overlayBounds!.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(overlayBounds!.y)).toBeLessThanOrEqual(1)
    expect(Math.abs(overlayBounds!.width - viewport!.width)).toBeLessThanOrEqual(1)
    expect(Math.abs(overlayBounds!.height - viewport!.height)).toBeLessThanOrEqual(1)
    await expect(introduction).toContainText('Aceasta este o explorare')
    await expect(introduction.getByRole('heading', { name: 'Aceasta este o explorare, nu un test' })).toBeFocused()
    await expect(introduction.getByRole('progressbar', { name: 'Progresul introducerii' })).toHaveAttribute('aria-valuenow', '1')
    await expect(introduction.getByRole('group', { name: 'Limbă' })).toHaveCount(0)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.getByRole('button', { name: 'Închideți introducerea' }).click()
    await expect(page.getByTestId('settings-screen')).toBeVisible()
    await expect(replay).toBeFocused()

    await replay.click()
    await page.getByRole('button', { name: 'Înainte' }).click()
    await expect(page.getByRole('heading', { name: 'Emoțiile pot fi explorate cu curiozitate' })).toBeFocused()
    await page.getByRole('button', { name: 'Înainte' }).click()
    await expect(page.getByRole('heading', { name: 'Confidențialitate și date' })).toBeFocused()
    await expect(page.getByRole('group', { name: 'Limbă' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Gata' }).click()

    await expect(page.getByTestId('settings-screen')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.getByRole('button', { name: 'RO', exact: true })).toHaveAttribute('aria-pressed', 'true')
  })
})
