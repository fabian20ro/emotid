import { describe, expect, it } from 'vitest'

import { hydrateCatalogEmotion } from './hydrate'
import type { CanonicalEmotionSource } from './types'

function source(overrides: Partial<CanonicalEmotionSource> = {}): CanonicalEmotionSource {
  return {
    id: 'example',
    label: { en: 'example', ro: 'exemplu' },
    color: '#123456',
    ...overrides,
  }
}

describe('catalog guidance hydration', () => {
  it('exposes no inferred guidance or generated description without reviewed provenance', () => {
    const emotion = hydrateCatalogEmotion(source(), 'test.json')

    expect(emotion.needs).toBeUndefined()
    expect(emotion.needId).toBeUndefined()
    expect(emotion.guidanceStatus).toBeUndefined()
    expect(emotion.description).toBeUndefined()
    expect(emotion.descriptionStatus).toBeUndefined()
  })

  it('resolves a reviewed need ID through the controlled bilingual vocabulary', () => {
    const emotion = hydrateCatalogEmotion(source({
      guidance: { status: 'reviewed', needId: 'grounding' },
    }), 'test.json')

    expect(emotion.needId).toBe('grounding')
    expect(emotion.guidanceStatus).toBe('reviewed')
    expect(emotion.needs).toEqual({ en: 'grounding', ro: 'ancorare' })
  })

  it('keeps a reviewed no-suggestion decision absent at runtime', () => {
    const emotion = hydrateCatalogEmotion(source({
      guidance: { status: 'reviewed', needId: null },
    }), 'test.json')

    expect(emotion.needId).toBeUndefined()
    expect(emotion.guidanceStatus).toBeUndefined()
    expect(emotion.needs).toBeUndefined()
  })

  it('rejects unknown need references and guidance statuses', () => {
    expect(() => hydrateCatalogEmotion(source({
      guidance: { status: 'reviewed', needId: 'unknown' },
    }), 'test.json')).toThrow('unknown reviewed need "unknown"')

    expect(() => hydrateCatalogEmotion(source({
      guidance: { status: 'generated', needId: 'grounding' } as never,
    }), 'test.json')).toThrow('unknown guidance status')
  })

  it('rejects legacy raw needs instead of silently treating them as reviewed', () => {
    const legacy = {
      ...source(),
      needs: { en: 'support', ro: 'sprijin' },
    } as unknown as CanonicalEmotionSource

    expect(() => hydrateCatalogEmotion(legacy, 'test.json')).toThrow('raw needs must be removed')
  })

  it('keeps only explicitly reviewed bilingual descriptions', () => {
    const emotion = hydrateCatalogEmotion(source({
      description: { en: 'A tentative description.', ro: 'O descriere posibilă.' },
      descriptionStatus: 'reviewed',
    }), 'test.json')

    expect(emotion.description).toEqual({
      en: 'A tentative description.',
      ro: 'O descriere posibilă.',
    })
    expect(emotion.descriptionStatus).toBe('reviewed')
  })
})
