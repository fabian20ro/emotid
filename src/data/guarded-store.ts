import { announceErasure, getStorageInvalidation, invalidateStorage, watchStorage } from './storage-lifecycle'

const META = '_lifecycle'
const EPOCH = 'epoch'

export class StaleStorageError extends Error {
  constructor() { super('Local data changed in another tab'); this.name = 'StaleStorageError' }
}

/** Epoch and records share one transaction; notification delivery is not a safety boundary. */
export function createGuardedStore(database: string, records: string) {
  let opening: Promise<IDBDatabase> | undefined
  let epoch: string | undefined

  const open = () => {
    opening ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(database, 2)
      let blocked = false
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(records)) db.createObjectStore(records)
        if (!db.objectStoreNames.contains(META)) db.createObjectStore(META)
      }
      request.onblocked = () => {
        blocked = true
        invalidateStorage('upgrade')
        reject(new Error('Close older app tabs before upgrading local storage'))
      }
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        if (blocked) { db.close(); return }
        db.onversionchange = () => { db.close(); invalidateStorage('upgrade') }
        const tx = db.transaction(META)
        const read = tx.objectStore(META).get(EPOCH)
        tx.oncomplete = () => { epoch = read.result ?? '0'; resolve(db) }
        tx.onabort = () => { db.close(); reject(tx.error) }
      }
    })
    return opening
  }

  const transact = async <T>(mode: IDBTransactionMode, action: (store: IDBObjectStore, meta: IDBObjectStore) => IDBRequest<T>, signal?: AbortSignal): Promise<T> => {
    if (signal?.aborted) throw signal.reason
    const db = await open()
    if (signal?.aborted) throw signal.reason
    if (getStorageInvalidation()) throw new StaleStorageError()
    const expected = epoch
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction([records, META], mode)
      let result: IDBRequest<T> | undefined
      let failure: unknown
      const abort = () => {
        failure = signal?.reason
        try { tx.abort() }
        catch { /* Commit may have finished before its completion event was delivered. */ }
      }
      signal?.addEventListener('abort', abort, { once: true })
      const cleanup = () => signal?.removeEventListener('abort', abort)
      tx.oncomplete = () => { cleanup(); resolve(result!.result) }
      tx.onabort = () => { cleanup(); reject(failure ?? tx.error ?? new DOMException('Transaction aborted', 'AbortError')) }
      const meta = tx.objectStore(META)
      const read = meta.get(EPOCH)
      read.onsuccess = () => {
        if ((read.result ?? '0') !== expected) {
          failure = new StaleStorageError()
          tx.abort()
          invalidateStorage('deleted')
          return
        }
        try { result = action(tx.objectStore(records), meta) }
        catch (error) { failure = error; tx.abort() }
      }
    })
  }

  let watching = false
  const initialize = async () => {
    await open()
    if (!watching) {
      watching = true
      watchStorage(() => transact('readonly', (_store, meta) => meta.get(EPOCH)))
    }
  }

  return {
    async values(): Promise<unknown[]> {
      await initialize()
      return transact('readonly', (store) => store.getAll())
    },
    async put(key: string, value: unknown, signal?: AbortSignal) {
      if (signal?.aborted) throw signal.reason
      await initialize()
      await transact('readwrite', (store) => store.put(value, key), signal)
    },
    async delete(key: string) {
      await initialize()
      await transact('readwrite', (store) => store.delete(key))
    },
    async clear() {
      await initialize()
      const next = crypto.randomUUID()
      await transact('readwrite', (store, meta) => {
        meta.put(next, EPOCH)
        return store.clear()
      })
      epoch = next
      announceErasure()
    },
  }
}
