import type { EmotionModel, ModelState, SelectionEffect, AnalysisResult } from '../types'
import { MODEL_IDS } from '../constants'
import type { SomaticRegion } from './types'
import { analyzeSomaticSelections } from './scoring'
import headData from './data/head.json'
import torsoFrontData from './data/torso-front.json'
import torsoBackData from './data/torso-back.json'
import armsData from './data/arms.json'
import legsData from './data/legs.json'

const allEmotions = {
  ...headData,
  ...torsoFrontData,
  ...torsoBackData,
  ...armsData,
  ...legsData,
} as unknown as Record<string, SomaticRegion>

export { allEmotions as somaticRegions }

const ALL_REGION_IDS = Object.keys(allEmotions)

function makeVisibleMap(): Map<string, number> {
  return new Map(ALL_REGION_IDS.map((id) => [id, 0]))
}

export const somaticModel: EmotionModel<SomaticRegion> = {
  id: MODEL_IDS.SOMATIC,
  name: { ro: 'Harta corporala', en: 'Body Map' },
  shortName: { ro: 'Corp', en: 'Body' },
  description: {
    ro: 'Compară senzațiile selectate cu asocieri orientative și oferă cuvinte posibile, nu concluzii despre emoții sau cauze.',
    en: 'Compares selected sensations with exploratory associations and offers possible words, not conclusions about emotions or causes.',
  },
  allEmotions,

  get initialState(): ModelState {
    return {
      visibleEmotionIds: makeVisibleMap(),
      currentGeneration: 0,
    }
  },

  onSelect(
    emotion: SomaticRegion,
    state: ModelState,
    selections: SomaticRegion[]
  ): SelectionEffect {
    const nextVisible = new Map(state.visibleEmotionIds);
    nextVisible.set(emotion.id, (nextVisible.get(emotion.id) ?? 0) + 1);
    
    return {
      newState: {
        visibleEmotionIds: nextVisible,
        currentGeneration: state.currentGeneration + 1,
      },
      newSelections: [...selections.filter((selection) => selection.id !== emotion.id), emotion],
    }
  },

  onDeselect(_emotion: SomaticRegion, state: ModelState): SelectionEffect {
    const nextVisible = new Map(state.visibleEmotionIds);
    nextVisible.delete(_emotion.id);
    
    return {
      newState: {
        visibleEmotionIds: nextVisible,
        currentGeneration: state.currentGeneration + 1,
      },
    }
  },

  onClear(): ModelState {
    return {
      visibleEmotionIds: makeVisibleMap(),
      currentGeneration: 0,
    }
  },

  analyze(selections: SomaticRegion[]): AnalysisResult[] {
    return analyzeSomaticSelections(selections)
  },

  getEmotionSize(_emotionId: string, _state: ModelState): 'small' | 'medium' | 'large' {
    return 'medium'
  },
}
