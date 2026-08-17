export type SessionWriteKind = 'base' | 'detail'
export const SESSION_WRITE_TIMEOUT_MS = 8_000
export type SessionWriteStatus = 'idle' | 'writing' | 'degraded'
export type SessionWriteOutcome =
  | 'succeeded'
  | 'failed'
  | 'timed-out'
  | 'rejected-degraded'
  | 'rejected-paused'
  | 'obsolete'
  | 'settled-late'

export interface SessionWriteDiagnostic {
  operationId: number
  kind: SessionWriteKind
  durationMs: number
  outcome: SessionWriteOutcome
}

export interface SessionWriteSnapshot {
  status: SessionWriteStatus
  generation: number
  pendingOperations: number
  lastDiagnostic?: SessionWriteDiagnostic
}

interface SessionWriteCoordinatorOptions {
  timeoutMs: number
  now?: () => number
  onDiagnostic?: (diagnostic: SessionWriteDiagnostic) => void
}

interface PendingWrite {
  id: number
  kind: SessionWriteKind
  generation: number
  startedAt: number
  timer?: ReturnType<typeof setTimeout>
  facadeSettled: boolean
  timedOut: boolean
  obsolete: boolean
  abortController: AbortController
  resolve: () => void
  reject: (error: unknown) => void
  physicalSettlement?: Promise<void>
}

export class SessionWriteCoordinatorError extends Error {
  readonly code: 'timeout' | 'degraded' | 'obsolete' | 'paused'
  readonly operationId: number

  constructor(
    code: 'timeout' | 'degraded' | 'obsolete' | 'paused',
    operationId: number,
  ) {
    const messages = {
      timeout: 'Local write did not finish before the deadline.',
      degraded: 'Local writes are unavailable until the pending operation settles.',
      obsolete: 'Local write belongs to an obsolete check-in.',
      paused: 'Local writes are paused for an exclusive data operation.',
    }
    super(messages[code])
    this.name = 'SessionWriteCoordinatorError'
    this.code = code
    this.operationId = operationId
  }
}

export const SESSION_WRITE_DIAGNOSTIC_EVENT = 'emot-id:session-write'

export function emitSessionWriteDiagnostic(diagnostic: SessionWriteDiagnostic) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(SESSION_WRITE_DIAGNOSTIC_EVENT, {
    detail: diagnostic,
  }))
}

export function createSessionWriteCoordinator({
  timeoutMs,
  now = Date.now,
  onDiagnostic,
}: SessionWriteCoordinatorOptions) {
  let generation = 0
  let operationSequence = 0
  let tail: Promise<void> = Promise.resolve()
  let lastDiagnostic: SessionWriteDiagnostic | undefined
  let paused = false
  const pending = new Set<PendingWrite>()

  const currentOperations = () => [...pending].filter((operation) => (
    operation.generation === generation && !operation.obsolete
  ))

  const status = (): SessionWriteStatus => {
    const current = currentOperations()
    if (current.some((operation) => operation.timedOut)) return 'degraded'
    return current.length > 0 ? 'writing' : 'idle'
  }

  const report = (operation: Pick<PendingWrite, 'id' | 'kind' | 'startedAt'>, outcome: SessionWriteOutcome) => {
    const diagnostic: SessionWriteDiagnostic = {
      operationId: operation.id,
      kind: operation.kind,
      durationMs: Math.max(0, now() - operation.startedAt),
      outcome,
    }
    lastDiagnostic = diagnostic
    try {
      onDiagnostic?.(diagnostic)
    } catch {
      // Diagnostics must not alter persistence behavior.
    }
  }

  const settleFacade = (operation: PendingWrite, error?: unknown) => {
    if (operation.facadeSettled) return
    operation.facadeSettled = true
    clearTimeout(operation.timer)
    if (error === undefined) operation.resolve()
    else operation.reject(error)
  }

  const enqueue = (kind: SessionWriteKind, write: (signal: AbortSignal) => Promise<void>): Promise<void> => {
    const id = ++operationSequence
    const startedAt = now()

    if (paused) {
      const error = new SessionWriteCoordinatorError('paused', id)
      report({ id, kind, startedAt }, 'rejected-paused')
      return Promise.reject(error)
    }

    if (status() === 'degraded') {
      const error = new SessionWriteCoordinatorError('degraded', id)
      report({ id, kind, startedAt }, 'rejected-degraded')
      return Promise.reject(error)
    }

    let resolveFacade!: () => void
    let rejectFacade!: (error: unknown) => void
    const facade = new Promise<void>((resolve, reject) => {
      resolveFacade = resolve
      rejectFacade = reject
    })
    const operation: PendingWrite = {
      id,
      kind,
      generation,
      startedAt,
      facadeSettled: false,
      timedOut: false,
      obsolete: false,
      abortController: new AbortController(),
      resolve: resolveFacade,
      reject: rejectFacade,
    }
    pending.add(operation)
    operation.timer = setTimeout(() => {
      operation.timedOut = true
      report(operation, 'timed-out')
      settleFacade(operation, new SessionWriteCoordinatorError('timeout', operation.id))
      operation.abortController.abort()
    }, timeoutMs)

    const execution = tail.then(async () => {
      if (operation.obsolete || operation.generation !== generation) {
        throw new SessionWriteCoordinatorError('obsolete', operation.id)
      }
      if (operation.timedOut) {
        throw new SessionWriteCoordinatorError('timeout', operation.id)
      }
      await write(operation.abortController.signal)
    })
    tail = execution.then(() => undefined, () => undefined)

    operation.physicalSettlement = execution.then(
      () => {
        if (operation.timedOut) {
          report(operation, 'settled-late')
        } else if (!operation.obsolete) {
          report(operation, 'succeeded')
          settleFacade(operation)
        }
      },
      (error: unknown) => {
        if (operation.timedOut) {
          report(operation, 'settled-late')
        } else if (!operation.obsolete) {
          report(operation, 'failed')
          settleFacade(operation, error)
        }
      },
    ).then(() => {
      clearTimeout(operation.timer)
      pending.delete(operation)
    })

    return facade
  }

  const resetGeneration = () => {
    generation += 1
    tail = Promise.resolve()
    for (const operation of pending) {
      operation.obsolete = true
      if (!operation.facadeSettled) {
        report(operation, 'obsolete')
        settleFacade(operation, new SessionWriteCoordinatorError('obsolete', operation.id))
      }
      operation.abortController.abort()
    }
  }

  const pauseAndDrain = async () => {
    paused = true
    generation += 1
    const obsoleteOperations = [...pending]
    for (const operation of obsoleteOperations) {
      operation.obsolete = true
      if (!operation.facadeSettled) {
        report(operation, 'obsolete')
        settleFacade(operation, new SessionWriteCoordinatorError('obsolete', operation.id))
      }
      operation.abortController.abort()
    }
    await Promise.all(obsoleteOperations.map((operation) => operation.physicalSettlement ?? Promise.resolve()))
    tail = Promise.resolve()
  }

  const resume = () => {
    paused = false
  }

  const getSnapshot = (): SessionWriteSnapshot => ({
    status: status(),
    generation,
    pendingOperations: currentOperations().length,
    lastDiagnostic,
  })

  return { enqueue, resetGeneration, pauseAndDrain, resume, getSnapshot }
}

export type SessionWriteCoordinator = ReturnType<typeof createSessionWriteCoordinator>
