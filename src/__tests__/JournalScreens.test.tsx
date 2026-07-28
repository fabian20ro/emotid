import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('localizes stored body region patterns from raw IDs', () => {
    withLanguage(
      <JournalScreen
        sessions={[bodySession()]}
        loading={false}
        saveSessions
        onOpenSession={vi.fn()}
        onOpenChain={vi.fn()}
      />,
      'ro',
    )

    expect(screen.getByText('Piept (1)')).toBeInTheDocument()
    expect(screen.queryByText('chest (1)')).not.toBeInTheDocument()
  })

  it('shows explicit loading, error, and empty states', () => {
    const props = {
      sessions: [],
      saveSessions: true,
      onOpenSession: vi.fn(),
      onOpenChain: vi.fn(),
    }
    const { rerender } = withLanguage(<JournalScreen {...props} loading />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading saved check-ins')

    rerender(<LanguageProvider><JournalScreen {...props} loading={false} error /></LanguageProvider>)
    expect(screen.getByRole('alert')).toHaveTextContent('Saved check-ins could not be loaded')

    rerender(<LanguageProvider><JournalScreen {...props} loading={false} /></LanguageProvider>)
    expect(screen.getByText('No saved check-ins yet')).toBeInTheDocument()
  })

  it('shows localized body signals, selected need, and next step without mutating the record', () => {
    const session = bodySession()
    const before = structuredClone(session)
    withLanguage(<SessionDetailScreen session={session} onBack={vi.fn()} />, 'ro')

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
    withLanguage(<SessionDetailScreen session={oldSession} onBack={vi.fn()} />)

    expect(screen.getByText('anxiety')).toBeInTheDocument()
    expect(screen.getByText('This check-in was saved before these details were available.')).toBeInTheDocument()
  })

  it('labels generated results as possibilities until the user confirms fit', () => {
    withLanguage(<SessionDetailScreen session={bodySession({
      reflectionAnswer: undefined,
      selectedNeed: undefined,
      nextStep: undefined,
    })} onBack={vi.fn()} />)

    expect(screen.getByText('Possible words')).toBeInTheDocument()
    expect(screen.queryByText(/optional reflection details/i)).not.toBeInTheDocument()
  })
})
