import { describe, it, expect } from 'vitest'
import { computeValenceRatio } from '../data/valence-ratio'
import type { Session } from '../data/types'

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    modelId: 'dimensional',
    selections: [],
    results: [],
    crisisTier: 'none',
    ...overrides,
  }
}

describe('computeValenceRatio', () => {
  it('returns zero counts for empty sessions', () => {
    const result = computeValenceRatio([])
    expect(result.total).toBe(0)
    expect(result.pleasant).toBe(0)
    expect(result.unpleasant).toBe(0)
    expect(result.weeks).toHaveLength(4)
  })

  it('categorizes by valence', () => {
    const sessions = [
      makeSession({
        results: [
          { id: 'happy', label: { ro: 'fericit', en: 'happy' }, color: '#fff', valence: 0.8 },
          { id: 'sad', label: { ro: 'trist', en: 'sad' }, color: '#aaa', valence: -0.6 },
          { id: 'calm', label: { ro: 'calm', en: 'calm' }, color: '#bbb', valence: 0.05 },
        ],
      }),
    ]
    const result = computeValenceRatio(sessions)
    expect(result.pleasant).toBe(1)
    expect(result.unpleasant).toBe(1)
    expect(result.neutral).toBe(1)
    expect(result.total).toBe(3)
    expect(result.weeks[result.weeks.length - 1].total).toBe(3)
  })

  it('excludes generated results until the user confirms their fit', () => {
    const suggestedResult = { id: 'happy', label: { ro: 'fericit', en: 'happy' }, color: '#fff', valence: 0.8 }
    const sessions = [
      makeSession({ entryRoute: 'affect', results: [suggestedResult] }),
      makeSession({ entryRoute: 'body', reflectionAnswer: 'partly', results: [suggestedResult] }),
      makeSession({ entryRoute: 'plutchik', reflectionAnswer: 'no', results: [suggestedResult] }),
      makeSession({ entryRoute: 'affect', reflectionAnswer: 'yes', results: [suggestedResult] }),
    ]

    expect(computeValenceRatio(sessions).pleasant).toBe(1)
  })

  it('excludes sessions older than 7 days', () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000
    const sessions = [
      makeSession({
        timestamp: eightDaysAgo,
        results: [
          { id: 'happy', label: { ro: 'fericit', en: 'happy' }, color: '#fff', valence: 0.8 },
        ],
      }),
    ]
    const result = computeValenceRatio(sessions)
    expect(result.total).toBe(0)
    const historicalTotal = result.weeks.reduce((sum, week) => sum + week.total, 0)
    expect(historicalTotal).toBe(1)
  })

  it('aggregates per-week across the sliding window', () => {
    const now = Date.now()

    // Place sessions at known offsets so each falls into a distinct week bucket.
    // Bucket layout (oldest first): [now-28d, now-21d), [now-21d, now-14d), [now-14d, now-7d), [now-7d, now+1ms).
    const makeTs = (daysAgo: number) => now - daysAgo * 24 * 60 * 60 * 1000

    const sessions = [
      // Week 0 (oldest): one pleasant session.
      makeSession({
        timestamp: makeTs(25),
        results: [{ id: 'w0-pleasant', label: { ro: '', en: '' }, color: '#fff', valence: 0.8 }],
      }),
      // Week 1 (second oldest): one unpleasant + one neutral session.
      makeSession({
        timestamp: makeTs(18),
        results: [
          { id: 'w1-unpleasant', label: { ro: '', en: '' }, color: '#fff', valence: -0.5 },
          { id: 'w1-neutral', label: { ro: '', en: '' }, color: '#fff', valence: 0.0 },
        ],
      }),
      // Week 2 (second newest): two pleasant sessions, one unpleasant session.
      makeSession({
        timestamp: makeTs(10),
        results: [
          { id: 'w2-pleasant-a', label: { ro: '', en: '' }, color: '#fff', valence: 0.9 },
          { id: 'w2-pleasant-b', label: { ro: '', en: '' }, color: '#fff', valence: 0.4 },
          { id: 'w2-unpleasant', label: { ro: '', en: '' }, color: '#fff', valence: -0.3 },
        ],
      }),
      // Week 3 (current): one neutral session, plus a stale outlier far outside the window.
      makeSession({
        timestamp: makeTs(3),
        results: [{ id: 'w3-neutral', label: { ro: '', en: '' }, color: '#fff', valence: 0.0 }],
      }),
      makeSession({
        // 90 days ago — should not leak into any bucket.
        timestamp: makeTs(90),
        results: [{ id: 'stale', label: { ro: '', en: '' }, color: '#fff', valence: 1.0 }],
      }),
    ]

    const result = computeValenceRatio(sessions)

    // Each bucket should contain only the sessions placed in that window.
    expect(result.weeks[0].total).toBe(1)
    expect(result.weeks[0].pleasant).toBe(1)
    expect(result.weeks[1].total).toBe(2)
    expect(result.weeks[1].unpleasant).toBe(1)
    expect(result.weeks[1].neutral).toBe(1)
    expect(result.weeks[2].total).toBe(3)
    expect(result.weeks[2].pleasant).toBe(2)
    expect(result.weeks[2].unpleasant).toBe(1)
    // Current week: only the 3-days-ago session (the 90-day one is out of range).
    expect(result.weeks[3].total).toBe(1)
    expect(result.weeks[3].neutral).toBe(1)

    // `total` returns the current-week total (not a grand sum across weeks).
    expect(result.total).toBe(1)

    // Cross-week aggregation: all four buckets combined.
    const historicalTotal = result.weeks.reduce((sum: number, week: { total: number }) => sum + week.total, 0)
    expect(historicalTotal).toBe(7)
  })

  it('handles boundary conditions around 0.1 and -0.1', () => {
    const sessions = [
      makeSession({
        results: [
          { id: 'val-0.1', label: { ro: 'val', en: 'val' }, color: '#fff', valence: 0.1 },
          { id: 'val-neg-0.1', label: { ro: 'val', en: 'val' }, color: '#fff', valence: -0.1 },
          { id: 'val-pos-0.11', label: { ro: 'val', en: 'val' }, color: '#fff', valence: 0.11 },
          { id: 'val-neg-0.11', label: { ro: 'val', en: 'val' }, color: '#fff', valence: -0.11 },
          { id: 'val-0', label: { ro: 'val', en: 'val' }, color: '#fff', valence: 0 },
        ],
      }),
    ]
    const result = computeValenceRatio(sessions)
    // 0.1 -> neutral
    // -0.1 -> neutral
    // 0.11 -> pleasant
    // -0.11 -> unpleasant
    // 0 -> neutral
    expect(result.pleasant).toBe(1)
    expect(result.unpleasant).toBe(1)
    expect(result.neutral).toBe(3)
    expect(result.total).toBe(5)
  })

})
