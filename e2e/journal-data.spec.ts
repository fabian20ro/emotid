import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { expectAccessibleTextContrast } from './contrast'
import { completeQuick, finishReflection, openApp, openArrival } from './helpers'

async function saveQuickReflectionWithNextStep(page: Page) {
  await page.getByTestId('quick-feeling-anxiety').click()
  await page.getByTestId('quick-continue').click()
  await page.getByRole('button', { name: 'Yes' }).click()
  await page.getByRole('button', { name: 'Explore further' }).click()
  await page.getByRole('button', { name: 'grounding', exact: true }).click()
  await page.getByRole('button', { name: 'Try one small step' }).click()
  await page.getByRole('button', { name: 'Pause and notice what feels manageable next.' }).click()
  await page.getByRole('button', { name: 'Keep this step' }).click()
  await expect(page.getByTestId('today-screen')).toBeVisible()
}

async function saveChainEntry(page: Page) {
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await page.getByRole('button', { name: 'Unpack a moment' }).click()
  for (let index = 0; index < 7; index++) {
    await page.getByRole('textbox').fill(`entry-${index}`)
    await page.getByRole('button', { name: index === 6 ? 'Save chain' : 'Next' }).click()
  }
  await page.getByRole('button', { name: 'Done' }).click()
}

test.describe('Journal data trust', () => {
  test('keeps early history tentative and deletes exactly one selected check-in', async ({ page }) => {
    await openApp(page, { theme: 'dark' })
    await completeQuick(page, 'anxiety')
    await finishReflection(page)
    await completeQuick(page, 'joy')
    await finishReflection(page)

    await page.getByRole('button', { name: 'Journal', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Your first check-ins' })).toBeVisible()
    await expect(page.locator('.journal-stats')).toHaveCount(0)

    await page.getByRole('button', { name: /Open check-in: joy/i }).click()
    const deleteTrigger = page.getByRole('button', { name: 'Delete this check-in' })
    await deleteTrigger.click()

    const dialog = page.getByRole('dialog', { name: 'Delete this check-in?' })
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused()
    await expectAccessibleTextContrast(page, 'dark single-check-in confirmation')
    const dialogBox = await dialog.boundingBox()
    expect(dialogBox!.x).toBeGreaterThanOrEqual(16)
    expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width - 16)
    expect(dialogBox!.y).toBeGreaterThanOrEqual(16)
    expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(page.viewportSize()!.height - 16)
    expect(await page.locator('.dialog-viewport').evaluate((element) => element.parentElement === document.body)).toBe(true)

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(deleteTrigger).toBeFocused()
    await expect(page.getByTestId('session-detail-screen')).toContainText('joy')

    await deleteTrigger.click()
    await page.getByRole('button', { name: 'Delete check-in' }).click()
    await expect(page.getByTestId('journal-screen')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Your emotional thread' })).toBeFocused()
    await expect(page.getByRole('button', { name: /Open check-in: anxiety/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Open check-in: joy/i })).toHaveCount(0)

    await page.reload()
    await page.getByRole('button', { name: 'Journal', exact: true }).click()
    await expect(page.getByRole('button', { name: /Open check-in: anxiety/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Open check-in: joy/i })).toHaveCount(0)
  })

  test('exports sessions, chain entries, and preferences, then deletes all local data', async ({ page }) => {
    await openApp(page)
    await page.evaluate(() => {
      localStorage.setItem('emot-id-sound-muted', 'true')
      localStorage.setItem('emot-id-daily-reminder-enabled', 'true')
      localStorage.setItem('emot-id-daily-reminder-last-sent-at', '42')
      localStorage.setItem('emot-id-simple-language', 'true')
    })
    await saveQuickReflectionWithNextStep(page)
    await saveChainEntry(page)

    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('button', { name: 'Dark' }).click()
    await page.getByRole('button', { name: 'Privacy & data' }).click()
    await page.getByRole('switch', { name: 'Allow external AI search links' }).click()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export my data' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('emot-id-data.json')
    const path = await download.path()
    expect(path).not.toBeNull()
    const exported = JSON.parse(await readFile(path!, 'utf8'))

    expect(exported.schemaVersion).toBe(2)
    expect(exported.sessions).toHaveLength(1)
    expect(exported.sessions[0].selectedNeed).toBe('grounding')
    expect(exported.sessions[0].nextStep).toEqual(expect.any(String))
    expect(exported.chainEntries).toHaveLength(1)
    expect(exported.chainEntries[0].emotion).toBe('entry-3')
    expect(exported.preferences.theme).toBe('dark')
    expect(exported.preferences.allowExternalAI).toBe(false)
    expect(exported.preferences).not.toHaveProperty('soundMuted')
    expect(exported.preferences).not.toHaveProperty('dailyReminderEnabled')
    expect(exported.preferences).not.toHaveProperty('dailyReminderLastSentAt')
    expect(exported.preferences).not.toHaveProperty('simpleLanguage')

    const deleteTrigger = page.getByRole('button', { name: 'Delete all local data' })
    await deleteTrigger.click()
    const dialog = page.getByRole('dialog', { name: 'Delete all local data?' })
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused()
    await expectAccessibleTextContrast(page, 'dark delete-all confirmation')
    const dialogBox = await dialog.boundingBox()
    expect(dialogBox!.x).toBeGreaterThanOrEqual(16)
    expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width - 16)
    expect(dialogBox!.y).toBeGreaterThanOrEqual(16)
    expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(page.viewportSize()!.height - 16)
    expect(await page.locator('.dialog-viewport').evaluate((element) => element.parentElement === document.body)).toBe(true)
    await page.getByRole('button', { name: 'Delete everything' }).click()
    await expect(page.getByRole('status')).toContainText('Local data was deleted')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.getByRole('switch', { name: 'Allow external AI search links' })).toBeChecked()
    expect(await page.evaluate(() => ({
      sound: localStorage.getItem('emot-id-sound-muted'),
      reminder: localStorage.getItem('emot-id-daily-reminder-enabled'),
      reminderSent: localStorage.getItem('emot-id-daily-reminder-last-sent-at'),
      simple: localStorage.getItem('emot-id-simple-language'),
    }))).toEqual({ sound: null, reminder: null, reminderSent: null, simple: null })

    await page.getByRole('button', { name: 'Back' }).click()
    await page.getByRole('button', { name: 'Back' }).click()
    await page.getByRole('button', { name: 'Journal', exact: true }).click()
    await expect(page.getByText('No saved check-ins yet')).toBeVisible()
    await page.getByRole('button', { name: 'Unpack a moment' }).click()
    await expect(page.getByText('Recent chains')).toHaveCount(0)

    await page.reload()
    await expect(page.getByText('Recent chains')).toHaveCount(0)
  })

  test('localizes stored body region and sensation details in Romanian', async ({ page }) => {
    await openApp(page, { language: 'ro' })
    await openArrival(page)
    await page.getByTestId('arrival-body').click()
    await page.locator('[data-region="chest"]').first().click({ force: true })
    await page.getByRole('button', { name: 'Tensiune' }).click()
    await page.getByRole('button', { name: /Moderată/i }).click()
    await page.locator('.route-action button').click()
    await page.getByRole('button', { name: 'Explorați mai mult' }).click()
    await page.getByRole('button', { name: 'Încercați un pas mic' }).click()
    await page.getByRole('button', { name: 'Opriți-vă puțin și observați ce pare realizabil în continuare.' }).click()
    await page.getByRole('button', { name: 'Păstrați acest pas' }).click()
    await expect(page.getByTestId('today-screen')).toBeVisible()

    await page.getByRole('button', { name: 'Jurnal', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Primele voastre verificări' })).toBeVisible()
    await page.locator('.journal-list button').click()
    await expect(page.getByTestId('session-detail-screen')).toContainText('Semnale corporale')
    await expect(page.getByTestId('session-detail-screen')).toContainText('Piept')
    await expect(page.getByTestId('session-detail-screen')).toContainText('Tensiune · Moderată')
    await expect(page.getByTestId('session-detail-screen')).toContainText('Pasul următor')
  })
})
