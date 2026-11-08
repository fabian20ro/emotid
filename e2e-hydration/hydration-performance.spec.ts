import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { measureHistoryAction, seedHistory } from '../e2e-performance/history-browser'
import { makeHistoryFixture } from '../e2e-performance/history-fixtures'
import { summarizeMeasurements } from '../e2e-performance/history-measurements'
import { hydratedSnapshot, observeStartup, renderedStartup } from './hydration-browser'
import { summarizeHydration, type HydrationSnapshot } from './hydration-probe'
import en from '../src/i18n/en.json' with { type: 'json' }
import ro from '../src/i18n/ro.json' with { type: 'json' }

const viewport = { width: 393, height: 742 }
type Sample = {
  instrumented: boolean
  startup: Awaited<ReturnType<typeof renderedStartup>>
  hydration: ReturnType<typeof summarizeHydration> | null
  raw: HydrationSnapshot | null
  journal: Awaited<ReturnType<typeof measureHistoryAction>>
}

for (const language of ['en', 'ro'] as const) for (const theme of ['light', 'dark'] as const) for (const count of [0, 100, 1000, 5000]) {
  test(`hydration ${count} (${language}/${theme})`, async ({ browser, baseURL }, testInfo) => {
    const copy = language === 'en' ? en : ro
    const samples: Sample[] = []
    let complete = false
    const hashes = Object.fromEntries(await Promise.all(['dist', '.history-hydration-build'].map(async (root) =>
      [root, createHash('sha256').update(await readFile(`${root}/.vite/manifest.json`)).digest('hex')])))
    try {
      for (let repetition = 0; repetition < 3; repetition++) for (const instrumented of [false, true]) {
        const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, locale: 'en-US', serviceWorkers: 'block', colorScheme: theme })
        const page = await context.newPage()
        const errors: string[] = []
        page.on('pageerror', (error) => errors.push(error.message))
        try {
          await observeStartup(page, count)
          await seedHistory(page, instrumented ? baseURL! : 'http://127.0.0.1:4178/emotid/', count, language, theme)
          const raw = instrumented ? await hydratedSnapshot(page) : null
          const hydration = raw ? summarizeHydration(raw, count) : null
          const startup = await renderedStartup(page)
          expect(startup.mountedAtMs).toBeGreaterThanOrEqual(0)
          expect(startup.todayReadyAtMs).toBeGreaterThanOrEqual(startup.mountedAtMs!)
          expect(await page.evaluate(() => '__EMOTID_HYDRATION_PROBE__' in window)).toBe(instrumented)
          await expect(page.locator('html')).toHaveAttribute('lang', language)
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
          const journal = await measureHistoryAction(page,
            () => page.getByRole('button', { name: copy.navigation.journal, exact: true }).click(),
            count ? '.journal-list button' : '.journal-empty')
          await expect(page.locator('.journal-list button')).toHaveCount(Math.min(20, count))
          if (count) await expect(page.getByRole('button', { name: new RegExp(`^${copy.journalScreen.openExercises}:`) })).toBeVisible()
          samples.push({ instrumented, startup, hydration, raw, journal })
          if (repetition === 0) {
            await page.getByRole('button', { name: copy.navigation.settings, exact: true }).click()
            await page.getByRole('button', { name: copy.settingsScreen.privacy, exact: true }).click()
            const pending = page.waitForEvent('download')
            await page.getByRole('button', { name: copy.privacyData.export, exact: true }).click()
            const download = await pending
            const exported = JSON.parse(await readFile((await download.path())!, 'utf8'))
            const fixture = makeHistoryFixture(count)
            expect(exported.sessions).toEqual(fixture.sessions)
            expect(exported.chainEntries).toEqual(fixture.chainEntries)
          }
          expect(errors).toEqual([])
        } finally { await context.close() }
      }
      complete = true
    } finally {
      const summary = Object.fromEntries([false, true].map((instrumented) => {
        const rows = samples.filter((sample) => sample.instrumented === instrumented)
        return [instrumented ? 'instrumented' : 'production', {
          mountedAtMs: summarizeMeasurements(rows.flatMap((row) => row.startup.mountedAtMs === null ? [] : [row.startup.mountedAtMs])),
          todayReadyAtMs: summarizeMeasurements(rows.flatMap((row) => row.startup.todayReadyAtMs === null ? [] : [row.startup.todayReadyAtMs])),
          journalOpenMs: summarizeMeasurements(rows.map((row) => row.journal.inputToFrameMs)),
          bothHydratedAtMs: summarizeMeasurements(rows.flatMap((row) => row.hydration ? [row.hydration.bothHydratedAtMs] : [])),
          stores: Object.fromEntries((['sessions', 'exercises'] as const).map((store) => [store,
            Object.fromEntries((['repositoryMs', 'readMs', 'decodeMs', 'sortAndContinuationMs', 'schedulingBeforeDecodeMs', 'readyAtMs'] as const).map((key) =>
              [key, summarizeMeasurements(rows.flatMap((row) => row.hydration ? [row.hydration.stores[store][key]] : []))]))])),
        }]
      }))
      const body = JSON.stringify({ capturedAt: new Date().toISOString(), browser: browser.browserType().name(), browserVersion: browser.version(),
        platform: process.platform, architecture: process.arch, viewport, language, theme, recordsPerStore: count, repetitions: 3,
        complete, hashes, summary, samples,
        note: 'Native navigation-relative clock. Fresh contexts, fixture seeding excluded; HTTP routes disable cache, OS caches are not reset. Guarded read includes database open/epoch checks. Sort interval includes Promise continuation, not isolated CPU. Instrumented optimized build versus unchanged production control, sequential fixed order. Three-sample p95 is max; no timing SLA, physical-device or INP claim. Fixture key order already matches timestamp order.',
      }, null, 2)
      await writeFile(testInfo.outputPath('history-hydration.json'), body)
      await testInfo.attach('history-hydration', { body, contentType: 'application/json' })
    }
  })
}
