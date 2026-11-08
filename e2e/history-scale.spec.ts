import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { seedHistory } from '../e2e-performance/history-browser'
import { makeHistoryFixture } from '../e2e-performance/history-fixtures'
import en from '../src/i18n/en.json' with { type: 'json' }
import ro from '../src/i18n/ro.json' with { type: 'json' }

test.use({ serviceWorkers: 'block' })

for (const language of ['en', 'ro'] as const) for (const theme of ['light', 'dark'] as const) {
  test(`large history retains records, draft and complete export (${language}/${theme})`, async ({ page, baseURL }, testInfo) => {
    test.setTimeout(120_000)
    const copy = language === 'en' ? en : ro
    const fixture = makeHistoryFixture(5000)
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await seedHistory(page, baseURL!, 5000, language, theme)
    await expect(page.locator('html')).toHaveAttribute('lang', language)
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    await page.getByRole('button', { name: copy.navigation.journal, exact: true }).click()
    const sessions = page.locator('.journal-list button')
    await expect(sessions).toHaveCount(20)
    await expect(page.locator('.journal-stats strong').first()).toHaveText('2500')
    const dates = await page.evaluate(({ language, timestamps }) => {
      const format = new Intl.DateTimeFormat(language, { dateStyle: 'medium', timeStyle: 'short' })
      return timestamps.map((timestamp) => format.format(timestamp))
    }, { language, timestamps: fixture.sessions.map((entry) => entry.timestamp) })
    await expect(sessions.first().locator('small').first()).toHaveText(dates[0])
    await expect(sessions.last().locator('small').first()).toHaveText(dates[19])
    await page.getByRole('spinbutton', { name: copy.historyPagination.page }).first().fill('126')
    await page.getByRole('button', { name: copy.historyPagination.go }).first().click()
    await expect(sessions.first().locator('small').first()).toHaveText(dates[2500])
    await page.getByRole('button', { name: copy.historyPagination.last }).first().click()
    await expect(sessions.last().locator('small').first()).toHaveText(dates[4999])
    await page.getByRole('button', { name: copy.historyPagination.first }).first().click()
    await page.screenshot({ path: testInfo.outputPath('large-journal.png') })
    await sessions.first().click()
    await page.getByRole('button', { name: copy.sessionDetail.delete, exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: copy.sessionDetail.confirmAction, exact: true }).click()
    await expect(sessions).toHaveCount(20)
    await expect(page.locator('.journal-stats strong').first()).toHaveText('2499')

    await page.getByRole('button', { name: new RegExp(`^${copy.journalScreen.openExercises}:`) }).click()
    const entries = page.locator('.guided-recent-list button')
    await expect(entries).toHaveCount(20)
    await expect(entries.first()).toContainText('Synthetic moment 00000')
    await page.getByRole('button', { name: copy.historyPagination.last }).last().click()
    await expect(entries.last()).toContainText('Synthetic moment 04999')
    await page.getByRole('button', { name: copy.chainAnalysis.newEntry, exact: true }).click()
    const field = page.getByLabel(copy.chainAnalysis.situation, { exact: true })
    await field.fill('Synthetic unsaved draft')
    await entries.last().click()
    await expect(page.getByTestId('chain-entry-detail')).toContainText('Synthetic moment 04999')
    await page.getByRole('button', { name: copy.chainAnalysis.deleteOne, exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: copy.chainAnalysis.deleteOne, exact: true }).click()
    await expect(entries).toHaveCount(19)
    await expect(entries.last()).toContainText('Synthetic moment 04998')
    await page.getByRole('button', { name: copy.chainAnalysis.resumeEntry, exact: true }).click()
    await expect(field).toHaveValue('Synthetic unsaved draft')
    await page.screenshot({ path: testInfo.outputPath('large-exercise-draft.png') })

    // Remount the app: deletions must be durable, while unsaved text must not enter the export.
    await page.reload()
    await page.getByRole('button', { name: copy.navigation.journal, exact: true }).click()
    await expect(sessions).toHaveCount(20)
    await expect(sessions.first().locator('small').first()).toHaveText(dates[1])
    await page.getByRole('button', { name: copy.navigation.settings, exact: true }).click()
    await page.getByRole('button', { name: copy.settingsScreen.privacy, exact: true }).click()
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: copy.privacyData.export, exact: true }).click()
    const download = await downloadPromise
    const exported = JSON.parse(await readFile((await download.path())!, 'utf8'))
    expect(exported.schemaVersion).toBe(3)
    expect(exported.sessions).toEqual(fixture.sessions.slice(1))
    expect(exported.chainEntries).toEqual(fixture.chainEntries.slice(0, -1))
    expect(errors).toEqual([])
  })
}
