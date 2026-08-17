import { ACCEPTANCE_HOOKS, ACCEPTANCE_SELECTORS } from '../acceptance/selectors.mjs'

async function openArrival({ page, activate, expectVisible }) {
  await activate(page.getByTestId(ACCEPTANCE_HOOKS.todayGuidedEntry))
  await expectVisible(page.getByTestId('arrival-screen'), 'Arrival')
}

async function finishQuick({ page, activate, expectVisible }, emotion = 'anxiety') {
  await activate(page.getByTestId(`quick-feeling-${emotion}`))
  await activate(page.getByTestId('quick-continue'))
  await expectVisible(page.getByTestId('reflection-screen'), 'Reflection')
  await activate(page.getByRole('button', { name: /done for now|gata pentru acum/i }))
  await expectVisible(page.getByTestId('today-screen'), 'Today')
}

export const JOURNEYS = Object.freeze({
  j1: async (context) => {
    const { page, language, resetState, expectVisible, assert, activate } = context
    await resetState(page, language, false)
    const dialog = page.getByTestId(ACCEPTANCE_HOOKS.onboardingDialog)
    await expectVisible(dialog, 'First-run dialog')
    for (const expectedStep of ['1', '2', '3']) {
      const heading = dialog.getByRole('heading', { level: 1 })
      await page.waitForFunction(({ step, dialogSelector, progressSelector, headingSelector }) => {
        const activeDialog = document.querySelector(dialogSelector)
        const progress = activeDialog?.querySelector(progressSelector)
        const currentHeading = activeDialog?.querySelector(headingSelector)
        return progress?.getAttribute('aria-valuenow') === step
          && currentHeading === document.activeElement
      }, {
        step: expectedStep,
        dialogSelector: ACCEPTANCE_SELECTORS.onboardingDialog,
        progressSelector: ACCEPTANCE_SELECTORS.onboardingProgress,
        headingSelector: ACCEPTANCE_SELECTORS.onboardingHeading,
      })
      assert(await heading.evaluate((element) => element === document.activeElement), `J1 step ${expectedStep} heading lacks focus`)
      assert(await dialog.getByTestId(ACCEPTANCE_HOOKS.onboardingProgress).getAttribute('aria-valuenow') === expectedStep, `J1 progress is not ${expectedStep}`)
      if (expectedStep !== '3') await activate(dialog.locator('.primary-button'))
    }
    await expectVisible(dialog.locator('.onboarding-language'), 'Language choice')
    await activate(dialog.locator('.primary-button'))
    await expectVisible(page.getByTestId('today-screen'), 'Today after onboarding')
  },

  j2: async (context) => {
    const { page, language, resetState, activate, expectVisible, assert } = context
    await resetState(page, language)
    await activate(page.getByRole('button', { name: /settings|setări/i }))
    await activate(page.getByRole('button', { name: /replay introduction|reia introducerea/i }))
    const dialog = page.getByTestId(ACCEPTANCE_HOOKS.onboardingDialog)
    await expectVisible(dialog, 'Replayed introduction')
    assert(await page.locator('.app-shell').getAttribute('inert') !== null, 'J2 background is not inert')
    await activate(page.getByRole('button', { name: /close introduction|închide introducerea/i }))
    const replay = page.getByRole('button', { name: /replay introduction|reia introducerea/i })
    assert(await replay.evaluate((element) => element === document.activeElement), 'J2 focus did not return to replay trigger')
  },

  j3: async (context) => {
    const { page, language, resetState, activate, expectVisible, pressElement } = context
    await resetState(page, language)
    await openArrival(context)
    await activate(page.getByTestId('arrival-affect'))
    const field = page.locator('.dimensional-plot-svg')
    await expectVisible(field, 'Affect field')
    await field.focus()
    await pressElement(field, 'ArrowLeft')
    await pressElement(field, 'ArrowUp')
    const suggestion = page.locator('.dimensional-suggestion-chip').first()
    await expectVisible(suggestion, 'Affect suggestion')
    await activate(suggestion)
    await activate(page.locator('.route-action button'))
    await expectVisible(page.getByTestId('reflection-screen'), 'Affect reflection')
  },

  j4: async (context) => {
    const { page, language, resetState, activate, expectVisible, assert } = context
    await resetState(page, language)
    await openArrival(context)
    await activate(page.getByTestId('arrival-body'))
    await activate(page.getByRole('button', { name: /list|listă/i, exact: true }))
    await activate(page.locator('.body-region-list button').first())
    await activate(page.locator('.body-choice-grid button').first())
    await activate(page.locator('.body-intensity-list button').nth(1))
    const signal = page.locator('[data-testid^="body-signal-"]').first()
    await expectVisible(signal, 'Saved body signal')
    assert(await signal.evaluate((element) => element === document.activeElement), 'J4 saved signal lacks focus')
    await expectVisible(page.getByTestId('body-evidence-note'), 'Body evidence note')
    await activate(page.locator('.route-action button'))
    await expectVisible(page.getByTestId('reflection-screen'), 'Body reflection')
  },

  j5: async (context) => {
    const { page, language, resetState, activate, expectVisible, assert } = context
    await resetState(page, language)
    await openArrival(context)
    await activate(page.getByTestId('arrival-words'))
    await activate(page.locator('.word-options button').first())
    await activate(page.locator('.word-options button').first())
    const direct = page.locator('.word-stop-choice .primary-button')
    assert(await direct.evaluate((element) => element === document.activeElement), 'J5 direct completion lacks focus')
    assert(Boolean(await direct.getAttribute('aria-describedby')), 'J5 direct completion lacks specificity description')
    await activate(direct)
    await expectVisible(page.getByTestId('reflection-screen'), 'Word reflection')
  },

  j6: async (context) => {
    const { page, language, resetState, activate, expectVisible, assert } = context
    await resetState(page, language)
    await page.evaluate(() => {
      const originalPut = IDBObjectStore.prototype.put
      let attempts = 0
      IDBObjectStore.prototype.put = function put(value, key) {
        attempts += 1
        if (attempts === 2) throw new DOMException('Simulated local save failure', 'QuotaExceededError')
        return originalPut.call(this, value, key)
      }
    })
    await activate(page.getByTestId('quick-feeling-anxiety'))
    await activate(page.getByTestId('quick-continue'))
    await activate(page.getByRole('button', { name: /done for now|gata pentru acum/i }))
    const alert = page.getByRole('alert')
    await expectVisible(alert, 'Save failure alert')
    assert(await alert.count() === 1, 'J6 failure is announced more than once')
    await activate(page.locator('.save-error-actions button').first())
    await expectVisible(page.getByTestId('today-screen'), 'Today after retry')
  },

  j7: async (context) => {
    const { page, language, resetState, activate, expectVisible, assert } = context
    await resetState(page, language)
    await finishQuick(context, 'joy')
    await activate(page.getByRole('button', { name: language === 'en' ? 'Journal' : 'Jurnal', exact: true }))
    await activate(page.locator('.journal-list button').first())
    const detail = page.getByTestId('session-detail-screen')
    await expectVisible(detail, 'Session detail')
    await page.goBack()
    await expectVisible(page.getByTestId('journal-screen'), 'Journal after browser Back')
    await page.goForward()
    await expectVisible(detail, 'Session detail after browser Forward')
    const remove = page.locator('.danger-button').first()
    await activate(remove)
    await activate(page.getByRole('button', { name: /cancel|anulează/i }))
    assert(await remove.evaluate((element) => element === document.activeElement), 'J7 Cancel did not restore focus')
    await activate(remove)
    await activate(page.locator('.confirm-dialog-actions .danger-button'))
    await expectVisible(page.getByTestId('journal-screen'), 'Journal after deletion')
  },

  j8: async (context) => {
    const { page, language, resetState, activate, expectVisible, assert } = context
    await resetState(page, language)
    await openArrival(context)
    await activate(page.getByTestId('arrival-words'))
    const labels = language === 'en'
      ? ['Sad', 'Despair', 'Sad', 'Depressed', 'Empty', 'Fearful', 'Weak', 'Worthless']
      : ['Trist', 'Disperare', 'Trist', 'Deprimat', 'Gol', 'Temător', 'Slab', 'Lipsit de valoare']
    const choose = async (label) => activate(page.locator('.word-options button').filter({ hasText: new RegExp(`^${label}`, 'i') }).first())
    await choose(labels[0])
    await choose(labels[1])
    await activate(page.locator('.word-path-levels button').last())
    for (const label of labels.slice(2)) await choose(label)
    await activate(page.locator('.route-action button'))
    await expectVisible(page.getByRole('alert'), 'Tier-4 safety message')
    assert(await page.locator('.emotion-heading').count() === 0, 'J8 reflection details leaked before acknowledgment')
    await expectVisible(page.locator('.crisis-resources a').first(), 'Tier-4 support link')
    await activate(page.getByRole('button', { name: /continue to reflection|continuă la reflecție/i }))
    await expectVisible(page.locator('.emotion-heading'), 'Tier-4 reflection after acknowledgment')
  },

  j9: async (context) => {
    const { page, language, resetState, activate, expectVisible, assert, capture } = context
    await resetState(page, language)
    await activate(page.getByTestId('quick-feeling-anxiety'))
    await activate(page.getByTestId('quick-continue'))
    await expectVisible(page.getByTestId('reflection-screen'), 'Compact reflection')
    assert(await page.locator('.need-choice').count() === 0, 'J9 inferred need is visible before exploration')
    const aiLink = page.getByTestId(ACCEPTANCE_HOOKS.externalAiLink)
    assert(await aiLink.count() === 0, 'J9 AI link is visible before exploration')

    const done = page.getByRole('button', { name: /done for now|gata pentru acum/i })
    const explore = page.getByRole('button', { name: /explore further|explorează mai mult/i })
    for (const [control, description] of [[done, 'Done'], [explore, 'Explore']]) {
      const inViewport = await control.evaluate((element) => {
        const bounds = element.getBoundingClientRect()
        return bounds.top >= 0 && bounds.left >= 0 && bounds.right <= innerWidth && bounds.bottom <= innerHeight
      })
      assert(inViewport, `J9 ${description} action is outside the first viewport`)
    }

    await activate(page.getByRole('button', { name: /partly|parțial/i }))
    await activate(explore)
    await expectVisible(page.getByTestId('reflection-exploration-screen'), 'Reflection exploration')
    assert(await page.locator('#screen-title').evaluate((element) => element === document.activeElement), 'J9 exploration heading lacks focus')
    await expectVisible(page.locator('.need-choice'), 'J9 inferred need')
    await expectVisible(aiLink, 'J9 AI link')
    await capture(page, `${language}-j9-exploration`)

    await activate(page.locator('.screen-back'))
    assert(await explore.evaluate((element) => element === document.activeElement), 'J9 focus did not return to Explore')
  },
})

export const ANDROID_ACCEPTANCE_ADAPTER = validateAcceptanceAdapter({
  name: 'android-physical',
  journeyIds: Object.keys(JOURNEYS),
  resultClass: ACCEPTANCE_RESULTS.supportingPass,
  complete: true,
})

export const JOURNEY_IDS = ANDROID_ACCEPTANCE_ADAPTER.journeyIds

export function selectJourneys(filter) {
  if (filter && !JOURNEY_IDS.includes(filter)) throw new Error(`Unsupported journey: ${filter}`)
  return Object.entries(JOURNEYS).filter(([id]) => !filter || id === filter)
}

export async function runJourneyCase({
  id,
  language,
  mode,
  execute,
  capture,
  log = console.log,
  logError = console.error,
}) {
  const name = `${language}-${id}`
  log(`[${mode}] ${language.toUpperCase()} ${id.toUpperCase()} start`)
  try {
    await execute()
    await capture(name)
    log(`[${mode}] ${language.toUpperCase()} ${id.toUpperCase()} supporting pass`)
    return { language, journey: id.toUpperCase(), result: ACCEPTANCE_RESULTS.supportingPass }
  } catch (error) {
    await capture(`${name}-failure`).catch(() => {})
    logError(`[${mode}] ${language.toUpperCase()} ${id.toUpperCase()} fail: ${error}`)
    return { language, journey: id.toUpperCase(), result: ACCEPTANCE_RESULTS.fail, error: String(error) }
  }
}

export async function runJourneyMatrix({ context, mode, journeyFilter }) {
  const results = []
  for (const language of ACCEPTANCE_LANGUAGES) {
    for (const [id, execute] of selectJourneys(journeyFilter)) {
      results.push(await runJourneyCase({
        id,
        language,
        mode,
        execute: () => execute({ ...context, language }),
        capture: (name) => context.capture(context.page, name),
      }))
    }
  }
  return results
}
import {
  ACCEPTANCE_LANGUAGES,
  ACCEPTANCE_RESULTS,
  validateAcceptanceAdapter,
} from '../acceptance/contract.mjs'
