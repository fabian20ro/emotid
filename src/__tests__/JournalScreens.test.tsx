import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import { JournalScreen } from '../screens/JournalScreen'
import { SessionDetailScreen } from '../screens/SessionDetailScreen'
import { storage } from '../data/storage'
import type { ChainAnalysisEntry, Session } from '../data/types'

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

const noExercises = {
  chainEntries: [] as ChainAnalysisEntry[],
  chainLoading: false,
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
        {...noExercises}
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
        {...noExercises}
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
      ...noExercises,
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

    rerender(<LanguageProvider><JournalScreen {...props} loading={false} chainLoading /></LanguageProvider>)
    expect(screen.getByRole('status')).toHaveTextContent('Loading journal exercises')
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

  it('presents rejected results as suggestions in the Journal and saved detail', () => {
    const rejected = bodySession({ reflectionAnswer: 'no', selectedNeed: undefined, nextStep: undefined })
    const { unmount } = withLanguage(
      <JournalScreen
        sessions={[rejected]}
        loading={false}
        {...noExercises}
        saveSessions
        onOpenSession={vi.fn()}
        onOpenChain={vi.fn()}
      />,
    )

    expect(screen.getByText('Suggested result: anxiety')).toBeInTheDocument()
    expect(screen.getByText('Did not fit')).toBeInTheDocument()
    expect(screen.queryByText('anxiety', { exact: true })).not.toBeInTheDocument()

    unmount()
    withLanguage(<SessionDetailScreen session={rejected} onBack={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Suggested result that did not fit')).toBeInTheDocument()
    expect(screen.getByText('anxiety', { exact: true })).toBeInTheDocument()
  })

  it('shows summaries only when their own evidence threshold is met', () => {
    const props = {
      loading: false,
      ...noExercises,
      saveSessions: true,
      onOpenSession: vi.fn(),
      onOpenChain: vi.fn(),
    }
    const unrelatedSessions = [0, 1, 2].map((index) => bodySession({
      id: `quick-${index}`,
      timestamp: Date.now() - index,
      modelId: 'quick-check-in',
      entryRoute: 'quick',
      selections: [{ emotionId: 'joy', label: { ro: 'bucurie', en: 'joy' } }],
      results: [{ id: 'joy', label: { ro: 'bucurie', en: 'joy' }, color: '#f00', valence: 0.8 }],
      reflectionAnswer: undefined,
    }))
    const oneBodySession = bodySession({ id: 'body-1', timestamp: Date.now() })
    const { rerender } = withLanguage(
      <JournalScreen {...props} sessions={[...unrelatedSessions, oneBodySession]} />,
    )

    expect(screen.getByRole('heading', { name: 'Observations from your reflections' })).toBeInTheDocument()
    expect(document.querySelector('.journal-stats')).toBeInTheDocument()
    expect(screen.queryByText('Body observations')).not.toBeInTheDocument()

    rerender(
      <LanguageProvider>
        <JournalScreen
          {...props}
          sessions={[
            ...unrelatedSessions,
            oneBodySession,
            bodySession({ id: 'body-2', timestamp: Date.now() - 1 }),
            bodySession({ id: 'body-3', timestamp: Date.now() - 2 }),
          ]}
        />
      </LanguageProvider>,
    )

    expect(screen.getByText('Body observations')).toBeInTheDocument()
    expect(screen.getByText('Chest (3)')).toBeInTheDocument()
  })

  it('shows the latest journal exercise and opens the existing exercise screen', async () => {
    const user = userEvent.setup()
    const onOpenChain = vi.fn()
    const entries: ChainAnalysisEntry[] = [
      {
        id: 'older',
        timestamp: new Date('2026-07-20T10:00:00Z').getTime(),
        version: 2,
        situation: 'An older moment',
        noticed: '',
        response: '',
        outcome: '',
      },
      {
        id: 'latest',
        timestamp: new Date('2026-07-24T10:00:00Z').getTime(),
        version: 2,
        situation: 'A difficult message',
        noticed: '',
        response: '',
        outcome: '',
      },
    ]

    withLanguage(
      <JournalScreen
        sessions={[]}
        loading={false}
        chainEntries={entries}
        chainLoading={false}
        saveSessions
        onOpenSession={vi.fn()}
        onOpenChain={onOpenChain}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Journal exercises' })).toBeInTheDocument()
    expect(screen.getByText('A difficult message')).toBeInTheDocument()
    expect(screen.queryByText('An older moment')).not.toBeInTheDocument()
    expect(screen.getByText('No saved emotion reflections yet')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /open journal exercises.*a difficult message/i }))
    expect(onOpenChain).toHaveBeenCalledOnce()
  })

  it('keeps Unpack a moment as the journal exercise empty state', () => {
    withLanguage(
      <JournalScreen
        sessions={[]}
        loading={false}
        {...noExercises}
        saveSessions
        onOpenSession={vi.fn()}
        onOpenChain={vi.fn()}
      />,
    )

    expect(screen.queryByRole('heading', { name: 'Journal exercises' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unpack a moment' })).toBeInTheDocument()
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
