import { expect, it } from 'vitest'
import { createSession } from '../data/session'
import { decodeSessions } from '../data/record-validation'
import { getSessionResults, isSessionEligibleForPatterns } from '../data/session-presentation'
import { computeVocabulary } from '../data/vocabulary'
import { computeValenceRatio } from '../data/valence-ratio'

const results = ['love', 'pride', 'tenderness', 'gratitude'].map((id) => ({
  id, label: { en: id, ro: id }, color: '#000000', valence: 0.6,
}))
const base = createSession({ route: 'body', modelId: 'somatic', selections: [results[0]], results })

it('counts only explicitly chosen words while retaining all original suggestions', () => {
  const session = { ...base, reflectionAnswer: 'partly' as const, selectedResultIds: ['gratitude'] }
  expect(decodeSessions([session])).toEqual([session])
  expect(session.results).toHaveLength(4)
  expect(getSessionResults(session).map((result) => result.id)).toEqual(['gratitude'])
  expect(isSessionEligibleForPatterns(session)).toBe(true)
  expect(computeVocabulary([session]).topActiveEmotions.map((result) => result.id)).toEqual(['gratitude'])
  expect(computeValenceRatio([session]).total).toBe(1)
})

it('distinguishes untouched, none, rejected and legacy global answers', () => {
  expect(isSessionEligibleForPatterns(base)).toBe(false)
  expect(isSessionEligibleForPatterns({ ...base, reflectionAnswer: 'partly' })).toBe(false)
  expect(isSessionEligibleForPatterns({ ...base, reflectionAnswer: 'yes' })).toBe(true)
  expect(isSessionEligibleForPatterns({ ...base, reflectionAnswer: 'yes', selectedResultIds: [] })).toBe(false)
  expect(isSessionEligibleForPatterns({ ...base, reflectionAnswer: 'no', selectedResultIds: ['gratitude'] })).toBe(false)
})

it('rejects unknown, duplicate and malformed accepted IDs', () => {
  for (const selectedResultIds of [['unknown'], ['gratitude', 'gratitude'], [4], 'gratitude']) {
    expect(() => decodeSessions([{ ...base, selectedResultIds }])).toThrow()
  }
})
