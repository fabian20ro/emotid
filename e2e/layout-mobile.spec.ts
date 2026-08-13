import { test, expect, type Page } from '@playwright/test'
import { openApp, openArrival } from './helpers'

const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 393, height: 742 },
  { width: 430, height: 932 },
]

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.locator('.app-shell').evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    height: element.getBoundingClientRect().height,
  }))
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1)
  expect(metrics.height).toBe(page.viewportSize()!.height)
}

for (const viewport of viewports) {
  test.describe(`mobile ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport })

    test('Today and Arrival keep navigation and controls in bounds', async ({ page }) => {
      await openApp(page)
      await expectNoHorizontalOverflow(page)

      const primary = await page.getByRole('button', { name: 'Start a reflection' }).boundingBox()
      expect(primary!.height).toBeGreaterThanOrEqual(55)

      let nav = await page.locator('.bottom-nav').boundingBox()
      expect(nav!.y + nav!.height).toBeLessThanOrEqual(viewport.height + 1)

      await openArrival(page)
      await expectNoHorizontalOverflow(page)
      nav = await page.locator('.bottom-nav').boundingBox()
      expect(nav!.y + nav!.height).toBeLessThanOrEqual(viewport.height + 1)

      const cards = page.locator('.route-card')
      for (let index = 0; index < await cards.count(); index++) {
        const box = await cards.nth(index).boundingBox()
        expect(box!.width).toBeLessThanOrEqual(viewport.width - 32)
        expect(box!.height).toBeGreaterThanOrEqual(80)
      }
    })

    test('Affect suggestions remain below the plot without overlap', async ({ page }) => {
      await openApp(page)
      await openArrival(page)
      await page.getByTestId('arrival-affect').click()
      const plot = page.getByTestId('dimensional-plot-container').locator('svg')
      const plotBox = await plot.boundingBox()
      expect(plotBox).not.toBeNull()
      await plot.click({ position: { x: plotBox!.width * 0.5, y: plotBox!.height * 0.7 }, force: true })
      const tray = page.getByTestId('dimensional-suggestion-tray')
      await expect(tray).toBeVisible()
      await expect.poll(async () => {
        return page.evaluate(() => {
          const currentPlot = document.querySelector('[data-testid="dimensional-plot-container"] svg')
          const currentTray = document.querySelector('[data-testid="dimensional-suggestion-tray"]')
          const currentAction = document.querySelector('.route-action')
          if (!currentPlot || !currentTray || !currentAction) return Number.NEGATIVE_INFINITY

          const plotRect = currentPlot.getBoundingClientRect()
          const trayRect = currentTray.getBoundingClientRect()
          const actionRect = currentAction.getBoundingClientRect()
          return Math.min(trayRect.top - plotRect.bottom, actionRect.top - trayRect.bottom)
        })
      }).toBeGreaterThanOrEqual(-1)
      await expect(tray.locator('.dimensional-suggestion-chip').first()).toBeInViewport()
      await expectNoHorizontalOverflow(page)
    })

    test('Plutchik wheel keeps all primary emotions in bounds', async ({ page }) => {
      await openApp(page)
      await page.getByRole('button', { name: 'Explore' }).click()
      await page.getByTestId('explore-plutchik').click()

      const stage = page.locator('.model-stage-plutchik')
      const stageBox = await stage.boundingBox()
      const emotions = page.locator('.plutchik-emotion')
      await expect(emotions).toHaveCount(8)
      for (let index = 0; index < await emotions.count(); index++) {
        const box = await emotions.nth(index).boundingBox()
        expect(box!.x).toBeGreaterThanOrEqual(stageBox!.x - 1)
        expect(box!.x + box!.width).toBeLessThanOrEqual(stageBox!.x + stageBox!.width + 1)
        expect(box!.height).toBeGreaterThanOrEqual(44)
      }

      await page.getByTestId('plutchik-emotion-joy').click()
      await page.getByTestId('plutchik-emotion-trust').click()
      await expect(page.getByTestId('plutchik-combination')).toBeVisible()
      await expectNoHorizontalOverflow(page)
    })

    test('Body Compass map and side controls stay within the staged surface', async ({ page }) => {
      await openApp(page)
      await openArrival(page)
      await page.getByTestId('arrival-body').click()

      const stage = page.locator('.model-stage-body')
      const svg = page.locator('.body-region-map-svg')
      const stageBox = await stage.boundingBox()
      const svgBox = await svg.boundingBox()
      expect(stageBox).not.toBeNull()
      expect(svgBox).not.toBeNull()
      expect(svgBox!.x).toBeGreaterThanOrEqual(stageBox!.x - 1)
      expect(svgBox!.x + svgBox!.width).toBeLessThanOrEqual(stageBox!.x + stageBox!.width + 1)
      expect(svgBox!.y).toBeGreaterThanOrEqual(stageBox!.y - 1)
      expect(svgBox!.y + svgBox!.height).toBeLessThanOrEqual(stageBox!.y + stageBox!.height + 1)

      const sideButtons = page.locator('.body-side-switch button')
      await expect(sideButtons).toHaveCount(3)
      for (let index = 0; index < await sideButtons.count(); index++) {
        expect((await sideButtons.nth(index).boundingBox())!.height).toBeGreaterThanOrEqual(44)
      }
      await expect(page.locator('[data-region]:not([data-region$="-hit"])')).toHaveCount(10)
      await page.getByRole('button', { name: 'Back', exact: true }).nth(1).click()
      await expect(page.locator('[data-region]:not([data-region$="-hit"])')).toHaveCount(8)
      await page.getByRole('button', { name: 'List' }).click()
      await expect(page.getByTestId('bodymap-root')).toHaveCount(0)
      await expect(page.getByRole('group', { name: 'Body areas' })).toBeInViewport()
      await expectNoHorizontalOverflow(page)
    })
  })
}
