import { expect, test } from '@playwright/test'
import { completeQuick, finishReflection, openApp } from './helpers'
import { expectAccessibleTextContrast } from './contrast'

for (const language of ['en', 'ro'] as const) for (const theme of ['light', 'dark'] as const) {
  test(`Today distinguishes unavailable history without losing data (${language}/${theme})`, async ({ page }, testInfo) => {
    const ro = language === 'ro'
    await page.addInitScript(() => {
      const original = IDBObjectStore.prototype.getAll
      IDBObjectStore.prototype.getAll = function (...args: Parameters<typeof original>) {
        if (this.name === 'sessions' && sessionStorage.getItem('fail-history') === 'true') {
          throw new DOMException('Synthetic history read failure', 'UnknownError')
        }
        return original.apply(this, args)
      }
    })
    await openApp(page, { language, theme })
    await completeQuick(page)
    await finishReflection(page)
    await expect(page.locator('.recent-thread strong')).toContainText(ro ? 'anxietate' : 'anxiety')
    await page.evaluate(() => sessionStorage.setItem('fail-history', 'true'))
    await page.reload()
    await expect(page.locator('.recent-thread [role="status"]')).toContainText(ro ? 'nu înseamnă că au fost șterse' : 'does not mean they were deleted')
    await expect(page.locator('.recent-thread')).not.toContainText(ro ? 'Reflecțiile pot rămâne aici' : 'Your reflections can stay here')
    await page.getByTestId('quick-feeling-joy').click()
    await expect(page.getByTestId('quick-continue')).toBeEnabled()
    await page.setViewportSize({ width: 320, height: 568 })
    await page.locator('.recent-thread').scrollIntoViewIfNeeded()
    expect(await page.locator('.app-content').evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
    await expectAccessibleTextContrast(page, `history failure ${language}/${theme}`)
    await page.screenshot({ path: testInfo.outputPath('history-failure.png') })
    await page.evaluate(() => sessionStorage.removeItem('fail-history'))
    await page.reload()
    await expect(page.locator('.recent-thread strong')).toContainText(ro ? 'anxietate' : 'anxiety')
  })
}
