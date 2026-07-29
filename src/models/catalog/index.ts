import type { CanonicalEmotion, CanonicalEmotionSource } from './types'
import { hydrateCatalogEmotion } from './hydrate'

import primaryAffects from './primary-affects.json'
import positive from './positive.json'
import negativeHigh from './negative-high.json'
import negativeLow from './negative-low.json'
import social from './social.json'
import complex from './complex.json'
import somaticOnly from './somatic-only.json'
import wheelBranches from './wheel-branches.json'
import wheelLeaves from './wheel-leaves.json'
import plutchikVariants from './plutchik-variants.json'
import dimensionalOnly from './dimensional-only.json'

const catalogSources: Array<[string, Record<string, CanonicalEmotionSource>]> = [
  ['primary-affects.json', primaryAffects as Record<string, CanonicalEmotionSource>],
  ['positive.json', positive as Record<string, CanonicalEmotionSource>],
  ['negative-high.json', negativeHigh as Record<string, CanonicalEmotionSource>],
  ['negative-low.json', negativeLow as Record<string, CanonicalEmotionSource>],
  ['social.json', social as Record<string, CanonicalEmotionSource>],
  ['complex.json', complex as Record<string, CanonicalEmotionSource>],
  ['somatic-only.json', somaticOnly as Record<string, CanonicalEmotionSource>],
  ['wheel-branches.json', wheelBranches as Record<string, CanonicalEmotionSource>],
  ['wheel-leaves.json', wheelLeaves as Record<string, CanonicalEmotionSource>],
  ['plutchik-variants.json', plutchikVariants as Record<string, CanonicalEmotionSource>],
  ['dimensional-only.json', dimensionalOnly as Record<string, CanonicalEmotionSource>],
]

const mergedCatalog: Record<string, CanonicalEmotion> = {}
for (const [sourceName, sourceEntries] of catalogSources) {
  for (const [id, source] of Object.entries(sourceEntries)) {
    if (mergedCatalog[id]) {
      throw new Error(`Duplicate canonical emotion "${id}" in ${sourceName}`)
    }
    if (source.id !== id) {
      throw new Error(`${sourceName}: key "${id}" does not match id "${source.id}"`)
    }
    mergedCatalog[id] = hydrateCatalogEmotion(source, sourceName)
  }
}

export const emotionCatalog: Readonly<Record<string, CanonicalEmotion>> = mergedCatalog

export function getCanonicalEmotion(id: string): CanonicalEmotion | undefined {
  return emotionCatalog[id]
}
