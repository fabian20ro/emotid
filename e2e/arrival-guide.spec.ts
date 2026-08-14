import { expect, test, type Page } from '@playwright/test'
import { expectAccessibleTextContrast } from './contrast'
import { openApp, openArrival } from './helpers'

async function expectGuideInBounds(page: Page) {
  const overflow = await page.locator('body').evaluate((body) => body.scrollWidth - body.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)

  const options = page.locator('.guide-option')
  await expect(options).toHaveCount(2)
  for (let index = 0; index < await options.count(); index++) {
    const box = await options.nth(index).boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(88)
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1)
  }
}

test.describe('Arrival guide', () => {
  test('keeps guided support and priority placement in the first viewport', async ({ page }) => {
    await openApp(page)
    await openArrival(page)

    const routeIds = await page.locator('.route-grid > [data-testid]').evaluateAll(
      (elements) => elements.map((element) => element.getAttribute('data-testid')),
    )
    expect(routeIds).toEqual([
      'arrival-unsure',
      'arrival-affect',
      'arrival-words',
      'arrival-body',
    ])
    await expect(page.getByTestId('arrival-unsure')).toBeInViewport()
    await expect(page.getByTestId('arrival-affect')).toBeInViewport()
  })

  test('supports keyboard navigation, exact Back, and direct handoff', async ({ page }) => {
    await openApp(page, { theme: 'dark' })
    await openArrival(page)

    await page.getByTestId('arrival-unsure').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('arrival-guide-body')).toBeVisible()
    await expectAccessibleTextContrast(page, 'Arrival guide body question')
    await expectGuideInBounds(page)

    await page.getByRole('button', { name: /Not clearly/i }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('arrival-guide-placement')).toBeVisible()
    await expectGuideInBounds(page)

    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page.getByTestId('arrival-guide-body')).toBeVisible()
    await page.getByRole('button', { name: 'Show all starting points' }).click()
    await expect(page.getByTestId('arrival-unsure')).toBeVisible()

    await page.getByTestId('arrival-unsure').click()
    await page.getByRole('button', { name: /Yes, I can point to an area/i }).click()
    await expect(page.getByTestId('body-screen')).toBeVisible()
  })

  test('uses Romanian questions and hands broad words to the Word Ladder', async ({ page }) => {
    await openApp(page, { language: 'ro' })
    await openArrival(page)

    await page.getByTestId('arrival-unsure').click()
    await expect(page.getByRole('heading', { name: 'Poți indica unde simți ceva în corp?' })).toBeVisible()
    await page.getByRole('button', { name: /Nu foarte clar/i }).click()
    await expect(page.getByRole('heading', { name: 'Poți plasa aproximativ starea?' })).toBeVisible()
    await page.getByRole('button', { name: /Am nevoie întâi de termeni generali/i }).click()

    await expect(page.getByTestId('words-screen')).toBeVisible()
  })

  test('hands a placeable feeling to the Affect Map', async ({ page }) => {
    await openApp(page)
    await openArrival(page)

    await page.getByTestId('arrival-unsure').click()
    await page.getByRole('button', { name: /Not clearly/i }).click()
    await page.getByRole('button', { name: /Yes, I can place it/i }).click()

    await expect(page.getByTestId('affect-screen')).toBeVisible()
    await expect(page.getByTestId('dimensional-plot-container')).toBeVisible()
  })
})
