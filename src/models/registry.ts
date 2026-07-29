import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { MODEL_IDS, type ModelId } from './constants'
import type { BaseEmotion, EmotionModel, VisualizationProps } from './types'

type VisualizationComponent =
  | ComponentType<VisualizationProps>
  | LazyExoticComponent<ComponentType<VisualizationProps>>

interface ModelEntry {
  loadModel: () => Promise<EmotionModel<BaseEmotion>>
  loadVisualization?: () => Promise<ComponentType<VisualizationProps>>
}

const entries: Record<ModelId, ModelEntry> = {
  [MODEL_IDS.PLUTCHIK]: {
    loadModel: async () => {
      const module = await import('./plutchik')
      return module.plutchikModel as EmotionModel<BaseEmotion>
    },
    loadVisualization: async () => {
      const module = await import('../components/PlutchikWheel')
      return module.PlutchikWheel
    },
  },
  [MODEL_IDS.WHEEL]: {
    loadModel: async () => {
      const module = await import('./wheel')
      return module.wheelModel as EmotionModel<BaseEmotion>
    },
    loadVisualization: async () => {
      const module = await import('../components/BubbleField')
      return module.BubbleField
    },
  },
  [MODEL_IDS.SOMATIC]: {
    loadModel: async () => {
      const module = await import('./somatic')
      return module.somaticModel as EmotionModel<BaseEmotion>
    },
  },
  [MODEL_IDS.DIMENSIONAL]: {
    loadModel: async () => {
      const module = await import('./dimensional')
      return module.dimensionalModel as EmotionModel<BaseEmotion>
    },
    loadVisualization: async () => {
      const module = await import('../components/DimensionalField')
      return module.DimensionalField
    },
  },
}

const modelCache: Partial<Record<ModelId, EmotionModel<BaseEmotion>>> = {}
const modelPromiseCache: Partial<Record<ModelId, Promise<EmotionModel<BaseEmotion>>>> = {}
const visualizationCache: Partial<Record<ModelId, VisualizationComponent>> = {}
const visualizationPromiseCache: Partial<Record<ModelId, Promise<ComponentType<VisualizationProps>>>> = {}

export async function loadModel(id: ModelId): Promise<EmotionModel<BaseEmotion>> {
  if (modelCache[id]) return modelCache[id]
  if (modelPromiseCache[id]) return modelPromiseCache[id]

  const promise = entries[id].loadModel()
    .then((model) => {
      modelCache[id] = model
      return model
    })
    .catch((error: unknown) => {
      delete modelPromiseCache[id]
      throw error
    })
  modelPromiseCache[id] = promise
  return promise
}

async function loadVisualization(
  id: ModelId,
): Promise<ComponentType<VisualizationProps> | undefined> {
  const loader = entries[id].loadVisualization
  if (!loader) return undefined
  if (!visualizationPromiseCache[id]) {
    visualizationPromiseCache[id] = loader().catch((error: unknown) => {
      delete visualizationPromiseCache[id]
      throw error
    })
  }
  return visualizationPromiseCache[id]
}

export async function preloadVisualization(id: ModelId): Promise<void> {
  await loadVisualization(id)
}

export function getVisualization(id: ModelId): VisualizationComponent | undefined {
  if (!entries[id].loadVisualization) return undefined
  if (!visualizationCache[id]) {
    visualizationCache[id] = lazy(async () => {
      const component = await loadVisualization(id)
      if (!component) throw new Error(`Model "${id}" has no visualization`)
      return { default: component }
    })
  }
  return visualizationCache[id]
}
