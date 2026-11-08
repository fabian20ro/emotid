import { describe, expect, it } from 'vitest'
import { wheelModel } from '../models/wheel'
import { dimensionalModel } from '../models/dimensional'
import { plutchikModel } from '../models/plutchik'
import type { EmotionModel } from '../models/types'

describe('reviewed need identity in analysis results', () => {
  it.each([wheelModel, dimensionalModel, plutchikModel] as EmotionModel[])('keeps every offered reviewed need in $id addressable by ID', (model) => {
    const withNeeds = Object.values(model.allEmotions).filter((emotion) => emotion.needs)
    expect(withNeeds.length).toBeGreaterThan(0)
    for (const emotion of withNeeds) {
      expect(emotion.needId).toBeTruthy()
      expect(model.analyze([emotion])[0]).toMatchObject({ needs: emotion.needs, needId: emotion.needId })
    }
  })
  it('preserves the catalog choice through word, affect and Plutchik analysis', () => {
    expect(wheelModel.analyze([wheelModel.allEmotions.tired])[0]).toMatchObject({ needId: 'rest' })
    expect(dimensionalModel.analyze([dimensionalModel.allEmotions.nervous])[0]).toMatchObject({ needId: 'grounding' })
    expect(plutchikModel.analyze([plutchikModel.allEmotions.sadness])[0]).toMatchObject({ needId: 'compassion' })
    const combined = plutchikModel.analyze([plutchikModel.allEmotions.trust, plutchikModel.allEmotions.sadness])
    expect(combined.find((result) => result.id === 'compassion')).toMatchObject({ needs: undefined, needId: undefined })
    expect(plutchikModel.analyze([plutchikModel.allEmotions.trust, plutchikModel.allEmotions.joy]))
      .toEqual(expect.arrayContaining([expect.objectContaining({ id: 'love', needId: 'connection' })]))
  })
})
