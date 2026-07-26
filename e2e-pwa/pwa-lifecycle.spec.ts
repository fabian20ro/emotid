import { expect, test, type Page } from '@playwright/test'

async function waitForServiceWorkerControl(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (navigator.serviceWorker.controller) return
    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true })
    })
  })
}

test('offline reopen and automatic update preserve local reflections', async ({ context, page, request }) => {
  const externalRequests: string[] = []
  context.on('request', (browserRequest) => {
    const url = new URL(browserRequest.url())
    if (url.origin !== 'http://127.0.0.1:4174') externalRequests.push(browserRequest.url())
  })

  await page.addInitScript(() => {
    localStorage.setItem('emot-id-onboarded', 'true')
    localStorage.setItem('emot-id-language', 'en')
    localStorage.setItem('emot-id-save-sessions', 'true')
  })
  await page.goto('/emot-id/')
  await expect(page.getByTestId('today-screen')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-app-version', 'v1')

  const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(manifestUrl).toBeTruthy()
  const manifest = await page.evaluate(async (url) => fetch(url!).then((response) => response.json()), manifestUrl)
  expect(manifest).toMatchObject({
    display: 'standalone',
    scope: '/emot-id/',
    start_url: '/emot-id/',
  })

  await waitForServiceWorkerControl(page)
  await page.getByTestId('quick-feeling-anxiety').click()
  await page.getByRole('button', { name: 'Done for now' }).click()
  await expect(page.getByTestId('reflection-close-screen')).toContainText('Saved privately on this device')
  await page.getByRole('button', { name: 'Return to Today' }).click()

  const cachedPaths = await page.evaluate(async () => {
    const paths: string[] = []
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName)
      paths.push(...(await cache.keys()).map((entry) => new URL(entry.url).pathname))
    }
    return paths
  })
  expect(cachedPaths).toContain('/emot-id/index.html')
  expect(cachedPaths.some((path) => path.includes('/assets/PlutchikWheel-'))).toBe(true)
  expect(cachedPaths.some((path) => path.includes('/assets/DimensionalField-'))).toBe(true)

  await context.setOffline(true)
  await page.close()
  const offlinePage = await context.newPage()
  await offlinePage.goto('http://127.0.0.1:4174/emot-id/')
  await expect(offlinePage.getByTestId('today-screen')).toBeVisible()
  await expect(offlinePage.getByRole('status')).toContainText(/offline/i)

  await offlinePage.getByRole('button', { name: 'Journal', exact: true }).click()
  await expect(offlinePage.locator('.journal-list button')).toHaveCount(1)
  await offlinePage.getByRole('button', { name: 'Explore', exact: true }).click()
  await offlinePage.getByTestId('explore-plutchik').click()
  await expect(offlinePage.getByTestId('plutchik-screen')).toBeVisible()

  await context.setOffline(false)
  const controllerChanged = offlinePage.evaluate(() => new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Service worker update did not activate')), 15_000)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.clearTimeout(timeout)
      resolve()
    }, { once: true })
  }))
  await request.post('http://127.0.0.1:4174/__pwa-test/version')
  await offlinePage.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration('/emot-id/')
    if (!registration) throw new Error('Missing service worker registration')
    await registration.update()
  })
  await controllerChanged
  await offlinePage.reload()
  await expect(offlinePage.locator('html')).toHaveAttribute('data-app-version', 'v2')
  await offlinePage.getByRole('button', { name: 'Journal', exact: true }).click()
  await expect(offlinePage.locator('.journal-list button')).toHaveCount(1)
  expect(externalRequests).toEqual([])
})
