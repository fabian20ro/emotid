import type { BaseEmotion } from '../types'
import { SENSATION_TYPES, type SomaticSelection } from './types'

const VALID_SENSATIONS = new Set<string>(SENSATION_TYPES)
const VALID_INTENSITIES = new Set([1, 2, 3])

export function isCompleteSomaticSelection(selection: BaseEmotion): selection is SomaticSelection {
  const candidate = selection as Partial<SomaticSelection>
  return typeof candidate.selectedSensation === 'string'
    && VALID_SENSATIONS.has(candidate.selectedSensation)
    && typeof candidate.selectedIntensity === 'number'
    && VALID_INTENSITIES.has(candidate.selectedIntensity)
    && Array.isArray(candidate.emotionSignals)
}
