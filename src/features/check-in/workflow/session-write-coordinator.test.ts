import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createSessionWriteCoordinator,
  SessionWriteCoordinatorError,
  type SessionWriteDiagnostic,
} from './session-write-coordinator'

function deferred() {
  let resolve!: () => void
  let reject!: (error: unknown) => void
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

async function flushPromises() {
  for (let index = 0; index < 6; index += 1) {
    await Promise.resolve()
  }
}

describe('session write coordinator', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('times out a stuck write and rejects retries until the underlying write settles', async () => {
    vi.useFakeTimers()
    const pending = deferred()
    const diagnostics: SessionWriteDiagnostic[] = []
    const write = vi.fn(() => pending.promise)
    const coordinator = createSessionWriteCoordinator({
      timeoutMs: 1_000,
      onDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
    })

    const firstWrite = coordinator.enqueue('base', write)
    const firstFailure = expect(firstWrite).rejects.toMatchObject({ code: 'timeout' })
    await flushPromises()
    expect(write).toHaveBeenCalledOnce()
    expect(coordinator.getSnapshot().status).toBe('writing')

    await vi.advanceTimersByTimeAsync(1_000)
    await firstFailure
    expect(coordinator.getSnapshot().status).toBe('degraded')

    await expect(coordinator.enqueue('base', write)).rejects.toMatchObject({ code: 'degraded' })
    expect(write).toHaveBeenCalledOnce()

    pending.resolve()
    await flushPromises()
    expect(coordinator.getSnapshot().status).toBe('idle')
    expect(diagnostics.map(({ outcome }) => outcome)).toEqual([
      'timed-out',
      'rejected-degraded',
      'settled-late',
    ])

    await expect(coordinator.enqueue('base', async () => undefined)).resolves.toBeUndefined()
  })

  it('preserves write order while the queue is healthy', async () => {
    const base = deferred()
    const events: string[] = []
    const coordinator = createSessionWriteCoordinator({ timeoutMs: 1_000 })

    const baseWrite = coordinator.enqueue('base', async () => {
      events.push('base-start')
      await base.promise
      events.push('base-end')
    })
    const detailWrite = coordinator.enqueue('detail', async () => {
      events.push('detail-start')
      events.push('detail-end')
    })

    await flushPromises()
    expect(events).toEqual(['base-start'])
    base.resolve()
    await expect(Promise.all([baseWrite, detailWrite])).resolves.toEqual([undefined, undefined])
    expect(events).toEqual(['base-start', 'base-end', 'detail-start', 'detail-end'])
  })

  it('invalidates old callbacks and prevents queued writes from an obsolete generation', async () => {
    const base = deferred()
    const detailWrite = vi.fn(async () => undefined)
    const newWrite = vi.fn(async () => undefined)
    const coordinator = createSessionWriteCoordinator({ timeoutMs: 1_000 })

    const oldBase = coordinator.enqueue('base', () => base.promise)
    const oldDetail = coordinator.enqueue('detail', detailWrite)
    const oldBaseFailure = expect(oldBase).rejects.toMatchObject({ code: 'obsolete' })
    const oldDetailFailure = expect(oldDetail).rejects.toMatchObject({ code: 'obsolete' })
    await flushPromises()

    coordinator.resetGeneration()
    await oldBaseFailure
    await oldDetailFailure
    await expect(coordinator.enqueue('base', newWrite)).resolves.toBeUndefined()

    expect(newWrite).toHaveBeenCalledOnce()
    expect(detailWrite).not.toHaveBeenCalled()
    base.resolve()
    await flushPromises()

    expect(detailWrite).not.toHaveBeenCalled()
  })

  it('pauses new writes and drains obsolete physical work before an exclusive reset', async () => {
    const pending = deferred()
    const coordinator = createSessionWriteCoordinator({ timeoutMs: 1_000 })
    const oldWrite = coordinator.enqueue('base', () => pending.promise)
    await flushPromises()

    const drain = coordinator.pauseAndDrain()
    await expect(oldWrite).rejects.toMatchObject({ code: 'obsolete' })

    await expect(coordinator.enqueue('base', async () => undefined))
      .rejects.toMatchObject({ code: 'paused' })
    let drained = false
    void drain.then(() => { drained = true })
    await flushPromises()
    expect(drained).toBe(false)

    pending.resolve()
    await drain
    coordinator.resume()
    await expect(coordinator.enqueue('base', async () => undefined)).resolves.toBeUndefined()
  })

  it('recovers after an ordinary rejection without entering degraded state', async () => {
    const coordinator = createSessionWriteCoordinator({ timeoutMs: 1_000 })
    const failure = new Error('disk unavailable')

    await expect(coordinator.enqueue('base', async () => {
      throw failure
    })).rejects.toBe(failure)
    expect(coordinator.getSnapshot().status).toBe('idle')
    await expect(coordinator.enqueue('base', async () => undefined)).resolves.toBeUndefined()
  })

  it('starts a clean generation after timeout even when obsolete work ignores cancellation', async () => {
    vi.useFakeTimers()
    const pending = deferred()
    const coordinator = createSessionWriteCoordinator({ timeoutMs: 1_000 })

    const oldWrite = coordinator.enqueue('base', () => pending.promise)
    const oldFailure = expect(oldWrite).rejects.toMatchObject({ code: 'timeout' })
    await flushPromises()
    await vi.advanceTimersByTimeAsync(1_000)
    await oldFailure
    expect(coordinator.getSnapshot().status).toBe('degraded')

    coordinator.resetGeneration()

    expect(coordinator.getSnapshot()).toMatchObject({ status: 'idle', pendingOperations: 0 })
    await expect(coordinator.enqueue('base', async () => undefined)).resolves.toBeUndefined()
    pending.resolve()
    await flushPromises()
  })

  it('uses typed coordinator errors without exposing session content', () => {
    const error = new SessionWriteCoordinatorError('timeout', 7)

    expect(error).toMatchObject({ code: 'timeout', operationId: 7 })
    expect(error.message).not.toContain('emotion')
  })

  it('does not let diagnostic consumers alter write behavior', async () => {
    const coordinator = createSessionWriteCoordinator({
      timeoutMs: 1_000,
      onDiagnostic: () => {
        throw new Error('diagnostic consumer failed')
      },
    })

    await expect(coordinator.enqueue('base', async () => undefined)).resolves.toBeUndefined()
    expect(coordinator.getSnapshot().status).toBe('idle')
  })
})
