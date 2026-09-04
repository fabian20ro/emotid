import { describe, expect, it } from 'vitest'
import { somaticModel } from '../models/somatic'
import type { SomaticRegion } from '../models/somatic/types'
import { createSession } from '../data/session'
import { decodeSessions } from '../data/record-validation'
import { getResultRelationship, isSessionEligibleForPatterns } from '../data/session-presentation'

describe('body observations without suggested emotions', () => {
  it('round-trips every exposed single signal, preserving empty results rather than inventing labels', () => {
    let combinations = 0
    let empty = 0
    for (const region of Object.values(somaticModel.allEmotions) as SomaticRegion[]) {
      for (const selectedSensation of region.commonSensations) {
        for (const selectedIntensity of [1, 2, 3]) {
          combinations++
          const selection = { ...region, selectedSensation, selectedIntensity }
          const results = somaticModel.analyze([selection])
          if (results.length) continue
          empty++
          const session = createSession({ route: 'body', modelId: somaticModel.id, selections: [selection], results })
          expect(decodeSessions([session])).toEqual([session])
          expect(session.results).toEqual([])
          expect(getResultRelationship(session)).toBe('observation')
          expect(isSessionEligibleForPatterns(session)).toBe(false)
          expect(session.crisisTier).toBe('none')
        }
      }
    }
    expect(combinations).toBe(183)
    expect(empty).toBe(64)
  })

  it('rejects malformed observation records and inferred content attached to them', () => {
    const selection = { ...somaticModel.allEmotions.chest, selectedSensation: 'pressure', selectedIntensity: 1 }
    const session = createSession({ route: 'body', modelId: somaticModel.id, selections: [selection], results: [] })
    for (const change of [
      { entryRoute: 'quick' }, { selectedNeed: 'grounding' }, { reflectionAnswer: 'yes' },
      { selections: [] }, { crisisTier: 'tier4' }, { outcome: 'unknown' },
      { selections: [{ ...session.selections[0], extras: { sensationType: 'pressure', intensity: '1' } }] },
    ]) expect(() => decodeSessions([{ ...session, ...change }])).toThrow()
  })
})
