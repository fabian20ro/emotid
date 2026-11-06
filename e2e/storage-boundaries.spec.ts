import { expect, test } from '@playwright/test'
import en from '../src/i18n/en.json' with { type: 'json' }
import ro from '../src/i18n/ro.json' with { type: 'json' }
import { openApp } from './helpers'

for (const language of ['en', 'ro'] as const) for (const theme of ['light', 'dark'] as const) {
  const copy = language === 'ro' ? ro : en

  test(`invalid stored dates show load errors without deleting data (${language}/${theme})`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await openApp(page, { language, theme })
    // Stop React before changing storage; no live hydration/write race in the fixture.
    await page.goto('manifest.webmanifest')
    await page.evaluate(async () => {
      for (const [name, storeName, record] of [
        ['emot-id-sessions', 'sessions', { id: 'invalid', timestamp: 1e20, modelId: 'wheel', selections: [], results: [], crisisTier: 'none' }],
        ['emot-id-chain-analysis', 'entries', { id: 'invalid', timestamp: 1e20, version: 2, situation: 'Preserve me', noticed: '', response: '', outcome: '' }],
      ] as const) {
        await new Promise<void>((resolve, reject) => {
          const request = indexedDB.open(name)
          request.onupgradeneeded = () => request.result.createObjectStore(storeName)
          request.onerror = () => reject(request.error)
          request.onsuccess = () => {
            const db = request.result
            const tx = db.transaction(storeName, 'readwrite')
            tx.objectStore(storeName).put(record, record.id)
            tx.oncomplete = () => { db.close(); resolve() }
            tx.onabort = () => { db.close(); reject(tx.error) }
          }
        })
      }
    })
    await page.goto('./')
    await page.getByRole('button', { name: language === 'ro' ? 'Jurnal' : 'Journal', exact: true }).click()
    const journal = page.getByTestId('journal-screen')
    await expect(journal.getByRole('alert')).toHaveCount(2)
    await expect(journal).toContainText(copy.journalScreen.errorTitle)
    await expect(journal).toContainText(copy.journalScreen.exerciseErrorTitle)
    const retained = await page.evaluate(async () => {
      return Promise.all([['emot-id-sessions', 'sessions'], ['emot-id-chain-analysis', 'entries']].map(([name, store]) => new Promise<number>((resolve, reject) => {
        const request = indexedDB.open(name)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const read = db.transaction(store).objectStore(store).get('invalid')
          read.onsuccess = () => { db.close(); resolve(read.result.timestamp) }
          read.onerror = () => { db.close(); reject(read.error) }
        }
      })))
    })
    expect(retained).toEqual([1e20, 1e20])
    expect(errors).toEqual([])
  })

  test(`privacy dialog restores its touch opener (${language}/${theme})`, async ({ page }) => {
    await openApp(page, { language, theme })
    await page.getByRole('button', { name: language === 'ro' ? 'Setări' : 'Settings', exact: true }).click()
    await page.getByRole('button', { name: copy.privacyData.title, exact: true }).click()
    const trigger = page.getByRole('button', { name: copy.privacyData.clear, exact: true })
    // Match browsers where a pointer activation does not focus the opener.
    await trigger.evaluate((element) => element.addEventListener('mousedown', (event) => event.preventDefault()))
    for (const action of ['cancel', 'escape', 'success']) {
      await page.locator('#screen-title').focus()
      await trigger.click()
      await expect(page.getByRole('dialog')).toBeVisible()
      if (action === 'escape') await page.keyboard.press('Escape')
      else await page.getByRole('button', { name: action === 'cancel' ? copy.privacyData.cancel : copy.privacyData.confirmAction, exact: true }).click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      // Successful reset restores browser language, so retain the element by CSS.
      await expect(page.locator('[data-testid="privacy-screen"] > .danger-button')).toBeFocused()
      await expect(page.locator('[data-testid="privacy-screen"] > .danger-button')).toBeInViewport()
    }
  })
}
