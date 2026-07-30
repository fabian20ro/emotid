import { describe, expect, it } from 'vitest'
import type { Session } from '../../../data/types'
import type { AnalysisResult, BaseEmotion } from '../../../models/types'
import { buildCheckInCompletion } from './build-completion'

const now = 2_000_000_000_000
const selection: BaseEmotion = {
  id: 'despair',
  label: { en: 'despair', ro: 'disperare' },
  color: '#555',
}

function result(id: string): AnalysisResult {
  return {
    id,
    label: { en: id, ro: id },
    color: '#555',
  }
}

function historicalSession(id: string, crisisTier: Session['crisisTier']): Session {
  return {
    id,
    timestamp: now - 1_000,
    modelId: 'wheel',
    selections: [],
    results: [],
    crisisTier,
  }
}

describe('buildCheckInCompletion', () => {
  it('builds the shared completion without history escalation', () => {
    const completion = buildCheckInCompletion({
      route: 'words',
      modelId: 'wheel',
      selections: [selection],
      results: [result('despair')],
    }, [], now)

    expect(completion).toMatchObject({
      route: 'words',
      modelId: 'wheel',
      crisisTier: 'tier1',
      temporalEscalation: false,
    })
  })

  it('discloses temporal history only when it raises the displayed tier', () => {
    const history = [
      historicalSession('one', 'tier2'),
      historicalSession('two', 'tier3'),
      historicalSession('three', 'tier2'),
    ]

    const escalated = buildCheckInCompletion({
      route: 'quick',
      modelId: 'quick-check-in',
      selections: [selection],
      results: [result('despair')],
    }, history, now)
    const alreadyTierThree = buildCheckInCompletion({
      route: 'words',
      modelId: 'wheel',
      selections: [selection],
      results: [result('despair'), result('helpless')],
    }, history, now)

    expect(escalated).toMatchObject({
      crisisTier: 'tier2',
      temporalEscalation: true,
    })
    expect(alreadyTierThree).toMatchObject({
      crisisTier: 'tier3',
      temporalEscalation: false,
    })
  })
})
