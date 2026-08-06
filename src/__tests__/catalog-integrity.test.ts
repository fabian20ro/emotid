import { describe, it, expect } from 'vitest'
import { emotionCatalog, getCanonicalEmotion } from '../models/catalog'
import { HIGH_DISTRESS_IDS, TIER3_COMBOS, TIER4_COMBOS, getCrisisTier } from '../models/distress'

describe('Catalog integrity', () => {
  it('has no empty IDs', () => {
    for (const [id, e] of Object.entries(emotionCatalog)) {
      expect(id).toBeTruthy()
      expect(e.id).toBe(id)
    }
  })

  it('every parent ID in the catalog exists', () => {
    for (const [id, e] of Object.entries(emotionCatalog)) {
      if (e.parents) {
        e.parents.forEach(parentId => {
          expect(emotionCatalog[parentId], `Emotion '${id}' has invalid parent '${parentId}'`).toBeDefined()
        })
      }
    }
  })

  it('every entry has bilingual label', () => {
    for (const [id, e] of Object.entries(emotionCatalog)) {
      expect(e.label.en, `${id} missing en label`).toBeTruthy()
      expect(e.label.ro, `${id} missing ro label`).toBeTruthy()
    }
  })

  it('every exposed description is bilingual and reviewed', () => {
    for (const [id, e] of Object.entries(emotionCatalog)) {
      if (!e.description) {
        expect(e.descriptionStatus, `${id} has status without copy`).toBeUndefined()
        continue
      }
      expect(e.description.en, `${id} missing en description`).toBeTruthy()
      expect(e.description.ro, `${id} missing ro description`).toBeTruthy()
      expect(e.descriptionStatus, `${id} description is not reviewed`).toBe('reviewed')
    }
  })

  it('exposes only the bounded reviewed-description inventory', () => {
    const entries = Object.values(emotionCatalog)
    expect(entries.filter((entry) => entry.descriptionStatus === 'reviewed')).toHaveLength(12)
    expect(entries.filter((entry) => entry.description === undefined)).toHaveLength(276)
  })

  it('exposes only reviewed bilingual need options', () => {
    const entries = Object.values(emotionCatalog)
    expect(entries.filter((entry) => entry.guidanceStatus === 'reviewed')).toHaveLength(25)
    expect(entries.filter((entry) => entry.needs === undefined)).toHaveLength(263)

    for (const [id, e] of Object.entries(emotionCatalog)) {
      if (!e.needs) {
        expect(e.needId, `${id} has needId without copy`).toBeUndefined()
        expect(e.guidanceStatus, `${id} has status without copy`).toBeUndefined()
        continue
      }
      expect(e.needs.en, `${id} missing en needs`).toBeTruthy()
      expect(e.needs.ro, `${id} missing ro needs`).toBeTruthy()
      expect(e.needId, `${id} missing needId`).toBeTruthy()
      expect(e.guidanceStatus, `${id} guidance is not reviewed`).toBe('reviewed')
    }
  })

  it('keeps the reviewed need mapping explicit', () => {
    const expectedNeedIds = {
      anger: 'boundaries',
      angry: 'boundaries',
      anxiety: 'grounding',
      despair: 'support',
      disgust: 'boundaries',
      distressed: 'compassion',
      exhaustion: 'rest',
      fear: 'safety',
      frustration: 'flexibility',
      frustrated: 'flexibility',
      grief: 'support',
      loneliness: 'connection',
      love: 'connection',
      nervous: 'grounding',
      overwhelm: 'relief',
      overwhelmed: 'relief',
      rage: 'space',
      sadness: 'compassion',
      shame: 'connection',
      stress: 'relief',
      stressed: 'relief',
      tenderness: 'connection',
      tense: 'physical-ease',
      terror: 'safety',
      worry: 'grounding',
    }

    expect(
      Object.fromEntries(
        Object.values(emotionCatalog)
          .filter((entry) => entry.guidanceStatus === 'reviewed')
          .map((entry) => [entry.id, entry.needId])
      )
    ).toEqual(expectedNeedIds)
  })

  it('every entry has a color', () => {
    for (const [id, e] of Object.entries(emotionCatalog)) {
      expect(e.color, `${id} missing color`).toBeTruthy()
    }
  })

  it('distressTier values are valid', () => {
    for (const [, e] of Object.entries(emotionCatalog)) {
      if (e.distressTier) {
        expect(['high', 'watch']).toContain(e.distressTier)
      }
    }
  })

  it('all current HIGH_DISTRESS_IDS exist in catalog', () => {
    for (const id of HIGH_DISTRESS_IDS) {
      expect(
        getCanonicalEmotion(id),
        `Distress ID '${id}' not in catalog`
      ).toBeDefined()
    }
  })

  it('getCanonicalEmotion returns undefined for unknown IDs', () => {
    expect(getCanonicalEmotion('nonexistent_xyz')).toBeUndefined()
  })

  it('catalog has at least 250 entries', () => {
    expect(Object.keys(emotionCatalog).length).toBeGreaterThanOrEqual(250)
  })

  it('no duplicate canonical IDs across merged sources', () => {
    const seen = new Set<string>()
    for (const id of Object.keys(emotionCatalog)) {
      expect(seen.has(id), `Duplicate canonical ID '${id}'`).toBe(false)
      seen.add(id)
    }
  })

  it('every parent reference is also a valid catalog entry with same distressTier', () => {
    for (const [id, e] of Object.entries(emotionCatalog)) {
      if (!e.parents || e.parents.length === 0) continue
      for (const parentId of e.parents) {
        const parent = emotionCatalog[parentId]
        expect(parent, `Parent '${parentId}' not in catalog`).toBeDefined()
        if (parent?.distressTier && e.distressTier) {
          expect(
            parent.distressTier,
            `Parent '${parentId}' tier mismatch with '${id}'`
          ).toBe(e.distressTier)
        }
      }
    }
  })

  it('HIGH_DISTRESS_IDS is consistent with catalog distressTier === "high"', () => {
    const expected = new Set(
      Object.values(emotionCatalog)
        .filter((e) => e.distressTier === 'high')
        .map((e) => e.id)
    )
    expect(HIGH_DISTRESS_IDS.size).toBe(expected.size)
    for (const id of HIGH_DISTRESS_IDS) {
      expect(
        expected.has(id),
        `HIGH_DISTRESS_IDS has '${id}' but catalog tier is not high`
      ).toBe(true)
    }
  })

  it('all TIER3_COMBOS entries reference valid catalog IDs', () => {
    for (const [a, b] of TIER3_COMBOS) {
      expect(getCanonicalEmotion(a), `TIER3 combo '${a}' not in catalog`).toBeDefined()
      expect(getCanonicalEmotion(b), `TIER3 combo '${b}' not in catalog`).toBeDefined()
    }
  })

  it('all TIER4_COMBOS entries reference valid catalog IDs', () => {
    for (const [a, b, c] of TIER4_COMBOS) {
      expect(getCanonicalEmotion(a), `TIER4 combo '${a}' not in catalog`).toBeDefined()
      expect(getCanonicalEmotion(b), `TIER4 combo '${b}' not in catalog`).toBeDefined()
      expect(getCanonicalEmotion(c), `TIER4 combo '${c}' not in catalog`).toBeDefined()
    }
  })

  it('every high-distress entry has distressTier set', () => {
    for (const id of HIGH_DISTRESS_IDS) {
      const e = getCanonicalEmotion(id)
      expect(e, `HIGH_DISTRESS_IDS references '${id}' missing from catalog`).toBeDefined()
      expect(e?.distressTier).toBe('high')
    }
  })

  it('all TIER3/TIER4 combo members are in HIGH_DISTRESS_IDS', () => {
    for (const [a, b] of TIER3_COMBOS) {
      expect(HIGH_DISTRESS_IDS.has(a), `TIER3 member '${a}' not high-distress`).toBe(true)
      expect(HIGH_DISTRESS_IDS.has(b), `TIER3 member '${b}' not high-distress`).toBe(true)
    }
    for (const [a, b, c] of TIER4_COMBOS) {
      expect(HIGH_DISTRESS_IDS.has(a), `TIER4 member '${a}' not high-distress`).toBe(true)
      expect(HIGH_DISTRESS_IDS.has(b), `TIER4 member '${b}' not high-distress`).toBe(true)
      expect(HIGH_DISTRESS_IDS.has(c), `TIER4 member '${c}' not high-distress`).toBe(true)
    }
  })

  it('getCrisisTier returns none for empty input', () => {
    expect(getCrisisTier([])).toBe('none')
  })

  it('getCrisisTier returns tier1 for single high-distress', () => {
    const sample = Array.from(HIGH_DISTRESS_IDS)[0]
    if (!sample) return
    expect(getCrisisTier([sample])).toBe('tier1')
  })

  it('getCrisisTier detects tier4 from TIER4_COMBOS input', () => {
    const triple = TIER4_COMBOS[0]
    expect(getCrisisTier(Array.from(triple))).toBe('tier4')
  })

  it('HIGH_DISTRESS_IDS size matches catalog high-tier count', () => {
    const highCount = Object.values(emotionCatalog).filter((e) => e.distressTier === 'high').length
    expect(HIGH_DISTRESS_IDS.size).toBe(highCount)
  })
})
