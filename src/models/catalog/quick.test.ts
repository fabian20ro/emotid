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
})
