import type { EmotionModel, ModelState, SelectionEffect, AnalysisResult } from '../types'
import { MODEL_IDS } from '../constants'
import { getCanonicalEmotion } from '../catalog'
import type { PlutchikEmotion } from './types'
import primaryOverlay from './overlays/primary.json'
import intensityOverlay from './overlays/intensity.json'
import dyadOverlay from './overlays/dyad.json'
import secondaryDyadOverlay from './overlays/secondary-dyad.json'
import tertiaryDyadOverlay from './overlays/tertiary-dyad.json'
import oppositeDyadOverlay from './overlays/opposite-dyad.json'

interface PlutchikOverlay {
  color: string
  category: string
  intensity: number
  opposite?: string
  spawns?: string[]
  components?: string[]
}

const allOverlays: Record<string, PlutchikOverlay> = {
  ...(primaryOverlay as Record<string, PlutchikOverlay>),
  ...(intensityOverlay as Record<string, PlutchikOverlay>),
  ...(dyadOverlay as Record<string, PlutchikOverlay>),
  ...(secondaryDyadOverlay as Record<string, PlutchikOverlay>),
  ...(tertiaryDyadOverlay as Record<string, PlutchikOverlay>),
  ...(oppositeDyadOverlay as Record<string, PlutchikOverlay>),
}

const allEmotions: Record<string, PlutchikEmotion> = Object.fromEntries(
  Object.entries(allOverlays).map(([id, overlay]) => {
    const base = getCanonicalEmotion(id)
    if (!base) throw new Error(`Plutchik references unknown emotion: ${id}`)
    return [
      id,
      {
        ...base,
        color: overlay.color,
        category: overlay.category,
        intensity: overlay.intensity,
        opposite: overlay.opposite,
        spawns: overlay.spawns ?? [],
        components: overlay.components,
      },
    ]
  })
)

export { allEmotions as plutchikEmotions }

const INITIAL_EMOTION_IDS = [
  'joy',
  'trust',
  'fear',
  'surprise',
  'sadness',
  'disgust',
  'anger',
  'anticipation',
]

export const plutchikModel: EmotionModel<PlutchikEmotion> = {
  id: MODEL_IDS.PLUTCHIK,
  name: { ro: 'Roata emoțiilor Plutchik', en: "Plutchik's Wheel of Emotions" },
  shortName: { ro: 'Plutchik', en: 'Plutchik' },
  description: {
    ro: '8 emoții primare care se combină în diade (bazat pe Plutchik, 1980) — selectează două emoții primare pentru a descoperi combinația lor',
    en: '8 primary emotions that combine into dyads (based on Plutchik, 1980) — select two primary emotions to discover their combination',
  },
  allEmotions,

  get initialState(): ModelState {
    return {
      visibleEmotionIds: new Map(INITIAL_EMOTION_IDS.map((id) => [id, 0])),
      currentGeneration: 0,
    }
  },

  onSelect(emotion: PlutchikEmotion, state: ModelState, selections: PlutchikEmotion[]): SelectionEffect {
    const newGen = state.currentGeneration + 1
    const newMap = new Map(state.visibleEmotionIds)
    newMap.delete(emotion.id)

    const spawns = emotion.spawns || []
    for (const spawnId of spawns) {
      if (allEmotions[spawnId] && !selections.find((s) => s.id === spawnId)) {
        if (!newMap.has(spawnId)) {
          newMap.set(spawnId, newGen)
        }
      }
    }

    return {
      newState: {
        visibleEmotionIds: newMap,
        currentGeneration: newGen,
      },
    }
  },

  onDeselect(emotion: PlutchikEmotion, state: ModelState): SelectionEffect {
    const newMap = new Map(state.visibleEmotionIds)
    const smallGen = Math.max(0, state.currentGeneration - 2)

    if (emotion.components) {
      emotion.components.forEach((id) => {
        if (allEmotions[id]) newMap.set(id, smallGen)
      })
    } else {
      newMap.set(emotion.id, smallGen)
    }

    return {
      newState: {
        visibleEmotionIds: newMap,
        currentGeneration: state.currentGeneration,
      },
    }
  },

  onClear(): ModelState {
    return {
      visibleEmotionIds: new Map(INITIAL_EMOTION_IDS.map((id) => [id, 0])),
      currentGeneration: 0,
    }
  },

  analyze(selections: PlutchikEmotion[]): AnalysisResult[] {
    if (selections.length === 0) return []

    if (selections.length === 1) {
      const s = selections[0]
      return [{ id: s.id, label: s.label, color: s.color, description: s.description, needs: s.needs }]
    }

    const results: AnalysisResult[] = []
    const selectionIds = new Set(selections.map((s) => s.id))
    const usedAsComponent = new Set<string>()

    for (const emotion of Object.values(allEmotions)) {
      if (emotion.components && emotion.components.length === 2) {
        const [c1, c2] = emotion.components
        if (selectionIds.has(c1) && selectionIds.has(c2)) {
          usedAsComponent.add(c1)
          usedAsComponent.add(c2)
          const comp1 = allEmotions[c1]
          const comp2 = allEmotions[c2]
          results.push({
            id: emotion.id,
            label: emotion.label,
            color: emotion.color,
            description: emotion.description,
            needs: emotion.needs,
            componentLabels: [comp1.label, comp2.label],
          })
        }
      }
    }

    for (const s of selections) {
      if (!usedAsComponent.has(s.id)) {
        results.push({ id: s.id, label: s.label, color: s.color, description: s.description, needs: s.needs })
      }
    }

    return results
  },

  getEmotionSize(emotionId: string, state: ModelState): 'small' | 'medium' | 'large' {
    const gen = state.visibleEmotionIds.get(emotionId) ?? 0
    const diff = state.currentGeneration - gen
    if (diff === 0) return 'large'
    return 'small'
  },
}
