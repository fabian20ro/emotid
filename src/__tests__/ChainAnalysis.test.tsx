import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChainAnalysis } from '../components/ChainAnalysis'
import { LanguageProvider } from '../context/LanguageContext'

function renderChain(overrides: Partial<React.ComponentProps<typeof ChainAnalysis>> = {}) {
  const defaults: React.ComponentProps<typeof ChainAnalysis> = {
    isOpen: true,
    onClose: vi.fn(),
    entries: [],
    loading: false,
    onSave: vi.fn().mockResolvedValue(undefined),
    onClearAll: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }

  return {
    ...render(<LanguageProvider><ChainAnalysis {...defaults} /></LanguageProvider>),
    props: defaults,
  }
}

describe('ChainAnalysis', () => {
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

  it('keeps legacy seven-field records readable without rewriting them', () => {
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
    expect(legacyEntry).not.toHaveProperty('version')
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

    rerender(<LanguageProvider><ChainAnalysis isOpen={false} onClose={vi.fn()} entries={[]} loading={false} onSave={vi.fn()} onClearAll={vi.fn()} /></LanguageProvider>)
    expect(screen.queryByTestId('chain-screen')).not.toBeInTheDocument()
  })
})
