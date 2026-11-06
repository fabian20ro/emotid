import { useState, useCallback, useEffect, useRef } from 'react'
import { saveSession, getAllSessions, deleteSession, clearAllSessions } from '../data/session-repo'
import type { Session } from '../data/types'

export function useSessionHistory() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const revision = useRef(0)

  useEffect(() => {
    const started = revision.current
    let active = true
    getAllSessions()
      .then((loaded) => {
        if (!active || started !== revision.current) return
        setSessions(loaded)
        setError(false)
      })
      .catch((err) => {
        if (!active || started !== revision.current) return
        console.warn('Failed to load sessions:', err)
        setSessions([])
        setError(true)
      })
      .finally(() => { if (active && started === revision.current) setLoading(false) })
    return () => { active = false }
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
    revision.current += 1
    setSessions([])
    setError(false)
    setLoading(false)
  }, [])

  return { sessions, loading, error, save, remove, clearAll }
}
