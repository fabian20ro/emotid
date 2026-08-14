import { expect, test, type Page } from '@playwright/test'

type BrowserFailure = {
  kind: 'console' | 'page' | 'request' | 'response'
  detail: string
  url?: string
}

async function waitForActiveServiceWorker(page: Page) {
  return page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('Service workers are unavailable')
    const withTimeout = <T>(promise: Promise<T>, message: string) => Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error(message)), 15_000)
      }),
    ])
    const registration = await withTimeout(
      navigator.serviceWorker.ready,
      'Service worker did not become ready',
    )
    const worker = registration.active
    if (!worker) throw new Error('Service worker registration has no active worker')
    if (worker.state !== 'activated') {
      await withTimeout(new Promise<void>((resolve) => {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'activated') resolve()
        })
      }), 'Service worker did not finish activating')
    }
    return {
      scope: registration.scope,
      scriptURL: worker.scriptURL,
      state: worker.state,
    }
  })
}

test('serves a usable deployed PWA from the published Pages URL', async ({ page, request }, testInfo) => {
  const failures: BrowserFailure[] = []
  const requestedUrls: string[] = []
  page.on('request', (browserRequest) => requestedUrls.push(browserRequest.url()))
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push({ kind: 'console', detail: message.text() })
  })
  page.on('pageerror', (error) => failures.push({ kind: 'page', detail: error.message }))
  page.on('requestfailed', (failedRequest) => failures.push({
    kind: 'request',
    detail: failedRequest.failure()?.errorText ?? 'unknown request failure',
    url: failedRequest.url(),
  }))
  page.on('response', (response) => {
    if (response.status() >= 400) {
      failures.push({ kind: 'response', detail: String(response.status()), url: response.url() })
    }
  })

  await page.addInitScript(() => {
    localStorage.setItem('emot-id-onboarded', 'true')
    localStorage.setItem('emot-id-language', 'en')
    localStorage.setItem('emot-id-theme', 'light')
  })

  const revision = process.env.DEPLOYED_REVISION ?? `local-${Date.now()}`
  await page.goto(`?deployed-smoke=${encodeURIComponent(revision)}`, { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('today-screen')).toBeVisible()

  const deployedOrigin = new URL(page.url()).origin
  const documentResources = await page.locator([
    'script[src]',
    'link[rel="stylesheet"][href]',
    'link[rel="manifest"][href]',
    'link[rel="icon"][href]',
    'link[rel="apple-touch-icon"][href]',
  ].join(',')).evaluateAll((elements) => elements.map((element) => {
    const value = element.getAttribute('src') ?? element.getAttribute('href')
    return value ? new URL(value, document.baseURI).href : null
  }).filter((value): value is string => Boolean(value)))
  expect(documentResources.length).toBeGreaterThanOrEqual(4)

  const manifestUrl = await page.locator('link[rel="manifest"]').evaluate((link) => (
    new URL(link.getAttribute('href')!, document.baseURI).href
  ))
  const manifestResponse = await request.get(manifestUrl, {
    headers: { 'cache-control': 'no-cache' },
  })
  expect(manifestResponse.ok(), `manifest ${manifestResponse.status()} ${manifestUrl}`).toBe(true)
  const manifest = await manifestResponse.json()
  expect(manifest).toMatchObject({
    name: 'Emot-ID',
    short_name: 'Emot-ID',
    id: '/emotid/',
    scope: '/emotid/',
    start_url: '/emotid/',
    display: 'standalone',
  })

  const referencedResources = [
    ...documentResources,
    ...manifest.icons.map((icon: { src: string }) => new URL(icon.src, manifestUrl).href),
  ]
  for (const resourceUrl of new Set(referencedResources)) {
    const response = await request.get(resourceUrl, { headers: { 'cache-control': 'no-cache' } })
    expect(response.ok(), `${response.status()} ${resourceUrl}`).toBe(true)
  }

  const serviceWorker = await waitForActiveServiceWorker(page)
  expect(serviceWorker.state).toBe('activated')
  expect(new URL(serviceWorker.scope).pathname).toBe('/emotid/')
  const serviceWorkerResponse = await request.get(serviceWorker.scriptURL, {
    headers: { 'cache-control': 'no-cache' },
  })
  expect(
    serviceWorkerResponse.ok(),
    `service worker ${serviceWorkerResponse.status()} ${serviceWorker.scriptURL}`,
  ).toBe(true)

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('today-screen')).toBeVisible()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)

  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByTestId('settings-screen')).toBeVisible()
  await page.waitForLoadState('networkidle')
  const loadedPaths = await page.evaluate(() => performance.getEntriesByType('resource').map((entry) => (
    new URL(entry.name).pathname
  )))
  expect(loadedPaths.some((path) => path.includes('/assets/SettingsScreen-'))).toBe(true)

  const sameOriginFailures = failures.filter((failure) => (
    !failure.url || new URL(failure.url).origin === deployedOrigin
  ))
  expect(sameOriginFailures, `${testInfo.project.name} deployed browser failures`).toEqual([])
  const externalRequests = requestedUrls.filter((url) => new URL(url).origin !== deployedOrigin)
  expect(externalRequests, `${testInfo.project.name} unexpected outbound requests`).toEqual([])
})
