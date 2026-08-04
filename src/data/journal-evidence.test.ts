import { describe, expect, it } from 'vitest'
import type { Session } from './types'
import {
  JOURNAL_PATTERN_MIN_SESSIONS,
  hasJournalPatternEvidence,
} from './journal-evidence'

function sessions(count: number): Session[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `session-${index}`,
    timestamp: index,
    modelId: 'quick-check-in',
    entryRoute: 'quick' as const,
    selections: [],
    results: [],
    crisisTier: 'none' as const,
  }))
}

describe('journal pattern evidence', () => {
  it('does not present fewer than three saved check-ins as a pattern', () => {
    expect(JOURNAL_PATTERN_MIN_SESSIONS).toBe(3)
    expect(hasJournalPatternEvidence(sessions(0))).toBe(false)
    expect(hasJournalPatternEvidence(sessions(2))).toBe(false)
  })

  it('allows tentative aggregate observations from three saved check-ins', () => {
    expect(hasJournalPatternEvidence(sessions(3))).toBe(true)
  })
})
