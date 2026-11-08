import { describe, expect, it } from 'vitest'
import { decodeChainEntries, decodeSessions } from '../data/record-validation'

describe('persisted record validation', () => {
  it.each(['selectedNeedId', 'nextStepId'] as const)('validates optional %s without rewriting legacy text', (field) => {
    const legacy = { id: 's', timestamp: 1, modelId: 'wheel', selections: [], results: [], crisisTier: 'none',
      selectedNeed: 'My own wording', nextStep: 'Keep this verbatim' }
    expect(decodeSessions([legacy])).toEqual([legacy])
    const current = { ...legacy, selectedNeedId: 'grounding', nextStepId: 'write' }
    expect(decodeSessions([current])).toEqual([current])
    for (const invalid of ['unknown', '__proto__', 'toString', '', null, 4, {}]) {
      expect(() => decodeSessions([{ ...current, [field]: invalid }])).toThrow(/Invalid persisted session/)
    }
  })

  it('validates optional need identity on stored analysis results', () => {
    const session = { id: 's', timestamp: 1, modelId: 'wheel', selections: [], crisisTier: 'none',
      results: [{ id: 'anxiety', color: '#fff', label: { en: 'anxiety', ro: 'anxietate' }, needId: 'unknown' }] }
    expect(() => decodeSessions([session])).toThrow(/Invalid persisted session/)
  })
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
