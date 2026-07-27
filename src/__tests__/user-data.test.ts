import { describe, expect, it } from 'vitest'
import { buildUserDataExport, exportUserDataJSON } from '../data/user-data'
import type { PreferenceSnapshot } from '../data/storage'
import type { ChainAnalysisEntry, Session } from '../data/types'

const preferences: PreferenceSnapshot = {
  model: 'somatic',
  language: 'ro',
  saveSessions: true,
  dimensionalAxisHintSeen: true,
  allowExternalAI: false,
  theme: 'dark',
  dismissedHints: ['somatic'],
}

const session: Session = {
  id: 'session-1',
  timestamp: 1,
  modelId: 'somatic',
  entryRoute: 'body',
  selections: [{
    emotionId: 'chest',
    label: { ro: 'Piept', en: 'Chest' },
    extras: { sensationType: 'tension', intensity: 2 },
  }],
  results: [{ id: 'anxiety', label: { ro: 'anxietate', en: 'anxiety' }, color: '#f00' }],
  crisisTier: 'none',
  selectedNeed: 'slow breathing and safety',
  nextStep: 'Pause for three slow breaths.',
}

const chain: ChainAnalysisEntry = {
  id: 'chain-1',
  timestamp: 2,
  triggeringEvent: 'message',
  vulnerabilityFactors: 'little sleep',
  promptingEvent: 'feedback',
  emotion: 'anxiety',
  urge: 'avoid',
  action: 'paused',
  consequence: 'felt steadier',
}

describe('complete user-data export', () => {
  it('includes sessions, chains, preferences, and schema metadata without changing raw IDs', () => {
    const exported = buildUserDataExport([session], [chain], preferences, '2026-07-23T00:00:00.000Z')

    expect(exported).toEqual({
      schemaVersion: 2,
      exportedAt: '2026-07-23T00:00:00.000Z',
      sessions: [session],
      chainEntries: [chain],
      preferences,
    })
    expect(exported.sessions[0].selections[0].emotionId).toBe('chest')
    expect(exported.sessions[0].selections[0].extras?.sensationType).toBe('tension')
  })

  it('serializes a stable JSON envelope', () => {
    const exported = JSON.parse(exportUserDataJSON([session], [chain], preferences))

    expect(exported.schemaVersion).toBe(2)
    expect(exported.exportedAt).toEqual(expect.any(String))
    expect(exported.sessions[0].selectedNeed).toBe('slow breathing and safety')
    expect(exported.sessions[0].nextStep).toBe('Pause for three slow breaths.')
    expect(exported.chainEntries[0].consequence).toBe('felt steadier')
    expect(exported.preferences.theme).toBe('dark')
  })
})
