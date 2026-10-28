import { describe, expect, it } from 'vitest'
import { decodeChainEntries, decodeSessions } from '../data/record-validation'

describe('persisted record validation', () => {
  const records = [
    { decode: decodeSessions, record: { id: 's', modelId: 'wheel', selections: [], results: [], crisisTier: 'none' } },
    { decode: decodeChainEntries, record: { id: 'c', version: 2, situation: '', noticed: '', response: '', outcome: '' } },
    { decode: decodeChainEntries, record: { id: 'legacy', triggeringEvent: '', vulnerabilityFactors: '', promptingEvent: '', emotion: '', urge: '', action: '', consequence: '' } },
  ]

  it.each([1e20, -1e20, 8.64e15 + 1, -8.64e15 - 1, NaN, Infinity, -Infinity])('rejects unrenderable timestamp %s for every record format', (timestamp) => {
    for (const { decode, record } of records) {
      expect(() => decode([{ ...record, timestamp }])).toThrow(/Invalid persisted/)
    }
  })

  it.each([0, -1, 1, -8.64e15, 8.64e15])('preserves supported timestamp %s', (timestamp) => {
    for (const { decode, record } of records) {
      expect(decode([{ ...record, timestamp }])[0].timestamp).toBe(timestamp)
    }
  })

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
