import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import { JournalScreen } from '../screens/JournalScreen'
import { SessionDetailScreen } from '../screens/SessionDetailScreen'
import { storage } from '../data/storage'
import type { Session } from '../data/types'

function bodySession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    timestamp: new Date('2026-07-23T10:00:00Z').getTime(),
    modelId: 'somatic',
    entryRoute: 'body',
    selections: [{
      emotionId: 'chest',
      label: { ro: 'Piept vechi', en: 'Old chest label' },
      extras: { sensationType: 'tension', intensity: 2 },
    }],
    results: [{ id: 'anxiety', label: { ro: 'anxietate', en: 'anxiety' }, color: '#f00' }],
    crisisTier: 'none',
    reflectionAnswer: 'partly',
    selectedNeed: 'siguranță',
    nextStep: 'Trei respirații lente.',
    ...overrides,
  }
}

function withLanguage(ui: React.ReactNode, language: 'en' | 'ro' = 'en') {
  storage.set('language', language)
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

describe('Journal data display', () => {
  beforeEach(() => localStorage.clear())

  it('shows corrected canonical labels for records saved with older copy', () => {
    withLanguage(
      <JournalScreen
        sessions={[bodySession({
          results: [{ id: 'overwhelmed', label: { ro: 'Coplesit', en: 'Overwhelmed' }, color: '#f00' }],
        })]}
        loading={false}
        saveSessions
        onOpenSession={vi.fn()}
        onOpenChain={vi.fn()}
      />,
      'ro',
    )

    expect(screen.getByText('Copleșit')).toBeInTheDocument()
    expect(screen.queryByText('Coplesit')).not.toBeInTheDocument()
  })

  it('localizes stored body region patterns from raw IDs', () => {
    withLanguage(
      <JournalScreen
        sessions={[
          bodySession(),
          bodySession({ id: 'session-2' }),
          bodySession({ id: 'session-3' }),
        ]}
        loading={false}
        saveSessions
        onOpenSession={vi.fn()}
        onOpenChain={vi.fn()}
      />,
      'ro',
    )

    expect(screen.getByText('Piept (3)')).toBeInTheDocument()
    expect(screen.queryByText('chest (3)')).not.toBeInTheDocument()
  })

  it('shows explicit loading, error, and empty states', () => {
    const props = {
      sessions: [],
      saveSessions: true,
      onOpenSession: vi.fn(),
      onOpenChain: vi.fn(),
    }
    const { rerender } = withLanguage(<JournalScreen {...props} loading />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading saved reflections')

    rerender(<LanguageProvider><JournalScreen {...props} loading={false} error /></LanguageProvider>)
    expect(screen.getByRole('alert')).toHaveTextContent('Saved reflections could not be loaded')

    rerender(<LanguageProvider><JournalScreen {...props} loading={false} /></LanguageProvider>)
    expect(screen.getByText('No saved reflections yet')).toBeInTheDocument()
  })

  it('shows localized body signals, selected need, and next step without mutating the record', () => {
    const session = bodySession()
    const before = structuredClone(session)
    withLanguage(<SessionDetailScreen session={session} onBack={vi.fn()} onDelete={vi.fn()} />, 'ro')

    expect(screen.getByText('Semnale corporale')).toBeInTheDocument()
    expect(screen.getByText('Piept')).toBeInTheDocument()
    expect(screen.getByText('Tensiune · Moderată')).toBeInTheDocument()
    expect(screen.getByText('siguranță')).toBeInTheDocument()
    expect(screen.getByText('Trei respirații lente.')).toBeInTheDocument()
    expect(session).toEqual(before)
  })

  it('keeps older records without optional detail fields readable', () => {
    const oldSession = bodySession({
      entryRoute: undefined,
      selections: [{ emotionId: 'legacy-region', label: { ro: 'Zonă veche', en: 'Legacy region' } }],
      reflectionAnswer: undefined,
      selectedNeed: undefined,
      nextStep: undefined,
    })
    withLanguage(<SessionDetailScreen session={oldSession} onBack={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('anxiety')).toBeInTheDocument()
    expect(screen.getByText('This reflection was saved before these details were available.')).toBeInTheDocument()
  })

  it('labels generated results as possibilities until the user confirms fit', () => {
    withLanguage(<SessionDetailScreen session={bodySession({
      reflectionAnswer: undefined,
      selectedNeed: undefined,
      nextStep: undefined,
    })} onBack={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('Possible words')).toBeInTheDocument()
    expect(screen.queryByText(/optional reflection details/i)).not.toBeInTheDocument()
  })

  it('keeps sparse history as individual entries instead of presenting patterns', () => {
    const props = {
      loading: false,
      saveSessions: true,
      onOpenSession: vi.fn(),
      onOpenChain: vi.fn(),
    }
    const { rerender } = withLanguage(
      <JournalScreen {...props} sessions={[bodySession(), bodySession({ id: 'session-2' })]} />,
    )

    expect(screen.getByRole('heading', { name: 'Your first reflections' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'What has appeared so far' })).not.toBeInTheDocument()
    expect(document.querySelector('.journal-stats')).not.toBeInTheDocument()

    rerender(
      <LanguageProvider>
        <JournalScreen
          {...props}
          sessions={[
            bodySession(),
            bodySession({ id: 'session-2' }),
            bodySession({ id: 'session-3' }),
          ]}
        />
      </LanguageProvider>,
    )

    expect(screen.getByRole('heading', { name: 'What has appeared so far' })).toBeInTheDocument()
    expect(document.querySelector('.journal-stats')).toBeInTheDocument()
  })

  it('deletes only after confirmation and restores focus when cancelled', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn().mockResolvedValue(undefined)
    withLanguage(<SessionDetailScreen session={bodySession()} onBack={vi.fn()} onDelete={onDelete} />)

    const trigger = screen.getByRole('button', { name: 'Delete this reflection' })
    await user.click(trigger)

    const dialog = screen.getByRole('dialog', { name: 'Delete this reflection?' })
    expect(dialog.parentElement?.parentElement).toBe(document.body)
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    expect(onDelete).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(onDelete).not.toHaveBeenCalled()

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Delete reflection' }))
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('session-1'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps the confirmation available when deletion fails', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn().mockRejectedValue(new Error('write failed'))
    withLanguage(<SessionDetailScreen session={bodySession()} onBack={vi.fn()} onDelete={onDelete} />)

    await user.click(screen.getByRole('button', { name: 'Delete this reflection' }))
    await user.click(screen.getByRole('button', { name: 'Delete reflection' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This reflection could not be deleted. Your other entries were not changed.',
    )
    expect(screen.getByRole('dialog', { name: 'Delete this reflection?' })).toBeInTheDocument()
  })
})
