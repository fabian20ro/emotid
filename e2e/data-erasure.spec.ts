import { expect, test, type Page } from '@playwright/test'
import { completeQuick, openApp } from './helpers'
import en from '../src/i18n/en.json' with { type: 'json' }
import ro from '../src/i18n/ro.json' with { type: 'json' }
import { expectAccessibleTextContrast } from './contrast'

test.use({ serviceWorkers: 'block' })

async function clearData(page: Page) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Privacy & data', exact: true }).click()
  await page.getByRole('button', { name: 'Delete all local data', exact: true }).click()
  await page.getByRole('button', { name: 'Delete everything', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Local data was deleted')
}

async function recordCounts(page: Page) {
  return page.evaluate(async () => Promise.all([
    ['emot-id-sessions', 'sessions'], ['emot-id-chain-analysis', 'entries'],
  ].map(([name, store]) => new Promise<number>((resolve, reject) => {
    const request = indexedDB.open(name)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      const count = db.transaction(store).objectStore(store).count()
      count.onsuccess = () => { db.close(); resolve(count.result) }
      count.onerror = () => { db.close(); reject(count.error) }
    }
  }))))
}

for (const language of ['en', 'ro'] as const) for (const theme of ['light', 'dark'] as const) for (const notifications of [true, false]) {
  const copy = language === 'ro' ? ro : en
  test(`a second tab cannot restore erased reflections (${language}/${theme}, notifications=${notifications})`, async ({ page, context }, testInfo) => {
    if (!notifications) await page.addInitScript(() => {
      // Model a suspended page: no cross-tab or foreground notifications delivered.
      Object.defineProperty(window, 'BroadcastChannel', { value: undefined })
      for (const event of ['focus', 'pageshow', 'storage', 'visibilitychange']) {
        window.addEventListener(event, (e) => e.stopImmediatePropagation(), true)
      }
    })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await openApp(page, { language, theme })
    await completeQuick(page)
    await expect(page.getByText(copy.reflectionScreen.baseSaved, { exact: true })).toBeVisible()
    const other = await context.newPage()
    await openApp(other)
    await clearData(other)
    expect(await recordCounts(other)).toEqual([0, 0])
    if (!notifications) {
      await page.getByRole('button', { name: copy.reflectionScreen.yes, exact: true }).click()
    }
    expect(await recordCounts(other)).toEqual([0, 0])
    await expect(page.getByTestId('storage-invalidated')).toBeVisible()
    await expect(page.getByRole('heading', { name: copy.storageRecovery.title })).toBeFocused()
    await expectAccessibleTextContrast(page, `erasure ${language}/${theme}`)
    await expect(page.getByRole('button', { name: copy.storageRecovery.reload })).toBeInViewport()
    await page.screenshot({ path: testInfo.outputPath('storage-recovery.png') })
    await page.getByRole('button', { name: copy.settingsScreen.support, exact: true }).click()
    await expect(page.getByTestId('support-screen')).toBeVisible()
    await expect(page.getByRole('heading', { name: copy.supportScreen.title, exact: true })).toBeFocused()
    await page.getByRole('button', { name: copy.supportScreen.continue, exact: true }).click()
    await page.getByRole('button', { name: copy.storageRecovery.reload, exact: true }).click()
    await expect(page.getByTestId('today-screen')).toBeVisible()
    await completeQuick(page, 'joy')
    await expect(page.getByText(copy.reflectionScreen.baseSaved, { exact: true })).toBeVisible()
    expect(await recordCounts(other)).toEqual([1, 0])
    expect(errors).toEqual([])
  })
}

test('an exercise draft cannot be saved after another tab erases data without notifications', async ({ page, context }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'BroadcastChannel', { value: undefined })
    for (const event of ['focus', 'pageshow', 'visibilitychange']) window.addEventListener(event, (e) => e.stopImmediatePropagation(), true)
  })
  await openApp(page)
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await page.getByRole('button', { name: 'Unpack a moment', exact: true }).click()
  await page.getByLabel('What happened?', { exact: true }).fill('Draft before erasure')
  const other = await context.newPage()
  await openApp(other)
  await clearData(other)
  await page.getByRole('button', { name: 'Save reflection', exact: true }).click()
  await expect(page.getByTestId('storage-invalidated')).toBeVisible()
  expect(await recordCounts(other)).toEqual([0, 0])
})

test('partial deletion preserves failed records and preferences, then a retry succeeds', async ({ page }) => {
  await openApp(page, { theme: 'dark' })
  await completeQuick(page)
  await page.getByRole('button', { name: 'Done for now', exact: true }).click()
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await page.getByRole('button', { name: 'Unpack a moment', exact: true }).click()
  await page.getByLabel('What happened?', { exact: true }).fill('Keep on failure')
  await page.getByRole('button', { name: 'Save reflection', exact: true }).click()
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  expect(await recordCounts(page)).toEqual([1, 1])
  await page.evaluate(() => {
    const clear = IDBObjectStore.prototype.clear
    IDBObjectStore.prototype.clear = function () {
      const request = clear.call(this)
      if (this.name === 'entries') {
        this.transaction.abort()
        IDBObjectStore.prototype.clear = clear
      }
      return request
    }
  })
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Privacy & data', exact: true }).click()
  await page.getByRole('button', { name: 'Delete all local data', exact: true }).click()
  await page.getByRole('button', { name: 'Delete everything', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText(en.privacyData.clearError)
  expect(await recordCounts(page)).toEqual([0, 1])
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await expect(page.getByTestId('journal-screen')).toContainText('Keep on failure')
  await clearData(page)
  expect(await recordCounts(page)).toEqual([0, 0])
})

test('an old v1 tab blocks migration safely; closing it and reloading keeps its data', async ({ page, context }) => {
  await page.route('**/legacy-storage-fixture', (route) => route.fulfill({ contentType: 'text/html', body: '<title>Legacy storage fixture</title>' }))
  await page.goto('./legacy-storage-fixture')
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('emot-id-sessions', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('sessions').put({
      id: 'legacy', timestamp: 1, modelId: 'wheel', selections: [], results: [], crisisTier: 'none',
    }, 'legacy')
    request.onsuccess = () => {
      // Deliberately emulate the previous release, which did not close on versionchange.
      Object.assign(window, { legacyConnection: request.result })
      resolve()
    }
    request.onerror = () => reject(request.error)
  }))
  const next = await context.newPage()
  await next.addInitScript(() => {
    localStorage.setItem('emot-id-onboarded', 'true')
    localStorage.setItem('emot-id-language', 'en')
  })
  // Blocked storage may replace Today before the first paint; await recovery directly.
  await next.goto('./', { waitUntil: 'domcontentloaded' })
  await expect(next.getByRole('heading', { name: en.storageRecovery.upgradeTitle })).toBeVisible()
  await page.close()
  await next.getByRole('button', { name: en.storageRecovery.reload }).click()
  await expect(next.getByTestId('today-screen')).toBeVisible()
  expect(await recordCounts(next)).toEqual([1, 0])
})

test('a failed collection does not release the reset while the other clear is still pending', async ({ page }) => {
  await openApp(page)
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.clear
    let failed = false
    let held = false
    IDBObjectStore.prototype.clear = function () {
      const request = original.call(this)
      const tx = this.transaction
      if (this.name === 'sessions' && !failed) { failed = true; tx.abort() }
      if (this.name === 'entries' && !held) {
        held = true
        const complete = tx.oncomplete
        tx.oncomplete = (event) => {
          Object.assign(window, { releaseClear: () => complete?.call(tx, event) })
        }
      }
      // Independent databases may finish in either order.
      if (failed && held) IDBObjectStore.prototype.clear = original
      return request
    }
  })
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Privacy & data', exact: true }).click()
  await page.getByRole('button', { name: 'Delete all local data', exact: true }).click()
  await page.getByRole('button', { name: 'Delete everything', exact: true }).click()
  await expect.poll(() => page.evaluate(() => 'releaseClear' in window)).toBe(true)
  await expect(page.getByRole('button', { name: en.privacyData.deleting, exact: true })).toBeDisabled()
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveCount(0)
  await page.evaluate(() => (window as unknown as { releaseClear: () => void }).releaseClear())
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText(en.privacyData.clearError)
  await page.getByRole('button', { name: 'Delete everything', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Local data was deleted')
})
