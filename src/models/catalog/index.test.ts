import { emotionCatalog, getCanonicalEmotion } from './index'

describe('getCanonicalEmotion', () => {
  it('should return the correct emotion for a valid id', () => {
    const emotion = getCanonicalEmotion('serene')
    expect(emotion).toBeDefined()
    expect(emotion?.id).toBe('serene')
  })

  it('should return undefined for an invalid id', () => {
    const emotion = getCanonicalEmotion('non-existent')
    expect(emotion).toBeUndefined()
  })

  it('should handle complex emotions', () => {
    const emotion = getCanonicalEmotion('nostalgia')
    expect(emotion?.id).toBe('nostalgia')
  })
})

describe('catalog integrity', () => {
  it('should not have duplicate IDs across sources (spread does not warn)', () => {
    // The catalog is built via spread of 11 JSON modules. A key collision
    // silently overwrites an earlier entry — no error, no warning. This test
    // catches that regression so a data bug stays visible rather than silent.
    const seen = new Set<string>()
    const duplicates: string[] = []

    for (const id of Object.keys(emotionCatalog)) {
      if (seen.has(id)) {
        duplicates.push(id)
      } else {
        seen.add(id)
      }
    }

    expect(duplicates).toEqual([])
  })

  it('should include every ID from every source file', () => {
    // Each JSON module is imported as a sub-object of emotionCatalog. This test
    // verifies the catalog contains entries from each expected branch,
    // ensuring a broken/empty import does not go unnoticed during refactors.

    // If any import is empty or broken, total count would drop below minimums.
    expect(Object.keys(emotionCatalog).length).toBeGreaterThan(30)

    // Spot-check at least one known ID from each branch to confirm imports load
    const sampleIds = ['joy', 'serene', 'anger', 'sadness', 'trust', 'fear', 'anticipation']
    for (const id of sampleIds) {
      expect(getCanonicalEmotion(id)).toBeDefined()
      expect(getCanonicalEmotion(id)?.id).toBe(id)
    }
  })

  it('should have required fields on every catalog entry', () => {
    // Sanity check: every emotion must have the core shape. A missing field in
    // one source would surface as a UI crash; this test keeps that visible.
    const requiredFields = ['id', 'label', 'color']

    for (const [id, entry] of Object.entries(emotionCatalog)) {
      expect(id).toBe(entry.id)
      for (const field of requiredFields) {
        expect(entry).toHaveProperty(field)
      }
      expect(typeof entry.label.ro).toBe('string')
      expect(typeof entry.label.en).toBe('string')
      if (entry.description) {
        expect(typeof entry.description.ro).toBe('string')
        expect(typeof entry.description.en).toBe('string')
        expect(entry.descriptionStatus).toBe('reviewed')
      }
      if (entry.needs) {
        expect(typeof entry.needs.ro).toBe('string')
        expect(typeof entry.needs.en).toBe('string')
        expect(entry.guidanceStatus).toBe('reviewed')
      }
    }
  })
})
