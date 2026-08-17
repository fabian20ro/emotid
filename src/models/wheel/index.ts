import type { EmotionModel, ModelState, SelectionEffect, AnalysisResult } from '../types'
import { MODEL_IDS } from '../constants'
import { getCanonicalEmotion } from '../catalog'
import type { WheelEmotion } from './types'
import happyOverlay from './overlays/happy.json'
import surprisedOverlay from './overlays/surprised.json'
import badOverlay from './overlays/bad.json'
import fearfulOverlay from './overlays/fearful.json'
import angryOverlay from './overlays/angry.json'
import disgustedOverlay from './overlays/disgusted.json'
import sadOverlay from './overlays/sad.json'
import rootIds from './root-ids.json'

interface WheelOverlay {
  level: number
  color: string
  parents: string[]
  children?: string[]
}

const allOverlays: Record<string, WheelOverlay> = {
  ...(happyOverlay as Record<string, WheelOverlay>),
  ...(surprisedOverlay as Record<string, WheelOverlay>),
  ...(badOverlay as Record<string, WheelOverlay>),
  ...(fearfulOverlay as Record<string, WheelOverlay>),
  ...(angryOverlay as Record<string, WheelOverlay>),
  ...(disgustedOverlay as Record<string, WheelOverlay>),
  ...(sadOverlay as Record<string, WheelOverlay>),
}

const allEmotions: Record<string, WheelEmotion> = {}
for (const [id, overlay] of Object.entries(allOverlays)) {
  const base = getCanonicalEmotion(id)
  if (!base) throw new Error(`Wheel references unknown emotion: ${id}`)
  allEmotions[id] = {
    ...base,
    color: overlay.color,
    level: overlay.level,
    parents: overlay.parents,
    children: overlay.children,
  }
}

const CENTER_IDS = rootIds

function getHierarchyPath(selection: WheelEmotion): { ro: string; en: string }[] {
  const traversed = selection.navigationPath
  if (traversed?.length && traversed[traversed.length - 1] === selection.id) {
    const valid = traversed.every((id, index) => {
      const emotion = allEmotions[id]
      if (!emotion) return false
      if (index === 0) return emotion.parents.length === 0
      return emotion.parents.includes(traversed[index - 1])
    })
    if (valid) return traversed.map((id) => allEmotions[id].label)
  }

  const path: { ro: string; en: string }[] = []
  let current: WheelEmotion | undefined = selection
  let depth = 0
  while (current && depth < 10) {
    path.push(current.label)
    current = current.parents[0] ? allEmotions[current.parents[0]] : undefined
    depth += 1
  }
  return path.reverse()
}

export const wheelModel: EmotionModel<WheelEmotion> = {
  id: MODEL_IDS.WHEEL,
  name: { ro: 'Roata emoțiilor', en: 'Emotion Wheel' },
  shortName: { ro: 'Roata', en: 'Wheel' },
  description: {
    ro: 'Navigare ierarhică pe 3 niveluri (bazată pe Parrott, 2001) — de la emoții generale la specifice prin explorare în profunzime',
    en: '3-level hierarchical navigation (based on Parrott, 2001) — from general to specific emotions through drill-down exploration',
  },
  allEmotions,

  get initialState(): ModelState {
    return {
      visibleEmotionIds: new Map(CENTER_IDS.map((id) => [id, 0])),
      currentGeneration: 0,
    }
  },

  onSelect(emotion: WheelEmotion, state: ModelState, selections: WheelEmotion[]): SelectionEffect {
    const newGen = state.currentGeneration + 1

    if (emotion.children?.length) {
      // Has children: drill down — show children, hide current level
      // Don't add branch node to selections
      const newMap = new Map<string, number>()
      for (const childId of emotion.children) {
        newMap.set(childId, newGen)
      }
      return {
        newState: {
          visibleEmotionIds: newMap,
          currentGeneration: newGen,
        },
        newSelections: selections,
      }
    }

    // Leaf node: add to selections, then reset to root for next pick
    return {
      newState: {
        visibleEmotionIds: new Map(CENTER_IDS.map((id) => [id, 0])),
        currentGeneration: 0,
      },
      newSelections: [...selections, emotion],
    }
  },

  onDeselect(_emotion: WheelEmotion, _state: ModelState): SelectionEffect {
    // Reset to root — let the hook's default behavior remove only the deselected emotion
    return {
      newState: {
        visibleEmotionIds: new Map(CENTER_IDS.map((id) => [id, 0])),
        currentGeneration: 0,
      },
    }
  },

  onClear(): ModelState {
    return {
      visibleEmotionIds: new Map(CENTER_IDS.map((id) => [id, 0])),
      currentGeneration: 0,
    }
  },

  analyze(selections: WheelEmotion[]): AnalysisResult[] {
    return selections.map((s) => {
      const path = getHierarchyPath(s)

      return {
        id: s.id,
        label: s.label,
        color: s.color,
        description: s.description,
        needs: s.needs,
        hierarchyPath: path.length > 1 ? path : undefined,
      }
    })
  },

  getEmotionSize(_emotionId: string, _state: ModelState): 'small' | 'medium' | 'large' {
    return 'large'
  },
}
