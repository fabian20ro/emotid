import type { Session } from './types'

export const JOURNAL_PATTERN_MIN_SESSIONS = 3

export function hasJournalPatternEvidence(sessions: readonly Session[]): boolean {
  return sessions.length >= JOURNAL_PATTERN_MIN_SESSIONS
}
