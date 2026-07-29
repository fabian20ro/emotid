import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useEmotionModel } from '../hooks/useEmotionModel'
import { plutchikModel } from '../models/plutchik'
import { somaticModel } from '../models/somatic'
import { wheelModel } from '../models/wheel'

describe('useEmotionModel', () => {
  it('starts with empty selections', () => {
    const { result } = renderHook(() => useEmotionModel(plutchikModel))
    expect(result.current.selections).toEqual([])
  })

  it('marks a loaded model as ready', async () => {
    const { result } = renderHook(() => useEmotionModel(somaticModel))
    await waitFor(() => expect(result.current.modelReady).toBe(true))
    expect(result.current.visibleEmotions.length).toBeGreaterThan(0)
  })

  it('returns visible emotions matching initial state', () => {
    const { result } = renderHook(() => useEmotionModel(plutchikModel))
    expect(result.current.visibleEmotions.length).toBeGreaterThan(0)
  })

  it('adds emotion to selections on handleSelect', () => {
    const { result } = renderHook(() => useEmotionModel(plutchikModel))
    const firstEmotion = result.current.visibleEmotions[0]

    act(() => {
      result.current.handleSelect(firstEmotion)
    })

    expect(result.current.selections).toHaveLength(1)
    expect(result.current.selections[0].id).toBe(firstEmotion.id)
  })

  it('removes emotion from selections on handleDeselect', () => {
    const { result } = renderHook(() => useEmotionModel(plutchikModel))
    const firstEmotion = result.current.visibleEmotions[0]

    act(() => {
      result.current.handleSelect(firstEmotion)
    })
    expect(result.current.selections).toHaveLength(1)

    act(() => {
      result.current.handleDeselect(firstEmotion)
    })
    expect(result.current.selections).toHaveLength(0)
  })

  it('clears all selections on handleClear', () => {
    const { result } = renderHook(() => useEmotionModel(plutchikModel))
    const emotions = result.current.visibleEmotions

    act(() => {
      result.current.handleSelect(emotions[0])
      result.current.handleSelect(emotions[1])
    })
    expect(result.current.selections.length).toBeGreaterThan(0)

    act(() => {
      result.current.handleClear()
    })
    expect(result.current.selections).toEqual([])
  })

  it('resets selections when model changes', () => {
    const { result, rerender } = renderHook(
      ({ model }) => useEmotionModel(model),
      { initialProps: { model: plutchikModel } }
    )

    const firstEmotion = result.current.visibleEmotions[0]
    act(() => {
      result.current.handleSelect(firstEmotion)
    })
    expect(result.current.selections).toHaveLength(1)

    rerender({ model: wheelModel })
    expect(result.current.selections).toEqual([])
  })

  it('detects combos for plutchik dyads', () => {
    const { result } = renderHook(() => useEmotionModel(plutchikModel))
    // Select joy and trust (which form "love" in Plutchik)
    const joy = result.current.visibleEmotions.find((e) => e.id === 'joy')!
    const trust = result.current.visibleEmotions.find((e) => e.id === 'trust')!

    act(() => {
      result.current.handleSelect(joy)
    })
    act(() => {
      result.current.handleSelect(trust)
    })

    expect(result.current.combos.length).toBeGreaterThan(0)
    expect(result.current.combos[0].componentLabels).toBeDefined()
  })

  it('handleDeselect removes only the targeted emotion when multiple are selected simultaneously', () => {
    const { result } = renderHook(() => useEmotionModel(plutchikModel))
    const joy = result.current.visibleEmotions.find((e) => e.id === 'joy')!
    const trust = result.current.visibleEmotions.find((e) => e.id === 'trust')!

    act(() => {
      result.current.handleSelect(joy)
      result.current.handleSelect(trust)
    })
    expect(result.current.selections).toHaveLength(2)

    act(() => {
      result.current.handleDeselect(joy)
    })
    expect(result.current.selections).toHaveLength(1)
    expect(result.current.selections[0].id).toBe('trust')
  })

  it('analyze returns results based on current selections', () => {
    const { result } = renderHook(() => useEmotionModel(plutchikModel))
    const firstEmotion = result.current.visibleEmotions[0]

    act(() => {
      result.current.handleSelect(firstEmotion)
    })

    const results = result.current.analyze()
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe(firstEmotion.id)
  })

  it('provides sizes for all visible emotions', () => {
    const { result } = renderHook(() => useEmotionModel(plutchikModel))
    for (const emotion of result.current.visibleEmotions) {
      expect(result.current.sizes.has(emotion.id)).toBe(true)
    }
  })

  describe('wheel breadcrumb', () => {
    it('breadcrumbPath is empty at root', () => {
      const { result } = renderHook(() => useEmotionModel(wheelModel))
      expect(result.current.breadcrumbPath).toEqual([])
    })

    it('breadcrumbPath shows ancestors after drilling down', () => {
      const { result } = renderHook(() => useEmotionModel(wheelModel))

      // Drill into happy
      const happy = result.current.visibleEmotions.find((e) => e.id === 'happy')!
      act(() => { result.current.handleSelect(happy) })

      expect(result.current.breadcrumbPath).toHaveLength(1)
      expect(result.current.breadcrumbPath[0].id).toBe('happy')
    })

    it('breadcrumbPath shows two ancestors at level 2', () => {
      const { result } = renderHook(() => useEmotionModel(wheelModel))

      const happy = result.current.visibleEmotions.find((e) => e.id === 'happy')!
      act(() => { result.current.handleSelect(happy) })

      const playful = result.current.visibleEmotions.find((e) => e.id === 'playful')!
      act(() => { result.current.handleSelect(playful) })

      expect(result.current.breadcrumbPath).toHaveLength(2)
      expect(result.current.breadcrumbPath[0].id).toBe('happy')
      expect(result.current.breadcrumbPath[1].id).toBe('playful')
    })

    it('handleBreadcrumbSelect adds branch emotion and resets to root', () => {
      const { result } = renderHook(() => useEmotionModel(wheelModel))

      // Drill into happy
      const happy = result.current.visibleEmotions.find((e) => e.id === 'happy')!
      act(() => { result.current.handleSelect(happy) })

      // Now select happy via breadcrumb
      act(() => { result.current.handleBreadcrumbSelect(result.current.breadcrumbPath[0]) })

      // happy should be in selections
      expect(result.current.selections).toHaveLength(1)
      expect(result.current.selections[0].id).toBe('happy')

      // Should reset to root
      expect(result.current.breadcrumbPath).toEqual([])
      const visibleIds = result.current.visibleEmotions.map((e) => e.id)
      expect(visibleIds).toContain('happy')
      expect(visibleIds).toContain('sad')
    })

    it('handleBreadcrumbSelect does not duplicate already-selected emotions', () => {
      const { result } = renderHook(() => useEmotionModel(wheelModel))

      // Drill into happy → playful → select 'aroused' (leaf)
      act(() => { result.current.handleSelect(result.current.visibleEmotions.find((e) => e.id === 'happy')!) })
      act(() => { result.current.handleSelect(result.current.visibleEmotions.find((e) => e.id === 'playful')!) })
      // Select 'aroused' as leaf
      act(() => { result.current.handleSelect(result.current.visibleEmotions.find((e) => e.id === 'aroused')!) })

      // Now drill again and breadcrumb-select happy
      act(() => { result.current.handleSelect(result.current.visibleEmotions.find((e) => e.id === 'happy')!) })
      act(() => { result.current.handleBreadcrumbSelect(result.current.breadcrumbPath[0]) })

      // Should have aroused + happy, no duplicates
      expect(result.current.selections).toHaveLength(2)
      expect(result.current.selections.map((s) => s.id)).toContain('aroused')
      expect(result.current.selections.map((s) => s.id)).toContain('happy')

      // Breadcrumb-select happy again — should not duplicate
      act(() => { result.current.handleSelect(result.current.visibleEmotions.find((e) => e.id === 'happy')!) })
      act(() => { result.current.handleBreadcrumbSelect(result.current.breadcrumbPath[0]) })
      const happyCount = result.current.selections.filter((s) => s.id === 'happy').length
      expect(happyCount).toBe(1)
    })
  })

  describe('wheel model navigation', () => {
    it('preserves selections when deselecting one in wheel model', () => {
      const { result } = renderHook(() => useEmotionModel(wheelModel))

      // Drill to happy → playful → aroused
      const happy = result.current.visibleEmotions.find((e) => e.id === 'happy')!
      act(() => { result.current.handleSelect(happy) })

      const playful = result.current.visibleEmotions.find((e) => e.id === 'playful')!
      act(() => { result.current.handleSelect(playful) })

      const aroused = result.current.visibleEmotions.find((e) => e.id === 'aroused')!
      act(() => { result.current.handleSelect(aroused) })

      expect(result.current.selections).toHaveLength(1)
      expect(result.current.selections[0].id).toBe('aroused')

      // Now select from another branch: sad → lonely → isolated
      const sad = result.current.visibleEmotions.find((e) => e.id === 'sad')!
      act(() => { result.current.handleSelect(sad) })

      const lonely = result.current.visibleEmotions.find((e) => e.id === 'lonely')!
      act(() => { result.current.handleSelect(lonely) })

      const isolated = result.current.visibleEmotions.find((e) => e.id === 'isolated')!
      act(() => { result.current.handleSelect(isolated) })

      // Should have both selections
      expect(result.current.selections).toHaveLength(2)
      expect(result.current.selections.map((s) => s.id)).toContain('aroused')
      expect(result.current.selections.map((s) => s.id)).toContain('isolated')

      // Deselect aroused — isolated should remain
      act(() => { result.current.handleDeselect(result.current.selections.find((s) => s.id === 'aroused')!) })
      expect(result.current.selections).toHaveLength(1)
      expect(result.current.selections[0].id).toBe('isolated')
    })
  })
})
