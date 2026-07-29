import { describe, expect, it } from 'vitest'
import {
  getLoadedCheckInFeature,
  loadCheckInFeature,
  preloadCheckInFeature,
  type FeatureRoute,
} from '../features/check-in/registry'

describe('check-in feature registry', () => {
  it.each<FeatureRoute>(['body', 'affect', 'words', 'plutchik'])(
    'loads and caches the %s feature boundary',
    async (route) => {
      const first = await loadCheckInFeature(route)
      const second = await loadCheckInFeature(route)
      expect(typeof first).toBe('function')
      expect(second).toBe(first)
      expect(getLoadedCheckInFeature(route)).toBe(first)
    },
  )

  it('allows event-time preloading without exposing a rejected promise', async () => {
    preloadCheckInFeature('affect')
    await expect(loadCheckInFeature('affect')).resolves.toBeDefined()
  })
})
