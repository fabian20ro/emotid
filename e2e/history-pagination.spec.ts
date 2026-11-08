import { expect, test } from '@playwright/test'
import { seedHistory } from '../e2e-performance/history-browser'
import { expectAccessibleTextContrast } from './contrast'
import { pressTab } from './helpers'
import en from '../src/i18n/en.json' with { type: 'json' }
import ro from '../src/i18n/ro.json' with { type: 'json' }

test.use({ serviceWorkers: 'block' })

for (const language of ['en', 'ro'] as const) for (const theme of ['light', 'dark'] as const) {
  test(`history pages preserve navigation, boundary deletion and erasure (${language}/${theme})`, async ({ page, context, baseURL }, testInfo) => {
    const copy = language === 'en' ? en : ro
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await seedHistory(page, baseURL!, 41, language, theme)
    await page.setViewportSize({ width: 320, height: 568 })
    await page.getByRole('button', { name: copy.navigation.journal, exact: true }).click()
    const sessions = page.locator('.journal-list button')
    const summary = page.locator('.history-page-summary')
    const pager = page.getByRole('navigation', { name: copy.journalScreen.recent, exact: true }).first()
    await expect(sessions).toHaveCount(20)
    const next = page.getByRole('navigation', { name: copy.journalScreen.recent, exact: true }).last().getByRole('button', { name: copy.historyPagination.next })
    await next.focus()
    await page.keyboard.press('Enter')
    await expect(summary).toBeFocused()
    await expect(summary).toBeInViewport()
    await expect(pager.getByRole('spinbutton')).toHaveValue('2')
    await pressTab(page)
    await expect(pager.getByRole('button', { name: copy.historyPagination.first })).toBeFocused()
    await pager.getByRole('spinbutton').fill('0')
    await pager.getByRole('spinbutton').press('Enter')
    await expect(sessions).toHaveCount(20)
    await pager.getByRole('spinbutton').fill('3')
    await pager.getByRole('spinbutton').press('Enter')
    await expect(sessions).toHaveCount(1)
    await expect(summary).toBeFocused()
    await expect(pager.getByRole('button', { name: copy.historyPagination.last })).toBeDisabled()
    await expectAccessibleTextContrast(page, `history pagination ${language}/${theme}`)
    expect(await pager.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    for (const button of await pager.getByRole('button').all()) {
      const box = await button.boundingBox()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)
    }
    await page.screenshot({ path: testInfo.outputPath('history-pagination.png') })
    await page.setViewportSize({ width: 1280, height: 900 })
    await summary.scrollIntoViewIfNeeded()
    expect(await pager.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath('history-pagination-desktop.png') })
    await page.setViewportSize({ width: 320, height: 568 })
    await sessions.first().click()
    await page.getByRole('button', { name: copy.navigation.back, exact: true }).click()
    await expect(sessions).toHaveCount(1)
    await expect(pager.getByRole('spinbutton')).toHaveValue('3')
    await sessions.first().click()
    await page.getByRole('button', { name: copy.sessionDetail.delete, exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: copy.sessionDetail.confirmAction, exact: true }).click()
    await expect(sessions).toHaveCount(20)
    await expect(pager.getByRole('spinbutton')).toHaveValue('2')
    await expect(page.getByRole('heading', { name: copy.journalScreen.title, exact: true })).toBeFocused()

    await page.getByRole('button', { name: new RegExp(`^${copy.journalScreen.openExercises}:`) }).click()
    await page.getByRole('button', { name: copy.historyPagination.last }).last().click()
    const entries = page.locator('.guided-recent-list button')
    await expect(entries).toHaveCount(1)
    await entries.first().click()
    await page.getByRole('button', { name: copy.chainAnalysis.deleteOne, exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: copy.chainAnalysis.deleteOne, exact: true }).click()
    await expect(entries).toHaveCount(20)
    await expect(page.getByRole('spinbutton').first()).toHaveValue('2')
    await expect(page.getByRole('heading', { name: copy.chainAnalysis.recent, exact: true })).toBeFocused()

    await page.getByRole('button', { name: copy.chainAnalysis.clear, exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: copy.chainAnalysis.confirmAction, exact: true }).click()
    await expect(entries).toHaveCount(0)
    await expect(page.getByRole('heading', { name: copy.chainAnalysis.recent, exact: true })).toBeFocused()
    await expect(page.locator('.history-pagination')).toHaveCount(0)
    await page.getByRole('button', { name: copy.navigation.back, exact: true }).click()
    await expect(pager.getByRole('spinbutton')).toHaveValue('2')

    const other = await context.newPage()
    await other.goto(baseURL!)
    await other.getByRole('button', { name: copy.navigation.settings, exact: true }).click()
    await other.getByRole('button', { name: copy.settingsScreen.privacy, exact: true }).click()
    await other.getByRole('button', { name: copy.privacyData.clear, exact: true }).click()
    await other.getByRole('dialog').getByRole('button', { name: copy.privacyData.confirmAction, exact: true }).click()
    await expect(page.getByTestId('storage-invalidated')).toBeVisible()
    await expect(sessions).toHaveCount(0)
    await page.getByRole('button', { name: copy.storageRecovery.reload, exact: true }).click()
    // Erasure resets preferences to the browser locale (English in these contexts).
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await page.getByRole('button', { name: en.navigation.journal, exact: true }).click()
    await expect(sessions).toHaveCount(0)
    await expect(page.locator('.history-pagination')).toHaveCount(0)
    expect(errors).toEqual([])
  })
}
