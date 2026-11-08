import { describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChainAnalysis } from '../components/ChainAnalysis'
import { LanguageProvider } from '../context/LanguageContext'
import { useChainDraft } from '../hooks/useChainDraft'
import type { ChainAnalysisEntry } from '../data/types'

type TestProps = Omit<React.ComponentProps<typeof ChainAnalysis>, 'draft'> & { onSave: (entry: ChainAnalysisEntry) => Promise<void> }
function ChainHarness({ onSave, ...props }: TestProps) {
  const draft = useChainDraft(onSave)
  return <LanguageProvider><ChainAnalysis {...props} draft={draft} /></LanguageProvider>
}

function renderChain(overrides: Partial<TestProps> = {}) {
  const defaults: TestProps = {
    isOpen: true,
    onClose: vi.fn(),
    entries: [],
    loading: false,
    onSave: vi.fn().mockResolvedValue(undefined),
    onClearAll: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }

  return {
    ...render(<ChainHarness {...defaults} />),
    props: defaults,
  }
}

describe('ChainAnalysis', () => {
  it('does not reformat saved history while typing an unrelated draft', async () => {
    const legacyFormat = vi.spyOn(Date.prototype, 'toLocaleString')
    const formatterRead = vi.spyOn(Intl.DateTimeFormat.prototype, 'format', 'get')
    try {
      renderChain({ entries: [{ id: 'old', timestamp: 1, version: 2,
        situation: 'Saved moment', noticed: '', response: '', outcome: '' }] })
      legacyFormat.mockClear()
      formatterRead.mockClear()
      await userEvent.setup().type(screen.getByLabelText('What happened?'), 'abc')
      expect(screen.getByLabelText('What happened?')).toHaveValue('abc')
      expect(screen.getByRole('button', { name: /Saved moment/ })).toBeInTheDocument()
      expect(legacyFormat).not.toHaveBeenCalled()
      expect(formatterRead).not.toHaveBeenCalled()
    } finally { legacyFormat.mockRestore(); formatterRead.mockRestore() }
  })
  it('requires confirmation to discard a draft, without deleting saved entries', async () => {
    const user = userEvent.setup()
    const { props } = renderChain()
    await user.type(screen.getByLabelText('What happened?'), 'Keep until confirmed')
    await user.click(screen.getByRole('button', { name: 'Discard draft' }))
    const dialog = screen.getByRole('dialog', { name: 'Discard this draft?' })
    expect(dialog.parentElement?.parentElement).toBe(document.body)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByLabelText('What happened?')).toHaveValue('Keep until confirmed')
    await user.click(screen.getByRole('button', { name: 'Discard draft' }))
    await user.click(screen.getByRole('dialog').querySelector('button.danger-button')!)
    expect(screen.getByLabelText('What happened?')).toHaveValue('')
    expect(props.onClearAll).not.toHaveBeenCalled()
  })

  it('locks the submitted fields while saving and restores them after failure', async () => {
    let reject!: (error: Error) => void
    const onSave = vi.fn(() => new Promise<void>((_, fail) => { reject = fail }))
    const user = userEvent.setup()
    renderChain({ onSave })
    await user.type(screen.getByLabelText('What happened?'), 'Snapshot')
    await user.click(screen.getByRole('button', { name: 'Save reflection' }))
    expect(screen.getAllByRole('textbox').every((input) => (input as HTMLTextAreaElement).disabled)).toBe(true)
    await act(async () => reject(new Error('retry later')))
    expect(screen.getByLabelText('What happened?')).toBeEnabled()
    expect(screen.getByLabelText('What happened?')).toHaveValue('Snapshot')
  })

  it('preserves the current draft when visiting saved reflections', async () => {
    const user = userEvent.setup()
    renderChain({ entries: [{ id: 'old', timestamp: 1, version: 2, situation: 'Old entry', noticed: '', response: '', outcome: '' }] })
    await user.type(screen.getByLabelText('What happened?'), 'Unfinished thought')
    await user.type(screen.getByLabelText('What did you notice?'), 'Tension')
    await user.click(screen.getByRole('button', { name: 'Read saved reflections' }))
    await user.click(screen.getByRole('button', { name: /Write a new reflection|Continue this draft/ }))
    expect(screen.getByLabelText('What happened?')).toHaveValue('Unfinished thought')
    expect(screen.getByLabelText('What did you notice?')).toHaveValue('Tension')
  })

  it('shows one four-part reflection and requires only what happened', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    renderChain({ onSave })

    expect(screen.getAllByRole('textbox')).toHaveLength(4)
    expect(screen.getByLabelText('What happened?')).toBeRequired()
    expect(screen.getByLabelText('What did you notice?')).not.toBeRequired()
    expect(screen.getByLabelText('What did you do?')).not.toBeRequired()
    expect(screen.getByLabelText('What followed, or what might help next?')).not.toBeRequired()
    expect(screen.getByRole('button', { name: 'Save reflection' })).toBeDisabled()

    await user.type(screen.getByLabelText('What happened?'), 'I received difficult feedback.')
    await user.click(screen.getByRole('button', { name: 'Save reflection' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(onSave.mock.calls[0][0]).toMatchObject({
      version: 2,
      situation: 'I received difficult feedback.',
      noticed: '',
      response: '',
      outcome: '',
    })
  })

  it('saves all optional parts when provided', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    renderChain({ onSave })

    await user.type(screen.getByLabelText('What happened?'), 'A meeting changed suddenly.')
    await user.type(screen.getByLabelText('What did you notice?'), 'Tension, worry, and an urge to leave.')
    await user.type(screen.getByLabelText('What did you do?'), 'I asked for five minutes.')
    await user.type(screen.getByLabelText('What followed, or what might help next?'), 'A short pause helped.')
    await user.click(screen.getByRole('button', { name: 'Save reflection' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1))
    expect(onSave.mock.calls[0][0]).toMatchObject({
      situation: 'A meeting changed suddenly.',
      noticed: 'Tension, worry, and an urge to leave.',
      response: 'I asked for five minutes.',
      outcome: 'A short pause helped.',
    })
  })

  it('keeps legacy seven-field records readable without rewriting them', async () => {
    const legacyEntry = {
      id: 'legacy-1',
      timestamp: Date.now(),
      triggeringEvent: 'message',
      vulnerabilityFactors: 'little sleep',
      promptingEvent: 'feedback',
      emotion: 'anxiety',
      urge: 'avoid',
      action: 'paused',
      consequence: 'felt steadier',
    }
    renderChain({ entries: [legacyEntry] })

    expect(screen.getByText('anxiety')).toBeInTheDocument()
    expect(screen.getByText('felt steadier')).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: /anxiety.*felt steadier/i }))
    for (const text of ['message', 'little sleep', 'feedback', 'anxiety', 'avoid', 'paused', 'felt steadier']) {
      expect(screen.getByText(text, { exact: true })).toBeInTheDocument()
    }
    expect(legacyEntry).not.toHaveProperty('version')
  })

  it('keeps an individual exercise open when deletion fails and never falls back to bulk deletion', async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error('disk unavailable'))
    const onClearAll = vi.fn()
    renderChain({ initialView: 'entries', onDelete, onClearAll, entries: [{
      id: 'one', timestamp: Date.now(), version: 2,
      situation: 'A distinct moment', noticed: 'Tension', response: 'Paused', outcome: 'More time',
    }] })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /A distinct moment/ }))
    await user.click(screen.getByRole('button', { name: 'Delete this exercise', exact: true }))
    await user.click(screen.getByRole('dialog').querySelector('button.danger-button')!)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(onDelete).toHaveBeenCalledWith('one')
    expect(onClearAll).not.toHaveBeenCalled()
    expect(screen.getByText('Tension')).toBeInTheDocument()
  })

  it('shows a new reflection preview using factual entered text', () => {
    renderChain({ entries: [{
      id: 'current-1',
      timestamp: Date.now(),
      version: 2,
      situation: 'A plan changed.',
      noticed: 'I felt tense.',
      response: '',
      outcome: 'A pause might help.',
    }] })

    expect(screen.getByText('A plan changed.')).toBeInTheDocument()
    expect(screen.getByText('A pause might help.')).toBeInTheDocument()
  })

  it('confirms deletion, restores focus on cancel, and clears only after confirmation', async () => {
    const user = userEvent.setup()
    const onClearAll = vi.fn().mockResolvedValue(undefined)
    renderChain({
      entries: [{
        id: 'current-1',
        timestamp: Date.now(),
        version: 2,
        situation: 'A plan changed.',
        noticed: '',
        response: '',
        outcome: '',
      }],
      onClearAll,
    })

    const trigger = screen.getByRole('button', { name: 'Delete journal exercises' })
    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Delete journal exercises?' })
    expect(dialog.parentElement?.parentElement).toBe(document.body)
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    expect(onClearAll).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(trigger).toHaveFocus())
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Delete exercises' }))
    await waitFor(() => expect(onClearAll).toHaveBeenCalledTimes(1))
  })

  it('keeps the confirmation and existing entries when deletion fails', async () => {
    const user = userEvent.setup()
    const onClearAll = vi.fn().mockRejectedValue(new Error('write failed'))
    renderChain({
      entries: [{
        id: 'current-1',
        timestamp: Date.now(),
        version: 2,
        situation: 'A plan changed.',
        noticed: '',
        response: '',
        outcome: '',
      }],
      onClearAll,
    })

    await user.click(screen.getByRole('button', { name: 'Delete journal exercises' }))
    await user.click(screen.getByRole('button', { name: 'Delete exercises' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The journal exercises could not be deleted. Your saved emotion reflections were not changed.',
    )
    expect(screen.getByRole('dialog', { name: 'Delete journal exercises?' })).toBeInTheDocument()
    expect(screen.getByText('A plan changed.')).toBeInTheDocument()
  })

  it('shows an inline alert when saving fails and preserves entered text', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValue(new Error('local write failed'))
    renderChain({ onSave })

    await user.type(screen.getByLabelText('What happened?'), 'A difficult moment.')
    await user.click(screen.getByRole('button', { name: 'Save reflection' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('local write failed')
    expect(screen.getByLabelText('What happened?')).toHaveValue('A difficult moment.')
  })

  it('renders nothing when closed and hides recent entries when empty', () => {
    const { rerender } = renderChain({ entries: [] })
    expect(screen.queryByText('Recent reflections')).not.toBeInTheDocument()

    rerender(<ChainHarness isOpen={false} onClose={vi.fn()} entries={[]} loading={false} onSave={vi.fn()} onClearAll={vi.fn()} />)
    expect(screen.queryByTestId('chain-screen')).not.toBeInTheDocument()
  })
})
