import { createGuardedStore } from './guarded-store'
import type { Session } from './types'
import { decodeSessions } from './record-validation'

const store = createGuardedStore('emot-id-sessions', 'sessions')

export async function saveSession(session: Session, signal?: AbortSignal): Promise<void> {
  await store.put(session.id, session, signal)
}

export async function getAllSessions(): Promise<Session[]> {
  const allValues = await store.values()
  const sessions = decodeSessions(allValues)
  return sessions.sort((a, b) => b.timestamp - a.timestamp)
}

export async function deleteSession(id: string): Promise<void> {
  await store.delete(id)
}

export async function clearAllSessions(): Promise<void> {
  await store.clear()
}
