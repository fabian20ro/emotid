import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppDestination } from '../navigation/types'
import {
  createBrowserHistoryState,
  createNavigationId,
  readNavigationSnapshot,
  type AppNavigationSnapshot,
} from '../navigation/history-state'

const ROOT: AppDestination = { name: 'today' }

export function useAppNavigation() {
  const [snapshot, setSnapshot] = useState<AppNavigationSnapshot>(() => ({
    navigationId: createNavigationId(),
    stack: [ROOT],
  }))
  const snapshotRef = useRef(snapshot)

  const writeHistory = useCallback((next: AppNavigationSnapshot, mode: 'push' | 'replace') => {
    const state = createBrowserHistoryState(next, window.history.state)
    if (mode === 'push') window.history.pushState(state, '')
    else window.history.replaceState(state, '')
    snapshotRef.current = next
    setSnapshot(next)
  }, [])

  useEffect(() => {
    window.history.replaceState(
      createBrowserHistoryState(snapshotRef.current, window.history.state),
      '',
    )
    const onPopState = (event: PopStateEvent) => {
      const restored = readNavigationSnapshot(event.state)
      const current = snapshotRef.current
      if (restored?.navigationId === current.navigationId) {
        snapshotRef.current = restored
        setSnapshot(restored)
        return
      }
      window.history.replaceState(createBrowserHistoryState(current, event.state), '')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((destination: AppDestination) => {
    const current = snapshotRef.current
    writeHistory({ ...current, stack: [...current.stack, destination] }, 'push')
  }, [writeHistory])

  const replace = useCallback((destination: AppDestination) => {
    const current = snapshotRef.current
    writeHistory({ ...current, stack: [...current.stack.slice(0, -1), destination] }, 'replace')
  }, [writeHistory])

  const reset = useCallback((destination: AppDestination) => {
    writeHistory({ navigationId: createNavigationId(), stack: [destination] }, 'replace')
  }, [writeHistory])

  const back = useCallback(() => {
    if (snapshotRef.current.stack.length <= 1) return
    window.history.back()
  }, [])

  const stack = snapshot.stack

  return {
    destination: stack[stack.length - 1],
    canGoBack: stack.length > 1,
    navigate,
    replace,
    reset,
    back,
  }
}
