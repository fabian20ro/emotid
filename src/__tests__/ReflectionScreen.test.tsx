import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReflectionScreen } from '../screens/ReflectionScreen'
import { LanguageProvider, useLanguage } from '../context/LanguageContext'
import { storage } from '../data/storage'
import type { AnalysisResult } from '../models/types'
import type { CheckInCompletion, ReflectionDetail, ReflectionSaveOutcome } from '../navigation/types'
import { ACCEPTANCE_HOOKS } from '../../scripts/acceptance/selectors.mjs'
import en from '../i18n/en.json'
import ro from '../i18n/ro.json'
import { useState } from 'react'
import { quickEmotions } from '../models/catalog/quick'
import { needOptions, type NeedOptionId } from '../models/catalog/guidance/need-options'
import type { ReflectionView } from '../navigation/types'

function ReflectionHarness(props: Omit<React.ComponentProps<typeof ReflectionScreen>, 'view' | 'onViewChange'>) {
  const [view, setView] = useState<ReflectionView>('result')
  return <ReflectionScreen {...props} view={view} onViewChange={setView} onBack={() => {
    if (view === 'result') props.onBack()
    else setView(view === 'step' ? 'exploration' : 'result')
  }} />
}

function ChangeLanguage() {
  const { language, setLanguage } = useLanguage()
  return <button onClick={() => setLanguage(language === 'en' ? 'ro' : 'en')}>Change language</button>
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function result(id: string, needId?: NeedOptionId): AnalysisResult {
  return {
    id,
    label: { en: id, ro: id },
    color: '#176b60',
    description: { en: `${id} description`, ro: `descriere ${id}` },
    needs: needId ? needOptions[needId] : undefined,
    needId,
  }
}

function completion(results: AnalysisResult[], crisisTier: CheckInCompletion['crisisTier'] = 'none'): CheckInCompletion {
  return {
    route: 'quick',
    modelId: 'test',
    selections: results,
    results,
    crisisTier,
  }
}

function renderReflection(
  results: AnalysisResult[],
  options: {
    route?: CheckInCompletion['route']
    crisisTier?: CheckInCompletion['crisisTier']
    language?: 'en' | 'ro'
    saveSessions?: boolean
    allowExternalAI?: boolean
    saveState?: React.ComponentProps<typeof ReflectionScreen>['saveState']
    sessionCaptured?: boolean
    onSave?: (detail: ReflectionDetail) => Promise<ReflectionSaveOutcome>
  } = {},
) {
  storage.set('language', options.language ?? 'en')
  const onSave = vi.fn(options.onSave ?? (() => Promise.resolve(options.saveSessions === false ? 'not-saved' : 'saved')))
  const onBack = vi.fn()
  const onReturn = vi.fn()
  const onRetryBaseSave = vi.fn()
  render(
    <LanguageProvider>
      <ChangeLanguage />
      <ReflectionHarness
        completion={{ ...completion(results, options.crisisTier), route: options.route ?? 'affect' }}
        allowExternalAI={options.allowExternalAI ?? false}
        saveState={options.saveState ?? (options.saveSessions === false ? 'disabled' : 'saved')}
        sessionCaptured={options.sessionCaptured ?? options.saveSessions !== false}
        onBack={onBack}
        onRetryBaseSave={onRetryBaseSave}
        onSave={onSave}
        onReturn={onReturn}
      />
    </LanguageProvider>,
  )
  return { onSave, onBack, onReturn, onRetryBaseSave }
}

describe('ReflectionScreen need selection', () => {
  it('clears both chosen identities when the user rejects the result', async () => {
    const { onSave } = renderReflection([result('anxiety', 'grounding')])
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: en.reflectionScreen.exploreMore }))
    await user.click(screen.getByRole('button', { name: 'grounding', exact: true }))
    await user.click(screen.getByRole('button', { name: en.reflectionScreen.nextStep }))
    await user.click(screen.getByRole('button', { name: en.reflectionScreen.stepConnect }))
    await user.click(screen.getByRole('button', { name: en.navigation.back, exact: true }))
    await user.click(screen.getByRole('button', { name: en.navigation.back, exact: true }))
    await user.click(screen.getByRole('button', { name: en.reflectionScreen.no, exact: true }))
    await user.click(screen.getByRole('button', { name: en.reflectionScreen.finishWithoutLabel }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ reflectionAnswer: 'no',
      selectedNeedId: undefined, selectedNeed: undefined, nextStepId: undefined, nextStep: undefined }))
  })
  it.each(['en', 'ro'] as const)('keeps a chosen need across a language change from %s', async (language) => {
    const { onSave } = renderReflection([quickEmotions.find((emotion) => emotion.id === 'anxiety')!], { language })
    const user = userEvent.setup()
    const before = language === 'en' ? en : ro
    const after = language === 'en' ? ro : en
    await user.click(screen.getByRole('button', { name: before.reflectionScreen.exploreMore }))
    await user.click(screen.getByRole('button', { name: language === 'en' ? 'grounding' : 'ancorare', exact: true }))
    await user.click(screen.getByRole('button', { name: 'Change language' }))
    const translated = language === 'en' ? 'ancorare' : 'grounding'
    expect(screen.getByRole('button', { name: translated, exact: true })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: after.reflectionScreen.done }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ selectedNeedId: 'grounding', selectedNeed: translated }))
  })
  it('keeps the selected next step when the language changes, and saves its identity', async () => {
    const { onSave } = renderReflection([result('calm')])
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: en.reflectionScreen.exploreMore }))
    await user.click(screen.getByRole('button', { name: en.reflectionScreen.nextStep }))
    await user.click(screen.getByRole('button', { name: en.reflectionScreen.stepWrite }))
    await user.click(screen.getByRole('button', { name: 'Change language' }))
    expect(screen.getByRole('button', { name: ro.reflectionScreen.stepWrite })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: ro.reflectionScreen.keepStep }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ nextStepId: 'write', nextStep: ro.reflectionScreen.stepWrite }))
  })
  it.each(['exploration', 'step'] as const)('rejects a history request for %s before tier-4 acknowledgment', (view) => {
    storage.set('language', 'en')
    const onBack = vi.fn()
    render(<LanguageProvider><ReflectionScreen
      view={view} onViewChange={vi.fn()} completion={completion([result('despair')], 'tier4')}
      allowExternalAI={false} saveState="saved" sessionCaptured
      onBack={onBack} onRetryBaseSave={vi.fn()} onSave={vi.fn()} onReturn={vi.fn()}
    /></LanguageProvider>)
    expect(screen.getByRole('button', { name: en.reflectionScreen.acknowledge })).toBeVisible()
    expect(screen.queryByTestId('reflection-exploration-screen')).not.toBeInTheDocument()
    expect(screen.queryByTestId('next-step-screen')).not.toBeInTheDocument()
    expect(onBack).toHaveBeenCalledOnce()
  })

  for (const language of ['en', 'ro'] as const) {
    it.each(['none', 'tier1', 'tier2', 'tier3', 'tier4'] as const)(`keeps support and gating consistent through every reflection substate in ${language}: %s`, async (tier) => {
      const user = userEvent.setup()
      const copy = language === 'en' ? en : ro
      const t = copy.reflectionScreen
      const pending = deferred<ReflectionSaveOutcome>()
      renderReflection([result('despair')], { language, crisisTier: tier, onSave: () => pending.promise })
      const expectSupport = () => {
        const links = screen.queryAllByRole('link', { name: /deprehub/i })
        expect(links).toHaveLength(tier === 'none' ? 0 : 1)
        if (tier !== 'none') {
          expect(screen.getByText(copy.crisis[tier])).toBeInTheDocument()
          expect(links[0]).toHaveAttribute('href', 'tel:+40374456420')
        }
      }
      expectSupport()
      if (tier === 'tier4') {
        expect(screen.queryByRole('button', { name: t.exploreMore })).not.toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: t.acknowledge }))
        expect(screen.getByRole('heading', { name: 'despair' })).toHaveFocus()
      } else {
        expect(screen.queryByRole('button', { name: t.acknowledge })).not.toBeInTheDocument()
      }
      await user.click(screen.getByRole('button', { name: t.exploreMore }))
      expectSupport()
      await user.click(screen.getByRole('button', { name: t.nextStep }))
      expectSupport()
      await user.click(screen.getByRole('button', { name: copy.navigation.back }))
      expectSupport()
      await user.click(screen.getByRole('button', { name: copy.navigation.back }))
      expectSupport()
      expect(screen.getByRole('button', { name: t.exploreMore })).toHaveFocus()
      expect(screen.queryByRole('button', { name: t.acknowledge })).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: t.done }))
      expectSupport()
      await act(async () => pending.reject(new Error('disk unavailable')))
      expect(screen.getByTestId('reflection-save-error-screen')).toBeInTheDocument()
      expectSupport()
    })
  }

  it('keeps a chosen subset when the user also confirms its fit', async () => {
    const { onSave } = renderReflection([result('love'), result('gratitude')], { route: 'body' })
    const user = userEvent.setup()
    await user.click(screen.getByRole('checkbox', { name: 'gratitude' }))
    await user.click(screen.getByRole('button', { name: 'Yes', exact: true }))
    await user.click(screen.getByRole('button', { name: 'Done for now' }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ reflectionAnswer: 'yes', selectedResultIds: ['gratitude'] }))
  })
  beforeEach(() => localStorage.clear())

  it('frames generated labels as rejectable possibilities in both languages', () => {
    renderReflection([result('anxiety')])
    expect(screen.getByText('anxiety may be close. Keep only what fits your experience.')).toBeInTheDocument()
  })

  it('makes the direct exit primary and records no inferred need without a tap', async () => {
    const user = userEvent.setup()
    const { onSave } = renderReflection([result('tired', 'rest')])
    const done = screen.getByRole('button', { name: 'Done for now' })
    const explore = screen.getByRole('button', { name: 'Explore further' })

    expect(done).toHaveClass('primary-button')
    expect(explore).toHaveClass('secondary-button')
    expect(done.compareDocumentPosition(explore) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Try one small step' })).not.toBeInTheDocument()
    await user.click(done)
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ selectedNeed: undefined }))
  })

  it('keeps inferred guidance behind explicit exploration and restores disclosure focus', async () => {
    const user = userEvent.setup()
    const need = needOptions.rest
    renderReflection([result('tired', 'rest')], { allowExternalAI: true })

    const explore = screen.getByRole('button', { name: 'Explore further' })
    expect(screen.queryByRole('button', { name: need.en })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try one small step' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Explore in Google AI Mode' })).not.toBeInTheDocument()

    await user.click(explore)
    expect(screen.getByTestId('reflection-exploration-screen')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Explore further' })).toHaveFocus()
    expect(screen.getByRole('button', { name: need.en })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try one small step' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Explore in Google AI Mode' })).not.toBeInTheDocument()
    expect(screen.getByText(/choose yes or partly/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'A possible meaning' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByTestId('reflection-screen')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Explore further' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Partly' }))
    await user.click(screen.getByRole('button', { name: 'Explore further' }))
    expect(screen.getByRole('link', { name: 'Explore in Google AI Mode' })).toBeInTheDocument()
  })

  it('shows the primary description once and omits empty result rows from more context', async () => {
    const user = userEvent.setup()
    const withoutGuidance = { ...result('empty'), description: undefined }
    renderReflection([result('anxiety'), withoutGuidance])

    await user.click(screen.getByRole('button', { name: 'Explore further' }))
    expect(screen.queryByText('More context')).not.toBeInTheDocument()

    expect(screen.getAllByText('anxiety description')).toHaveLength(1)
    expect(screen.queryByText('empty:')).not.toBeInTheDocument()
  })

  it('uses the same uncertainty and agency level in Romanian', () => {
    renderReflection([result('anxietate')], { language: 'ro' })
    expect(screen.getByText('anxietate ar putea fi aproape. Păstrează doar ce se potrivește experienței de acum.')).toBeInTheDocument()
  })

  it('omits need selection and saves no need when none are inferred', async () => {
    const user = userEvent.setup()
    const { onSave } = renderReflection([result('calm')])

    expect(screen.queryByRole('group', { name: 'What might help most right now?' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Done for now' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ selectedNeed: undefined }))
  })

  it('requires explicit consent before persisting the only inferred need', async () => {
    const user = userEvent.setup()
    const need = needOptions.rest
    const { onSave } = renderReflection([result('tired', 'rest')])
    await user.click(screen.getByRole('button', { name: 'Explore further' }))
    const option = screen.getByRole('button', { name: need.en })

    expect(option).toHaveAttribute('aria-pressed', 'false')
    await user.click(option)
    await user.click(screen.getByRole('button', { name: 'Done for now' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ selectedNeed: need.en }))
  })

  it('requires an explicit choice among deduplicated needs and allows clearing it', async () => {
    const user = userEvent.setup()
    const quiet = needOptions.rest
    const support = needOptions.support
    const { onSave } = renderReflection([result('tired', 'rest'), result('drained', 'rest'), result('sad', 'support')])
    await user.click(screen.getByRole('button', { name: 'Explore further' }))
    const quietOption = screen.getByRole('button', { name: quiet.en })
    const supportOption = screen.getByRole('button', { name: support.en })

    expect(screen.getAllByRole('button', { name: quiet.en })).toHaveLength(1)
    expect(quietOption).toHaveAttribute('aria-pressed', 'false')
    expect(supportOption).toHaveAttribute('aria-pressed', 'false')

    supportOption.focus()
    await user.keyboard('{Enter}')
    expect(supportOption).toHaveAttribute('aria-pressed', 'true')
    expect(quietOption).toHaveAttribute('aria-pressed', 'false')

    await user.click(supportOption)
    expect(supportOption).toHaveAttribute('aria-pressed', 'false')
    await user.click(quietOption)
    await user.click(screen.getByRole('button', { name: 'Try one small step' }))
    expect(screen.getByRole('heading', { name: 'Try one small step' })).toBeInTheDocument()
    expect(screen.getByText(`What might help: ${quiet.en}`)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Done for now' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ selectedNeed: quiet.en }))
  })

  it('supports Romanian keyboard selection and save-disabled completion', async () => {
    const user = userEvent.setup()
    const second = needOptions.support
    const { onSave, onReturn } = renderReflection(
      [result('obosit', 'rest'), result('trist', 'support')],
      { language: 'ro', saveSessions: false },
    )
    await user.click(screen.getByRole('button', { name: 'Explorează mai mult' }))
    const option = screen.getByRole('button', { name: second.ro })

    option.focus()
    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: 'Gata pentru acum' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ selectedNeed: second.ro }))
    expect(onReturn).toHaveBeenCalledOnce()
  })

  it('keeps every need control behind tier-4 acknowledgement', async () => {
    const user = userEvent.setup()
    const need = needOptions.support
    renderReflection([result('despair', 'support')], { crisisTier: 'tier4' })

    expect(screen.queryByRole('group', { name: 'What might help most right now?' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue to reflection' }))

    expect(screen.getByRole('heading', { level: 2, name: 'despair' })).toHaveFocus()
    expect(screen.queryByRole('group', { name: 'What might help most right now?' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Explore further' }))
    expect(screen.getByRole('group', { name: 'What might help most right now?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: need.en })).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps safety support ahead of visible storage feedback', () => {
    renderReflection([result('despair')], { crisisTier: 'tier4', saveState: 'saved' })

    const alert = screen.getByRole('alert')
    const saveStatus = screen.getByTestId('session-save-status')
    expect(alert).toHaveClass('crisis-message')
    expect(alert.closest('.crisis-banner')).toBeInTheDocument()
    expect(saveStatus).toHaveTextContent('Reflection saved. Everything below is optional.')
    expect(alert.compareDocumentPosition(saveStatus) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('clears inferred content and saves no inferred detail when the result is rejected', async () => {
    const user = userEvent.setup()
    const need = needOptions.rest
    const { onSave, onBack } = renderReflection([result('anxiety', 'rest')], { allowExternalAI: true })

    expect(screen.queryByRole('button', { name: need.en })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Not really' }))

    expect(screen.getByRole('heading', { name: 'The result does not fit' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'What might help most right now?' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try one small step' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Explore in Google AI Mode' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Revise my selection' }))
    expect(onBack).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: 'Finish without confirming this label' }))
    expect(onSave).toHaveBeenCalledWith({
      reflectionAnswer: 'no',
      selectedNeed: undefined,
      nextStep: undefined,
    })
  })

  it('explains a partial fit and saves only an explicitly chosen neutral step', async () => {
    const user = userEvent.setup()
    const { onSave } = renderReflection([result('anxiety')])

    await user.click(screen.getByRole('button', { name: 'Partly' }))
    expect(screen.getByText(/treating these as possibilities/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Explore further' }))
    await user.click(screen.getByRole('button', { name: 'Try one small step' }))

    expect(screen.queryByText(/approach what feels scary/i)).not.toBeInTheDocument()
    const keep = screen.getByRole('button', { name: 'Keep this step' })
    expect(keep).toBeDisabled()
    const chosenStep = 'Write down one observation without trying to solve it.'
    await user.click(screen.getByRole('button', { name: chosenStep }))
    expect(keep).toBeEnabled()
    await user.click(keep)

    expect(onSave).toHaveBeenCalledWith({
      reflectionAnswer: 'partly',
      selectedNeed: undefined,
      nextStep: chosenStep,
      nextStepId: 'write',
    })
  })

  it('shows the Google handoff disclosure beside the unchanged external action', async () => {
    const user = userEvent.setup()
    renderReflection([result('anxiety')], { allowExternalAI: true })
    await user.click(screen.getByRole('button', { name: 'Yes' }))
    await user.click(screen.getByRole('button', { name: 'Explore further' }))

    const link = screen.getByRole('link', { name: 'Explore in Google AI Mode' })
    expect(screen.getByTestId(ACCEPTANCE_HOOKS.externalAiLink)).toBe(link)
    expect(link).toHaveAttribute('href', expect.stringContaining('https://www.google.com/search?udm=50&q='))
    expect(screen.getByText(/opens Google AI Mode/i)).toBeInTheDocument()
    expect(screen.getByText(/not a substitute for professional support/i)).toBeInTheDocument()
  })

  it('shows qualitative match provenance for body-derived possibilities', () => {
    renderReflection([{
      ...result('grief'),
      matchStrength: { en: 'closer match', ro: 'potrivire mai apropiată' },
    }])

    expect(screen.getByText('closer match')).toBeInTheDocument()
  })

  it('exposes save completion through the stable native acceptance hook', () => {
    renderReflection([result('anxiety')], { saveState: 'saved' })

    expect(screen.getByTestId(ACCEPTANCE_HOOKS.sessionSaveStatus)).toHaveClass('is-saved')
  })

  it('localizes mismatch recovery in Romanian', async () => {
    const user = userEvent.setup()
    renderReflection([result('anxietate', 'support')], { language: 'ro' })

    await user.click(screen.getByRole('button', { name: 'Nu prea' }))
    expect(screen.getByRole('heading', { name: 'Rezultatul nu se potrivește' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Încheie fără să confirmi această etichetă' })).toBeInTheDocument()
  })

  it('shows pending state, waits for persistence, and blocks duplicate submission', async () => {
    const pending = deferred<ReflectionSaveOutcome>()
    const onSave = vi.fn(() => pending.promise)
    const { onReturn } = renderReflection([result('calm')], { onSave })
    const done = screen.getByRole('button', { name: 'Done for now' })

    act(() => {
      done.click()
      done.click()
    })

    expect(onSave).toHaveBeenCalledOnce()
    expect(screen.getByTestId('reflection-screen')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Finishing…' })).toBeDisabled()
    expect(screen.queryByTestId('reflection-close-screen')).not.toBeInTheDocument()

    await act(async () => pending.resolve('saved'))
    expect(onReturn).toHaveBeenCalledOnce()
  })

  it('retries the same reflection after a local save failure', async () => {
    const user = userEvent.setup()
    const save = vi.fn()
      .mockRejectedValueOnce(new Error('IndexedDB unavailable'))
      .mockResolvedValueOnce('saved' as const)
    const { onSave, onReturn } = renderReflection([result('calm')], { onSave: save })

    await user.click(screen.getByRole('button', { name: 'Done for now' }))
    expect(await screen.findByRole('heading', { name: 'The latest details were not saved' })).toBeInTheDocument()
    expect(screen.getByText(/nothing was sent online/i)).toBeInTheDocument()
    expect(screen.queryByTestId('reflection-close-screen')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try saving again' }))
    expect(onReturn).toHaveBeenCalledOnce()
    expect(onSave).toHaveBeenCalledTimes(2)
    expect(onSave.mock.calls[1][0]).toEqual(onSave.mock.calls[0][0])
  })

  it('allows continuing after failure without claiming the reflection was saved', async () => {
    const user = userEvent.setup()
    const { onReturn } = renderReflection(
      [result('calm')],
      { language: 'ro', onSave: () => Promise.reject(new Error('IndexedDB unavailable')) },
    )

    await user.click(screen.getByRole('button', { name: 'Gata pentru acum' }))
    expect(await screen.findByRole('heading', { name: 'Ultimele detalii nu au fost salvate' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Încheie fără aceste detalii' }))

    expect(onReturn).toHaveBeenCalledOnce()
  })

  it('makes early local capture explicit and lets the user retry it', async () => {
    const user = userEvent.setup()
    const { onRetryBaseSave } = renderReflection([result('calm')], {
      saveState: 'error',
      sessionCaptured: false,
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Your latest changes have not been saved yet')
    await user.click(screen.getByRole('button', { name: 'Try saving again' }))
    expect(onRetryBaseSave).toHaveBeenCalledOnce()
  })
})
