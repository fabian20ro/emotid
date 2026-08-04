import { describe, it, expect } from 'vitest'
import { analyzeSomaticSelections, scoreSomaticSelections } from './scoring'
import { somaticRegions } from './index'
import type { SomaticSelection } from './types'

describe('scoreSomaticSelections', () => {
  it('rejects incomplete or invalid body signals at the analysis boundary', () => {
    const chest = somaticRegions.chest
    const invalidIntensity = {
      ...chest,
      selectedSensation: 'tension',
      selectedIntensity: 4,
    }

    expect(analyzeSomaticSelections([chest])).toEqual([])
    expect(analyzeSomaticSelections([invalidIntensity])).toEqual([])
  })

  it('should return an empty array if no selections are provided', () => {
    const results = scoreSomaticSelections([])
    expect(results).toEqual([])
  })

  it('should correctly calculate score for a single selection', () => {
    const selections = [{
      group: 'head',
      selectedSensation: 'pressure',
      selectedIntensity: 2,
      emotionSignals: [
        {
          emotionId: 'anger',
          sensationType: 'pressure',
          minIntensity: 2,
          weight: 1.0,
          source: 'curated-hypothesis'
        }
      ]
    }] as unknown as SomaticSelection[]

    const results = scoreSomaticSelections(selections)
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('anger')
    expect(results[0].score).toBe(2.0)
  })

  it('should add contributions without inferring cross-body coherence', () => {
    const selections = [
      {
        group: 'head',
        selectedSensation: 'pressure',
        selectedIntensity: 2,
        emotionSignals: [{
          emotionId: 'anger',
          sensationType: 'pressure',
          minIntensity: 2,
          weight: 1.0,
          source: 'curated-hypothesis'
        }]
      },
      {
        group: 'torso',
        selectedSensation: 'pressure',
        selectedIntensity: 2,
        emotionSignals: [{
          emotionId: 'anger',
          sensationType: 'pressure',
          minIntensity: 2,
          weight: 1.0,
          source: 'curated-hypothesis'
        }]
      }
    ] as unknown as SomaticSelection[]

    const results = scoreSomaticSelections(selections)
    expect(results).toHaveLength(1)
    expect(results[0].score).toBeCloseTo(4.0)
  })

  it('should add contributions from the same body group', () => {
    const selections = [
      {
        group: 'head',
        selectedSensation: 'pressure',
        selectedIntensity: 2,
        emotionSignals: [{
          emotionId: 'anger',
          sensationType: 'pressure',
          minIntensity: 2,
          weight: 1.0,
          source: 'curated-hypothesis'
        }]
      },
      {
        group: 'head',
        selectedSensation: 'pressure',
        selectedIntensity: 2,
        emotionSignals: [{
          emotionId: 'anger',
          sensationType: 'pressure',
          minIntensity: 2,
          weight: 1.0,
          source: 'curated-hypothesis'
        }]
      }
    ] as unknown as SomaticSelection[]

    const results = scoreSomaticSelections(selections)
    expect(results).toHaveLength(1)
    expect(results[0].score).toBe(4.0)
  })

  it('should skip emotion signals whose sensationType does not match the selected sensation', () => {
    const selections = [{
      group: 'head',
      selectedSensation: 'pressure',
      selectedIntensity: 2,
      emotionSignals: [
        {
          emotionId: 'anger',
          sensationType: 'tension',
          minIntensity: 1,
          weight: 5.0,
          source: 'curated-hypothesis'
        },
        {
          emotionId: 'calm',
          sensationType: 'pressure',
          minIntensity: 2,
          weight: 1.0,
          source: 'curated-hypothesis'
        }
      ]
    }] as unknown as SomaticSelection[]

    const results = scoreSomaticSelections(selections)
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('calm')
    expect(results[0].score).toBe(2.0)
  })

  it('should skip emotion signals whose minIntensity exceeds selected intensity', () => {
    const selections = [{
      group: 'head',
      selectedSensation: 'pressure',
      selectedIntensity: 1,
      emotionSignals: [
        {
          emotionId: 'anger',
          sensationType: 'pressure',
          minIntensity: 2,
          weight: 3.0,
          source: 'curated-hypothesis'
        },
        {
          emotionId: 'calm',
          sensationType: 'pressure',
          minIntensity: 1,
          weight: 1.5,
          source: 'curated-hypothesis'
        }
      ]
    }] as unknown as SomaticSelection[]

    const results = scoreSomaticSelections(selections)
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('calm')
    expect(results[0].score).toBeCloseTo(1.5)
  })

  it('should return empty array when all signals fail sensationType or minIntensity gates', () => {
    const selections = [{
      group: 'head',
      selectedSensation: 'warmth',
      selectedIntensity: 1,
      emotionSignals: [
        {
          emotionId: 'anger',
          sensationType: 'pressure',
          minIntensity: 3,
          weight: 5.0,
          source: 'curated-hypothesis'
        }
      ]
    }] as unknown as SomaticSelection[]

    const results = scoreSomaticSelections(selections)
    expect(results).toEqual([])
  })
})
