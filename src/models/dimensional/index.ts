import type { EmotionModel, ModelState, SelectionEffect, AnalysisResult } from '../types'
import { MODEL_IDS } from '../constants'
import { getCanonicalEmotion } from '../catalog'
import type { DimensionalEmotion } from './types'
import overlayData from './overlay.json'

const allEmotions: Record<string, DimensionalEmotion> = {}
for (const [id, overlay] of Object.entries(overlayData)) {
  const base = getCanonicalEmotion(id)
  if (!base) throw new Error(`Dimensional references unknown emotion: ${id}`)
  allEmotions[id] = {
    ...base,
    color: overlay.color,
    valence: overlay.valence,
    arousal: overlay.arousal,
    quadrant: overlay.quadrant as DimensionalEmotion['quadrant'],
  }
}
const ALL_IDS = Object.keys(allEmotions)

export function findNearest(
  valence: number,
  arousal: number,
  emotions: Record<string, DimensionalEmotion>,
  count: number
): DimensionalEmotion[] {
  return Object.values(emotions)
    .map((e) => ({
      emotion: e,
      distance: Math.sqrt((e.valence - valence) ** 2 + (e.arousal - arousal) ** 2),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map((e) => e.emotion)
}

export const dimensionalModel: EmotionModel<DimensionalEmotion> = {
  id: MODEL_IDS.DIMENSIONAL,
  name: { ro: 'Spațiul emoțional', en: 'Emotional Space' },
  shortName: { ro: 'Spațiu', en: 'Space' },
  description: {
    ro: 'Câmp bidimensional (bazat pe Russell, 1980) — plasează-ți experiența pe axele plăcut/neplăcut și calm/intens',
    en: '2D emotional field (based on Russell, 1980) — place your experience on the pleasant/unpleasant and calm/intense axes',
  },
  allEmotions,

  get initialState(): ModelState {
    return {
      visibleEmotionIds: new Map(ALL_IDS.map((id) => [id, 0])),
      currentGeneration: 0,
    }
  },

  onSelect(_emotion: DimensionalEmotion, state: ModelState): SelectionEffect {
    // All emotions stay visible — no state changes needed
    return { newState: state }
  },

  onDeselect(_emotion: DimensionalEmotion, state: ModelState): SelectionEffect {
    return { newState: state }
  },

  onClear(): ModelState {
    return {
      visibleEmotionIds: new Map(ALL_IDS.map((id) => [id, 0])),
      currentGeneration: 0,
    }
  },

  analyze(selections: DimensionalEmotion[]): AnalysisResult[] {
    return selections.map((s) => ({
      id: s.id,
      label: s.label,
      color: s.color,
      description: s.description,
      needs: s.needs,
      valence: s.valence,
      arousal: s.arousal,
    }))
  },

  getEmotionSize(_emotionId: string, _state: ModelState): 'small' | 'medium' | 'large' {
    // DimensionalField doesn't use BubbleField — this is unused but required by interface
    return 'small'
  },
}
