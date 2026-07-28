import { describe, it, expect } from 'vitest'
import { scoreSomaticSelections } from '../models/somatic/scoring'
import type { SomaticSelection, SomaticRegion } from '../models/somatic/types'
import { somaticRegions as somaticData } from '../models/somatic'

type RegionMap = Record<string, SomaticRegion>

const regions = somaticData as unknown as RegionMap

const GROUP_MAP_INFORMED_EMOTIONS = ['anger', 'fear', 'disgust', 'sadness', 'surprise'] as const

function buildPatternSelections(emotionId: string): SomaticSelection[] {
  const matches: Array<{
    region: SomaticRegion
    sensationType: SomaticSelection['selectedSensation']
    minIntensity: 1 | 2 | 3
    weight: number
  }> = []

  for (const region of Object.values(regions)) {
    for (const signal of region.emotionSignals) {
      if (signal.emotionId !== emotionId) continue
      if (signal.basis !== 'nummenmaa-2014-group-map') continue
      matches.push({
        region,
        sensationType: signal.sensationType,
        minIntensity: signal.minIntensity,
        weight: signal.weight,
      })
    }
  }

  return matches
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4)
    .map((match) => ({
      ...match.region,
      selectedSensation: match.sensationType,
      selectedIntensity: (match.minIntensity === 3 ? 3 : 2) as 1 | 2 | 3,
    }))
}

describe('group-map-informed somatic hypothesis regression', () => {
  for (const emotionId of GROUP_MAP_INFORMED_EMOTIONS) {
    it(`keeps "${emotionId}" in top results for its curated pattern`, () => {
      const selections = buildPatternSelections(emotionId)
      expect(selections.length).toBeGreaterThan(0)

      const results = scoreSomaticSelections(selections)
      expect(results.length).toBeGreaterThan(0)

      const rank = results.findIndex((result) => result.id === emotionId)

      expect(rank).toBeGreaterThanOrEqual(0)
      expect(rank).toBeLessThan(3)
    })

    it(`ranks "${emotionId}" first when its own curated pattern is selected`, () => {
      const selections = buildPatternSelections(emotionId)
      expect(selections.length).toBeGreaterThan(0)

      const results = scoreSomaticSelections(selections)
      expect(results[0]?.id).toBe(emotionId)
    })
  }
})
