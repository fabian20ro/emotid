import { expect, test } from '@playwright/test'
import { openApp, pressTab, tabTo } from './helpers'
import en from '../src/i18n/en.json' with { type: 'json' }
import ro from '../src/i18n/ro.json' with { type: 'json' }

test.use({ serviceWorkers: 'block' })

for (const language of ['en', 'ro'] as const) for (const theme of ['light', 'dark'] as const) {
  const copy = language === 'en' ? en : ro
  test(`vocabulary prompts, completion and restart retain keyboard focus (${language}/${theme})`, async ({ page }) => {
    await openApp(page, { language, theme })
    await tabTo(page.getByRole('button', { name: copy.navigation.explore, exact: true }))
    await page.keyboard.press('Enter')
    await tabTo(page.getByTestId('explore-practice'))
    await page.keyboard.press('Enter')
    const prompt = page.getByRole('heading', { name: copy.granularity.prompt })
    await expect(prompt).toBeFocused()
    for (let step = 0; step < Object.keys(copy.granularity.contrasts).length; step += 1) {
      await tabTo(page.getByRole('button', { name: copy.granularity.notSure }))
      await page.keyboard.press('Space')
      await pressTab(page)
      await expect(page.getByRole('button', { name: copy.granularity.continue })).toBeFocused()
      await page.keyboard.press('Enter')
      if (step < Object.keys(copy.granularity.contrasts).length - 1) {
        await expect(prompt).toBeFocused()
        await expect(prompt).toBeInViewport()
      }
    }
    await expect(page.getByRole('heading', { name: copy.granularity.completedTitle })).toBeFocused()
    await pressTab(page)
    await expect(page.getByRole('button', { name: copy.granularity.restart })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(prompt).toBeFocused()
    await pressTab(page)
    await expect(page.locator('.guided-options button').first()).toBeFocused()
  })

  test(`similar Journal entries expose their visible dates and open the selected record (${language}/${theme})`, async ({ page }) => {
    await openApp(page, { language, theme })
    // Stop the app before seeding two otherwise indistinguishable records.
    await page.goto('manifest.webmanifest')
    await page.evaluate(() => new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('emot-id-sessions')
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('sessions', 'readwrite')
        for (const [id, timestamp] of [['older', Date.parse('2026-07-23T10:00:00Z')], ['newer', Date.parse('2026-07-24T10:00:00Z')]] as const) {
          tx.objectStore('sessions').put({ id, timestamp, modelId: 'quick-check-in', entryRoute: 'quick', selections: [],
            results: [{ id: 'anxiety', label: { en: 'anxiety', ro: 'anxietate' }, color: '#176b60' }], crisisTier: 'none' }, id)
        }
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onabort = () => { db.close(); reject(tx.error) }
      }
    }))
    await page.goto('./')
    await tabTo(page.getByRole('button', { name: copy.navigation.journal, exact: true }))
    await page.keyboard.press('Enter')
    const entries = page.locator('.journal-list button')
    await expect(entries).toHaveCount(2)
    for (let index = 0; index < 2; index += 1) {
      const entry = entries.nth(index)
      const date = await entry.locator('small').first().innerText()
      await expect(entry).toHaveAccessibleName(new RegExp(date.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    }
    const older = entries.nth(1)
    await tabTo(older)
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('session-detail-screen')).toBeVisible()
    await expect(page.locator('.screen-lede')).toContainText('23')
  })
}
