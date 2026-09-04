import type { Session } from './types'
import { getSessionResults, isSessionEligibleForPatterns } from './session-presentation'

export interface ValenceRatio {
  pleasant: number
  unpleasant: number
  neutral: number
  total: number
  weeks: {
    pleasant: number
    unpleasant: number
    neutral: number
    total: number
  }[]
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
const WEEKS = 4

function computeRange(sessions: Session[], start: number, end: number) {
  const inRange = sessions.filter((s) => s.timestamp >= start && s.timestamp < end)
  let pleasant = 0
  let unpleasant = 0
  let neutral = 0

  for (const session of inRange) {
    if (!isSessionEligibleForPatterns(session)) continue
    for (const result of getSessionResults(session)) {
      if (result.valence === undefined) continue

      if (result.valence > 0.1) {
        pleasant++
      } else if (result.valence < -0.1) {
        unpleasant++
      } else {
        neutral++
      }
    }
  }

  return {
    pleasant,
    unpleasant,
    neutral,
    total: pleasant + unpleasant + neutral,
  }
}

export function computeValenceRatio(sessions: Session[], nowMs = Date.now()): ValenceRatio {
  // +1ms so sessions stamped at Date.now() are included in current-week bucket.
  const now = nowMs + 1
  const weeks = []
  for (let i = WEEKS - 1; i >= 0; i--) {
    const end = now - i * SEVEN_DAYS_MS
    const start = end - SEVEN_DAYS_MS
    weeks.push(computeRange(sessions, start, end))
  }

  const currentWeek = weeks[weeks.length - 1] ?? {
    pleasant: 0,
    unpleasant: 0,
    neutral: 0,
    total: 0,
  }

  return {
    pleasant: currentWeek.pleasant,
    unpleasant: currentWeek.unpleasant,
    neutral: currentWeek.neutral,
    total: currentWeek.total,
    weeks,
  }
}
