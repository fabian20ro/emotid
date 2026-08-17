import { describe, it, expect } from 'vitest'
import { wheelModel } from '../models/wheel'

const e = wheelModel.allEmotions

function analyze(ids: string[]) {
  return wheelModel.analyze(ids.map((id) => e[id]))
}

describe('wheelModel.analyze', () => {
  it('returns empty array for no selections', () => {
    expect(analyze([])).toEqual([])
  })

  it('returns one result per selection', () => {
    const leafId = Object.keys(e).find((id) => !e[id].children?.length)!
    const results = analyze([leafId])
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe(leafId)
    expect(results[0].label).toEqual(e[leafId].label)
    expect(results[0].color).toBe(e[leafId].color)
  })

  it('passes bilingual description from data', () => {
    const withDesc = Object.keys(e).find((id) => e[id].children?.length === 0 && e[id].description)
    if (!withDesc) return // skip if no leaf nodes have descriptions

    const results = analyze([withDesc])
    expect(results[0].description).toEqual(e[withDesc].description)
    expect(results[0].description?.ro).toBeDefined()
    expect(results[0].description?.en).toBeDefined()
  })

  it('keeps duplicate selections as separate results', () => {
    const leafId = Object.keys(e).find((id) => !e[id].children?.length)!
    const results = analyze([leafId, leafId])
    expect(results).toHaveLength(2)
    expect(results[0]).toEqual(results[1])
  })

  it('builds hierarchyPath for nodes with parents', () => {
    // Pick a known leaf — verify path length > 1 when the emotion has ancestors
    const leaves = Object.keys(e).filter((id) => !e[id].children?.length)
    if (leaves.length === 0) return

    const result = analyze([leaves[0]])[0]
    // A leaf should have at least one parent unless it IS the center emotion
    if (e[leaves[0]].parents?.length > 0 && e[leaves[0]].id !== 'emotion-center') {
      expect(result.hierarchyPath).toBeDefined()
      expect((result.hierarchyPath as Array<{ ro: string; en: string }>).length).toBeGreaterThan(1)
      // Last entry in path should be the emotion's own label
      const labels = (result.hierarchyPath as Array<{ ro: string; en: string }>).map((p) => p.ro)
      expect(labels[labels.length - 1]).toBe(e[leaves[0]].label.ro)
    }
  })

  it('preserves the traversed parent branch for a multi-parent emotion', () => {
    const helpless = {
      ...e.helpless,
      navigationPath: ['sad', 'vulnerable', 'helpless'],
    }

    expect(wheelModel.analyze([helpless])[0].hierarchyPath?.map((item) => item.en))
      .toEqual(['Sad', 'Vulnerable', 'Helpless'])
  })

  it('returns multiple results for multiple selections', () => {
    const leaves = Object.keys(e).filter((id) => !e[id].children?.length).slice(0, 3)
    const results = analyze(leaves)
    expect(results).toHaveLength(leaves.length)
  })
})
