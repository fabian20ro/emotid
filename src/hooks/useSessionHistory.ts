import { useState, useCallback, useEffect } from 'react'
import { saveSession, getAllSessions, deleteSession, clearAllSessions } from '../data/session-repo'
import type { Session } from '../data/types'

export function useSessionHistory() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getAllSessions()
      .then((loaded) => {
        setSessions(loaded)
        setError(false)
      })
      .catch((err) => {
        console.warn('Failed to load sessions:', err)
        setSessions([])
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  const save = useCallback(async (session: Session, signal?: AbortSignal) => {
    await saveSession(session, signal)
    setSessions((prev) => [session, ...prev.filter((s) => s.id !== session.id)])
  }, [])

  const remove = useCallback(async (id: string) => {
    await deleteSession(id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const clearAll = useCallback(async () => {
    await clearAllSessions()
    setSessions([])
  }, [])

  return { sessions, loading, error, save, remove, clearAll }
}
