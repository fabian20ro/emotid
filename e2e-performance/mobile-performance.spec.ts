import { writeFile } from 'node:fs/promises'
import { expect, test, type Page, type TestInfo } from '@playwright/test'

interface BrowserMetrics {
  durationMs: number
  transferBytes: number
  decodedBytes: number
  longTasks: Array<{ startTime: number; duration: number }>
  resources: string[]
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
      resources: relevant.map((entry) => new URL(entry.name).pathname),
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
  if (route === 'plutchik') {
    await page.getByRole('button', { name: 'Explore', exact: true }).click()
    await expect(page.getByTestId('explore-screen')).toBeVisible()
  } else {
    await page.getByRole('button', { name: /start a check-in/i }).click()
    await expect(page.getByTestId('arrival-screen')).toBeVisible()
  }
  const start = await page.evaluate(() => performance.now())
  await page.getByTestId(`${route === 'plutchik' ? 'explore' : 'arrival'}-${route}`).click()
  await expect(page.getByTestId(`${route}-screen`)).toBeVisible()
  return snapshot(page, start)
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
