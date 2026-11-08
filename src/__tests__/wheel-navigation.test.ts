import { describe, it, expect } from 'vitest'
import { wheelModel } from '../models/wheel'

const e = wheelModel.allEmotions

const CENTER_IDS = [
  'happy', 'surprised', 'bad', 'fearful', 'angry', 'disgusted', 'sad',
]

function getCenterMap() {
  return new Map(CENTER_IDS.map((id) => [id, 0]))
}

describe('Wheel navigation', () => {
  it('initial state shows root emotions', () => {
    const state = wheelModel.initialState
    const ids = Array.from(state.visibleEmotionIds.keys())
    expect(ids).toEqual(CENTER_IDS)
  })

  it('selecting a branch node drills down to children', () => {
    const state = wheelModel.initialState
    const happy = e['happy']
    const effect = wheelModel.onSelect(happy, state, [])

    const visibleIds = Array.from(effect.newState.visibleEmotionIds.keys())
    expect(visibleIds).toEqual(happy.children)
  })

  it('selecting a leaf resets visible to root', () => {
    // Drill down: happy → playful → aroused (leaf)
    const state1 = wheelModel.initialState
    const effect1 = wheelModel.onSelect(e['happy'], state1, [])

    const effect2 = wheelModel.onSelect(e['playful'], effect1.newState, [])

    // Now select leaf 'aroused'
    const effect3 = wheelModel.onSelect(e['aroused'], effect2.newState, [])

    const visibleIds = Array.from(effect3.newState.visibleEmotionIds.keys())
    expect(visibleIds).toEqual(CENTER_IDS)
  })

  it('selecting a leaf node updates newSelections correctly', () => {
    const state = wheelModel.initialState
    const leaf = e['aroused'] // a leaf node
    const effect1 = wheelModel.onSelect(leaf, state, [])
    
    // Select excited (branch)
    const effect2 = wheelModel.onSelect(e['excited'], effect1.newState, [leaf])
    
    expect(effect2.newSelections).toBeDefined()
    expect(effect2.newSelections?.map(e => e.id)).toContain(leaf.id)
  })

  it('deselecting resets to root without wiping other selections', () => {
    const state = { visibleEmotionIds: getCenterMap(), currentGeneration: 0 }
    const effect = wheelModel.onDeselect(e['aroused'], state)

    // Should NOT have newSelections set (lets hook's default remove-one logic work)
    expect(effect.newSelections).toBeUndefined()

    // Should show root
    const visibleIds = Array.from(effect.newState.visibleEmotionIds.keys())
    expect(visibleIds).toEqual(CENTER_IDS)
  })

  it('onClear resets to initial state', () => {
    const cleared = wheelModel.onClear()
    const ids = Array.from(cleared.visibleEmotionIds.keys())
    expect(ids).toEqual(CENTER_IDS)
    expect(cleared.currentGeneration).toBe(0)
  })
})

describe('Wheel analyze with hierarchy path', () => {
  it('builds hierarchy path for leaf emotion', () => {
    const results = wheelModel.analyze([e['aroused']])
    expect(results).toHaveLength(1)
    expect(results[0].hierarchyPath).toBeDefined()
    // aroused → playful → happy
    const pathIds = results[0].hierarchyPath!.map((p) => p.en)
    expect(pathIds).toEqual(['Happy', 'Playful', 'Energized'])
  })

  it('does not include hierarchy path for root emotions', () => {
    const results = wheelModel.analyze([e['happy']])
    expect(results).toHaveLength(1)
    // Root has only itself — path length 1, so hierarchyPath should be undefined
    expect(results[0].hierarchyPath).toBeUndefined()
  })

  it('returns empty array for analyze with no selections', () => {
    const results = wheelModel.analyze([])
    expect(results).toEqual([])
  })

  it('drills into root emotions with children and preserves previous selections', () => {
    const state1 = wheelModel.initialState
    // Select a leaf first: happy → playful → aroused (leaf)
    const effect1 = wheelModel.onSelect(e['happy'], state1, [])
    const effect2 = wheelModel.onSelect(e['playful'], effect1.newState, [])
    const effect3 = wheelModel.onSelect(e['aroused'], effect2.newState, [])

    // Now select a root emotion (sad) — it has children: model drills down.
    // Pass the previous selections to show they survive drill-down into a branch node.
    const effect4 = wheelModel.onSelect(e['sad'], effect3.newState, effect3.newSelections || [])

    expect(effect4.newState.currentGeneration).toBe(1)
    expect(effect4.newSelections).toBeDefined()
    expect(effect4.newSelections?.map((s) => s.id)).toContain('aroused')
  })

  it('builds paths for multiple selections from different branches', () => {
    const results = wheelModel.analyze([e['aroused'], e['anxious']])
    expect(results).toHaveLength(2)
    expect(results[0].hierarchyPath).toBeDefined()
    expect(results[1].hierarchyPath).toBeDefined()

    // Should be from different root branches
    const root0 = results[0].hierarchyPath![0].en
    const root1 = results[1].hierarchyPath![0].en
    expect(root0).not.toBe(root1)
  })
})
