import { expect, test, type Page } from '@playwright/test'
import { completeQuick, openApp } from './helpers'

async function expectCompactActions(page: Page, doneName: string, exploreName: string) {
  const done = page.getByRole('button', { name: doneName })
  const explore = page.getByRole('button', { name: exploreName })
  await expect(done).toBeInViewport()
  await expect(explore).toBeInViewport()
  const [doneBox, exploreBox] = await Promise.all([done.boundingBox(), explore.boundingBox()])
  expect(doneBox).not.toBeNull()
  expect(exploreBox).not.toBeNull()
  expect(Math.abs(doneBox!.y - exploreBox!.y)).toBeLessThan(1)
  for (const box of [doneBox!, exploreBox!]) {
    expect(box.x).toBeGreaterThanOrEqual(16)
    expect(box.x + box.width).toBeLessThanOrEqual(304)
    expect(box.height).toBeGreaterThanOrEqual(48)
  }
  return { done, explore }
}

test.describe('Reflection trust boundary', () => {
  test.beforeEach(async ({ page }) => openApp(page))

  test('rejected results remove inferred content and persist no inferred need', async ({ page }) => {
    await completeQuick(page, 'anxiety')
    await expect(page.getByRole('button', { name: 'grounding', exact: true })).toHaveCount(0)

    await page.getByRole('button', { name: 'Not really' }).click()
    await expect(page.getByRole('heading', { name: 'The result does not fit' })).toBeVisible()
    await expect(page.getByRole('group', { name: 'What feels most needed right now?' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Try one small step' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Explore with AI' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Finish without a label' }).click()
    await expect(page.getByTestId('today-screen')).toBeVisible()
    await page.getByRole('button', { name: 'Journal', exact: true }).click()
    await page.getByRole('button', { name: /open check-in: anxiety/i }).click()
    await expect(page.getByTestId('session-detail-screen')).toContainText(/not really/i)
    await expect(page.getByTestId('session-detail-screen')).not.toContainText('grounding')
  })

  test('partial results offer only user-chosen neutral next steps', async ({ page }) => {
    await completeQuick(page, 'anxiety')
    await page.getByRole('button', { name: 'Partly' }).click()
    await expect(page.locator('.fit-response')).toContainText(/possibilities/i)
    await page.getByRole('button', { name: 'Explore further' }).click()
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

    await expect(page.getByTestId('today-screen')).toBeVisible()
    await page.getByRole('button', { name: 'Journal', exact: true }).click()
    await page.getByRole('button', { name: /open check-in: anxiety/i }).click()
    await expect(page.getByTestId('session-detail-screen')).toContainText('Write down one observation without trying to solve it.')
  })

  test('keeps optional interpretation behind an accessible compact choice', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await completeQuick(page, 'anxiety')

    await expect(page.getByRole('heading', { name: 'What seems to fit?' })).toBeFocused()
    await expect(page.getByRole('group', { name: 'What feels most needed right now?' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Explore with AI' })).toHaveCount(0)

    const { explore } = await expectCompactActions(page, 'Done for now', 'Explore further')

    await explore.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('reflection-exploration-screen')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Explore further' })).toBeFocused()
    await expect(page.getByRole('group', { name: 'What feels most needed right now?' })).toBeVisible()

    await page.getByRole('button', { name: 'Back' }).click()
    await expect(explore).toBeFocused()
  })

  test('keeps Romanian compact actions readable without scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'RO', exact: true }).click()
    await page.getByRole('button', { name: 'Înapoi' }).click()
    await page.getByTestId('quick-feeling-anxiety').click()
    await page.getByTestId('quick-continue').click()

    await expectCompactActions(page, 'Gata pentru acum', 'Explorați mai mult')
  })

  test('Romanian mismatch recovery remains in bounds', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'RO', exact: true }).click()
    await page.getByRole('button', { name: 'Înapoi' }).click()
    await page.getByTestId('quick-feeling-anxiety').click()
    await page.getByTestId('quick-continue').click()
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
