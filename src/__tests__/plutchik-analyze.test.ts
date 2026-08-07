import { describe, it, expect } from 'vitest'
import { plutchikModel } from '../models/plutchik'

const e = plutchikModel.allEmotions

function analyze(ids: string[]) {
  return plutchikModel.analyze(ids.map((id) => e[id]))
}

describe('plutchikModel.analyze', () => {
  it('returns empty array for no selections', () => {
    expect(analyze([])).toEqual([])
  })

  it('returns single result with description for one selection', () => {
    const results = analyze(['joy'])
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('joy')
    expect(results[0].label).toEqual(e['joy'].label)
    expect(results[0].color).toBe(e['joy'].color)
    expect(results[0].description).toEqual(e['joy'].description)
  })

  it('returns dyad when two complementary primaries are selected', () => {
    // joy + trust = love
    const results = analyze(['joy', 'trust'])
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('love')
    expect(results[0].componentLabels).toHaveLength(2)
    expect(results[0].description).toEqual(e['love'].description)
  })

  it('includes unconsumed selections alongside dyads', () => {
    // joy + trust = love (dyad), ecstasy has no pair here so it's unconsumed
    const results = analyze(['joy', 'trust', 'ecstasy'])
    const ids = results.map((r) => r.id)
    expect(ids).toContain('love')
    expect(ids).toContain('ecstasy')
    // exactly 2 results: love (dyad consuming joy+trust) + ecstasy standalone
    expect(results).toHaveLength(2)
    // ecstasy should appear without componentLabels
    const ecstasyResult = results.find((r) => r.id === 'ecstasy')
    expect(ecstasyResult?.componentLabels).toBeUndefined()
  })

  it('propagates needs from the dyad emotion, not components', () => {
    const loveEmotion = e['love']
    const results = analyze(['joy', 'trust'])
    expect(results[0].needs).toEqual(loveEmotion.needs)
  })

  it('does not duplicate consumed primaries as standalone results', () => {
    const results = analyze(['joy', 'trust'])
    const ids = results.map((r) => r.id)
    expect(ids).not.toContain('joy')
    expect(ids).not.toContain('trust')
  })

  it('includes directly-selected dyads as standalone results', () => {
    const results = analyze(['surprise', 'anticipation', 'optimism'])
    const ids = results.map((r) => r.id)
    // surprise + anticipation form a dyad (confusion)
    expect(ids).toContain('optimism')
    // optimism was not consumed as a component, so it appears standalone
    const optimismResult = results.find((r) => r.id === 'optimism')
    expect(optimismResult?.componentLabels).toBeUndefined()
  })

  it('returns multiple dyads from three primaries', () => {
    // joy + trust = optimism, joy + anticipation = optimism? No...
    // trust + fear = submission, joy + trust = optimism
    const results = analyze(['joy', 'trust', 'fear'])
    const dyadResults = results.filter((r) => r.componentLabels)
    expect(dyadResults.length).toBeGreaterThanOrEqual(1)
  })

  it('does not manufacture a description for an unaudited dyad', () => {
    // joy + trust = love
    const results = analyze(['joy', 'trust'])
    expect(results[0].description).toBeUndefined()
  })

  it('exposes only the four reviewed needs reachable from primary pairs', () => {
    const primaryIds = [...plutchikModel.initialState.visibleEmotionIds.keys()]
    const results = primaryIds.flatMap((first, index) => (
      primaryIds.slice(index + 1).flatMap((second) => analyze([first, second]))
    ))

    expect(Object.fromEntries(
      results
        .filter((result) => result.needs)
        .map((result) => [result.id, result.needs?.en]),
    )).toEqual({
      anxiety: 'grounding',
      despair: 'support',
      love: 'safe connection',
      shame: 'safe connection',
    })
  })
})
