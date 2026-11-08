import { expect, type Page } from '@playwright/test'
import type {} from './hydration-runtime'

declare global {
  interface Window {
    __hydrationDom: { mountedAtMs: number | null; todayReadyAtMs: number | null }
  }
}

export async function observeStartup(page: Page, count: number) {
  await page.addInitScript(({ count }) => {
    const state = { mountedAtMs: null as number | null, todayReadyAtMs: null as number | null }
    window.__hydrationDom = state
    let scheduled = false
    const ready = () => {
      const recent = document.querySelector('.recent-thread')
      return recent && !recent.querySelector('[role="status"]')
        && (count === 0 || recent.querySelector('.recent-thread-main strong'))
    }
    const observe = () => {
      if (state.mountedAtMs === null && document.querySelector('[data-testid="today-screen"]')) state.mountedAtMs = performance.now()
      if (scheduled || !ready()) return
      scheduled = true
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!ready()) { scheduled = false; observe(); return }
        state.todayReadyAtMs = performance.now()
        observer.disconnect()
      }))
    }
    const observer = new MutationObserver(observe)
    observer.observe(document, { subtree: true, childList: true, characterData: true })
  }, { count })
}

export async function hydratedSnapshot(page: Page) {
  await expect.poll(() => page.evaluate(() => Object.keys(window.__EMOTID_HYDRATION_PROBE__.snapshot.commits).length)).toBe(2)
  return page.evaluate(() => window.__EMOTID_HYDRATION_PROBE__.snapshot)
}

export async function renderedStartup(page: Page) {
  await page.waitForFunction(() => window.__hydrationDom.todayReadyAtMs !== null)
  return page.evaluate(() => ({ ...window.__hydrationDom, domNodes: document.querySelectorAll('*').length,
    heapBytes: (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? null }))
}
