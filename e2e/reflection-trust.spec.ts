import { expect, test } from '@playwright/test'
import { completeQuick, openApp } from './helpers'

test.describe('Reflection trust boundary', () => {
  test.beforeEach(async ({ page }) => openApp(page))

  test('rejected results remove inferred content and persist no inferred need', async ({ page }) => {
    await completeQuick(page, 'anxiety')
    await expect(page.getByRole('button', { name: 'grounding, breath, and present focus' })).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('button', { name: 'Not really' }).click()
    await expect(page.getByRole('heading', { name: 'The result does not fit' })).toBeVisible()
    await expect(page.getByRole('group', { name: 'What feels most needed right now?' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Try one small step' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Explore with AI' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Finish without a label' }).click()
    await page.getByRole('button', { name: 'Return to Today' }).click()
    await page.getByRole('button', { name: 'Journal', exact: true }).click()
    await page.getByRole('button', { name: /open reflection: anxiety/i }).click()
    await expect(page.getByTestId('session-detail-screen')).toContainText(/not really/i)
    await expect(page.getByTestId('session-detail-screen')).not.toContainText('grounding, breath, and present focus')
  })

  test('partial results offer only user-chosen neutral next steps', async ({ page }) => {
    await completeQuick(page, 'anxiety')
    await page.getByRole('button', { name: 'Partly' }).click()
    await expect(page.getByRole('status')).toContainText(/possibilities/i)
    await page.locator('.app-content').evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    await page.getByRole('button', { name: 'Try one small step' }).click()

    await expect(page.getByText(/approach what feels scary/i)).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Try one small step' })).toBeInViewport()
    await expect.poll(() => page.locator('.app-content').evaluate((element) => element.scrollTop)).toBe(0)
    const keep = page.getByRole('button', { name: 'Keep this step' })
    await expect(keep).toBeDisabled()
    await page.getByRole('button', { name: 'Write down one observation without trying to solve it.' }).click()
    await expect(keep).toBeEnabled()
    await keep.click()

    await page.getByRole('button', { name: 'Return to Today' }).click()
    await page.getByRole('button', { name: 'Journal', exact: true }).click()
    await page.getByRole('button', { name: /open reflection: anxiety/i }).click()
    await expect(page.getByTestId('session-detail-screen')).toContainText('Write down one observation without trying to solve it.')
  })

  test('Romanian mismatch recovery remains in bounds', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'RO' }).click()
    await page.getByRole('button', { name: 'Înapoi' }).click()
    await page.getByTestId('quick-feeling-anxiety').click()
    await page.getByRole('button', { name: 'Nu prea' }).click()

    const panel = page.locator('.mismatch-panel')
    await expect(panel).toContainText('Rezultatul nu se potrivește')
    const box = await panel.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(16)
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width - 16)
    const finish = page.getByRole('button', { name: 'Încheiați fără o etichetă' })
    await finish.scrollIntoViewIfNeeded()
    await expect(finish).toBeInViewport()
  })
})
