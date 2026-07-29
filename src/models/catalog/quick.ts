import negativeHigh from './negative-high.json'
import negativeLow from './negative-low.json'
import primaryAffects from './primary-affects.json'
import wheelBranches from './wheel-branches.json'
import { hydrateCatalogEmotion } from './hydrate'
import type { CanonicalEmotion, CanonicalEmotionSource } from './types'

export const QUICK_EMOTION_IDS = [
  'anxiety',
  'sadness',
  'anger',
  'joy',
  'numb',
  'overwhelmed',
] as const

const quickSources: Array<[string, Record<string, CanonicalEmotionSource>]> = [
  ['primary-affects.json', primaryAffects as Record<string, CanonicalEmotionSource>],
  ['negative-high.json', negativeHigh as Record<string, CanonicalEmotionSource>],
  ['negative-low.json', negativeLow as Record<string, CanonicalEmotionSource>],
  ['wheel-branches.json', wheelBranches as Record<string, CanonicalEmotionSource>],
]

export const quickEmotions: readonly CanonicalEmotion[] = QUICK_EMOTION_IDS.map((id) => {
  for (const [sourceName, source] of quickSources) {
    const emotion = source[id]
    if (emotion) return hydrateCatalogEmotion(emotion, sourceName)
  }
  throw new Error(`Quick emotion "${id}" is missing from the canonical catalog`)
})
