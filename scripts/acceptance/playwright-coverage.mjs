import {
  ACCEPTANCE_RESULTS,
  validateAcceptanceAdapter,
} from './contract.mjs'

export const PLAYWRIGHT_ACCEPTANCE_COVERAGE = Object.freeze({
  j1: Object.freeze([
    Object.freeze({
      file: 'e2e/accessibility-acceptance.spec.ts',
      anchor: 'introduction exposes progress and focuses each new explanation',
    }),
  ]),
  j2: Object.freeze([
    Object.freeze({
      file: 'e2e/onboarding-replay.spec.ts',
      anchor: 'replays from Settings, stays dismissible, and preserves preferences',
    }),
  ]),
  j3: Object.freeze([
    Object.freeze({
      file: 'e2e/accessibility-acceptance.spec.ts',
      anchor: 'announces meaningful destinations through the Affect journey',
    }),
  ]),
  j4: Object.freeze([
    Object.freeze({
      file: 'e2e/body-compass.spec.ts',
      anchor: 'moves through area, sensation, and intensity into inline completion and Reflection',
    }),
  ]),
  j5: Object.freeze([
    Object.freeze({
      file: 'e2e/accessibility-acceptance.spec.ts',
      anchor: 'intermediary words focus the direct completion choice',
    }),
  ]),
  j6: Object.freeze([
    Object.freeze({
      file: 'e2e/accessibility-acceptance.spec.ts',
      anchor: 'save recovery focuses the new context and limits urgent announcements',
    }),
  ]),
  j7: Object.freeze([
    Object.freeze({
      file: 'e2e/smoke.spec.ts',
      anchor: 'restores exact destinations with browser Back and Forward',
    }),
    Object.freeze({
      file: 'e2e/journal-data.spec.ts',
      anchor: 'keeps early history tentative and deletes exactly one selected check-in',
    }),
  ]),
  j8: Object.freeze([
    Object.freeze({
      file: 'e2e/crisis-routes.spec.ts',
      anchor: 'Words keeps tier-4 support ahead of reflection details',
    }),
  ]),
  j9: Object.freeze([
    Object.freeze({
      file: 'e2e/reflection-trust.spec.ts',
      anchor: 'keeps optional interpretation behind an accessible compact choice',
    }),
  ]),
})

export const PLAYWRIGHT_ACCEPTANCE_ADAPTER = validateAcceptanceAdapter({
  name: 'playwright',
  journeyIds: Object.keys(PLAYWRIGHT_ACCEPTANCE_COVERAGE),
  resultClass: ACCEPTANCE_RESULTS.automatedPass,
  complete: true,
})

export function validatePlaywrightCoverage(coverage, readSource) {
  validateAcceptanceAdapter({
    name: 'playwright',
    journeyIds: Object.keys(coverage),
    resultClass: ACCEPTANCE_RESULTS.automatedPass,
    complete: true,
  })
  for (const [journeyId, anchors] of Object.entries(coverage)) {
    if (anchors.length === 0) throw new Error(`playwright ${journeyId} has no test anchor`)
    for (const { file, anchor } of anchors) {
      const source = readSource(file)
      if (!source.includes(anchor)) {
        throw new Error(`playwright ${journeyId} anchor is missing: ${file} :: ${anchor}`)
      }
    }
  }
  return true
}
