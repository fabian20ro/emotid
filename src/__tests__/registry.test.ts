import { describe, it, expect } from 'vitest'
import {
  getVisualization,
  loadModel,
  preloadVisualization,
} from '../models/registry'
import { MODEL_IDS } from '../models/constants'

describe('model registry', () => {
  it.each([
    MODEL_IDS.DIMENSIONAL,
    MODEL_IDS.PLUTCHIK,
    MODEL_IDS.SOMATIC,
    MODEL_IDS.WHEEL,
  ])('loads and caches %s on demand', async (modelId) => {
    const first = await loadModel(modelId)
    const second = await loadModel(modelId)
    expect(first).toBeDefined()
    expect(second).toBe(first)
  })

  it('keeps generic visualizations separate from the route-specific body flow', () => {
    expect(getVisualization(MODEL_IDS.PLUTCHIK)).toBeDefined()
    expect(getVisualization(MODEL_IDS.WHEEL)).toBeDefined()
    expect(getVisualization(MODEL_IDS.DIMENSIONAL)).toBeDefined()
    expect(getVisualization(MODEL_IDS.SOMATIC)).toBeUndefined()
  })

  it('preloads registered visualizations and ignores the route-specific body flow', async () => {
    await expect(preloadVisualization(MODEL_IDS.DIMENSIONAL)).resolves.toBeUndefined()
    await expect(preloadVisualization(MODEL_IDS.PLUTCHIK)).resolves.toBeUndefined()
    await expect(preloadVisualization(MODEL_IDS.SOMATIC)).resolves.toBeUndefined()
  })
})
