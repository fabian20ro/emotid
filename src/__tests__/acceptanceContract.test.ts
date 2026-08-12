import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

const contractUrl = pathToFileURL(
  path.resolve(process.cwd(), 'scripts/acceptance/contract.mjs'),
).href
const coverageUrl = pathToFileURL(
  path.resolve(process.cwd(), 'scripts/acceptance/playwright-coverage.mjs'),
).href
const androidUrl = pathToFileURL(
  path.resolve(process.cwd(), 'scripts/android-physical/journeys.mjs'),
).href
const iosUrl = pathToFileURL(
  path.resolve(process.cwd(), 'scripts/ios-simulator/audit.mjs'),
).href
const safariUrl = pathToFileURL(
  path.resolve(process.cwd(), 'scripts/macos-safari/audit.mjs'),
).href

describe('acceptance contract', () => {
  it('owns the exact J1-J9 intent, languages, and evidence classes', async () => {
    const {
      ACCEPTANCE_JOURNEYS,
      ACCEPTANCE_LANGUAGES,
      ACCEPTANCE_RESULT_CLASSES,
    } = await import(contractUrl)

    expect(ACCEPTANCE_JOURNEYS).toEqual([
      { id: 'j1', evidenceId: 'J1', title: 'First-run introduction' },
      { id: 'j2', evidenceId: 'J2', title: 'Settings replay' },
      { id: 'j3', evidenceId: 'J3', title: 'Affect route' },
      { id: 'j4', evidenceId: 'J4', title: 'Body Compass' },
      { id: 'j5', evidenceId: 'J5', title: 'Word Ladder' },
      { id: 'j6', evidenceId: 'J6', title: 'Save recovery' },
      { id: 'j7', evidenceId: 'J7', title: 'Browser history and Journal deletion' },
      { id: 'j8', evidenceId: 'J8', title: 'Tier-4 support fixture' },
      { id: 'j9', evidenceId: 'J9', title: 'Reflection disclosure' },
    ])
    expect(ACCEPTANCE_LANGUAGES).toEqual(['en', 'ro'])
    expect(ACCEPTANCE_RESULT_CLASSES).toEqual([
      'PASS',
      'BOUNDED_PASS',
      'AUTOMATED_PASS',
      'SUPPORTING_PASS',
      'NATIVE_SUPPORTING_PASS',
      'SIMULATOR_SUPPORTING_PASS',
      'BLOCKED',
      'FAIL',
    ])
  })

  it('validates adapter scope and rejects drift early', async () => {
    const { validateAcceptanceAdapter } = await import(contractUrl)

    expect(validateAcceptanceAdapter({
      name: 'complete',
      journeyIds: ['j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'j7', 'j8', 'j9'],
      resultClass: 'SUPPORTING_PASS',
      complete: true,
    })).toMatchObject({ name: 'complete', complete: true })
    expect(() => validateAcceptanceAdapter({
      name: 'duplicate', journeyIds: ['j1', 'j1'], resultClass: 'PASS',
    })).toThrow('duplicate journey: j1')
    expect(() => validateAcceptanceAdapter({
      name: 'unknown', journeyIds: ['j10'], resultClass: 'PASS',
    })).toThrow('unknown journey: j10')
    expect(() => validateAcceptanceAdapter({
      name: 'bad-result', journeyIds: ['j1'], resultClass: 'UNKNOWN_PASS',
    })).toThrow('unknown result class: UNKNOWN_PASS')
    expect(() => validateAcceptanceAdapter({
      name: 'incomplete', journeyIds: ['j1'], resultClass: 'PASS', complete: true,
    })).toThrow('must cover J1-J9')
  })

  it('registers exact platform scope without sharing platform execution', async () => {
    const { ANDROID_ACCEPTANCE_ADAPTER } = await import(androidUrl)
    const { IOS_SIMULATOR_ACCEPTANCE_ADAPTER } = await import(iosUrl)
    const { NATIVE_SAFARI_ACCEPTANCE_ADAPTER } = await import(safariUrl)
    const { PLAYWRIGHT_ACCEPTANCE_ADAPTER } = await import(coverageUrl)

    expect(ANDROID_ACCEPTANCE_ADAPTER.journeyIds).toEqual([
      'j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'j7', 'j8', 'j9',
    ])
    expect(PLAYWRIGHT_ACCEPTANCE_ADAPTER.journeyIds).toEqual(ANDROID_ACCEPTANCE_ADAPTER.journeyIds)
    expect(PLAYWRIGHT_ACCEPTANCE_ADAPTER.resultClass).toBe('AUTOMATED_PASS')
    expect(IOS_SIMULATOR_ACCEPTANCE_ADAPTER.journeyIds).toEqual(['j1', 'j5', 'j6', 'j8', 'j9'])
    expect(NATIVE_SAFARI_ACCEPTANCE_ADAPTER.journeyIds).toEqual(['j5', 'j8', 'j9'])
    expect(IOS_SIMULATOR_ACCEPTANCE_ADAPTER).not.toHaveProperty('selectors')
    expect(NATIVE_SAFARI_ACCEPTANCE_ADAPTER).not.toHaveProperty('steps')
  })

  it('anchors every Playwright registration to a real test and keeps the release doc aligned', async () => {
    const {
      PLAYWRIGHT_ACCEPTANCE_COVERAGE,
      validatePlaywrightCoverage,
    } = await import(coverageUrl)
    const { validateAcceptanceDocumentation } = await import(contractUrl)

    expect(() => validatePlaywrightCoverage(PLAYWRIGHT_ACCEPTANCE_COVERAGE, (file: string) => (
      readFileSync(path.resolve(process.cwd(), file), 'utf8')
    ))).not.toThrow()

    const releaseDoc = readFileSync(
      path.resolve(process.cwd(), 'docs/release-quality-gates.md'),
      'utf8',
    )
    expect(() => validateAcceptanceDocumentation(releaseDoc)).not.toThrow()
    expect(() => validateAcceptanceDocumentation(releaseDoc.replace('9. Reflection disclosure:', '')))
      .toThrow('release documentation is missing J9')
  })
})
