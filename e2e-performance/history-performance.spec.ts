import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import { measureHistoryAction, seedHistory } from './history-browser'
import { summarizeMeasurements } from './history-measurements'
import en from '../src/i18n/en.json' with { type: 'json' }
import ro from '../src/i18n/ro.json' with { type: 'json' }

const viewport = { width: 393, height: 742 }
type Measurement = Awaited<ReturnType<typeof measureHistoryAction>>

for (const language of ['en', 'ro'] as const) for (const theme of ['light', 'dark'] as const) for (const count of [100, 1000, 5000]) {
  test(`history ${count} (${language}/${theme})`, async ({ browser, baseURL }, testInfo) => {
    test.setTimeout(120_000)
    const copy = language === 'en' ? en : ro
    const samples: { journal: Measurement; entries: Measurement; form: Measurement; typing: Measurement[] }[] = []
    for (let repetition = 0; repetition < 3; repetition++) {
      const context = await browser.newContext({ viewport, isMobile: true, hasTouch: true, serviceWorkers: 'block', colorScheme: theme })
      const page = await context.newPage()
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      try {
        await seedHistory(page, baseURL!, count, language, theme)
        const journal = await measureHistoryAction(page,
          () => page.getByRole('button', { name: copy.navigation.journal, exact: true }).click(), '.journal-list button')
        const entries = await measureHistoryAction(page,
          () => page.getByRole('button', { name: new RegExp(`^${copy.journalScreen.openExercises}:`) }).click(), '.guided-recent-list button')
        const form = await measureHistoryAction(page,
          () => page.getByRole('button', { name: copy.chainAnalysis.newEntry, exact: true }).click(), '#chain-situation')
        const field = page.getByLabel(copy.chainAnalysis.situation, { exact: true })
        await field.click()
        const typing = []
        for (const letter of ['a', 'b', 'c']) typing.push(await measureHistoryAction(page,
          () => page.keyboard.insertText(letter), '#chain-situation', 'input'))
        await expect(field).toHaveValue('abc')
        expect(errors).toEqual([])
        samples.push({ journal, entries, form, typing })
      } finally { await context.close() }
    }
    const summary = Object.fromEntries((['journal', 'entries', 'form', 'typing'] as const).map((phase) => {
      const rows = samples.flatMap((sample) => phase === 'typing' ? sample.typing : [sample[phase]])
      return [phase, {
        inputToFrameMs: summarizeMeasurements(rows.map((row) => row.inputToFrameMs)),
        domNodes: summarizeMeasurements(rows.map((row) => row.domNodes)),
        heapBytes: summarizeMeasurements(rows.flatMap((row) => row.heapBytes === null ? [] : [row.heapBytes])),
      }]
    }))
    const body = JSON.stringify({ capturedAt: new Date().toISOString(), browser: browser.browserType().name(), browserVersion: browser.version(),
      platform: process.platform, architecture: process.arch, viewport, language, theme, recordsPerStore: count, repetitions: 3,
      note: 'Fresh isolated contexts with Playwright tracing; event capture to two animation frames, not INP. Diagnostic desktop proxy, no latency gate. p95 with three samples is the maximum. JS heap is nonstandard/approximate, not process memory; unsupported is null.',
      summary, samples }, null, 2)
    await writeFile(testInfo.outputPath('history-performance.json'), body)
    await testInfo.attach('history-performance', { body, contentType: 'application/json' })
  })
}
