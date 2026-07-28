import { describe, it, expect } from 'vitest'
import { computeVocabulary } from '../data/vocabulary'
import type { Session } from '../data/types'

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    modelId: 'wheel',
    selections: [{ emotionId: 'happy', label: { ro: 'fericit', en: 'happy' } }],
    results: [
      { id: 'happy', label: { ro: 'fericit', en: 'happy' }, color: '#fff' },
    ],
    crisisTier: 'none',
    ...overrides,
  }
}

describe('computeVocabulary', () => {
  it('returns zero counts for empty sessions', () => {
    const result = computeVocabulary([])
    expect(result.uniqueEmotionCount).toBe(0)
    expect(result.activeUniqueEmotionCount).toBe(0)
    expect(result.passiveUniqueEmotionCount).toBe(0)
    expect(result.modelsUsed).toBe(0)
    expect(result.totalSessions).toBe(0)
    expect(result.topActiveEmotions).toEqual([])
    expect(result.milestone).toBeNull()
  })

  it('counts unique emotions across sessions', () => {
    const sessions = [
      makeSession({ results: [{ id: 'happy', label: { ro: 'fericit', en: 'happy' }, color: '#fff' }] }),
      makeSession({ results: [{ id: 'happy', label: { ro: 'fericit', en: 'happy' }, color: '#fff' }, { id: 'sad', label: { ro: 'trist', en: 'sad' }, color: '#aaa' }] }),
      makeSession({ modelId: 'somatic', results: [{ id: 'anger', label: { ro: 'furie', en: 'anger' }, color: '#f00' }] }),
    ]
    const result = computeVocabulary(sessions)
    expect(result.uniqueEmotionCount).toBe(3)
    expect(result.activeUniqueEmotionCount).toBe(3)
    expect(result.passiveUniqueEmotionCount).toBe(0)
    expect(result.modelsUsed).toBe(2)
    expect(result.totalSessions).toBe(3)
    expect(result.perModel['wheel']).toBe(2)
    expect(result.perModel['somatic']).toBe(1)
  })

  it('excludes unconfirmed and rejected suggestions from emotion patterns', () => {
    const sessions = [
      makeSession({ modelId: 'affect', entryRoute: 'affect', reflectionAnswer: undefined }),
      makeSession({ modelId: 'body', entryRoute: 'body', reflectionAnswer: 'partly' }),
      makeSession({ modelId: 'plutchik', entryRoute: 'plutchik', reflectionAnswer: 'no' }),
      makeSession({ entryRoute: 'affect', reflectionAnswer: 'yes' }),
    ]

    const result = computeVocabulary(sessions)

    expect(result.uniqueEmotionCount).toBe(1)
    expect(result.topActiveEmotions).toEqual([
      { id: 'happy', count: 1, label: { ro: 'fericit', en: 'happy' } },
    ])
    expect(result.passiveUniqueEmotionCount).toBe(0)
    expect(result.modelsUsed).toBe(1)
    expect(result.perModel).toEqual({ wheel: 1 })
  })

  it('tracks passive emotions that are selected but never surfaced in results', () => {
    const sessions = [
      makeSession({
        selections: [
          { emotionId: 'happy', label: { ro: 'fericit', en: 'happy' } },
          { emotionId: 'sad', label: { ro: 'trist', en: 'sad' } },
        ],
        results: [{ id: 'happy', label: { ro: 'fericit', en: 'happy' }, color: '#fff' }],
      }),
      makeSession({
        selections: [
          { emotionId: 'anger', label: { ro: 'furie', en: 'anger' } },
          { emotionId: 'shame', label: { ro: 'rusine', en: 'shame' } },
        ],
        results: [{ id: 'anger', label: { ro: 'furie', en: 'anger' }, color: '#f00' }],
      }),
    ]

    const result = computeVocabulary(sessions)

    expect(result.activeUniqueEmotionCount).toBe(2)
    expect(result.passiveUniqueEmotionCount).toBe(2)
    expect(result.uniqueEmotionCount).toBe(2)
  })

  it('returns the most-identified active emotions sorted by frequency', () => {
    const sessions = [
      makeSession({ results: [{ id: 'happy', label: { ro: 'fericit', en: 'happy' }, color: '#fff' }] }),
      makeSession({ results: [{ id: 'anger', label: { ro: 'furie', en: 'anger' }, color: '#f00' }] }),
      makeSession({ results: [{ id: 'happy', label: { ro: 'fericit', en: 'happy' }, color: '#fff' }] }),
      makeSession({ results: [{ id: 'fear', label: { ro: 'frica', en: 'fear' }, color: '#aaa' }] }),
      makeSession({ results: [{ id: 'happy', label: { ro: 'fericit', en: 'happy' }, color: '#fff' }] }),
    ]

    const result = computeVocabulary(sessions)

    expect(result.topActiveEmotions.slice(0, 3)).toEqual([
      { id: 'happy', count: 3, label: { ro: 'fericit', en: 'happy' } },
      { id: 'anger', count: 1, label: { ro: 'furie', en: 'anger' } },
      { id: 'fear', count: 1, label: { ro: 'frica', en: 'fear' } },
    ])
  })

  it('returns milestone when threshold reached', () => {
    const results = Array.from({ length: 5 }, (_, i) => ({
      id: `emotion-${i}`,
      label: { ro: `em-${i}`, en: `em-${i}` },
      color: '#fff',
    }))
    const sessions = [makeSession({ results })]
    const result = computeVocabulary(sessions)
    expect(result.milestone).toEqual({ type: 'emotions', count: 5 })
  })

  it('breaks ties in topActiveEmotions by English label using localeCompare', () => {
    const sessions = [
      makeSession({ results: [{ id: 'zebra', label: { ro: 'z', en: 'zebra' }, color: '#fff' }] }),
      makeSession({ results: [{ id: 'apple', label: { ro: 'a', en: 'apple' }, color: '#fff' }] }),
      makeSession({ results: [{ id: 'banana', label: { ro: 'b', en: 'banana' }, color: '#fff' }] }),
    ]

    const result = computeVocabulary(sessions)

    expect(result.topActiveEmotions.map((e) => e.id)).toEqual(['apple', 'banana', 'zebra'])
  })

  it('prefers model milestone when emotion count is below threshold 10', () => {
    // 4 sessions from 2 models, only 3 unique active emotions (below 5-threshold milestone)
    const sessions = [
      makeSession({ modelId: 'wheel', results: [{ id: 'a', label: { ro: 'A', en: 'A' }, color: '#fff' }] }),
      makeSession({ modelId: 'wheel', results: [{ id: 'b', label: { ro: 'B', en: 'B' }, color: '#fff' }] }),
      makeSession({ modelId: 'somatic', results: [{ id: 'c', label: { ro: 'C', en: 'C' }, color: '#aaa' }] }),
      makeSession({ modelId: 'somatic', results: [] }),
    ]

    const result = computeVocabulary(sessions)

    // 2 models -> milestone at count=2; emotion count is 3 which is below 5 (first EMOTION_MILESTONE)
    expect(result.milestone).toEqual({ type: 'models', count: 2 })
    expect(result.uniqueEmotionCount).toBe(3)
    expect(result.modelsUsed).toBe(2)
  })

  it('tracks perModel counts correctly across multiple sessions and models', () => {
    const sessions = [
      makeSession({ modelId: 'wheel', results: [{ id: 'a', label: { ro: 'A', en: 'A' }, color: '#fff' }] }),
      makeSession({ modelId: 'wheel', results: [{ id: 'b', label: { ro: 'B', en: 'B' }, color: '#fff' }] }),
      makeSession({ modelId: 'somatic', results: [{ id: 'a', label: { ro: 'A', en: 'A' }, color: '#aaa' }, { id: 'c', label: { ro: 'C', en: 'C' }, color: '#bbb' }] }),
    ]

    const result = computeVocabulary(sessions)

    expect(result.perModel['wheel']).toBe(2)
    expect(result.perModel['somatic']).toBe(2)
    expect(result.uniqueEmotionCount).toBe(3) // a, b, c all active across models
  })

  it('limits topActiveEmotions to at most 15 entries', () => {
    const sessions = Array.from({ length: 20 }, (_, i) => ({
      id: `emo-${i}`,
      modelId: 'wheel',
      selections: [],
      results: [{ id: `emo-${i}`, label: { ro: `r${i}`, en: `e${i}` }, color: '#fff' }],
      crisisTier: 'none' as const,
    }))

    const result = computeVocabulary(sessions)

    expect(result.topActiveEmotions.length).toBe(15)
  })
})
