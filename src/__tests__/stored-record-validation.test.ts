import { describe, expect, it } from 'vitest'
import { decodeChainEntries, decodeSessions } from '../data/record-validation'

describe('persisted record validation', () => {
  it('accepts supported session and chain shapes', () => {
    expect(decodeSessions([{
      id: 'session-1', timestamp: 1, modelId: 'wheel', selections: [], results: [], crisisTier: 'none',
    }])).toHaveLength(1)
    expect(decodeChainEntries([{
      id: 'chain-1', timestamp: 1, version: 2,
      situation: 'A', noticed: 'B', response: 'C', outcome: 'D',
    }])).toHaveLength(1)
  })

  it('rejects malformed records instead of silently treating storage as empty', () => {
    expect(() => decodeSessions([{ id: 'broken' }])).toThrowError(/session/i)
    expect(() => decodeSessions([{
      id: 'session-1', timestamp: 1, modelId: 'wheel', selections: [], crisisTier: 'none',
      results: [{ id: 'joy', label: { en: 'Joy', ro: 'Bucurie' }, color: '#fff', hierarchyPath: ['joy'] }],
    }])).toThrowError(/session/i)
    expect(() => decodeChainEntries([{ id: 'broken' }])).toThrowError(/journal exercise/i)
  })
})
