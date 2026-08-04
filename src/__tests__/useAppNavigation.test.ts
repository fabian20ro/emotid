import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAppNavigation } from '../hooks/useAppNavigation'

describe('useAppNavigation', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it('restores exact destinations for browser Back and Forward', () => {
    const { result } = renderHook(() => useAppNavigation())

    act(() => result.current.navigate({ name: 'settings' }))
    const settingsState = window.history.state
    act(() => result.current.navigate({ name: 'privacy' }))
    const privacyState = window.history.state

    act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: settingsState })))
    expect(result.current.destination).toEqual({ name: 'settings' })

    act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: privacyState })))
    expect(result.current.destination).toEqual({ name: 'privacy' })
  })

  it('does not restore destinations from before a tab reset', () => {
    const { result } = renderHook(() => useAppNavigation())

    act(() => result.current.navigate({ name: 'arrival' }))
    const staleArrivalState = window.history.state
    act(() => result.current.reset({ name: 'explore' }))
    const resetState = window.history.state

    act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: staleArrivalState })))
    expect(result.current.destination).toEqual({ name: 'explore' })
    expect(window.history.state).toEqual(resetState)
  })

  it('replaces the current destination without changing its parent', () => {
    const { result } = renderHook(() => useAppNavigation())

    act(() => result.current.reset({ name: 'journal' }))
    act(() => result.current.navigate({ name: 'session', sessionId: 'session-1' }))
    act(() => result.current.replace({ name: 'journal' }))
    const replacedState = window.history.state

    expect(result.current.destination).toEqual({ name: 'journal' })
    act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: replacedState })))
    expect(result.current.destination).toEqual({ name: 'journal' })
  })

  it('restores destination payloads and rejects malformed history state', () => {
    const { result } = renderHook(() => useAppNavigation())

    act(() => result.current.navigate({ name: 'session', sessionId: 'session-42' }))
    const sessionState = window.history.state
    act(() => result.current.navigate({ name: 'support' }))
    act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: sessionState })))
    expect(result.current.destination).toEqual({ name: 'session', sessionId: 'session-42' })

    const navigationId = window.history.state.emotIdNavigation.navigationId
    act(() => window.dispatchEvent(new PopStateEvent('popstate', {
      state: { emotIdNavigation: { navigationId, stack: [{ name: 'session' }] } },
    })))
    expect(result.current.destination).toEqual({ name: 'session', sessionId: 'session-42' })
  })
})
