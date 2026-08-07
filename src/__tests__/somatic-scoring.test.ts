import { describe, it, expect } from 'vitest'
import { scoreSomaticSelections } from '../models/somatic/scoring'
import { emotionCatalog } from '../models/catalog'
import type { SomaticSelection, EmotionSignal, BodyGroup } from '../models/somatic/types'

function makeSignal(overrides: Partial<EmotionSignal> & Pick<EmotionSignal, 'emotionId' | 'sensationType'>): EmotionSignal {
  return {
    minIntensity: 1,
    weight: 1,
    source: 'curated-hypothesis',
    ...overrides,
  }
}

function makeSelection(
  id: string,
  sensation: SomaticSelection['selectedSensation'],
  intensity: SomaticSelection['selectedIntensity'],
  signals: EmotionSignal[] = [],
  group: BodyGroup = 'torso'
): SomaticSelection {
  return {
    id,
    label: { ro: id, en: id },
    color: '#ccc',
    svgRegionId: id,
    group,
    commonSensations: [sensation],
    emotionSignals: signals,
    selectedSensation: sensation,
    selectedIntensity: intensity,
  }
}

describe('scoreSomaticSelections', () => {
  it('returns empty array when no selections', () => {
    expect(scoreSomaticSelections([])).toEqual([])
  })

  it('scores a single matching signal', () => {
    const signal = makeSignal({ emotionId: 'anxiety', sensationType: 'tension', weight: 0.8 })
    const selection = makeSelection('chest', 'tension', 2, [signal])
    const results = scoreSomaticSelections([selection])

    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('anxiety')
    expect(results[0].score).toBeCloseTo(0.8 * 2)
  })

  it('ignores signals when sensation type does not match', () => {
    const signal = makeSignal({ emotionId: 'anxiety', sensationType: 'tension', weight: 0.8 })
    const selection = makeSelection('chest', 'warmth', 3, [signal])
    const results = scoreSomaticSelections([selection])

    expect(results).toHaveLength(0)
  })

  it('ignores signals when intensity is below minIntensity', () => {
    const signal = makeSignal({ emotionId: 'anger', sensationType: 'pressure', weight: 1, minIntensity: 3 })
    const selection = makeSelection('head', 'pressure', 2, [signal])
    const results = scoreSomaticSelections([selection])

    expect(results).toHaveLength(0)
  })

  it('includes signal when intensity equals minIntensity', () => {
    const signal = makeSignal({ emotionId: 'anger', sensationType: 'pressure', weight: 0.5, minIntensity: 2 })
    const selection = makeSelection('head', 'pressure', 2, [signal])
    const results = scoreSomaticSelections([selection])

    expect(results).toHaveLength(1)
    expect(results[0].score).toBeCloseTo(0.5 * 2)
  })

  it('aggregates scores across multiple selections for the same emotion', () => {
    const chestSignal = makeSignal({ emotionId: 'anxiety', sensationType: 'tension', weight: 0.6 })
    const stomachSignal = makeSignal({ emotionId: 'anxiety', sensationType: 'churning', weight: 0.4 })

    const chest = makeSelection('chest', 'tension', 2, [chestSignal], 'torso')
    const stomach = makeSelection('stomach', 'churning', 3, [stomachSignal], 'torso')

    const results = scoreSomaticSelections([chest, stomach])

    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('anxiety')
    expect(results[0].score).toBeCloseTo(0.6 * 2 + 0.4 * 3)
  })

  it('adds signals from multiple body groups without a coherence multiplier', () => {
    const chestSignal = makeSignal({ emotionId: 'anxiety', sensationType: 'tension', weight: 0.6 })
    const legSignal = makeSignal({ emotionId: 'anxiety', sensationType: 'tingling', weight: 0.4 })

    const chest = makeSelection('chest', 'tension', 2, [chestSignal], 'torso')
    const legs = makeSelection('legs', 'tingling', 3, [legSignal], 'legs')

    const results = scoreSomaticSelections([chest, legs])

    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('anxiety')
    expect(results[0].score).toBeCloseTo(0.6 * 2 + 0.4 * 3)
  })

  it('returns correct match strength for different ratios and scores', () => {
    // Test case 1: Closer match (ratio >= 0.7 and score >= 1.0)
    const signal1 = makeSignal({ emotionId: 'anxiety', sensationType: 'tension', weight: 2.0 })
    const selection1 = makeSelection('chest', 'tension', 2, [signal1])
    const results1 = scoreSomaticSelections([selection1])
    expect(results1[0].matchStrength).toEqual({ ro: 'potrivire mai apropiată', en: 'closer match' })

    // Test case 2: Possible match (ratio >= 0.4 and score >= 0.6)
    const signal2 = makeSignal({ emotionId: 'anxiety', sensationType: 'tension', weight: 0.4 })
    const selection2 = makeSelection('chest', 'tension', 2, [signal2])
    const results2 = scoreSomaticSelections([selection2])
    expect(results2[0].matchStrength).toEqual({ ro: 'potrivire posibilă', en: 'possible match' })

    // Test case 3: Worth exploring (else)
    const signal3 = makeSignal({ emotionId: 'anxiety', sensationType: 'tension', weight: 0.55 })
    const selection3 = makeSelection('chest', 'tension', 1, [signal3])
    const results3 = scoreSomaticSelections([selection3])
    expect(results3[0].matchStrength).toEqual({ ro: 'merită explorat', en: 'worth exploring' })
  })

  it('limits results to at most 4', () => {
    const signals = Array.from({ length: 6 }, (_, i) =>
      makeSignal({ emotionId: `emotion-${i}`, sensationType: 'tension', weight: 0.5 + i * 0.1 })
    )
    const selection = makeSelection('chest', 'tension', 3, signals)
    const results = scoreSomaticSelections([selection])

    expect(results.length).toBeLessThanOrEqual(4)
  })

  it('filters out emotions below threshold of 0.5', () => {
    const weakSignal = makeSignal({ emotionId: 'calm', sensationType: 'warmth', weight: 0.15 })
    const selection = makeSelection('feet', 'warmth', 2, [weakSignal], 'legs')
    const results = scoreSomaticSelections([selection])

    // 0.15 * 2 = 0.3 < 0.5 threshold
    expect(results).toHaveLength(0)
  })

  it('includes component labels showing contributing regions', () => {
    const chestSignal = makeSignal({ emotionId: 'anxiety', sensationType: 'tension', weight: 0.6 })
    const stomachSignal = makeSignal({ emotionId: 'anxiety', sensationType: 'churning', weight: 0.4 })

    const chest = makeSelection('chest', 'tension', 2, [chestSignal])
    chest.label = { ro: 'Piept', en: 'Chest' }
    const stomach = makeSelection('stomach', 'churning', 3, [stomachSignal])
    stomach.label = { ro: 'Stomac', en: 'Stomach' }

    const results = scoreSomaticSelections([chest, stomach])

    expect(results[0].componentLabels).toBeDefined()
    expect(results[0].componentLabels).toHaveLength(2)
    expect(results[0].componentLabels![0].en).toBe('Chest')
    expect(results[0].componentLabels![1].en).toBe('Stomach')
  })

  it('uses resonance-based match strength labels', () => {
    const strongSignal = makeSignal({ emotionId: 'joy', sensationType: 'lightness', weight: 1.0 })
    const weakSignal = makeSignal({ emotionId: 'calm', sensationType: 'lightness', weight: 0.2 })

    const selection = makeSelection('chest', 'lightness', 3, [strongSignal, weakSignal])
    const results = scoreSomaticSelections([selection])

    const strong = results.find(r => r.id === 'joy')
    expect(strong?.matchStrength.en).toBe('closer match')

    const weak = results.find(r => r.id === 'calm')
    expect(weak?.matchStrength.en).toBe('worth exploring')
  })

  it('applies the absolute score floor to match strength', () => {
    const signal = makeSignal({ emotionId: 'joy', sensationType: 'lightness', weight: 1.0 })
    const selection = makeSelection('chest', 'lightness', 3, [signal])
    const results = scoreSomaticSelections([selection])

    // maxScore = 1.0 * 3 = 3.0. ratio = 1.0. score = 3.0.
    // ratio >= 0.7 && score >= 1.0 -> 'closer match'
    expect(results[0].matchStrength.en).toBe('closer match')
  })

  it('reuses reviewed canonical description without manufacturing a need or somatic cause', () => {
    const signal = makeSignal({ emotionId: 'joy', sensationType: 'tension', weight: 1.0 })
    const selection = makeSelection('chest', 'tension', 2, [signal])

    const results = scoreSomaticSelections([selection])

    expect(results[0].description).toEqual(emotionCatalog.joy.description)
    expect(results[0].description?.en).not.toContain('tension')
    expect(results[0].needs).toBeUndefined()
  })

  it('exposes only reviewed controlled guidance for a somatic suggestion', () => {
    const signal = makeSignal({ emotionId: 'exhaustion', sensationType: 'heaviness', weight: 1.0 })
    const selection = makeSelection('shoulders', 'heaviness', 2, [signal])

    const results = scoreSomaticSelections([selection])

    expect(results[0].description).toBeUndefined()
    expect(results[0].needs).toEqual({ en: 'rest', ro: 'odihnă' })
  })

  it('downgrades match strength if score is below the threshold despite high ratio', () => {
    const signal = makeSignal({ emotionId: 'joy', sensationType: 'lightness', weight: 0.1 })
    const selection = makeSelection('chest', 'lightness', 3, [signal])
    const results = scoreSomaticSelections([selection])

    // maxScore = 0.1 * 3 = 0.3. ratio = 1.0. score = 0.3.
    // ratio >= 0.7 but score < 1.0 -> false
    // ratio >= 0.4 and score < 0.6 -> false
    // returns 'worth exploring'
    expect(results).toHaveLength(0)
  })

  it('handles the possible-match threshold correctly', () => {
    const signal = makeSignal({ emotionId: 'joy', sensationType: 'lightness', weight: 0.5 })
    const selection = makeSelection('chest', 'lightness', 2, [signal])
    const results = scoreSomaticSelections([selection])

    // maxScore = 0.5 * 2 = 1.0. ratio = 1.0. score = 1.0.
    // ratio >= 0.7 && score >= 1.0 -> 'closer match'
    expect(results[0].matchStrength.en).toBe('closer match')

    // Try score=0.8, maxScore=1.0 -> ratio=0.8, score=0.8
    // ratio >= 0.4 and score >= 0.6 -> 'possible match'
    const signal2 = makeSignal({ emotionId: 'joy', sensationType: 'lightness', weight: 0.4 })
    const selection2 = makeSelection('chest', 'lightness', 2, [signal2])
    const results2 = scoreSomaticSelections([selection2])
    expect(results2[0].matchStrength.en).toBe('possible match')
  })
})
