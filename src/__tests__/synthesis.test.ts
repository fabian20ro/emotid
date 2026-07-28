import { describe, it, expect } from 'vitest'
import { synthesize } from '../models/synthesis'
import type { AnalysisResult } from '../models/types'

function makeResult(overrides: Partial<AnalysisResult> & { id: string }): AnalysisResult {
  return {
    label: { ro: overrides.id, en: overrides.id },
    color: '#000',
    ...overrides,
  }
}

describe('synthesize', () => {
  it('returns empty string for no results', () => {
    expect(synthesize([], 'en')).toBe('')
  })

  it('produces a narrative for a single emotion', () => {
    const result = synthesize(
      [
        makeResult({
          id: 'joy',
          label: { ro: 'bucurie', en: 'joy' },
          description: { ro: 'desc ro', en: 'Joy signals fulfillment.' },
          needs: { ro: 'partajare', en: 'sharing and expression' },
        }),
      ],
      'en'
    )

    expect(result.length).toBeGreaterThan(20)
    // Should mention the emotion name
    expect(result.toLowerCase()).toContain('joy')
    expect(result.toLowerCase()).toMatch(/closest match|suggestion|fits/)
  })

  it('detects concordant pleasant emotions', () => {
    const result = synthesize(
      [
        makeResult({
          id: 'joy',
          label: { ro: 'bucurie', en: 'joy' },
          description: { ro: '', en: 'Joy signals fulfillment.' },
          valence: 0.8,
        }),
        makeResult({
          id: 'serenity',
          label: { ro: 'seninătate', en: 'serenity' },
          description: { ro: '', en: 'Serenity is calm acceptance.' },
          valence: 0.6,
        }),
      ],
      'en'
    )

    // Should not mention "mixed" or "conflicting"
    expect(result.toLowerCase()).not.toMatch(/mixed|conflicting|tension between/)
  })

  it('detects mixed valence and normalizes it', () => {
    const result = synthesize(
      [
        makeResult({
          id: 'joy',
          label: { ro: 'bucurie', en: 'joy' },
          description: { ro: '', en: 'Joy signals fulfillment.' },
          valence: 0.8,
        }),
        makeResult({
          id: 'sadness',
          label: { ro: 'tristete', en: 'sadness' },
          description: { ro: '', en: 'Sadness processes loss.' },
          valence: -0.6,
        }),
      ],
      'en'
    )

    expect(result.toLowerCase()).toMatch(/different directions|together/)
  })

  it('identifies high intensity pattern', () => {
    const result = synthesize(
      [
        makeResult({
          id: 'anger',
          label: { ro: 'furie', en: 'anger' },
          description: { ro: '', en: 'Anger protects boundaries.' },
          valence: -0.7,
          arousal: 0.8,
        }),
      ],
      'en'
    )

    expect(result.toLowerCase()).toMatch(/high-energy|especially present/)
  })

  it('identifies low intensity pattern', () => {
    const result = synthesize(
      [
        makeResult({
          id: 'serenity',
          label: { ro: 'seninătate', en: 'serenity' },
          description: { ro: '', en: 'Calm acceptance.' },
          valence: 0.4,
          arousal: 0.2,
        }),
      ],
      'en'
    )

    expect(result.toLowerCase()).toMatch(/subtle|quieter/)
  })

  it('frames 3+ emotions as complexity', () => {
    const result = synthesize(
      [
        makeResult({ id: 'joy', label: { ro: '', en: 'joy' }, description: { ro: '', en: 'Joy signals fulfillment.' } }),
        makeResult({ id: 'fear', label: { ro: '', en: 'fear' }, description: { ro: '', en: 'Fear keeps safe.' } }),
        makeResult({ id: 'sadness', label: { ro: '', en: 'sadness' }, description: { ro: '', en: 'Sadness processes loss.' } }),
      ],
      'en'
    )

    expect(result.toLowerCase()).toMatch(/several possibilities|do not need to accept/)
  })

  it('does not weave catalog descriptions into generated copy', () => {
    const result = synthesize(
      [
        makeResult({
          id: 'anger',
          label: { ro: 'furie', en: 'anger' },
          description: { ro: '', en: 'UNREVIEWED_CAUSAL_CLAIM' },
        }),
      ],
      'en'
    )

    expect(result).not.toContain('UNREVIEWED_CAUSAL_CLAIM')
  })

  it('integrates needs into closing sentence', () => {
    const result = synthesize(
      [
        makeResult({
          id: 'joy',
          label: { ro: 'bucurie', en: 'joy' },
          description: { ro: '', en: 'Joy signals fulfillment.' },
          needs: { ro: 'partajare', en: 'sharing and expression' },
        }),
        makeResult({
          id: 'fear',
          label: { ro: 'frica', en: 'fear' },
          description: { ro: '', en: 'Fear keeps you safe.' },
          needs: { ro: 'siguranta', en: 'safety and reassurance' },
        }),
      ],
      'en'
    )

    expect(result.toLowerCase()).toMatch(/sharing|safety|consider/)
  })

  it('produces Romanian output', () => {
    const result = synthesize(
      [
        makeResult({
          id: 'joy',
          label: { ro: 'bucurie', en: 'joy' },
          description: { ro: 'Bucuria semnaleaza implinire.', en: 'Joy signals fulfillment.' },
          needs: { ro: 'partajare si exprimare', en: 'sharing and expression' },
        }),
      ],
      'ro'
    )

    expect(result).toContain('bucurie')
  })

  it('avoids diagnostic language', () => {
    const result = synthesize(
      [
        makeResult({
          id: 'sadness',
          label: { ro: '', en: 'sadness' },
          description: { ro: '', en: 'Sadness processes loss.' },
          valence: -0.8,
          arousal: 0.7,
        }),
        makeResult({
          id: 'anger',
          label: { ro: '', en: 'anger' },
          description: { ro: '', en: 'Anger protects boundaries.' },
          valence: -0.7,
          arousal: 0.8,
        }),
      ],
      'en'
    )

    const lower = result.toLowerCase()
    // Should not use diagnostic/pathologizing language
    expect(lower).not.toMatch(/disorder|symptom|diagnos|abnormal|problem|wrong with/)
    // Should not attribute causes
    expect(lower).not.toMatch(/because you|the reason you/)
  })

  it('uses the specific pleasant combo narrative for joy+serenity', () => {
    const result = synthesize(
      [
        makeResult({ id: 'joy', label: { ro: '', en: 'joy' }, valence: 0.5 }),
        makeResult({ id: 'serenity', label: { ro: '', en: 'serenity' }, valence: 0.4 }),
      ],
      'en'
    )

    expect(result).toContain('Joy and serenity appear together here')
    expect(result).not.toContain('possible pleasant feelings')
  })

  it('uses concordantUnpleasantSevere when two high-distress emotions co-occur', () => {
    const result = synthesize(
      [
        makeResult({ id: 'rage', label: { ro: '', en: 'rage' }, valence: -0.9 }),
        makeResult({ id: 'terror', label: { ro: '', en: 'terror' }, valence: -0.95 }),
      ],
      'en'
    )

    expect(result).toContain('may describe a painful experience')
    expect(result).toContain('Support is available')
  })
})
