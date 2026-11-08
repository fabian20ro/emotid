export type HistoryStore = 'sessions' | 'exercises'
type PhaseName = 'repository' | 'read' | 'decode'
type Phase = { store: HistoryStore; phase: PhaseName; start: number; end: number | null; outcome: 'pending' | 'success' | 'error'; count: number | null }
export interface HydrationSnapshot {
  probeStartedAtMs: number
  phases: Phase[]
  commits: Partial<Record<HistoryStore, { at: number; error: boolean; count: number }>>
}

export function createHydrationProbe(now = () => performance.now()) {
  const snapshot: HydrationSnapshot = { probeStartedAtMs: now(), phases: [], commits: {} }
  const start = (store: HistoryStore, phase: PhaseName) => {
    const row: Phase = { store, phase, start: now(), end: null, outcome: 'pending', count: null }
    snapshot.phases.push(row)
    return row
  }
  const finish = (row: Phase, value: unknown, outcome: 'success' | 'error') => {
    row.end = now()
    row.outcome = outcome
    row.count = Array.isArray(value) ? value.length : null
  }
  return {
    snapshot,
    async async<T>(store: HistoryStore, phase: PhaseName, action: () => Promise<T>): Promise<T> {
      const row = start(store, phase)
      try { const value = await action(); finish(row, value, 'success'); return value }
      catch (error) { finish(row, undefined, 'error'); throw error }
    },
    sync<T>(store: HistoryStore, phase: PhaseName, action: () => T): T {
      const row = start(store, phase)
      try { const value = action(); finish(row, value, 'success'); return value }
      catch (error) { finish(row, undefined, 'error'); throw error }
    },
    committed(store: HistoryStore, loading: boolean, error: boolean, count: number) {
      if (!loading && !snapshot.commits[store]) snapshot.commits[store] = { at: now(), error, count }
    },
  }
}

export function summarizeHydration(snapshot: HydrationSnapshot, expectedCount: number) {
  const fail = () => { throw new Error('Incomplete or inconsistent hydration evidence') }
  const validTime = (time: unknown): time is number => typeof time === 'number' && Number.isFinite(time) && time >= 0
  if (!Number.isInteger(expectedCount) || expectedCount < 0 || !validTime(snapshot.probeStartedAtMs) || snapshot.phases.length !== 6) fail()
  const summarizeStore = (store: HistoryStore) => {
    const phase = (name: PhaseName) => {
      const matches = snapshot.phases.filter((row) => row.store === store && row.phase === name)
      const row = matches[0]
      if (matches.length !== 1 || row.outcome !== 'success' || row.count !== expectedCount
        || !validTime(row.start) || !validTime(row.end) || row.end < row.start) fail()
      return row as Phase & { end: number }
    }
    const repository = phase('repository')
    const read = phase('read')
    const decode = phase('decode')
    const commit = snapshot.commits[store]
    if (!commit || commit.error || commit.count !== expectedCount || !validTime(commit.at)) return fail()
    if (snapshot.probeStartedAtMs > repository.start || repository.start > read.start
      || read.end > decode.start || decode.end > repository.end || repository.end > commit.at) fail()
    return {
      repositoryMs: repository.end - repository.start,
      readMs: read.end - read.start,
      decodeMs: decode.end - decode.start,
      sortAndContinuationMs: repository.end - decode.end,
      schedulingBeforeDecodeMs: read.start - repository.start + decode.start - read.end,
      readyAtMs: commit.at,
      count: commit.count,
    }
  }
  const stores = { sessions: summarizeStore('sessions'), exercises: summarizeStore('exercises') }
  return { stores, bothHydratedAtMs: Math.max(stores.sessions.readyAtMs, stores.exercises.readyAtMs) }
}
