import { describe, it, expect } from 'vitest'
import {
  getCrisisTier,
  HIGH_DISTRESS_IDS,
  SAFETY_RULESET_VERSION,
  TIER3_COMBOS,
  TIER4_COMBOS,
} from '../models/distress'

describe('getCrisisTier', () => {
  it('returns none when no distress IDs present', () => {
    expect(getCrisisTier(['joy', 'trust', 'serenity'])).toBe('none')
  })

  it('returns none for empty results', () => {
    expect(getCrisisTier([])).toBe('none')
  })

  it('returns tier1 for single distress match with other non-distress matches', () => {
    expect(getCrisisTier(['despair', 'joy', 'trust'])).toBe('tier1')
  })


  it('returns tier2 for 2+ distress matches without combo', () => {
    expect(getCrisisTier(['rage', 'terror'])).toBe('tier2')
    expect(getCrisisTier(['shame', 'apathetic', 'joy'])).toBe('tier2')
  })

  it('returns tier3 for specific severe combos', () => {
    expect(getCrisisTier(['despair', 'helpless'])).toBe('tier3')
    expect(getCrisisTier(['grief', 'worthless'])).toBe('tier3')
    expect(getCrisisTier(['shame', 'loathing'])).toBe('tier3')
  })

  it('returns tier4 for high-risk triple combos', () => {
    expect(getCrisisTier(['despair', 'worthless', 'empty'])).toBe('tier4')
    expect(getCrisisTier(['helpless', 'numb', 'abandoned'])).toBe('tier4')
    expect(getCrisisTier(['depressed', 'worthless', 'helpless'])).toBe('tier4')
  })

  it('prioritizes tier4 over tier3 when both patterns are present', () => {
    expect(getCrisisTier(['despair', 'worthless', 'empty'])).toBe('tier4')
  })

  it('returns tier3 even when other non-distress IDs present', () => {
    expect(getCrisisTier(['joy', 'despair', 'helpless', 'trust'])).toBe('tier3')
  })

  it('returns none for a single non-distress ID', () => {
    expect(getCrisisTier(['joy'])).toBe('none')
    expect(getCrisisTier(['trust'])).toBe('none')
    expect(getCrisisTier(['sadness'])).toBe('none')
  })

  it('combo match is order-independent for tier3', () => {
    expect(getCrisisTier(['worthless', 'despair'])).toBe('tier3')
    expect(getCrisisTier(['helpless', 'rage'])).toBe('tier3')
  })

  it('combo match is order-independent for tier4', () => {
    expect(getCrisisTier(['numb', 'helpless', 'abandoned'])).toBe('tier4')
    expect(getCrisisTier(['worthless', 'despair', 'empty'])).toBe('tier4')
  })

  it('duplicates do not inflate tier beyond single-ID behavior', () => {
    expect(getCrisisTier(['despair', 'despair'])).toBe('tier1')
    expect(getCrisisTier(['rage', 'rage', 'joy'])).toBe('tier1')
  })

  it('is invariant to order, duplicates, and non-distress padding', () => {
    const inputs = [
      ['despair', 'worthless', 'empty'],
      ['empty', 'despair', 'worthless'],
      ['joy', 'despair', 'worthless', 'empty', 'trust'],
      ['empty', 'despair', 'worthless', 'despair', 'empty'],
    ]
    for (const input of inputs) expect(getCrisisTier(input)).toBe('tier4')
  })

  it('has a versioned and explicit high-distress inventory', () => {
    expect(SAFETY_RULESET_VERSION).toBe('2026-07-29')
    expect([...HIGH_DISTRESS_IDS]).toEqual([
      'abandoned', 'anguished', 'apathetic', 'depressed', 'despair',
      'distressed', 'empty', 'grief', 'helpless', 'hopeless', 'loathing',
      'numb', 'panicked', 'powerless', 'rage', 'shame', 'terror',
      'victimized', 'violated', 'worthless',
    ])
  })

  it('includes expanded distress IDs', () => {
    for (const id of ['empty', 'powerless', 'abandoned', 'victimized', 'numb', 'violated', 'depressed', 'distressed']) {
      expect(HIGH_DISTRESS_IDS.has(id)).toBe(true)
    }
  })

  it('has valid TIER3_COMBOS referencing distress IDs', () => {
    for (const [a, b] of TIER3_COMBOS) {
      expect(a).not.toBe(b)
      expect(HIGH_DISTRESS_IDS.has(a)).toBe(true)
      expect(HIGH_DISTRESS_IDS.has(b)).toBe(true)
    }
  })

  it('has valid TIER4_COMBOS referencing distress IDs', () => {
    for (const [a, b, c] of TIER4_COMBOS) {
      expect(new Set([a, b, c]).size).toBe(3)
      expect(HIGH_DISTRESS_IDS.has(a)).toBe(true)
      expect(HIGH_DISTRESS_IDS.has(b)).toBe(true)
      expect(HIGH_DISTRESS_IDS.has(c)).toBe(true)
    }
  })
})
