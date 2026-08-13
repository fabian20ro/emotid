import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '../../../data/types'
import type { AnalysisResult, BaseEmotion } from '../../../models/types'
import { useCheckInWorkflow } from './useCheckInWorkflow'

const selection: BaseEmotion = {
  id: 'joy',
  label: { en: 'joy', ro: 'bucurie' },
  color: '#ffd54f',
}
const analysis: AnalysisResult = {
  ...selection,
  description: { en: 'Possible joy.', ro: 'Posibilă bucurie.' },
}

function renderWorkflow(
  saveSession: (session: Session) => Promise<void>,
  saveSessions = true,
  writeTimeoutMs?: number,
) {
  const onShowReflection = vi.fn()
  const onReturnToday = vi.fn()
  const hook = renderHook(() => useCheckInWorkflow({
    sessions: [],
    saveSessions,
    saveSession,
    onShowReflection,
    onReturnToday,
    writeTimeoutMs,
  }))
  return { ...hook, onShowReflection, onReturnToday }
}

describe('useCheckInWorkflow', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('performs no write when local saving is disabled', async () => {
    const saveSession = vi.fn<(session: Session) => Promise<void>>()
    const { result, onShowReflection } = renderWorkflow(saveSession, false)

    act(() => {
      expect(result.current.complete(
        'quick',
        'quick-check-in',
        [selection],
        [analysis],
      )).toBe(true)
    })

    expect(onShowReflection).toHaveBeenCalledOnce()
    expect(saveSession).not.toHaveBeenCalled()
    expect(result.current.state).toMatchObject({
      phase: 'reflecting',
      saveState: 'disabled',
    })
    await expect(result.current.saveReflection({ reflectionAnswer: 'yes' }))
      .resolves.toBe('not-saved')
  })

  it('retries a failed base write without changing session identity', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001')
    const saveSession = vi.fn<(session: Session) => Promise<void>>()
      .mockRejectedValueOnce(new Error('disk unavailable'))
      .mockResolvedValueOnce(undefined)
    const { result } = renderWorkflow(saveSession)

    act(() => {
      result.current.complete('quick', 'quick-check-in', [selection], [analysis])
    })
    await waitFor(() => {
      expect(result.current.state).toMatchObject({
        phase: 'reflecting',
        saveState: 'error',
      })
    })

    act(() => result.current.retryBaseSave())
    await waitFor(() => {
      expect(result.current.state).toMatchObject({
        phase: 'reflecting',
        saveState: 'saved',
        sessionCaptured: true,
      })
    })

    expect(saveSession).toHaveBeenCalledTimes(2)
    expect(saveSession.mock.calls[0][0].id).toBe('00000000-0000-4000-8000-000000000001')
    expect(saveSession.mock.calls[1][0].id).toBe('00000000-0000-4000-8000-000000000001')
  })

  it('orders optional details after the base write and keeps one identity', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000002')
    const writes: string[] = []
    let releaseBase: (() => void) | undefined
    const saveSession = vi.fn<(session: Session) => Promise<void>>().mockImplementation(async (session) => {
      writes.push(session.reflectionAnswer ? 'detail-start' : 'base-start')
      if (!session.reflectionAnswer) {
        await new Promise<void>((resolve) => {
          releaseBase = resolve
        })
        writes.push('base-end')
      } else {
        writes.push('detail-end')
      }
    })
    const { result } = renderWorkflow(saveSession)

    act(() => {
      result.current.complete('quick', 'quick-check-in', [selection], [analysis])
    })
    const detailWrite = result.current.saveReflection({ reflectionAnswer: 'yes' })
    await waitFor(() => expect(writes).toEqual(['base-start']))

    act(() => releaseBase?.())
    await expect(detailWrite).resolves.toBe('saved')

    expect(writes).toEqual([
      'base-start',
      'base-end',
      'detail-start',
      'detail-end',
    ])
    expect(saveSession.mock.calls[0][0].id).toBe('00000000-0000-4000-8000-000000000002')
    expect(saveSession.mock.calls[1][0].id).toBe('00000000-0000-4000-8000-000000000002')
  })

  it('fails a stuck save after the deadline and makes retry recoverable after late settlement', async () => {
    vi.useFakeTimers()
    let releaseBase: (() => void) | undefined
    const saveSession = vi.fn<(session: Session) => Promise<void>>()
      .mockImplementationOnce(() => new Promise<void>((resolve) => {
        releaseBase = resolve
      }))
      .mockResolvedValue(undefined)
    const { result } = renderWorkflow(saveSession, true, 1_000)

    act(() => {
      result.current.complete('quick', 'quick-check-in', [selection], [analysis])
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000)
    })
    expect(result.current.state).toMatchObject({ saveState: 'error' })

    act(() => result.current.retryBaseSave())
    await act(async () => Promise.resolve())
    expect(result.current.state).toMatchObject({ saveState: 'error' })
    expect(saveSession).toHaveBeenCalledOnce()

    await act(async () => {
      releaseBase?.()
      await Promise.resolve()
      await Promise.resolve()
    })
    act(() => result.current.retryBaseSave())
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(saveSession).toHaveBeenCalledTimes(2)
    expect(result.current.state).toMatchObject({
      saveState: 'saved',
      sessionCaptured: true,
    })
  })
})
