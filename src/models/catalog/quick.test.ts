import { describe, expect, it } from 'vitest'
import { getCanonicalEmotion } from '.'
import { QUICK_EMOTION_IDS, quickEmotions } from './quick'

describe('quick emotion catalog boundary', () => {
  it('preserves the ordered canonical quick choices without loading them from the full index', () => {
    expect(quickEmotions.map((emotion) => emotion.id)).toEqual(QUICK_EMOTION_IDS)
    for (const emotion of quickEmotions) {
      expect(emotion).toEqual(getCanonicalEmotion(emotion.id))
    }
  })

  it('exposes only the reviewed Quick need suggestions', () => {
    expect(Object.fromEntries(quickEmotions.map(({ id, needId }) => [id, needId]))).toEqual({
      anxiety: 'grounding',
      sadness: 'compassion',
      anger: 'boundaries',
      joy: undefined,
      numb: undefined,
      overwhelmed: 'relief',
    })
  })
})
