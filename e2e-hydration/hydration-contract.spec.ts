import { expect, test } from '@playwright/test'
import { readFile, readdir } from 'node:fs/promises'
import { seedHistory } from '../e2e-performance/history-browser'
import { hydratedSnapshot, observeStartup, renderedStartup } from './hydration-browser'
import { summarizeHydration, type HistoryStore } from './hydration-probe'
import en from '../src/i18n/en.json' with { type: 'json' }

for (const store of ['sessions', 'exercises'] as const) {
  test(`a mounted Today is not full hydration while ${store} is held`, async ({ page, baseURL }) => {
    await page.addInitScript((hold) => { window.__hydrationControl = { hold } }, store)
    await observeStartup(page, 100)
    await seedHistory(page, baseURL!, 100, 'en', 'light')
    const other = store === 'sessions' ? 'exercises' : 'sessions'
    await expect.poll(() => page.evaluate<number | undefined, HistoryStore>((name) => window.__EMOTID_HYDRATION_PROBE__.snapshot.commits[name]?.count, other)).toBe(100)
    const pending = await page.evaluate(() => window.__EMOTID_HYDRATION_PROBE__.snapshot)
    expect(pending.commits[store]).toBeUndefined()
    expect(() => summarizeHydration(pending, 100)).toThrow()
    if (store === 'exercises') await renderedStartup(page)
    else await expect(page.getByRole('status')).toContainText(en.journalScreen.loading)
    await page.evaluate(() => window.__hydrationControl!.release!())
    const result = summarizeHydration(await hydratedSnapshot(page), 100)
    expect(result.stores[store].count).toBe(100)
    await renderedStartup(page)
  })

  test(`a failed ${store} read cannot produce successful hydration evidence`, async ({ page, baseURL }) => {
    await page.addInitScript((fail) => { window.__hydrationControl = { fail } }, store)
    await seedHistory(page, baseURL!, 100, 'en', 'light')
    const snapshot = await hydratedSnapshot(page)
    expect(snapshot.commits[store]).toMatchObject({ error: true, count: 0 })
    expect(() => summarizeHydration(snapshot, 100)).toThrow()
    await page.getByRole('button', { name: en.navigation.journal, exact: true }).click()
    await expect(page.getByRole('alert')).toContainText(store === 'sessions' ? en.journalScreen.errorTitle : en.journalScreen.exerciseErrorTitle)
  })
}

test('ordinary production files and browser runtime contain no hydration probe', async ({ page }) => {
  for (const file of await readdir('dist/assets')) if (file.endsWith('.js')) {
    expect(await readFile(`dist/assets/${file}`, 'utf8')).not.toContain('__EMOTID_HYDRATION_PROBE__')
  }
  await seedHistory(page, 'http://127.0.0.1:4178/emotid/', 100, 'en', 'light')
  expect(await page.evaluate(() => '__EMOTID_HYDRATION_PROBE__' in window)).toBe(false)
  await page.getByRole('button', { name: en.navigation.journal, exact: true }).click()
  await expect(page.locator('.journal-list button')).toHaveCount(20)
})
