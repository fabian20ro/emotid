import { expect, type Page } from '@playwright/test'
import { assertLocalHistoryTarget, makeHistoryFixture } from './history-fixtures'

export async function seedHistory(page: Page, baseURL: string, count: number, language: 'en' | 'ro', theme: 'light' | 'dark') {
  assertLocalHistoryTarget(baseURL)
  await page.route('**/*', async (route) => {
    try { assertLocalHistoryTarget(route.request().url()) }
    catch { await route.abort(); return }
    await route.continue()
  })
  await page.goto(new URL('manifest.webmanifest', baseURL).href)
  assertLocalHistoryTarget(page.url())
  await page.evaluate(async ({ data, language, theme }) => {
    localStorage.setItem('emot-id-onboarded', 'true')
    localStorage.setItem('emot-id-language', language)
    localStorage.setItem('emot-id-theme', theme)
    localStorage.setItem('emot-id-save-sessions', 'true')
    for (const [name, store, records] of [
      ['emot-id-sessions', 'sessions', data.sessions],
      ['emot-id-chain-analysis', 'entries', data.chainEntries],
    ] as const) {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(name, 2)
        request.onupgradeneeded = () => {
          request.result.createObjectStore(store)
          request.result.createObjectStore('_lifecycle')
        }
        request.onerror = () => reject(request.error)
        request.onblocked = () => reject(new Error('Fixture database blocked'))
        request.onsuccess = () => {
          const db = request.result
          const tx = db.transaction(store, 'readwrite')
          tx.objectStore(store).clear()
          for (const record of records) tx.objectStore(store).put(record, record.id)
          tx.oncomplete = () => { db.close(); resolve() }
          tx.onabort = () => { db.close(); reject(tx.error) }
        }
      })
    }
  }, { data: makeHistoryFixture(count), language, theme })
  await page.goto(baseURL)
  await expect(page.getByTestId('today-screen')).toBeVisible()
}

export async function measureHistoryAction(page: Page, action: () => Promise<unknown>, readySelector: string, event: 'click' | 'input' = 'click') {
  await page.evaluate(({ readySelector, event }) => {
    const state = { started: 0, duration: null as number | null }
    ;(window as typeof window & { __historyMeasurement?: typeof state }).__historyMeasurement = state
    let scheduled = false
    const ready = () => {
      if (!state.started || scheduled || !document.querySelector(readySelector)) return
      scheduled = true
      observer.disconnect()
      requestAnimationFrame(() => requestAnimationFrame(() => { state.duration = performance.now() - state.started }))
    }
    const observer = new MutationObserver(ready)
    observer.observe(document.body, { subtree: true, childList: true })
    document.addEventListener(event, () => { state.started = performance.now(); ready() }, { capture: true, once: true })
  }, { readySelector, event })
  await action()
  await page.waitForFunction(() => (window as typeof window & { __historyMeasurement?: { duration: number | null } }).__historyMeasurement?.duration != null)
  return page.evaluate(() => ({
    inputToFrameMs: (window as typeof window & { __historyMeasurement: { duration: number } }).__historyMeasurement.duration,
    domNodes: document.querySelectorAll('*').length,
    heapBytes: (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? null,
  }))
}
