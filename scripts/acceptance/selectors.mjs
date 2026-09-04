export const ACCEPTANCE_HOOKS = Object.freeze({
  todayGuidedEntry: 'today-guided-entry',
  onboardingDialog: 'onboarding-dialog',
  onboardingHeading: 'onboarding-heading',
  onboardingProgress: 'onboarding-progress',
  sessionSaveStatus: 'session-save-status',
  externalAiLink: 'external-ai-link',
})

export const ACCEPTANCE_SELECTORS = Object.freeze({
  guideAllRoutes: '.guide-all-routes',
  todayGuidedEntry: `[data-testid="${ACCEPTANCE_HOOKS.todayGuidedEntry}"]`,
  onboardingDialog: `[data-testid="${ACCEPTANCE_HOOKS.onboardingDialog}"]`,
  onboardingHeading: `[data-testid="${ACCEPTANCE_HOOKS.onboardingHeading}"]`,
  onboardingProgress: `[data-testid="${ACCEPTANCE_HOOKS.onboardingProgress}"]`,
  sessionSaveStatus: `[data-testid="${ACCEPTANCE_HOOKS.sessionSaveStatus}"]`,
  saveComplete: `[data-testid="${ACCEPTANCE_HOOKS.sessionSaveStatus}"].is-saved`,
  externalAiLink: `[data-testid="${ACCEPTANCE_HOOKS.externalAiLink}"]`,
})
