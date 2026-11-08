import { describe, expect, it } from 'vitest'
import { createHydrationProbe, summarizeHydration, type HydrationSnapshot } from '../../e2e-hydration/hydration-probe'

function complete(): HydrationSnapshot {
  return { probeStartedAtMs: 1, phases: (['sessions', 'exercises'] as const).flatMap((store) => [
    { store, phase: 'repository', start: 2, end: 10, outcome: 'success', count: 100 },
    { store, phase: 'read', start: 3, end: 6, outcome: 'success', count: 100 },
    { store, phase: 'decode', start: 7, end: 8, outcome: 'success', count: 100 },
  ]), commits: { sessions: { at: 12, error: false, count: 100 }, exercises: { at: 14, error: false, count: 100 } } }
}

describe('history hydration observations', () => {
  it.each([
    ['pending read', (s: HydrationSnapshot) => { s.phases[1].end = null; s.phases[1].outcome = 'pending' }],
    ['missing phase', (s: HydrationSnapshot) => { s.phases.pop() }],
    ['duplicate phase', (s: HydrationSnapshot) => { s.phases.push({ ...s.phases[0] }) }],
    ['read failed', (s: HydrationSnapshot) => { s.phases[1].outcome = 'error' }],
    ['incomplete result', (s: HydrationSnapshot) => { s.phases[0].count = 20 }],
    ['hook still loading', (s: HydrationSnapshot) => { delete s.commits.exercises }],
    ['hook error', (s: HydrationSnapshot) => { s.commits.sessions!.error = true }],
    ['hook count', (s: HydrationSnapshot) => { s.commits.sessions!.count = 20 }],
    ['NaN', (s: HydrationSnapshot) => { s.phases[0].end = NaN }],
    ['clock reversal', (s: HydrationSnapshot) => { s.phases[1].end = 2 }],
    ['decode overlaps read', (s: HydrationSnapshot) => { s.phases[2].start = 5 }],
    ['commit before repository', (s: HydrationSnapshot) => { s.commits.sessions!.at = 9 }],
  ])('rejects invalid evidence: %s', (_, change) => {
    const snapshot = complete()
    change(snapshot)
    expect(() => summarizeHydration(snapshot, 100)).toThrow()
  })

  it('accepts complete zero-duration observations without inventing time or losing zero counts', () => {
    const snapshot = complete()
    for (const row of snapshot.phases) { row.start = 1; row.end = 1; row.count = 0 }
    snapshot.commits = { sessions: { at: 1, error: false, count: 0 }, exercises: { at: 1, error: false, count: 0 } }
    expect(summarizeHydration(snapshot, 0).stores.sessions).toMatchObject({ readMs: 0, decodeMs: 0, count: 0 })
  })

  it('does not call a loading hook ready and preserves the original thrown error', async () => {
    const probe = createHydrationProbe()
    probe.committed('sessions', true, false, 0)
    expect(probe.snapshot.commits).toEqual({})
    const failure = new Error('private error detail')
    await expect(probe.async('sessions', 'read', async () => { throw failure })).rejects.toBe(failure)
    expect(probe.snapshot.phases[0]).toMatchObject({ outcome: 'error', count: null })
    expect(JSON.stringify(probe.snapshot)).not.toContain('private error detail')
  })

  it('keeps actual return values and separates read, decode and sort/continuation without recording content', async () => {
    let time = 10
    const probe = createHydrationProbe(() => time)
    const records = [{ privateText: 'never put this in the artifact' }]
    for (const store of ['sessions', 'exercises'] as const) {
      const result = await probe.async(store, 'repository', async () => {
        const raw = await probe.async(store, 'read', async () => { time += 4; return records })
        const decoded = probe.sync(store, 'decode', () => { time += 2; return raw })
        time += 3
        return decoded
      })
      expect(result).toBe(records)
      time += 1
      probe.committed(store, false, false, 1)
    }
    const summary = summarizeHydration(probe.snapshot, 1)
    expect(summary.stores.sessions).toMatchObject({ repositoryMs: 9, readMs: 4, decodeMs: 2, sortAndContinuationMs: 3, readyAtMs: 20 })
    expect(summary.bothHydratedAtMs).toBe(30)
    expect(JSON.stringify(probe.snapshot)).not.toContain('privateText')
    expect(JSON.stringify(probe.snapshot)).not.toContain('never put this')
  })
})
