import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../context/LanguageContext'
import { JournalScreen as JournalView } from '../screens/JournalScreen'
import { useHistoryPage } from '../hooks/useHistoryPage'
import { SessionDetailScreen } from '../screens/SessionDetailScreen'
import { storage } from '../data/storage'
import type { ChainAnalysisEntry, Session } from '../data/types'
import en from '../i18n/en.json'
import ro from '../i18n/ro.json'

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

function JournalScreen(props: Omit<React.ComponentProps<typeof JournalView>, 'pagination'>) {
  const pagination = useHistoryPage(props.sessions.length)
  return <JournalView {...props} pagination={pagination} />
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

  it('bounds the visible history without truncating aggregate evidence', () => {
    const sessions = Array.from({ length: 41 }, (_, index) => bodySession({
      id: `page-${index}`, reflectionAnswer: 'yes',
    }))
    withLanguage(<JournalScreen sessions={sessions} loading={false} {...noExercises}
      saveSessions onOpenSession={vi.fn()} onOpenChain={vi.fn()} />)
    expect(document.querySelectorAll('.journal-list button')).toHaveLength(20)
    expect(document.querySelector('.journal-stats strong')).toHaveTextContent(/^41$/)
    expect(screen.getAllByRole('button', { name: 'Next page' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Next page' }).every((button) => !button.hasAttribute('disabled'))).toBe(true)
  })

  it.each(['en', 'ro'] as const)('supports keyboard paging, direct jumps and shrinking histories (%s)', async (language) => {
    const user = userEvent.setup()
    const copy = language === 'en' ? en : ro
    const entries = Array.from({ length: 41 }, (_, index) => bodySession({ id: `page-${index}` }))
    const onOpenSession = vi.fn()
    const view = (sessions: Session[]) => <JournalScreen sessions={sessions} loading={false} {...noExercises}
      saveSessions onOpenSession={onOpenSession} onOpenChain={vi.fn()} />
    const { rerender } = withLanguage(view(entries), language)
    expect(screen.getAllByRole('button', { name: copy.historyPagination.first })[0]).toBeDisabled()
    const next = screen.getAllByRole('button', { name: copy.historyPagination.next })[1]
    next.focus()
    await user.keyboard('{Enter}')
    expect(document.querySelector('.history-page-summary')).toHaveFocus()
    await user.click(document.querySelector('.journal-list button')!)
    expect(onOpenSession).toHaveBeenLastCalledWith('page-20')
    const input = screen.getAllByRole('spinbutton', { name: copy.historyPagination.page })[0]
    await user.clear(input)
    await user.type(input, '3{Enter}')
    expect(document.querySelectorAll('.journal-list button')).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: copy.historyPagination.next })[0]).toBeDisabled()
    await user.click(document.querySelector('.journal-list button')!)
    expect(onOpenSession).toHaveBeenLastCalledWith('page-40')
    rerender(<LanguageProvider>{view(entries.slice(0, 40))}</LanguageProvider>)
    expect(document.querySelectorAll('.journal-list button')).toHaveLength(20)
    expect(document.querySelector('.history-page-summary')).toHaveFocus()
    expect(screen.getAllByRole('spinbutton')[0]).toHaveValue(2)
    rerender(<LanguageProvider>{view([])}</LanguageProvider>)
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    rerender(<LanguageProvider>{view(entries)}</LanguageProvider>)
    expect(screen.getAllByRole('spinbutton')[0]).toHaveValue(1)
  })

  it.each([
    ['en', 1, '1 different word'], ['en', 19, '19 different words'],
    ['en', 20, '20 different words'], ['en', 101, '101 different words'],
    ['ro', 1, '1 cuvânt diferit'], ['ro', 19, '19 cuvinte diferite'],
    ['ro', 20, '20 de cuvinte diferite'], ['ro', 101, '101 cuvinte diferite'],
  ] as const)('uses count-aware Journal vocabulary copy (%s, %s)', (language, count, expected) => {
    const results = Array.from({ length: count }, (_, index) => ({ id: `word-${index}`,
      label: { en: `word ${index}`, ro: `cuvânt ${index}` }, color: '#555' }))
    const sessions = Array.from({ length: 3 }, (_, index) => bodySession({ id: `s-${index}`, results, reflectionAnswer: 'yes' }))
    withLanguage(<JournalScreen sessions={sessions} loading={false} {...noExercises}
      saveSessions onOpenSession={vi.fn()} onOpenChain={vi.fn()} />, language)
    expect(document.querySelector('.journal-stats')?.children[1]).toHaveTextContent(new RegExp(`^${expected}$`))
  })

  it.each(['en', 'ro'] as const)('renders saved choice IDs in %s without rewriting their original text', (language) => {
    const copy = language === 'en' ? en : ro
    const session = bodySession({ selectedNeedId: 'grounding', nextStepId: 'write',
      selectedNeed: 'Original need snapshot', nextStep: 'Original step snapshot' })
    const before = structuredClone(session)
    withLanguage(<SessionDetailScreen session={session} onBack={vi.fn()} onDelete={vi.fn()} />, language)
    expect(screen.getByText(language === 'en' ? 'grounding' : 'ancorare')).toBeInTheDocument()
    expect(screen.getByText(copy.reflectionScreen.stepWrite)).toBeInTheDocument()
    expect(screen.queryByText('Original need snapshot')).not.toBeInTheDocument()
    expect(screen.queryByText('Original step snapshot')).not.toBeInTheDocument()
    expect(session).toEqual(before)
  })

  it('does not guess IDs or translate legacy strings that happen to match a preset', () => {
    const session = bodySession({ selectedNeed: 'grounding', nextStep: en.reflectionScreen.stepWrite })
    withLanguage(<SessionDetailScreen session={session} onBack={vi.fn()} onDelete={vi.fn()} />, 'ro')
    expect(screen.getByText('grounding')).toBeInTheDocument()
    expect(screen.getByText(en.reflectionScreen.stepWrite)).toBeInTheDocument()
    expect(session.selectedNeedId).toBeUndefined()
  })

  it.each(['en', 'ro'] as const)('includes the visible date in each similar entry accessible name (%s)', (language) => {
    withLanguage(<JournalScreen
      sessions={[bodySession(), bodySession({ id: 'session-2', timestamp: Date.parse('2026-07-24T10:00:00Z') })]}
      loading={false} {...noExercises} saveSessions onOpenSession={vi.fn()} onOpenChain={vi.fn()}
    />, language)
    const entries = document.querySelectorAll('.journal-list button')
    expect(entries).toHaveLength(2)
    const dates = Array.from(entries, (entry) => entry.querySelector('small')!.textContent!)
    expect(dates[0]).not.toBe(dates[1])
    entries.forEach((entry, index) => expect(entry).toHaveAccessibleName(expect.stringContaining(dates[index])))
  })

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

    rerender(<LanguageProvider><JournalScreen {...props} loading={false} chainError /></LanguageProvider>)
    expect(screen.getByRole('alert')).toHaveTextContent('Journal exercises could not be loaded')
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
