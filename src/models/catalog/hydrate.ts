import type { CanonicalEmotion, CanonicalEmotionSource } from './types'
import { getNeedOption } from './guidance/need-options'

export function hydrateCatalogEmotion(
  source: CanonicalEmotionSource,
  sourceName: string,
): CanonicalEmotion {
  if ('needs' in source) {
    throw new Error(`${sourceName}: raw needs must be removed for "${source.id}"`)
  }

  if (source.descriptionStatus === 'reviewed') {
    if (!source.description?.en || !source.description.ro) {
      throw new Error(`${sourceName}: reviewed description missing for "${source.id}"`)
    }
  } else if (source.description) {
    throw new Error(`${sourceName}: unreviewed description must be removed for "${source.id}"`)
  } else if (source.descriptionStatus !== undefined) {
    throw new Error(`${sourceName}: unknown description status for "${source.id}"`)
  }

  const { guidance, ...emotion } = source
  if (!guidance) return emotion
  if (guidance.status !== 'reviewed') {
    throw new Error(`${sourceName}: unknown guidance status for "${source.id}"`)
  }
  if (guidance.needId === null) return emotion

  const needs = getNeedOption(guidance.needId)
  if (!needs) {
    throw new Error(`${sourceName}: unknown reviewed need "${guidance.needId}" for "${source.id}"`)
  }

  return {
    ...emotion,
    needs,
    needId: guidance.needId,
    guidanceStatus: 'reviewed',
  }
}
