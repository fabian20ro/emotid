import { createStore, promisifyRequest, del, keys, values } from 'idb-keyval'
import type { Session } from './types'
import { decodeSessions } from './record-validation'

const store = createStore('emot-id-sessions', 'sessions')

export async function saveSession(session: Session, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw signal.reason

  await store('readwrite', (objectStore) => {
    const transaction = objectStore.transaction
    const abort = () => {
      try {
        transaction.abort()
      } catch {
        // The transaction may have settled between the signal and abort call.
      }
    }
    signal?.addEventListener('abort', abort, { once: true })
    objectStore.put(session, session.id)
    return promisifyRequest(transaction).finally(() => {
      signal?.removeEventListener('abort', abort)
    })
  })
}

export async function getAllSessions(): Promise<Session[]> {
  const allValues = await values<unknown>(store)
  const sessions = decodeSessions(allValues)
  return sessions.sort((a, b) => b.timestamp - a.timestamp)
}

export async function deleteSession(id: string): Promise<void> {
  await del(id, store)
}

export async function clearAllSessions(): Promise<void> {
  const allKeys = await keys(store)
  for (const key of allKeys) {
    await del(key, store)
  }
}

export async function exportSessionsJSON(): Promise<string> {
  const sessions = await getAllSessions()
  return JSON.stringify(sessions, null, 2)
}
