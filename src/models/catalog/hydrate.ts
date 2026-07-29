import type { CanonicalEmotion, CanonicalEmotionSource } from './types'

function generatedDescription(source: CanonicalEmotionSource): CanonicalEmotion['description'] {
  return {
    en: `${source.label.en} may be one word to consider. Some people connect it with: ${source.needs.en}. Keep only what fits your experience and context.`,
    ro: `${source.label.ro} poate fi un cuvânt de luat în considerare. Unele persoane îl asociază cu: ${source.needs.ro}. Păstrați doar ce se potrivește experienței și contextului vostru.`,
  }
}

export function hydrateCatalogEmotion(
  source: CanonicalEmotionSource,
  sourceName: string,
): CanonicalEmotion {
  if (source.descriptionStatus === 'reviewed') {
    if (!source.description?.en || !source.description.ro) {
      throw new Error(`${sourceName}: reviewed description missing for "${source.id}"`)
    }
    return { ...source, description: source.description, descriptionStatus: 'reviewed' }
  }
  if (source.description) {
    throw new Error(`${sourceName}: unreviewed description must be removed for "${source.id}"`)
  }
  if (source.descriptionStatus !== undefined) {
    throw new Error(`${sourceName}: unknown description status for "${source.id}"`)
  }
  return { ...source, description: generatedDescription(source), descriptionStatus: 'generated' }
}
