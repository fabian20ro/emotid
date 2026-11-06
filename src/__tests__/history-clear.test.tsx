import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { useSessionHistory } from '../hooks/useSessionHistory'
import { useChainAnalysis } from '../hooks/useChainAnalysis'

const repos = vi.hoisted(() => ({ load: vi.fn(), clear: vi.fn() }))
vi.mock('../data/session-repo', () => ({ getAllSessions: repos.load, clearAllSessions: repos.clear }))
vi.mock('../data/chain-analysis-repo', () => ({ getAllChainAnalyses: repos.load, clearAllChainAnalyses: repos.clear }))
beforeEach(() => { vi.resetAllMocks(); repos.clear.mockResolvedValue(undefined) })

for (const [name, hook] of [['sessions', useSessionHistory], ['exercises', useChainAnalysis]] as const) {
  it(`${name}: successful clear recovers from a load error`, async () => {
    repos.load.mockRejectedValue(new Error('invalid data'))
    const { result } = renderHook(hook)
    await waitFor(() => expect(result.current.error).toBe(true))
    await act(() => result.current.clearAll())
    expect(result.current.error).toBe(false)
    expect(result.current.loading).toBe(false)
  })

  it(`${name}: a late load cannot restore data after clear`, async () => {
    let finish!: (values: unknown[]) => void
    repos.load.mockReturnValue(new Promise((resolve) => { finish = resolve }))
    const { result } = renderHook(hook)
    await act(() => result.current.clearAll())
    await act(async () => { finish([{ id: 'erased' }]) })
    const state = result.current
    expect('sessions' in state ? state.sessions : state.entries).toEqual([])
    expect(state.loading).toBe(false)
  })

  it(`${name}: failed clear does not hide an existing load error`, async () => {
    repos.load.mockRejectedValue(new Error('invalid data'))
    repos.clear.mockRejectedValue(new Error('clear failed'))
    const { result } = renderHook(hook)
    await waitFor(() => expect(result.current.error).toBe(true))
    await act(async () => { await expect(result.current.clearAll()).rejects.toThrow('clear failed') })
    expect(result.current.error).toBe(true)
  })
}
