import type { Session } from './types'
import { isSessionEligibleForPatterns } from './session-presentation'

export const JOURNAL_SUMMARY_MIN_ENTRIES = 3

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export interface JournalEvidence {
  vocabulary: boolean
  valence: boolean
  somatic: boolean
}

export function getJournalEvidence(
  sessions: readonly Session[],
  nowMs = Date.now(),
): JournalEvidence {
  const eligible = sessions.filter((session) => (
    isSessionEligibleForPatterns(session) && session.results.length > 0
  ))
  const currentValence = eligible.filter((session) => (
    session.timestamp >= nowMs - SEVEN_DAYS_MS
    && session.timestamp <= nowMs
    && session.results.some((result) => result.valence !== undefined)
  ))
  const somatic = sessions.filter((session) => (
    session.modelId === 'somatic' && session.selections.length > 0
  ))

  return {
    vocabulary: eligible.length >= JOURNAL_SUMMARY_MIN_ENTRIES,
    valence: currentValence.length >= JOURNAL_SUMMARY_MIN_ENTRIES,
    somatic: somatic.length >= JOURNAL_SUMMARY_MIN_ENTRIES,
  }
}
