import { describe, it, expect } from 'vitest'
import { dimensionalModel, findNearest } from '../models/dimensional'
import type { DimensionalEmotion } from '../models/dimensional/types'

const emotions = Object.values(dimensionalModel.allEmotions) as DimensionalEmotion[]

describe('dimensional data', () => {
  it('has at least 28 reference emotions', () => {
    expect(emotions.length).toBeGreaterThanOrEqual(28)
  })

  it('has at least 7 emotions per quadrant', () => {
    const quadrants = {
      'pleasant-intense': 0,
      'pleasant-calm': 0,
      'unpleasant-intense': 0,
      'unpleasant-calm': 0,
    }
    for (const e of emotions) {
      quadrants[e.quadrant]++
    }
    expect(quadrants['pleasant-intense']).toBeGreaterThanOrEqual(7)
    expect(quadrants['pleasant-calm']).toBeGreaterThanOrEqual(7)
    expect(quadrants['unpleasant-intense']).toBeGreaterThanOrEqual(7)
    expect(quadrants['unpleasant-calm']).toBeGreaterThanOrEqual(7)
  })

  it('all emotions have coordinates in -1 to +1 range', () => {
    for (const e of emotions) {
      expect(e.valence).toBeGreaterThanOrEqual(-1)
      expect(e.valence).toBeLessThanOrEqual(1)
      expect(e.arousal).toBeGreaterThanOrEqual(-1)
      expect(e.arousal).toBeLessThanOrEqual(1)
    }
  })

  it('all emotions have bilingual labels', () => {
    for (const e of emotions) {
      expect(e.label.en).toBeTruthy()
      expect(e.label.ro).toBeTruthy()
    }
  })

  it('all exposed descriptions are bilingual', () => {
    for (const e of emotions) {
      if (!e.description) continue
      expect(e.description.en).toBeTruthy()
      expect(e.description.ro).toBeTruthy()
    }
  })

  it('all exposed needs are bilingual', () => {
    for (const e of emotions) {
      if (!e.needs) continue
      expect(e.needs.en).toBeTruthy()
      expect(e.needs.ro).toBeTruthy()
    }
  })

  it('all emotions have valid colors', () => {
    for (const e of emotions) {
      expect(e.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('quadrant assignment matches coordinates', () => {
    for (const e of emotions) {
      if (e.quadrant === 'pleasant-intense') {
        expect(e.valence).toBeGreaterThan(0)
        expect(e.arousal).toBeGreaterThan(0)
      } else if (e.quadrant === 'pleasant-calm') {
        expect(e.valence).toBeGreaterThan(0)
        expect(e.arousal).toBeLessThan(0)
      } else if (e.quadrant === 'unpleasant-intense') {
        expect(e.valence).toBeLessThan(0)
        expect(e.arousal).toBeGreaterThan(0)
      } else if (e.quadrant === 'unpleasant-calm') {
        expect(e.valence).toBeLessThan(0)
        expect(e.arousal).toBeLessThan(0)
      }
    }
  })

  it('all emotions have unique IDs', () => {
    const ids = emotions.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  describe('findNearest', () => {
    it('returns exactly count results', () => {
      const result = findNearest(0.5, 0.3, dimensionalModel.allEmotions as Record<string, DimensionalEmotion>, 5)
      expect(result).toHaveLength(5)
    })

    it('results are sorted by distance ascending', () => {
      const result = findNearest(0, 0, dimensionalModel.allEmotions as Record<string, DimensionalEmotion>, 10)
      for (let i = 1; i < result.length; i++) {
        const prevDist = Math.sqrt((result[i - 1].valence) ** 2 + (result[i - 1].arousal) ** 2)
        const currDist = Math.sqrt((result[i].valence) ** 2 + (result[i].arousal) ** 2)
        expect(currDist).toBeGreaterThanOrEqual(prevDist)
      }
    })

    it('returns empty array for count zero', () => {
      const result = findNearest(0.5, -0.5, dimensionalModel.allEmotions as Record<string, DimensionalEmotion>, 0)
      expect(result).toHaveLength(0)
    })

    it('findNearest with empty emotion set returns empty array', () => {
      const result = findNearest(0, 0, {}, 5)
      expect(result).toHaveLength(0)
    })

    it('findNearest when count exceeds available emotions returns all available', () => {
      const smallSet: Record<string, DimensionalEmotion> = {}
      for (const e of emotions.slice(0, 3)) {
        smallSet[e.id] = e
      }
      const result = findNearest(0, 0, smallSet, 10)
      expect(result.length).toBe(3)
    })

    it('findNearest results contain no duplicate IDs', () => {
      const result = findNearest(-0.5, 0.2, dimensionalModel.allEmotions as Record<string, DimensionalEmotion>, 10)
      const ids = result.map((e) => e.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('findNearest(1, 1) returns an emotion with high positive valence and arousal', () => {
      const result = findNearest(1, 1, dimensionalModel.allEmotions as Record<string, DimensionalEmotion>, 1)
      // The returned emotion should be close to (1,1) — at minimum both axes positive
      expect(result[0].valence).toBeGreaterThan(0.5)
      expect(result[0].arousal).toBeGreaterThan(0.5)
    })

    it('returns emotions from the full set', () => {
      const result = findNearest(0.5, -0.3, dimensionalModel.allEmotions as Record<string, DimensionalEmotion>, 28)
      expect(result.length).toBeLessThanOrEqual(emotions.length)
      for (const e of result) {
        expect(e.valence).toBeGreaterThanOrEqual(-1)
        expect(e.valence).toBeLessThanOrEqual(1)
        expect(e.arousal).toBeGreaterThanOrEqual(-1)
        expect(e.arousal).toBeLessThanOrEqual(1)
      }
    })
  })

  describe('model lifecycle', () => {
    it('initialState has visibleEmotionIds for every emotion at 0', () => {
      const state = dimensionalModel.initialState
      expect(state.visibleEmotionIds.size).toBe(emotions.length)
      for (const [, count] of state.visibleEmotionIds.entries()) {
        expect(count).toBe(0)
      }
    })

    it('onClear resets to initial state', () => {
      const cleared = dimensionalModel.onClear()
      const initial = dimensionalModel.initialState
      expect(cleared.visibleEmotionIds.size).toBe(initial.visibleEmotionIds.size)
      for (const [, count] of cleared.visibleEmotionIds.entries()) {
        expect(count).toBe(0)
      }
    })

    it('analyze returns one result per selection with required shape', () => {
      const sample = emotions.slice(0, 3) as DimensionalEmotion[]
      const results = dimensionalModel.analyze(sample)
      expect(results).toHaveLength(3)
      for (const r of results) {
        expect(r.id).toBeTruthy()
        expect(r.label?.en).toBeTruthy()
        expect(r.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
        expect(typeof r.valence).toBe('number')
        expect(typeof r.arousal).toBe('number')
      }
    })

    it('onSelect and onDeselect preserve state unchanged', () => {
      const state = dimensionalModel.initialState
      const sampleEmotion = emotions[0] as DimensionalEmotion
      const selResult = dimensionalModel.onSelect(sampleEmotion, state)
      expect(selResult.newState.visibleEmotionIds).toBe(state.visibleEmotionIds)
      const deselResult = dimensionalModel.onDeselect(sampleEmotion, state)
      expect(deselResult.newState.visibleEmotionIds).toBe(state.visibleEmotionIds)
    })

    it('getEmotionSize returns a valid size for any emotion', () => {
      for (const e of emotions.slice(0, 5) as DimensionalEmotion[]) {
        const size = dimensionalModel.getEmotionSize(e.id, dimensionalModel.initialState)
        expect(['small', 'medium', 'large']).toContain(size)
      }
    })
  })

  describe('edge cases', () => {
    it('emotions at valence=0 are in pleasant or unpleasant quadrant by arousal sign', () => {
      const zeroValence = emotions.filter((e) => e.valence === 0)
      for (const e of zeroValence) {
        if (e.arousal >= 0) {
          expect(e.quadrant).toBe('pleasant-intense')
        } else {
          expect(e.quadrant).toBe('unpleasant-calm')
        }
      }
    })

    it('emotions with coordinates exactly at boundary ±1 still have valid quadrants', () => {
      for (const e of emotions) {
        if (Math.abs(e.valence) === 1 || Math.abs(e.arousal) === 1) {
          expect(['pleasant-intense', 'pleasant-calm', 'unpleasant-intense', 'unpleasant-calm']).toContain(
            e.quadrant
          )
        }
      }
    })
  })
})
