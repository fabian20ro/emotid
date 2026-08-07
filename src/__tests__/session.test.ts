import { afterEach, describe, expect, it, vi } from 'vitest'
import { addReflectionDetail, createSession } from '../data/session'
import { getEmotionDisplayLabel, getResultRelationship, isSessionEligibleForPatterns } from '../data/session-presentation'
import type { AnalysisResult, BaseEmotion } from '../models/types'

const emotion: BaseEmotion = {
  id: 'happy',
  label: { en: 'Happy', ro: 'Fericit' },
  color: '#ffe066',
}

const result: AnalysisResult = {
  id: 'happy',
  label: emotion.label,
  color: emotion.color,
}

describe('session mapping', () => {
  afterEach(() => vi.restoreAllMocks())

  it('uses current canonical copy for historical results with a stored fallback', () => {
    expect(getEmotionDisplayLabel({
      id: 'overwhelmed',
      label: { ro: 'Coplesit', en: 'Overwhelmed' },
    }, 'ro')).toBe('Copleșit')
    expect(getEmotionDisplayLabel({
      id: 'legacy-custom',
      label: { ro: 'Etichetă veche', en: 'Legacy label' },
    }, 'ro')).toBe('Etichetă veche')
  })

  it('keeps one identity while optional reflection details are added', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('session-id')
    vi.spyOn(Date, 'now').mockReturnValue(1234)
    const base = createSession({
      route: 'words',
      modelId: 'wheel',
      selections: [emotion],
      results: [result],
    })
    const enriched = addReflectionDetail(base, {
      reflectionAnswer: 'yes',
      selectedNeed: 'rest',
      nextStep: 'Pause',
    })

    expect(base).toMatchObject({ id: 'session-id', timestamp: 1234, entryRoute: 'words' })
    expect(enriched).toMatchObject({
      id: base.id,
      timestamp: base.timestamp,
      reflectionAnswer: 'yes',
      selectedNeed: 'rest',
      nextStep: 'Pause',
    })
    expect(base.reflectionAnswer).toBeUndefined()
  })

  it('distinguishes chosen words from unconfirmed generated suggestions', () => {
    const chosen = createSession({
      route: 'words',
      modelId: 'wheel',
      selections: [emotion],
      results: [result],
    }, { id: 'chosen', timestamp: 1 })
    const suggested = { ...chosen, id: 'suggested', entryRoute: 'affect' as const }

    expect(getResultRelationship(chosen)).toBe('named')
    expect(getResultRelationship(suggested)).toBe('suggested')
    expect(getResultRelationship({ ...suggested, reflectionAnswer: 'no' })).toBe('rejected')
    expect(isSessionEligibleForPatterns(chosen)).toBe(true)
    expect(isSessionEligibleForPatterns(suggested)).toBe(false)
    expect(isSessionEligibleForPatterns({ ...suggested, reflectionAnswer: 'partly' })).toBe(false)
    expect(isSessionEligibleForPatterns({ ...suggested, reflectionAnswer: 'yes' })).toBe(true)
  })
})
