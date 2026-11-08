import { expect, type BrowserContext, type Page } from '@playwright/test'

export async function waitForServiceWorkerControl(page: Page) {
  await expect.poll(() => page.evaluate(async () => ({
    active: (await navigator.serviceWorker.getRegistration('/emotid/'))?.active?.state,
    controlled: navigator.serviceWorker.controller !== null,
  })), { timeout: 15_000 }).toEqual({ active: 'activated', controlled: true })
}

// An out-of-scope page can observe activation without keeping the app's old worker alive.
export async function observeWaitingUpdate(context: BrowserContext) {
  const observer = await context.newPage()
  await observer.goto('/__pwa-test/version')
  await observer.evaluate(async () => {
    if (navigator.serviceWorker.controller) throw new Error('Update observer must be uncontrolled')
    const worker = (await navigator.serviceWorker.getRegistration('/emotid/'))?.waiting
    if (worker?.state !== 'installed') throw new Error('Update must be completely installed before observing it')
    Object.assign(window, { pendingUpdate: worker })
  })
  return observer
}

export async function waitForObservedActivation(observer: Page) {
  await observer.waitForFunction(() => (window as typeof window & { pendingUpdate: ServiceWorker }).pendingUpdate.state === 'activated')
  await observer.close()
}
