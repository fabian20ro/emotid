import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb'
import type { Session } from '../data/types'

const session: Session = {
  id: 'session-1', timestamp: 1, modelId: 'wheel',
  selections: [], results: [], crisisTier: 'none',
}

beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal('indexedDB', new IDBFactory())
  vi.stubGlobal('BroadcastChannel', undefined)
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('session repository with real IndexedDB transaction semantics', () => {
  it('deletes only the requested key and preserves optional fields', async () => {
    const repo = await import('../data/session-repo')
    await repo.saveSession({ ...session, selectedNeed: 'quiet and rest' })
    await repo.saveSession({ ...session, id: 'session-2' })
    await repo.deleteSession('session-2')
    expect(await repo.getAllSessions()).toEqual([{ ...session, selectedNeed: 'quiet and rest' }])
  })

  it('fails closed on invalid persisted records without deleting them', async () => {
    const repo = await import('../data/session-repo')
    await repo.saveSession({ ...session, timestamp: NaN })
    await expect(repo.getAllSessions()).rejects.toMatchObject({ name: 'StoredDataValidationError' })
  })

  it('rolls back an active write when its signal aborts', async () => {
    const repo = await import('../data/session-repo')
    await repo.getAllSessions()
    const controller = new AbortController()
    const original = IDBObjectStore.prototype.put
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (...args) {
      const request = original.apply(this, args)
      controller.abort()
      return request
    })
    await expect(repo.saveSession(session, controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
    expect(await repo.getAllSessions()).toEqual([])
  })

  it('rejects cancellation while opening without persisting', async () => {
    const repo = await import('../data/session-repo')
    const controller = new AbortController()
    const write = repo.saveSession(session, controller.signal)
    controller.abort()
    await expect(write).rejects.toBe(controller.signal.reason)
    expect(await repo.getAllSessions()).toEqual([])
  })

  it('rejects an already cancelled write without opening a database', async () => {
    const repo = await import('../data/session-repo')
    const open = vi.spyOn(indexedDB, 'open')
    const controller = new AbortController()
    controller.abort()
    await expect(repo.saveSession(session, controller.signal)).rejects.toBe(controller.signal.reason)
    expect(open).not.toHaveBeenCalled()
  })
})
