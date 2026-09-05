import { expect, test, type Route } from '@playwright/test'
import { completeQuick, finishReflection, openApp } from './helpers'
import { expectAccessibleTextContrast } from './contrast'

test.use({ serviceWorkers: 'block' })

for (const language of ['en', 'ro'] as const) for (const theme of ['light', 'dark'] as const) {
  test(`recent summary is deferred and isolated from Quick (${language}/${theme})`, async ({ page: initialPage, browser }, testInfo) => {
    let page = initialPage
    const ro = language === 'ro'
    const summaryChunk = /\/session-presentation(?:-[^/]+\.js|\.ts)(?:\?|$)/
    const requested: string[] = []
    page.on('request', (request) => requested.push(request.url()))
    await openApp(page, { language, theme })
    await page.waitForLoadState('networkidle')
    expect(requested.some((url) => summaryChunk.test(url))).toBe(false)
    await completeQuick(page)
    await finishReflection(page)
    await expect(page.locator('.recent-thread strong')).toContainText(ro ? 'anxietate' : 'anxiety')
    const storageState = await page.context().storageState({ indexedDB: true })
    const url = page.url()
    const options = { storageState, serviceWorkers: 'block' as const, viewport: { width: 393, height: 742 }, isMobile: true, hasTouch: true }
    const delayedContext = await browser.newContext(options)
    page = await delayedContext.newPage()

    let release!: () => void
    const held = new Promise<void>((resolve) => { release = resolve })
    let summaryRequested = false
    const delay = async (route: Route) => {
      summaryRequested = true
      await held
      await route.continue()
    }
    await page.route(summaryChunk, delay)
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await expect.poll(() => summaryRequested).toBe(true)
      await expect(page.locator('.recent-thread [role="status"]')).toHaveText(ro ? 'Se încarcă ultima ta reflecție…' : 'Loading your latest reflection…')
      await page.getByTestId('quick-feeling-joy').click()
      await expect(page.getByTestId('quick-continue')).toBeEnabled()
      release()
      await expect(page.locator('.recent-thread strong')).toContainText(ro ? 'anxietate' : 'anxiety')
      await expect(page.getByTestId('quick-feeling-joy')).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('h1')).toHaveCount(1)
      await expectAccessibleTextContrast(page, `recent thread ${language}/${theme}`)
      await page.locator('.recent-thread').scrollIntoViewIfNeeded()
      await page.screenshot({ path: testInfo.outputPath('recent-loaded.png') })
    } finally {
      release()
      await page.unroute(summaryChunk, delay)
      await delayedContext.close()
    }

    const failedContext = await browser.newContext(options)
    page = await failedContext.newPage()
    try {
      await page.route(summaryChunk, (route) => route.fulfill({
        status: 503, contentType: 'text/plain', body: 'Unavailable', headers: { 'Cache-Control': 'no-store' },
      }))
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('.recent-thread [role="status"]')).toHaveText(ro
        ? 'Rezumatul nu s-a putut încărca. Redeschide aplicația pentru a reîncerca. Reflecțiile salvate nu sunt modificate.'
        : 'The summary could not load. Reopen the app to try again. Your saved reflections are unchanged.')
      await page.getByTestId('quick-feeling-joy').click()
      await expect(page.getByTestId('quick-continue')).toBeEnabled()
      await page.setViewportSize({ width: 320, height: 568 })
      expect(await page.locator('.app-content').evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
      await expectAccessibleTextContrast(page, `recent thread failure ${language}/${theme}`)
      await page.locator('.recent-thread').scrollIntoViewIfNeeded()
      await page.screenshot({ path: testInfo.outputPath('recent-failed.png') })
      await page.unroute(summaryChunk)
      await page.close()
      page = await failedContext.newPage()
      await page.goto(url)
      await expect(page.locator('.recent-thread strong')).toContainText(ro ? 'anxietate' : 'anxiety')
    } finally {
      await failedContext.close()
    }
  })
}
