import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReflectionScreen } from '../screens/ReflectionScreen'
import { LanguageProvider } from '../context/LanguageContext'
import { storage } from '../data/storage'
import type { AnalysisResult } from '../models/types'
import type { CheckInCompletion } from '../navigation/types'

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
  } = {},
) {
  storage.set('language', options.language ?? 'en')
  const onSave = vi.fn()
  const onBack = vi.fn()
  render(
    <LanguageProvider>
      <ReflectionScreen
        completion={completion(results, options.crisisTier)}
        saveSessions={options.saveSessions ?? true}
        allowExternalAI={options.allowExternalAI ?? false}
        onBack={onBack}
        onSave={onSave}
        onReturn={vi.fn()}
      />
    </LanguageProvider>,
  )
  return { onSave, onBack }
}

describe('ReflectionScreen need selection', () => {
  beforeEach(() => localStorage.clear())

  it('omits need selection and saves no need when none are inferred', async () => {
    const user = userEvent.setup()
    const { onSave } = renderReflection([result('calm')])

    expect(screen.queryByRole('group', { name: 'What feels most needed right now?' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Done for now' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ selectedNeed: undefined }))
  })

  it('preselects the only inferred need and persists it', async () => {
    const user = userEvent.setup()
    const need = { en: 'quiet and rest', ro: 'liniște și odihnă' }
    const { onSave } = renderReflection([result('tired', need)])
    const option = screen.getByRole('button', { name: need.en })

    expect(option).toHaveAttribute('aria-pressed', 'true')
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
    const { onSave } = renderReflection(
      [result('obosit', first), result('trist', second)],
      { language: 'ro', saveSessions: false },
    )
    const option = screen.getByRole('button', { name: second.ro })

    option.focus()
    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: 'Gata pentru acum' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ selectedNeed: second.ro }))
    expect(screen.getByText('Această verificare nu a fost salvată')).toBeInTheDocument()
  })

  it('keeps every need control behind tier-4 acknowledgement', async () => {
    const user = userEvent.setup()
    const need = { en: 'immediate support', ro: 'sprijin imediat' }
    renderReflection([result('despair', need)], { crisisTier: 'tier4' })

    expect(screen.queryByRole('group', { name: 'What feels most needed right now?' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue to reflection' }))

    expect(screen.getByRole('group', { name: 'What feels most needed right now?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: need.en })).toHaveAttribute('aria-pressed', 'true')
  })

  it('clears inferred content and saves no inferred detail when the result is rejected', async () => {
    const user = userEvent.setup()
    const need = { en: 'quiet and rest', ro: 'liniște și odihnă' }
    const { onSave, onBack } = renderReflection([result('anxiety', need)], { allowExternalAI: true })

    expect(screen.getByRole('button', { name: need.en })).toHaveAttribute('aria-pressed', 'true')
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
    expect(screen.getByRole('status')).toHaveTextContent(/treating these as possibilities/i)
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
})
