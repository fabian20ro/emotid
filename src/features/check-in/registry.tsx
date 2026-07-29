import type { ComponentType } from 'react'
import { MODEL_IDS, type ModelId } from '../../models/constants'
import { loadModel, preloadVisualization } from '../../models/registry'
import type { AnalysisResult, BaseEmotion, EmotionModel } from '../../models/types'
import type { CheckInRoute } from '../../navigation/types'

export type FeatureRoute = Exclude<CheckInRoute, 'quick'>

export interface CheckInFeatureProps {
  onBack: () => void
  onComplete: (modelId: string, selections: BaseEmotion[], results: AnalysisResult[]) => void
}

interface FeatureEntry {
  modelId: ModelId
  loadScreen: () => Promise<ComponentType<CheckInFeatureProps & {
    model: EmotionModel<BaseEmotion>
  }>>
  preloadVisualization?: boolean
}

const entries: Record<FeatureRoute, FeatureEntry> = {
  body: {
    modelId: MODEL_IDS.SOMATIC,
    loadScreen: async () => {
      const module = await import('../../screens/BodyCompassScreen')
      return module.BodyCompassScreen
    },
  },
  words: {
    modelId: MODEL_IDS.WHEEL,
    loadScreen: async () => {
      const module = await import('../../screens/WordLadderScreen')
      return module.WordLadderScreen
    },
  },
  affect: {
    modelId: MODEL_IDS.DIMENSIONAL,
    preloadVisualization: true,
    loadScreen: async () => {
      const module = await import('../../screens/ModelCheckInScreen')
      const AffectFeature: ComponentType<CheckInFeatureProps & {
        model: EmotionModel<BaseEmotion>
      }> = (props) => (
        <module.ModelCheckInScreen route="affect" {...props} />
      )
      AffectFeature.displayName = 'AffectCheckInFeature'
      return AffectFeature
    },
  },
  plutchik: {
    modelId: MODEL_IDS.PLUTCHIK,
    preloadVisualization: true,
    loadScreen: async () => {
      const module = await import('../../screens/ModelCheckInScreen')
      const PlutchikFeature: ComponentType<CheckInFeatureProps & {
        model: EmotionModel<BaseEmotion>
      }> = (props) => (
        <module.ModelCheckInScreen route="plutchik" {...props} />
      )
      PlutchikFeature.displayName = 'PlutchikCheckInFeature'
      return PlutchikFeature
    },
  },
}

const featureCache: Partial<Record<FeatureRoute, ComponentType<CheckInFeatureProps>>> = {}
const featurePromiseCache: Partial<Record<FeatureRoute, Promise<ComponentType<CheckInFeatureProps>>>> = {}

export function getLoadedCheckInFeature(
  route: FeatureRoute,
): ComponentType<CheckInFeatureProps> | undefined {
  return featureCache[route]
}

export async function loadCheckInFeature(
  route: FeatureRoute,
): Promise<ComponentType<CheckInFeatureProps>> {
  if (featureCache[route]) return featureCache[route]
  if (featurePromiseCache[route]) return featurePromiseCache[route]

  const entry = entries[route]
  const promise = Promise.all([
    entry.loadScreen(),
    loadModel(entry.modelId),
    entry.preloadVisualization ? preloadVisualization(entry.modelId) : Promise.resolve(),
  ])
    .then(([Implementation, model]) => {
      const Screen: ComponentType<CheckInFeatureProps> = (props) => (
        <Implementation {...props} model={model} />
      )
      Screen.displayName = `${route[0].toUpperCase()}${route.slice(1)}CheckInFeature`
      featureCache[route] = Screen
      return Screen
    })
    .catch((error: unknown) => {
      delete featurePromiseCache[route]
      throw error
    })
  featurePromiseCache[route] = promise
  return promise
}

export function preloadCheckInFeature(route: FeatureRoute): void {
  void loadCheckInFeature(route).catch(() => undefined)
}
