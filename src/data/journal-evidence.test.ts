import { describe, expect, it } from 'vitest'
import type { Session } from './types'
import {
  JOURNAL_SUMMARY_MIN_ENTRIES,
  getJournalEvidence,
} from './journal-evidence'

const NOW = new Date('2026-08-13T12:00:00Z').getTime()

function session(index: number, overrides: Partial<Session> = {}): Session {
  return {
    id: `session-${index}`,
    timestamp: NOW - index * 1_000,
    modelId: 'quick-check-in',
    entryRoute: 'quick',
    selections: [{ emotionId: 'calm', label: { ro: 'calm', en: 'calm' } }],
    results: [{ id: 'calm', label: { ro: 'calm', en: 'calm' }, color: '#fff', valence: 0.5 }],
    crisisTier: 'none',
    ...overrides,
  }
}

describe('Journal evidence policy', () => {
  it('requires three relevant entries for each summary', () => {
    expect(JOURNAL_SUMMARY_MIN_ENTRIES).toBe(3)
    expect(getJournalEvidence([session(0), session(1)], NOW)).toEqual({
      vocabulary: false,
      valence: false,
      somatic: false,
    })
  })

  it('unlocks vocabulary and weekly valence from three eligible current entries', () => {
    expect(getJournalEvidence([session(0), session(1), session(2)], NOW)).toEqual({
      vocabulary: true,
      valence: true,
      somatic: false,
    })
  })

  it('does not count rejected or unconfirmed suggestions as vocabulary or valence evidence', () => {
    const sessions = [
      session(0),
      session(1, { entryRoute: 'affect', reflectionAnswer: 'no' }),
      session(2, { entryRoute: 'body', reflectionAnswer: undefined }),
    ]

    expect(getJournalEvidence(sessions, NOW)).toEqual({
      vocabulary: false,
      valence: false,
      somatic: false,
    })
  })

  it('requires three current entries rather than three valence labels in one entry', () => {
    const multiResult = session(0, {
      results: [
        { id: 'calm', label: { ro: 'calm', en: 'calm' }, color: '#fff', valence: 0.5 },
        { id: 'joy', label: { ro: 'bucurie', en: 'joy' }, color: '#fff', valence: 0.8 },
        { id: 'sad', label: { ro: 'trist', en: 'sad' }, color: '#fff', valence: -0.5 },
      ],
    })

    expect(getJournalEvidence([multiResult], NOW).valence).toBe(false)
  })

  it('does not unlock body observations from unrelated entries', () => {
    const somatic = session(10, {
      modelId: 'somatic',
      entryRoute: 'body',
      reflectionAnswer: 'partly',
      selections: [{
        emotionId: 'chest',
        label: { ro: 'Piept', en: 'Chest' },
        extras: { sensationType: 'tension', intensity: 2 },
      }],
    })

    expect(getJournalEvidence([
      session(0), session(1), session(2), session(3), somatic,
    ], NOW).somatic).toBe(false)
  })

  it('unlocks body observations from three body entries with selected regions', () => {
    const sessions = [0, 1, 2].map((index) => session(index, {
      modelId: 'somatic',
      entryRoute: 'body',
      reflectionAnswer: 'partly',
      selections: [{
        emotionId: 'chest',
        label: { ro: 'Piept', en: 'Chest' },
        extras: { sensationType: 'tension', intensity: 2 },
      }],
    }))

    expect(getJournalEvidence(sessions, NOW).somatic).toBe(true)
  })
})
