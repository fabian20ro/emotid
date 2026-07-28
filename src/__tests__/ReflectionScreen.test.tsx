import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReflectionScreen } from '../screens/ReflectionScreen'
import { LanguageProvider } from '../context/LanguageContext'
import { storage } from '../data/storage'
import type { AnalysisResult } from '../models/types'
import type { CheckInCompletion, ReflectionDetail, ReflectionSaveOutcome } from '../navigation/types'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function result(id: string, need?: { en: string; ro: string }): AnalysisResult {
  return {
    id,
    label: { en: id, ro: id },
    color: '#176b60',
    description: { en: `${id} description`, ro: `descriere ${id}` },
    needs: need,
  }
}

function completion(results: AnalysisResult[], crisisTier: CheckInCompletion['crisisTier'] = 'none'): CheckInCompletion {
  return {
    route: 'quick',
    modelId: 'test',
    selections: results,
    results,
    crisisTier,
    temporalEscalation: false,
  }
}

function renderReflection(
  results: AnalysisResult[],
  options: {
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
      <ReflectionScreen
        completion={completion(results, options.crisisTier)}
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
  beforeEach(() => localStorage.clear())

  it('frames generated labels as rejectable possibilities in both languages', () => {
    renderReflection([result('anxiety')])
    expect(screen.getByText('anxiety may be among the possibilities here. Keep only the words that fit your experience.')).toBeInTheDocument()
  })

  it('makes the direct exit primary and records no inferred need without a tap', async () => {
    const user = userEvent.setup()
    const need = { en: 'quiet and rest', ro: 'liniște și odihnă' }
    const { onSave } = renderReflection([result('tired', need)])
    const done = screen.getByRole('button', { name: 'Done for now' })
    const step = screen.getByRole('button', { name: 'Try one small step' })

    expect(done).toHaveClass('primary-button')
    expect(step).toHaveClass('secondary-button')
    expect(done.compareDocumentPosition(step) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await user.click(done)
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ selectedNeed: undefined }))
  })

  it('uses the same uncertainty and agency level in Romanian', () => {
    renderReflection([result('anxietate')], { language: 'ro' })
    expect(screen.getByText('anxietate ar putea fi printre posibilitățile de aici. Păstrați doar cuvintele care se potrivesc experienței voastre.')).toBeInTheDocument()
  })

  it('omits need selection and saves no need when none are inferred', async () => {
    const user = userEvent.setup()
    const { onSave } = renderReflection([result('calm')])

    expect(screen.queryByRole('group', { name: 'What feels most needed right now?' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Done for now' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ selectedNeed: undefined }))
  })

  it('requires explicit consent before persisting the only inferred need', async () => {
    const user = userEvent.setup()
    const need = { en: 'quiet and rest', ro: 'liniște și odihnă' }
    const { onSave } = renderReflection([result('tired', need)])
    const option = screen.getByRole('button', { name: need.en })

    expect(option).toHaveAttribute('aria-pressed', 'false')
    await user.click(option)
    await user.click(screen.getByRole('button', { name: 'Done for now' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ selectedNeed: need.en }))
  })

  it('requires an explicit choice among deduplicated needs and allows clearing it', async () => {
    const user = userEvent.setup()
    const quiet = { en: 'quiet and rest', ro: 'liniște și odihnă' }
    const support = { en: 'human support', ro: 'sprijin uman' }
    const { onSave } = renderReflection([result('tired', quiet), result('drained', quiet), result('sad', support)])
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
    expect(screen.getByText(`What you may need: ${quiet.en}`)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Done for now' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ selectedNeed: quiet.en }))
  })

  it('supports Romanian keyboard selection and save-disabled completion', async () => {
    const user = userEvent.setup()
    const first = { en: 'quiet', ro: 'liniște' }
    const second = { en: 'support', ro: 'sprijin' }
    const { onSave, onReturn } = renderReflection(
      [result('obosit', first), result('trist', second)],
      { language: 'ro', saveSessions: false },
    )
    const option = screen.getByRole('button', { name: second.ro })

    option.focus()
    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: 'Gata pentru acum' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ selectedNeed: second.ro }))
    expect(onReturn).toHaveBeenCalledOnce()
  })

  it('keeps every need control behind tier-4 acknowledgement', async () => {
    const user = userEvent.setup()
    const need = { en: 'immediate support', ro: 'sprijin imediat' }
    renderReflection([result('despair', need)], { crisisTier: 'tier4' })

    expect(screen.queryByRole('group', { name: 'What feels most needed right now?' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue to reflection' }))

    expect(screen.getByRole('group', { name: 'What feels most needed right now?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: need.en })).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps safety support ahead of storage and suppresses routine save status', () => {
    renderReflection([result('despair')], { crisisTier: 'tier4', saveState: 'saved' })

    expect(screen.getByRole('alert')).toHaveClass('crisis-banner')
    expect(screen.queryByText('Check-in saved. Everything below is optional.')).not.toBeInTheDocument()
  })

  it('clears inferred content and saves no inferred detail when the result is rejected', async () => {
    const user = userEvent.setup()
    const need = { en: 'quiet and rest', ro: 'liniște și odihnă' }
    const { onSave, onBack } = renderReflection([result('anxiety', need)], { allowExternalAI: true })

    expect(screen.getByRole('button', { name: need.en })).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: 'Not really' }))

    expect(screen.getByRole('heading', { name: 'The result does not fit' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'What feels most needed right now?' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try one small step' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Explore with AI' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Revise my selection' }))
    expect(onBack).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: 'Finish without a label' }))
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
    })
  })

  it('shows the Google handoff disclosure beside the unchanged external action', () => {
    renderReflection([result('anxiety')], { allowExternalAI: true })

    const link = screen.getByRole('link', { name: 'Explore with AI' })
    expect(link).toHaveAttribute('href', expect.stringContaining('https://www.google.com/search?udm=50&q='))
    expect(screen.getByText(/opens Google AI Mode/i)).toBeInTheDocument()
    expect(screen.getByText(/not a substitute for professional support/i)).toBeInTheDocument()
  })

  it('localizes mismatch recovery in Romanian', async () => {
    const user = userEvent.setup()
    renderReflection([result('anxietate', { en: 'support', ro: 'sprijin' })], { language: 'ro' })

    await user.click(screen.getByRole('button', { name: 'Nu prea' }))
    expect(screen.getByRole('heading', { name: 'Rezultatul nu se potrivește' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Încheiați fără o etichetă' })).toBeInTheDocument()
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
    await user.click(screen.getByRole('button', { name: 'Încheiați fără aceste detalii' }))

    expect(onReturn).toHaveBeenCalledOnce()
  })

  it('makes early local capture explicit and lets the user retry it', async () => {
    const user = userEvent.setup()
    const { onRetryBaseSave } = renderReflection([result('calm')], {
      saveState: 'error',
      sessionCaptured: false,
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Your latest selection has not been saved yet')
    await user.click(screen.getByRole('button', { name: 'Try saving again' }))
    expect(onRetryBaseSave).toHaveBeenCalledOnce()
  })
})
