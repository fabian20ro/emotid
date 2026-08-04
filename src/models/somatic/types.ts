import type { BaseEmotion } from '../types'

export type BodyGroup = 'head' | 'torso' | 'arms' | 'legs'

export const SENSATION_TYPES = [
  'tension',
  'warmth',
  'heaviness',
  'lightness',
  'tingling',
  'numbness',
  'churning',
  'pressure',
  'constriction',
] as const

export type SensationType = typeof SENSATION_TYPES[number]

export interface EmotionSignal {
  emotionId: string
  sensationType: SensationType
  minIntensity: 1 | 2 | 3
  weight: number
  source: 'curated-hypothesis'
  basis?: 'nummenmaa-2014-group-map'
}

export interface SomaticRegion extends BaseEmotion {
  svgRegionId: string
  group: BodyGroup
  commonSensations: SensationType[]
  emotionSignals: EmotionSignal[]
}

/** Enriched selection: region + user-chosen sensation and intensity */
export interface SomaticSelection extends SomaticRegion {
  selectedSensation: SensationType
  selectedIntensity: 1 | 2 | 3
}
