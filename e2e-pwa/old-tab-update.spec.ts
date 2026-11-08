import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { observeWaitingUpdate, waitForObservedActivation, waitForServiceWorkerControl } from './lifecycle'
import en from '../src/i18n/en.json' with { type: 'json' }
import ro from '../src/i18n/ro.json' with { type: 'json' }

async function lazyBuild(version: 'v1' | 'v2') {
  const root = `.pwa-test-builds/${version}`
  const manifest = JSON.parse(await readFile(`${root}/.vite/manifest.json`, 'utf8'))
  const entry = manifest['src/screens/WordLadderScreen.tsx']
  expect(entry.isDynamicEntry).toBe(true)
  const bytes = await readFile(`${root}/${entry.file}`)
  return { path: `/emotid/${entry.file}`, sha256: createHash('sha256').update(bytes).digest('hex') }
}

async function lifecycle(page: Page) {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration('/emotid/')
    return {
      version: document.documentElement.dataset.appVersion,
      controllerChanges: (window as typeof window & { oldTabProbe?: { controllerChanges: number } }).oldTabProbe?.controllerChanges,
      active: registration?.active?.state ?? null,
      waiting: registration?.waiting?.state ?? null,
      caches: await Promise.all((await caches.keys()).map(async (name) => ({ name,
        paths: (await (await caches.open(name)).keys()).map((entry) => new URL(entry.url).pathname),
      }))),
    }
  })
}

async function exportData(page: Page, copy: typeof en) {
  await page.getByRole('button', { name: copy.navigation.settings, exact: true }).click()
  await page.getByRole('button', { name: copy.settingsScreen.privacy, exact: true }).click()
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: copy.privacyData.export, exact: true }).click()
  const download = await pending
  return JSON.parse(await readFile((await download.path())!, 'utf8'))
}

test.beforeEach(async ({ request }) => {
  expect((await request.put('/__pwa-test/network?state=online')).ok()).toBe(true)
  expect((await request.put('/__pwa-test/version?version=v1')).ok()).toBe(true)
})

test.afterEach(async ({ request }) => {
  expect((await request.put('/__pwa-test/network?state=online')).ok()).toBe(true)
})

test('origin outage rejects application requests but remains resettable', async ({ request }) => {
  expect(await (await request.get('/__pwa-test/network')).text()).toBe('online')
  for (const state of ['', 'invalid']) expect((await request.put(`/__pwa-test/network?state=${state}`)).status()).toBe(400)
  expect((await request.delete('/__pwa-test/network')).status()).toBe(405)
  expect((await request.get('/emotid/')).status()).toBe(200)
  expect(await (await request.put('/__pwa-test/network?state=offline')).text()).toBe('offline')
  await expect(request.get('/emotid/', { maxRetries: 0 })).rejects.toThrow()
  await expect(request.get('/emotid/sw.js', { maxRetries: 0 })).rejects.toThrow()
  expect((await request.put('/__pwa-test/version?version=v2')).ok()).toBe(true)
  await request.put('/__pwa-test/network?state=online')
  expect((await request.get('/emotid/')).status()).toBe(200)
})

test('fixture replaces real lazy chunk bytes and stops serving retired assets', async ({ request }) => {
  const first = await lazyBuild('v1')
  const next = await lazyBuild('v2')
  expect(first.path).not.toBe(next.path)
  expect(first.sha256).not.toBe(next.sha256)
  expect((await request.get(first.path)).status()).toBe(200)
  await request.put('/__pwa-test/version?version=v2')
  expect((await request.get(next.path)).status()).toBe(200)
  expect((await request.get(first.path)).status()).toBe(404)
})

for (const language of ['en', 'ro'] as const) for (const theme of ['light', 'dark'] as const) for (const offline of [false, true]) {
  test(`old tab preserves lazy routes and draft (${language}/${theme}/${offline ? 'origin-offline' : 'online'})`, async ({ page, context, request, browser }, testInfo) => {
    test.setTimeout(90_000)
    const copy = language === 'en' ? en : ro
    const first = await lazyBuild('v1')
    const next = await lazyBuild('v2')
    expect(first.path).not.toBe(next.path)
    expect(first.sha256).not.toBe(next.sha256)
    const errors: string[] = []
    const externalRequests: string[] = []
    const responses: { tab: string; path: string; status: number; fromWorker: boolean }[] = []
    const states: { phase: string; state: Awaited<ReturnType<typeof lifecycle>> }[] = []
    const watch = (target: Page, tab: string) => {
      target.on('pageerror', (error) => errors.push(`${tab}: ${error.message}`))
      target.on('console', (message) => { if (message.type() === 'error') errors.push(`${tab}: ${message.text()}`) })
      target.on('response', (response) => responses.push({ tab, path: new URL(response.url()).pathname, status: response.status(), fromWorker: response.fromServiceWorker() }))
    }
    context.on('request', (request) => {
      if (new URL(request.url()).origin !== 'http://127.0.0.1:4174') externalRequests.push(request.url())
    })
    watch(page, 'old')
    await page.goto('/__pwa-test/version')
    await page.evaluate(({ language, theme }) => {
      localStorage.setItem('emot-id-onboarded', 'true')
      localStorage.setItem('emot-id-language', language)
      localStorage.setItem('emot-id-theme', theme)
      localStorage.setItem('emot-id-save-sessions', 'true')
    }, { language, theme })
    await page.goto('/emotid/')
    await waitForServiceWorkerControl(page)
    await expect(page.locator('html')).toHaveAttribute('data-app-version', 'v1')
    await page.getByTestId('quick-feeling-anxiety').click()
    await page.getByTestId('quick-continue').click()
    await page.getByRole('button', { name: copy.reflectionScreen.done, exact: true }).click()
    await page.getByRole('button', { name: copy.navigation.explore, exact: true }).click()
    await expect(page.getByTestId('explore-screen')).toBeVisible()
    await page.getByRole('button', { name: copy.navigation.journal, exact: true }).click()
    await expect(page.locator('.journal-list button')).toHaveCount(1)
    await page.getByRole('button', { name: copy.journalScreen.unpack, exact: true }).click()
    const draft = 'Synthetic draft survives an update'
    await page.getByLabel(copy.chainAnalysis.situation, { exact: true }).fill(draft)
    expect(responses.some((response) => response.tab === 'old' && response.path === first.path)).toBe(false)
    await page.evaluate(() => {
      const probe = { controllerChanges: 0 }
      Object.assign(window, { oldTabProbe: probe })
      navigator.serviceWorker.addEventListener('controllerchange', () => { probe.controllerChanges++ })
    })
    const other = await context.newPage()
    watch(other, 'updater')
    await other.goto('/emotid/')
    await waitForServiceWorkerControl(other)
    await expect(other.locator('html')).toHaveAttribute('data-app-version', 'v1')
    const before = await exportData(other, copy)
    expect(before.sessions).toHaveLength(1)
    expect(before.chainEntries).toHaveLength(0)
    await request.put('/__pwa-test/version?version=v2')
    await other.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update() })

    try {
      await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.waiting?.state)).toBe('installed')
      const observer = await observeWaitingUpdate(context)
      states.push({ phase: 'update-installed', state: await lifecycle(page) })
      await expect(page.locator('html')).toHaveAttribute('data-app-version', 'v1')
      await expect(page.locator('html')).toHaveAttribute('lang', language)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await expect(page.getByLabel(copy.chainAnalysis.situation, { exact: true })).toHaveValue(draft)
      if (offline) {
        expect((await request.put('/__pwa-test/network?state=offline')).ok()).toBe(true)
        expect(await observer.evaluate(async () => {
          try { await fetch('/__pwa-test/network-probe', { cache: 'no-store' }); return false }
          catch { return true }
        })).toBe(true)
      }
      await page.getByRole('button', { name: copy.navigation.back, exact: true }).click()
      await page.getByRole('button', { name: copy.navigation.explore, exact: true }).click()
      await page.getByTestId('explore-words').click()
      await expect(page.getByTestId('words-screen')).toBeVisible()
      expect(responses.some((response) => response.tab === 'old' && response.path === first.path && response.status === 200 && response.fromWorker)).toBe(true)
      await page.getByRole('button', { name: copy.navigation.back, exact: true }).click()
      await page.getByRole('button', { name: copy.navigation.journal, exact: true }).click()
      await page.getByRole('button', { name: copy.journalScreen.unpack, exact: true }).click()
      await expect(page.getByLabel(copy.chainAnalysis.situation, { exact: true })).toHaveValue(draft)
      await other.close()
      await page.getByLabel(copy.chainAnalysis.noticed, { exact: true }).fill('Still editable with one tab open')
      const retained = await lifecycle(page)
      states.push({ phase: 'last-app-tab', state: retained })
      expect(retained).toMatchObject({ version: 'v1', controllerChanges: 0, active: 'activated', waiting: 'installed' })
      expect(retained.caches.flatMap((cache) => cache.paths)).toEqual(expect.arrayContaining([first.path, next.path]))
      await page.getByRole('button', { name: copy.chainAnalysis.save, exact: true }).click()
      await page.getByRole('button', { name: copy.chainAnalysis.done, exact: true }).click()
      await page.close()
      await waitForObservedActivation(observer)

      const reopened = await context.newPage()
      watch(reopened, 'updated')
      await reopened.goto('/emotid/')
      await waitForServiceWorkerControl(reopened)
      await expect(reopened.locator('html')).toHaveAttribute('data-app-version', 'v2')
      await expect(reopened.locator('html')).toHaveAttribute('lang', language)
      await expect(reopened.locator('html')).toHaveAttribute('data-theme', theme)
      await reopened.getByRole('button', { name: copy.navigation.explore, exact: true }).click()
      await reopened.getByTestId('explore-words').click()
      await expect(reopened.getByTestId('words-screen')).toBeVisible()
      expect(responses.some((response) => response.tab === 'updated' && response.path === next.path && response.status === 200 && response.fromWorker)).toBe(true)
      await reopened.getByRole('button', { name: copy.navigation.back, exact: true }).click()
      const exported = await exportData(reopened, copy)
      expect(exported.sessions).toEqual(before.sessions)
      expect(exported.preferences).toEqual(before.preferences)
      expect(exported.chainEntries).toHaveLength(1)
      expect(exported.chainEntries[0]).toMatchObject({ version: 2, situation: draft, noticed: 'Still editable with one tab open' })
      const activated = await lifecycle(reopened)
      states.push({ phase: 'updated-reopened', state: activated })
      expect(activated.waiting).toBeNull()
      expect(activated.caches.flatMap((cache) => cache.paths)).not.toContain(first.path)
      expect(errors).toEqual([])
      expect(externalRequests).toEqual([])
    } finally {
      if (!page.isClosed()) states.push({ phase: 'final-old-tab', state: await lifecycle(page) })
      const evidence = testInfo.outputPath('old-tab-update.json')
      await writeFile(evidence, JSON.stringify({ browser: browser.browserType().name(), browserVersion: browser.version(),
        language, theme, network: offline ? 'origin-socket-outage' : 'online', first, next, states, errors, externalRequests, responses }, null, 2))
      await testInfo.attach('old-tab-update', { path: evidence, contentType: 'application/json' })
    }
  })
}
