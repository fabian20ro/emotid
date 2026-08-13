import { describe, expect, it } from 'vitest'
import type { AnalysisResult, BaseEmotion } from '../../../models/types'
import { buildCheckInCompletion } from './build-completion'

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

describe('buildCheckInCompletion', () => {
  it('builds current-session support without temporal metadata', () => {
    const completion = buildCheckInCompletion({
      route: 'words',
      modelId: 'wheel',
      selections: [selection],
      results: [result('despair')],
    })

    expect(completion).toMatchObject({
      route: 'words',
      modelId: 'wheel',
      crisisTier: 'tier1',
    })
    expect(completion).not.toHaveProperty('temporalEscalation')
  })

  it('derives support only from the current result', () => {
    const completion = buildCheckInCompletion({
      route: 'quick',
      modelId: 'quick-check-in',
      selections: [selection],
      results: [result('despair')],
    })

    expect(completion.crisisTier).toBe('tier1')
    expect(buildCheckInCompletion).toHaveLength(1)
    expect(completion).not.toHaveProperty('temporalEscalation')
  })
})
