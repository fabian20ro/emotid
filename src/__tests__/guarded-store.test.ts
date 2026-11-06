import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb'

beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal('indexedDB', new IDBFactory())
  vi.stubGlobal('BroadcastChannel', undefined)
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

async function stored(name: string, store: string) {
  return new Promise<unknown[]>((resolve, reject) => {
    const request = indexedDB.open(name)
    request.onsuccess = () => {
      const db = request.result
      const read = db.transaction(store).objectStore(store).getAll()
      read.onsuccess = () => { db.close(); resolve(read.result) }
      read.onerror = () => { db.close(); reject(read.error) }
    }
    request.onerror = () => reject(request.error)
  })
}

for (const [database, records] of [['emot-id-sessions', 'sessions'], ['emot-id-chain-analysis', 'entries']]) {
  it(`${records}: old clients cannot write or export after clear without notifications`, async () => {
    const { createGuardedStore } = await import('../data/guarded-store')
    const a = createGuardedStore(database, records)
    const b = createGuardedStore(database, records)
    await a.put('old', { id: 'old' })
    await b.values()
    await b.clear()
    await expect(a.put('old', { id: 'old' })).rejects.toMatchObject({ name: 'StaleStorageError' })
    await expect(a.values()).rejects.toMatchObject({ name: 'StaleStorageError' })
    expect(await stored(database, records)).toEqual([])
  })

  it(`${records}: interrupted clear rolls back all records AND the epoch`, async () => {
    const { createGuardedStore } = await import('../data/guarded-store')
    const a = createGuardedStore(database, records)
    const b = createGuardedStore(database, records)
    await a.put('one', 1)
    await a.put('two', 2)
    await b.values()
    const original = IDBObjectStore.prototype.clear
    const fault = vi.spyOn(IDBObjectStore.prototype, 'clear').mockImplementation(function () {
      const request = original.call(this)
      this.transaction.abort()
      return request
    })
    await expect(b.clear()).rejects.toMatchObject({ name: 'AbortError' })
    fault.mockRestore()
    expect(await a.values()).toEqual([1, 2])
    await a.put('three', 3)
    await b.clear()
    expect(await b.values()).toEqual([])
    await b.put('fresh', 4)
    expect(await b.values()).toEqual([4])
  })
}

it('upgrades v1 in place without changing record keys or values', async () => {
  await new Promise<void>((resolve) => {
    const request = indexedDB.open('legacy', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('records').put({ id: 'keep' }, 'keep')
    request.onsuccess = () => { request.result.close(); resolve() }
  })
  const { createGuardedStore } = await import('../data/guarded-store')
  const store = createGuardedStore('legacy', 'records')
  expect(await store.values()).toEqual([{ id: 'keep' }])
  await store.delete('keep')
  expect(await store.values()).toEqual([])
})

it('optional notification failures cannot turn a committed erasure into a reported failure', async () => {
  vi.stubGlobal('BroadcastChannel', class {
    onmessage = null
    postMessage() { throw new DOMException('Channel unavailable', 'InvalidStateError') }
  })
  const { createGuardedStore } = await import('../data/guarded-store')
  const store = createGuardedStore('notifications', 'records')
  await store.put('old', 1)
  await expect(store.clear()).resolves.toBeUndefined()
  expect(await store.values()).toEqual([])
})

it('storage still works when the browser cannot create a notification channel', async () => {
  vi.stubGlobal('BroadcastChannel', class {
    constructor() { throw new DOMException('Channel unavailable', 'SecurityError') }
  })
  const { createGuardedStore } = await import('../data/guarded-store')
  const store = createGuardedStore('no-channel', 'records')
  await store.put('old', 1)
  expect(await store.values()).toEqual([1])
  await store.clear()
  expect(await store.values()).toEqual([])
})
