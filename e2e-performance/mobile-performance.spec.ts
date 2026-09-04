import { writeFile } from 'node:fs/promises'
import { expect, test, type Page, type TestInfo } from '@playwright/test'

interface BrowserMetrics {
  activationMs?: number
  durationMs: number
  transferBytes: number
  decodedBytes: number
  longTasks: Array<{ startTime: number; duration: number }>
  resources: Array<{
    path: string
    startTime: number
    duration: number
    transferBytes: number
    decodedBytes: number
  }>
}

async function prepare(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('emot-id-onboarded', 'true')
    localStorage.setItem('emot-id-language', 'en')
    localStorage.setItem('emot-id-save-sessions', 'false')
    const metricsWindow = window as typeof window & {
      __emotIdLongTasks?: Array<{ startTime: number; duration: number }>
    }
    metricsWindow.__emotIdLongTasks = []
    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver((list) => {
          metricsWindow.__emotIdLongTasks?.push(
            ...list.getEntries().map((entry) => ({
              startTime: entry.startTime,
              duration: entry.duration,
            })),
          )
        }).observe({ type: 'longtask', buffered: true })
      } catch {
        // Long-task entries are not exposed by every browser runtime.
      }
    }
  })
}

async function snapshot(page: Page, startTime: number): Promise<BrowserMetrics> {
  return page.evaluate((start) => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const relevant = resources.filter((entry) => entry.startTime >= start)
    const metricsWindow = window as typeof window & {
      __emotIdLongTasks?: Array<{ startTime: number; duration: number }>
    }
    return {
      durationMs: performance.now() - start,
      transferBytes: relevant.reduce((total, entry) => total + entry.transferSize, 0),
      decodedBytes: relevant.reduce((total, entry) => total + entry.decodedBodySize, 0),
      longTasks: (metricsWindow.__emotIdLongTasks ?? []).filter((entry) => entry.startTime >= start),
      resources: relevant.map((entry) => ({
        path: new URL(entry.name).pathname,
        startTime: entry.startTime,
        duration: entry.duration,
        transferBytes: entry.transferSize,
        decodedBytes: entry.decodedBodySize,
      })),
    }
  }, startTime)
}

async function measureRoute(
  page: Page,
  route: 'body' | 'affect' | 'words' | 'plutchik',
): Promise<BrowserMetrics> {
  const session = await page.context().newCDPSession(page)
  await session.send('Network.clearBrowserCache')
  await session.detach()
  await page.goto('/')
  await expect(page.getByTestId('today-screen')).toBeVisible()
  let routeTrigger = page.getByRole('button', { name: 'Place the feeling', exact: true })
  if (route === 'plutchik') {
    await page.getByRole('button', { name: 'Explore', exact: true }).click()
    await expect(page.getByTestId('explore-screen')).toBeVisible()
    routeTrigger = page.getByTestId('explore-plutchik')
  } else if (route !== 'affect') {
    await page.getByRole('button', { name: 'Help me choose', exact: true }).click()
    await expect(page.getByTestId('arrival-screen')).toBeVisible()
    await page.locator('.guide-all-routes').click()
    routeTrigger = page.getByTestId(`arrival-${route}`)
  }
  await routeTrigger.click({ trial: true })
  await page.evaluate((testId) => {
    const metricsWindow = window as typeof window & { __emotIdRouteReadyAt?: number }
    delete metricsWindow.__emotIdRouteReadyAt
    const observer = new MutationObserver(() => {
      if (!document.querySelector(`[data-testid="${testId}"]`)) return
      metricsWindow.__emotIdRouteReadyAt = performance.now()
      observer.disconnect()
    })
    observer.observe(document.body, { childList: true, subtree: true })
  }, `${route}-screen`)
  const start = await page.evaluate(() => performance.now())
  await routeTrigger.click()
  const activated = await page.evaluate(() => performance.now())
  await expect(page.getByTestId(`${route}-screen`)).toBeVisible()
  const ready = await page.evaluate(() => (
    window as typeof window & { __emotIdRouteReadyAt?: number }
  ).__emotIdRouteReadyAt)
  const metrics = await snapshot(page, start)
  return {
    ...metrics,
    activationMs: activated - start,
    durationMs: ready === undefined ? metrics.durationMs : ready - start,
  }
}

async function attachSummary(testInfo: TestInfo, summary: unknown) {
  const body = JSON.stringify(summary, null, 2)
  const outputPath = testInfo.outputPath('performance-summary.json')
  await writeFile(outputPath, body)
  await testInfo.attach('performance-summary', {
    body,
    contentType: 'application/json',
  })
}

test('records production startup and first feature-open behavior', async ({ page }, testInfo) => {
  await prepare(page)
  const navigationStart = 0
  await page.goto('/')
  await expect(page.getByTestId('today-screen')).toBeVisible()
  const startup = await snapshot(page, navigationStart)

  const routes = {
    body: await measureRoute(page, 'body'),
    affect: await measureRoute(page, 'affect'),
    words: await measureRoute(page, 'words'),
    plutchik: await measureRoute(page, 'plutchik'),
  }

  await attachSummary(testInfo, {
    capturedAt: new Date().toISOString(),
    environment: {
      browser: testInfo.project.name,
      viewport: testInfo.project.use.viewport,
      note: 'Diagnostic CI proxy. Physical low/mid-tier hardware remains the release measurement source.',
    },
    physicalAcceptanceTargets: {
      midTierColdUsableMs: 2500,
      lowTierColdUsableMs: 4000,
      midTierFirstRouteMs: 500,
      lowTierFirstRouteMs: 900,
      warmRouteMs: 150,
      maximumInteractionBlockingTaskMs: 200,
    },
    startup,
    routes,
  })
})
