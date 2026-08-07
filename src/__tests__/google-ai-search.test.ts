import { describe, expect, it } from 'vitest'
import { buildGoogleAiSearchUrl } from '../utils/google-ai-search'
import type { AnalysisResult } from '../models/types'

const prompts = {
  aiPrompt: 'I feel {emotions}. What does this emotion mean and how can I understand it better?',
  aiPromptMultiple: 'I feel a combination of {emotions}. How do these emotions relate and what might this mean?',
}

const result = (id: string, en: string, ro: string): AnalysisResult => ({
  id,
  label: { en, ro },
  color: '#000000',
})

describe('buildGoogleAiSearchUrl', () => {
  it('preserves the existing single-emotion Google AI Mode query', () => {
    const value = buildGoogleAiSearchUrl([result('joy', 'Joy', 'Bucurie')], 'en', prompts)
    const url = new URL(value!)

    expect(url.origin + url.pathname).toBe('https://www.google.com/search')
    expect(url.searchParams.get('udm')).toBe('50')
    expect(url.searchParams.get('q')).toBe(
      'I feel Joy. What does this emotion mean and how can I understand it better?',
    )
  })

  it('preserves conjunction and localized prompt behavior for multiple emotions', () => {
    const value = buildGoogleAiSearchUrl([
      result('joy', 'Joy', 'Bucurie'),
      result('trust', 'Trust', 'Încredere'),
      result('calm', 'Calm', 'Calm'),
    ], 'ro', {
      aiPrompt: 'Simt {emotions}.',
      aiPromptMultiple: 'Simt o combinație de {emotions}. Cum se leagă?',
    })
    const url = new URL(value!)

    expect(url.searchParams.get('udm')).toBe('50')
    expect(url.searchParams.get('q')).toBe(
      'Simt o combinație de Bucurie, Încredere si Calm. Cum se leagă?',
    )
  })

  it('returns null without results', () => {
    expect(buildGoogleAiSearchUrl([], 'en', prompts)).toBeNull()
  })
})
