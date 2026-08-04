import type { AppDestination } from './types'

const HISTORY_STATE_KEY = 'emotIdNavigation'

export interface AppNavigationSnapshot {
  navigationId: string
  stack: AppDestination[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isAppDestination(value: unknown): value is AppDestination {
  if (!isRecord(value) || typeof value.name !== 'string') return false

  switch (value.name) {
    case 'today':
    case 'explore':
    case 'journal':
    case 'arrival':
    case 'reflection':
    case 'settings':
    case 'privacy':
    case 'support':
    case 'granularity':
    case 'chain':
      return true
    case 'check-in':
      return value.route === 'body' || value.route === 'affect' || value.route === 'words' || value.route === 'plutchik'
    case 'session':
      return typeof value.sessionId === 'string'
    default:
      return false
  }
}

export function createNavigationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random()}`
}

export function createBrowserHistoryState(
  snapshot: AppNavigationSnapshot,
  currentState: unknown,
): Record<string, unknown> {
  const base = isRecord(currentState) ? currentState : {}
  return { ...base, [HISTORY_STATE_KEY]: snapshot }
}

export function readNavigationSnapshot(state: unknown): AppNavigationSnapshot | null {
  if (!isRecord(state)) return null
  const snapshot = state[HISTORY_STATE_KEY]
  if (!isRecord(snapshot) || typeof snapshot.navigationId !== 'string' || !Array.isArray(snapshot.stack)) {
    return null
  }
  if (snapshot.stack.length === 0 || !snapshot.stack.every(isAppDestination)) return null
  return {
    navigationId: snapshot.navigationId,
    stack: snapshot.stack,
  }
}
