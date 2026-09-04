import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

const selectorsModuleUrl = pathToFileURL(
  path.resolve(process.cwd(), 'scripts/acceptance/selectors.mjs'),
).href

const adapterFiles = [
  'scripts/ios-simulator/audit.mjs',
  'scripts/macos-safari/audit.mjs',
  'scripts/android-physical/journeys.mjs',
  'scripts/android-physical-audit.mjs',
]

describe('native acceptance selector contract', () => {
  it('defines only the repeated cross-platform hooks and derived CSS selectors', async () => {
    const { ACCEPTANCE_HOOKS, ACCEPTANCE_SELECTORS } = await import(selectorsModuleUrl)

    expect(ACCEPTANCE_HOOKS).toEqual({
      todayGuidedEntry: 'today-guided-entry',
      onboardingDialog: 'onboarding-dialog',
      onboardingHeading: 'onboarding-heading',
      onboardingProgress: 'onboarding-progress',
      sessionSaveStatus: 'session-save-status',
      externalAiLink: 'external-ai-link',
    })
    expect(ACCEPTANCE_SELECTORS).toEqual({
      guideAllRoutes: '.guide-all-routes',
      todayGuidedEntry: '[data-testid="today-guided-entry"]',
      onboardingDialog: '[data-testid="onboarding-dialog"]',
      onboardingHeading: '[data-testid="onboarding-heading"]',
      onboardingProgress: '[data-testid="onboarding-progress"]',
      sessionSaveStatus: '[data-testid="session-save-status"]',
      saveComplete: '[data-testid="session-save-status"].is-saved',
      externalAiLink: '[data-testid="external-ai-link"]',
    })
  })

  it('keeps native adapters on the shared contract instead of mutable copy or CSS classes', () => {
    for (const file of adapterFiles) {
      const source = readFileSync(path.resolve(process.cwd(), file), 'utf8')
      expect(source, file).toContain('acceptance/selectors.mjs')
      expect(source, file).not.toMatch(/help me choose|ajută-mă să aleg/i)
      expect(source, file).not.toContain('.session-save-status.is-saved')
      expect(source, file).not.toContain("'.external-ai-link'")
    }
  })
})
