import type { ChainReflectionEntry, Session } from '../src/data/types'

export const HISTORY_NOW = Date.UTC(2026, 10, 8, 0)

export function assertLocalHistoryTarget(target: string) {
  const url = new URL(target)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
    || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('History benchmarks require an explicit loopback target')
  }
}

export function makeHistoryFixture(count: number): { sessions: Session[]; chainEntries: ChainReflectionEntry[] } {
  if (!Number.isInteger(count) || count < 0 || count > 5000) throw new Error('History size must be an integer from 0 to 5000')
  const sessions: Session[] = []
  const chainEntries: ChainReflectionEntry[] = []
  for (let index = 0; index < count; index++) {
    const suffix = String(index).padStart(5, '0')
    const timestamp = HISTORY_NOW - index * 60_000
    const happy = { id: 'happy', label: { en: 'Happy', ro: 'Fericit' }, color: '#176b60', valence: 0.7 }
    const sad = { id: 'sad', label: { en: 'Sad', ro: 'Trist' }, color: '#176b60', valence: -0.7 }
    const session: Session = { id: `scale-session-${suffix}`, timestamp, modelId: 'dimensional',
      entryRoute: 'affect', selections: [{ emotionId: happy.id, label: happy.label }], results: [happy, sad], crisisTier: 'none' }
    switch (index % 6) {
      case 0: session.entryRoute = 'words'; session.modelId = 'wheel'; break
      case 2: session.reflectionAnswer = 'yes'; break
      case 3: session.reflectionAnswer = 'partly'; session.selectedResultIds = ['happy']; break
      case 4: session.reflectionAnswer = 'no'; break
      case 5:
        session.entryRoute = 'body'; session.modelId = 'somatic'; session.outcome = 'body-observation'; session.results = []
        session.selections = [{ emotionId: 'chest', label: { en: 'Chest', ro: 'Piept' }, extras: { sensationType: 'pressure', intensity: 1 } }]
        break
    }
    sessions.push(session)
    chainEntries.push({ id: `scale-exercise-${suffix}`, timestamp, version: 2,
      situation: `Synthetic moment ${suffix}`, noticed: 'Synthetic observation', response: '', outcome: 'Synthetic outcome' })
  }
  return { sessions, chainEntries }
}
