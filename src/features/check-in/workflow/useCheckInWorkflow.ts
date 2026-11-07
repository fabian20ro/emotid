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
import { isCompleteSomaticSelection } from '../../../models/somatic/selection'
import { MODEL_IDS } from '../../../models/constants'
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
  onShowReflection: (sessionId: string) => void
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
  const activeCompletionRef = useRef<ReturnType<typeof buildCheckInCompletion> | null>(null)
  const renderedCompletion = state.phase === 'reflecting' ? state.completion : null

  useEffect(() => {
    saveSessionRef.current = saveSession
  }, [saveSession])

  const reset = useCallback(() => {
    // A new draft must not cancel an already committed observation/correction.
    // Destructive resets still pause, cancel and drain the coordinator below.
    activeSessionRef.current = null
    activeCompletionRef.current = null
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
    const observationOnly = route === 'body' && modelId === MODEL_IDS.SOMATIC && selections.every(isCompleteSomaticSelection)
    if (selections.length === 0 || (results.length === 0 && !observationOnly) || completionInFlightRef.current) {
      return false
    }

    if (intent === 'new') reset()
    completionInFlightRef.current = true
    draft.set('selectedNeed', undefined)
    draft.set('nextStep', undefined)
    draft.set('tier4Acknowledged', false)
    const completion = buildCheckInCompletion({ route, modelId, selections, results })
    activeCompletionRef.current = completion
    const existing = activeSessionRef.current
    let session = createSession(
      completion,
      existing ? { id: existing.id, timestamp: existing.timestamp } : undefined,
    )
    if (existing?.reflectionAnswer && !completion.outcome) {
      const sameResults = existing.results.length === results.length
        && existing.results.every((previous) => results.some((result) => result.id === previous.id))
      const retainedIds = existing.selectedResultIds?.filter((id) => results.some((result) => result.id === id))
      const selectedResultIds = sameResults || retainedIds?.length ? retainedIds : undefined
      const reflectionAnswer = sameResults ? existing.reflectionAnswer
        : selectedResultIds?.length ? (selectedResultIds.length === results.length ? 'yes' : 'partly') : undefined
      session = addReflectionDetail(session, { reflectionAnswer, selectedResultIds })
      draft.set('fit', reflectionAnswer)
      draft.set('selectedResultIds', selectedResultIds)
    }
    if (completion.outcome) {
      draft.set('fit', undefined)
      draft.set('selectedResultIds', undefined)
    }
    activeSessionRef.current = session
    setCurrentSession(session)
    dispatch({ type: 'completed', completion, saveEnabled: saveSessions })
    persistBaseSession(session)
    onShowReflection(session.id)
    window.setTimeout(() => {
      completionInFlightRef.current = false
    }, 0)
    return true
  }, [draft, onShowReflection, persistBaseSession, reset, saveSessions])

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
    // A revision keeps the session ID but owns a different completion.
    if (!renderedCompletion || renderedCompletion !== activeCompletionRef.current) return
    reset()
    onReturnToday()
  }, [renderedCompletion, onReturnToday, reset])

  const runExclusiveReset = useCallback(async (action: () => Promise<void>) => {
    completionInFlightRef.current = true
    const coordinator = writeCoordinatorRef.current!
    try {
      await coordinator.pauseAndDrain()
      await action()
    } finally {
      // A failed multi-store clear may already have erased sessions. Never retain
      // a draft that could reinsert them when the coordinator resumes.
      activeSessionRef.current = null
      activeCompletionRef.current = null
      setCurrentSession(null)
      setDraft(createCheckInDraft())
      latestWriteRef.current = null
      latestBaseWriteRef.current = null
      dispatch({ type: 'reset' })
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
