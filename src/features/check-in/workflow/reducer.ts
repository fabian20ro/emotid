import type { CheckInCompletion, SessionSaveState } from '../../../navigation/types'

export type CheckInWorkflowState =
  | { phase: 'idle' }
  | {
    phase: 'reflecting'
    completion: CheckInCompletion
    saveState: SessionSaveState
    sessionCaptured: boolean
  }

export type CheckInWorkflowAction =
  | { type: 'reset' }
  | { type: 'completed'; completion: CheckInCompletion; saveEnabled: boolean }
  | { type: 'save-started' }
  | { type: 'base-saved'; isLatestWrite: boolean }
  | { type: 'write-succeeded' }
  | { type: 'write-failed' }

export const INITIAL_CHECK_IN_WORKFLOW_STATE: CheckInWorkflowState = { phase: 'idle' }

export function checkInWorkflowReducer(
  state: CheckInWorkflowState,
  action: CheckInWorkflowAction,
): CheckInWorkflowState {
  if (action.type === 'reset') return INITIAL_CHECK_IN_WORKFLOW_STATE
  if (action.type === 'completed') {
    return {
      phase: 'reflecting',
      completion: action.completion,
      saveState: action.saveEnabled ? 'saving' : 'disabled',
      sessionCaptured: false,
    }
  }
  if (state.phase !== 'reflecting') return state

  switch (action.type) {
    case 'save-started':
      return { ...state, saveState: 'saving' }
    case 'base-saved':
      return {
        ...state,
        sessionCaptured: true,
        saveState: action.isLatestWrite ? 'saved' : state.saveState,
      }
    case 'write-succeeded':
      return { ...state, sessionCaptured: true, saveState: 'saved' }
    case 'write-failed':
      return { ...state, saveState: 'error' }
    default:
      return state
  }
}
