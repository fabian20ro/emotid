import { describe, it, expect } from 'vitest'
import { scoreSomaticSelections } from '../models/somatic/scoring'
import type { SomaticSelection, SensationType } from '../models/somatic/types'
import { somaticRegions as somaticData } from '../models/somatic'

function makeSomaticSelection(
  regionId: string,
  sensation: SensationType,
  intensity: 1 | 2 | 3,
): SomaticSelection {
  const region = somaticData[regionId as keyof typeof somaticData] as unknown as SomaticSelection
  return {
    ...region,
    selectedSensation: sensation,
    selectedIntensity: intensity,
  }
}

describe('additive somatic scoring', () => {
  it('returns results for multi-region selections', () => {
    const results = scoreSomaticSelections([
      makeSomaticSelection('chest', 'tension', 3),
      makeSomaticSelection('stomach', 'tension', 3),
    ])

    expect(results.length).toBeGreaterThan(0)
  })

  it('adds a matching region without an extra cross-group multiplier', () => {
    const oneGroup = scoreSomaticSelections([
      makeSomaticSelection('chest', 'tension', 3),
    ])

    const twoGroups = scoreSomaticSelections([
      makeSomaticSelection('chest', 'tension', 3),
      makeSomaticSelection('head', 'tension', 3),
    ])

    const anxietyOne = oneGroup.find((r) => r.id === 'anxiety')
    const anxietyTwo = twoGroups.find((r) => r.id === 'anxiety')

    expect(anxietyOne).toBeDefined()
    expect(anxietyTwo).toBeDefined()
    expect(anxietyTwo!.score).toBeGreaterThan(anxietyOne!.score)
  })

  it('adds a third matching region without an extra cross-group multiplier', () => {
    const twoGroups = scoreSomaticSelections([
      makeSomaticSelection('chest', 'tension', 3),
      makeSomaticSelection('head', 'tension', 3),
    ])

    const threeGroups = scoreSomaticSelections([
      makeSomaticSelection('chest', 'tension', 3),
      makeSomaticSelection('head', 'tension', 3),
      makeSomaticSelection('hands', 'tingling', 3),
    ])

    const anxietyTwo = twoGroups.find((r) => r.id === 'anxiety')
    const anxietyThree = threeGroups.find((r) => r.id === 'anxiety')

    expect(anxietyTwo).toBeDefined()
    expect(anxietyThree).toBeDefined()
    expect(anxietyThree!.score).toBeGreaterThan(anxietyTwo!.score)
  })

  it('higher intensity within the same region produces higher emotion scores', () => {
    const lowIntensity = scoreSomaticSelections([
      makeSomaticSelection('chest', 'tension', 1),
    ])

    const highIntensity = scoreSomaticSelections([
      makeSomaticSelection('chest', 'tension', 3),
    ])

    const anxietyLow = lowIntensity.find((r) => r.id === 'anxiety')
    const anxietyHigh = highIntensity.find((r) => r.id === 'anxiety')

    expect(anxietyLow).toBeDefined()
    expect(anxietyHigh).toBeDefined()
    // Intensity is a multiplier on signal weight; higher intensity → stronger score
    expect(anxietyHigh!.score).toBeGreaterThan(anxietyLow!.score)
  })
})
