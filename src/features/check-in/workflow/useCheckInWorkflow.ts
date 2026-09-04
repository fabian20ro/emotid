import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { addReflectionDetail, createSession } from '../../../data/session'
import type { Session } from '../../../data/types'
import type { AnalysisResult, BaseEmotion } from '../../../models/types'
import type {
  CheckInRoute,
  ReflectionDetail,
  ReflectionSaveOutcome,
} from '../../../navigation/types'
import { buildCheckInCompletion } from './build-completion'
import { createCheckInDraft } from './draft'
import { isCompleteSomaticSelection } from '../../../models/somatic/scoring'
import {
  checkInWorkflowReducer,
  INITIAL_CHECK_IN_WORKFLOW_STATE,
} from './reducer'
import {
  createSessionWriteCoordinator,
  emitSessionWriteDiagnostic,
  SESSION_WRITE_TIMEOUT_MS,
  type SessionWriteCoordinator,
  type SessionWriteDiagnostic,
} from './session-write-coordinator'

interface UseCheckInWorkflowOptions {
  saveSessions: boolean
  saveSession: (session: Session, signal?: AbortSignal) => Promise<void>
  onShowReflection: () => void
  onReturnToday: () => void
  writeTimeoutMs?: number
  onWriteDiagnostic?: (diagnostic: SessionWriteDiagnostic) => void
}

export function useCheckInWorkflow({
  saveSessions,
  saveSession,
  onShowReflection,
  onReturnToday,
  writeTimeoutMs = SESSION_WRITE_TIMEOUT_MS,
  onWriteDiagnostic = emitSessionWriteDiagnostic,
}: UseCheckInWorkflowOptions) {
  const [state, dispatch] = useReducer(
    checkInWorkflowReducer,
    INITIAL_CHECK_IN_WORKFLOW_STATE,
  )
  const activeSessionRef = useRef<Session | null>(null)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [draft, setDraft] = useState(createCheckInDraft)
  const saveSessionRef = useRef(saveSession)
  const writeCoordinatorRef = useRef<SessionWriteCoordinator | null>(null)
  if (writeCoordinatorRef.current === null) {
    writeCoordinatorRef.current = createSessionWriteCoordinator({
      timeoutMs: writeTimeoutMs,
      onDiagnostic: onWriteDiagnostic,
    })
  }
  const latestWriteRef = useRef<Promise<void> | null>(null)
  const latestBaseWriteRef = useRef<Promise<void> | null>(null)
  const completionInFlightRef = useRef(false)

  useEffect(() => {
    saveSessionRef.current = saveSession
  }, [saveSession])

  const reset = useCallback(() => {
    writeCoordinatorRef.current?.resetGeneration()
    activeSessionRef.current = null
    setCurrentSession(null)
    setDraft(createCheckInDraft())
    latestWriteRef.current = null
    latestBaseWriteRef.current = null
    completionInFlightRef.current = false
    dispatch({ type: 'reset' })
  }, [])

  const queueSessionSave = useCallback((kind: 'base' | 'detail', session: Session) => {
    const write = writeCoordinatorRef.current!.enqueue(
      kind,
      (signal) => saveSessionRef.current(session, signal),
    )
    latestWriteRef.current = write
    return write
  }, [])

  const persistBaseSession = useCallback((session: Session) => {
    if (!saveSessions) return

    dispatch({ type: 'save-started' })
    const write = queueSessionSave('base', session)
    latestBaseWriteRef.current = write
    void write.then(
      () => {
        if (latestBaseWriteRef.current !== write) return
        dispatch({
          type: 'base-saved',
          isLatestWrite: latestWriteRef.current === write,
        })
      },
      () => {
        if (latestBaseWriteRef.current === write) {
          dispatch({ type: 'write-failed' })
        }
      },
    )
  }, [queueSessionSave, saveSessions])

  const complete = useCallback((
    route: CheckInRoute,
    modelId: string,
    selections: BaseEmotion[],
    results: AnalysisResult[],
    intent: 'new' | 'revision' = 'revision',
  ) => {
    const observationOnly = route === 'body' && selections.every(isCompleteSomaticSelection)
    if (selections.length === 0 || (results.length === 0 && !observationOnly) || completionInFlightRef.current) {
      return false
    }

    if (intent === 'new') reset()
    completionInFlightRef.current = true
    const completion = buildCheckInCompletion({ route, modelId, selections, results })
    const existing = activeSessionRef.current
    let session = createSession(
      completion,
      existing ? { id: existing.id, timestamp: existing.timestamp } : undefined,
    )
    if (existing?.reflectionAnswer) session = addReflectionDetail(session, {
      reflectionAnswer: existing.reflectionAnswer,
    })
    activeSessionRef.current = session
    setCurrentSession(session)
    dispatch({ type: 'completed', completion, saveEnabled: saveSessions })
    persistBaseSession(session)
    onShowReflection()
    window.setTimeout(() => {
      completionInFlightRef.current = false
    }, 0)
    return true
  }, [onShowReflection, persistBaseSession, reset, saveSessions])

  const saveReflection = useCallback(async (
    detail: ReflectionDetail,
  ): Promise<ReflectionSaveOutcome> => {
    const session = activeSessionRef.current
    if (!session) return 'not-saved'

    const updated = addReflectionDetail(session, detail)
    activeSessionRef.current = updated
    setCurrentSession(updated)
    if (!saveSessions) return 'not-saved'
    dispatch({ type: 'save-started' })
    const write = queueSessionSave('detail', updated)
    try {
      await write
      if (latestWriteRef.current === write) {
        dispatch({ type: 'write-succeeded' })
      }
      return 'saved'
    } catch (error) {
      if (latestWriteRef.current === write) {
        dispatch({ type: 'write-failed' })
      }
      throw error
    }
  }, [queueSessionSave, saveSessions])

  const retryBaseSave = useCallback(() => {
    if (activeSessionRef.current) persistBaseSession(activeSessionRef.current)
  }, [persistBaseSession])

  const finish = useCallback(() => {
    reset()
    onReturnToday()
  }, [onReturnToday, reset])

  const runExclusiveReset = useCallback(async (action: () => Promise<void>) => {
    completionInFlightRef.current = true
    const coordinator = writeCoordinatorRef.current!
    try {
      await coordinator.pauseAndDrain()
      await action()
      activeSessionRef.current = null
      setCurrentSession(null)
      setDraft(createCheckInDraft())
      latestWriteRef.current = null
      latestBaseWriteRef.current = null
      dispatch({ type: 'reset' })
    } finally {
      coordinator.resume()
      completionInFlightRef.current = false
    }
  }, [])

  return {
    state,
    draft,
    currentSession,
    begin: reset,
    complete,
    saveReflection,
    retryBaseSave,
    finish,
    runExclusiveReset,
  }
}
