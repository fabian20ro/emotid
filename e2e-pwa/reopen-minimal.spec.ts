import { readFile, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { observeWaitingUpdate, waitForObservedActivation, waitForServiceWorkerControl } from './lifecycle'

test('reduced application offline reopen without journal interactions', async ({ page, context, request, browser }, testInfo) => {
  test.setTimeout(45_000)
  await request.put('/__pwa-test/network?state=online')
  await request.put('/__pwa-test/version?version=v1')
  const manifest = JSON.parse(await readFile('.pwa-test-builds/v2/.vite/manifest.json', 'utf8'))
  const lazy = `/emotid/${manifest['src/screens/WordLadderScreen.tsx'].file}`
  const failures: { url: string; error?: string }[] = []
  const responses: { url: string; worker: boolean; status: number }[] = []
  context.on('requestfailed', request => failures.push({ url: request.url(), error: request.failure()?.errorText }))
  context.on('response', response => responses.push({ url: response.url(), worker: response.fromServiceWorker(), status: response.status() }))
  try {
    await page.goto('/emotid/')
    await waitForServiceWorkerControl(page)
    const updater = await context.newPage()
    await updater.goto('/emotid/')
    await waitForServiceWorkerControl(updater)
    await request.put('/__pwa-test/version?version=v2')
    await updater.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.update())
    await expect.poll(() => page.evaluate(async () =>
      (await navigator.serviceWorker.getRegistration())?.waiting?.state)).toBe('installed')
    const observer = await observeWaitingUpdate(context)
    await request.put('/__pwa-test/network?state=offline')
    await updater.close()
    await page.close()
    await waitForObservedActivation(observer)
    const reopened = await context.newPage()
    await reopened.goto('/emotid/')
    await waitForServiceWorkerControl(reopened)
    await expect(reopened.locator('html')).toHaveAttribute('data-app-version', 'v2')
    expect(await reopened.evaluate(async url => typeof (await import(/* @vite-ignore */ url)).WordLadderScreen, lazy)).toBe('function')
    expect(responses.some(response => new URL(response.url).pathname === lazy && response.worker && response.status === 200)).toBe(true)
  } finally {
    await request.put('/__pwa-test/network?state=online')
    const evidence = testInfo.outputPath('reduced-reopen.json')
    await writeFile(evidence, JSON.stringify({ browser: browser.version(), failures, responses }, null, 2))
    await testInfo.attach('reduced-reopen', { path: evidence, contentType: 'application/json' })
  }
})
