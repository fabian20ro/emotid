import { expect, it } from 'vitest'
import { getResultRelationship, getSessionResults, isSessionEligibleForPatterns } from '../data/session-policy'
import type { Session } from '../data/types'

const base: Session = {
  id: 'session', timestamp: 1, modelId: 'wheel', selections: [], crisisTier: 'none',
  results: ['happy', 'sad'].map((id) => ({ id, label: { en: id, ro: id }, color: '#000' })),
}

it.each<{ name: string; change: Partial<Session>; relationship: string; eligible: boolean }>([
  { name: 'legacy', change: {}, relationship: 'legacy', eligible: true },
  { name: 'quick', change: { entryRoute: 'quick' }, relationship: 'named', eligible: true },
  { name: 'words', change: { entryRoute: 'words' }, relationship: 'named', eligible: true },
  ...(['affect', 'body', 'plutchik'] as const).map((entryRoute) => ({
    name: entryRoute, change: { entryRoute }, relationship: 'suggested', eligible: false,
  })),
  { name: 'confirmed', change: { reflectionAnswer: 'yes' }, relationship: 'fit', eligible: true },
  { name: 'partial without chosen IDs', change: { reflectionAnswer: 'partly' }, relationship: 'partial', eligible: false },
  { name: 'partial with chosen IDs', change: { reflectionAnswer: 'partly', selectedResultIds: ['sad'] }, relationship: 'partial', eligible: true },
  { name: 'rejected overrides chosen IDs', change: { reflectionAnswer: 'no', selectedResultIds: ['sad'] }, relationship: 'rejected', eligible: false },
  { name: 'empty acceptance overrides yes', change: { reflectionAnswer: 'yes', selectedResultIds: [] }, relationship: 'rejected', eligible: false },
  { name: 'observation', change: { entryRoute: 'body', outcome: 'body-observation', results: [] }, relationship: 'observation', eligible: false },
])('$name retains its relationship and pattern eligibility', ({ change, relationship, eligible }) => {
  const session = { ...base, ...change }
  const before = structuredClone(session)
  expect(getResultRelationship(session)).toBe(relationship)
  expect(isSessionEligibleForPatterns(session)).toBe(eligible)
  expect(session).toEqual(before)
})

it('filters chosen results in original order without rewriting the stored suggestions', () => {
  expect(getSessionResults(base).map((result) => result.id)).toEqual(['happy', 'sad'])
  expect(getSessionResults({ ...base, selectedResultIds: [] })).toEqual([])
  expect(getSessionResults({ ...base, selectedResultIds: ['sad'] }).map((result) => result.id)).toEqual(['sad'])
  expect(getSessionResults({ ...base, selectedResultIds: ['sad', 'happy'] }).map((result) => result.id)).toEqual(['happy', 'sad'])
  expect(base.results.map((result) => result.id)).toEqual(['happy', 'sad'])
})
