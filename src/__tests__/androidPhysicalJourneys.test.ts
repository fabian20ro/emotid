import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const journeyModuleUrl = pathToFileURL(
  path.resolve(process.cwd(), 'scripts/android-physical/journeys.mjs'),
).href
const temporaryDirectories: string[] = []

async function loadJourneys() {
  return import(journeyModuleUrl)
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('Android physical journey registry', () => {
  it('imports without producing hardware evidence or filesystem effects', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'emot-id-journeys-'))
    temporaryDirectories.push(directory)

    const result = spawnSync(process.execPath, [
      '--input-type=module',
      '--eval',
      `const { JOURNEY_IDS } = await import(${JSON.stringify(journeyModuleUrl)}); process.stdout.write(JSON.stringify(JOURNEY_IDS))`,
    ], { cwd: directory, encoding: 'utf8' })

    expect(result.status).toBe(0)
    expect(JSON.parse(result.stdout)).toEqual(['j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'j7', 'j8', 'j9'])
    expect(readdirSync(directory)).toEqual([])
  })

  it('selects only registered journeys', async () => {
    const { selectJourneys } = await loadJourneys()

    expect(selectJourneys().map(([id]: [string]) => id)).toEqual([
      'j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'j7', 'j8', 'j9',
    ])
    expect(selectJourneys('j5').map(([id]: [string]) => id)).toEqual(['j5'])
    expect(() => selectJourneys('j10')).toThrow('Unsupported journey: j10')
  })

  it('captures and reports a successful journey', async () => {
    const { runJourneyCase } = await loadJourneys()
    const events: string[] = []

    const result = await runJourneyCase({
      id: 'j5',
      language: 'ro',
      mode: 'installed',
      execute: async () => events.push('execute'),
      capture: async (name: string) => events.push(`capture:${name}`),
      log: (message: string) => events.push(`log:${message}`),
      logError: (message: string) => events.push(`error:${message}`),
    })

    expect(result).toEqual({ language: 'ro', journey: 'J5', result: 'SUPPORTING_PASS' })
    expect(events).toEqual([
      'log:[installed] RO J5 start',
      'execute',
      'capture:ro-j5',
      'log:[installed] RO J5 supporting pass',
    ])
  })

  it('retains a failure result even when failure capture also fails', async () => {
    const { runJourneyCase } = await loadJourneys()
    const events: string[] = []

    const result = await runJourneyCase({
      id: 'j8',
      language: 'en',
      mode: 'browser',
      execute: async () => { throw new Error('focus escaped') },
      capture: async (name: string) => {
        events.push(`capture:${name}`)
        throw new Error('capture unavailable')
      },
      log: (message: string) => events.push(`log:${message}`),
      logError: (message: string) => events.push(`error:${message}`),
    })

    expect(result).toMatchObject({
      language: 'en',
      journey: 'J8',
      result: 'FAIL',
      error: 'Error: focus escaped',
    })
    expect(events).toEqual([
      'log:[browser] EN J8 start',
      'capture:en-j8-failure',
      'error:[browser] EN J8 fail: Error: focus escaped',
    ])
  })
})
