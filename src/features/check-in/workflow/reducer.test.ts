import { describe, expect, it } from 'vitest'
import type { CheckInCompletion } from '../../../navigation/types'
import {
  checkInWorkflowReducer,
  INITIAL_CHECK_IN_WORKFLOW_STATE,
} from './reducer'

const completion: CheckInCompletion = {
  route: 'quick',
  modelId: 'quick-check-in',
  selections: [],
  results: [],
  crisisTier: 'none',
  temporalEscalation: false,
}

describe('checkInWorkflowReducer', () => {
  it('models disabled, saving, saved, and reset states explicitly', () => {
    const disabled = checkInWorkflowReducer(INITIAL_CHECK_IN_WORKFLOW_STATE, {
      type: 'completed',
      completion,
      saveEnabled: false,
    })
    expect(disabled).toMatchObject({
      phase: 'reflecting',
      saveState: 'disabled',
      sessionCaptured: false,
    })

    const saving = checkInWorkflowReducer(INITIAL_CHECK_IN_WORKFLOW_STATE, {
      type: 'completed',
      completion,
      saveEnabled: true,
    })
    const saved = checkInWorkflowReducer(saving, {
      type: 'base-saved',
      isLatestWrite: true,
    })
    expect(saved).toMatchObject({
      phase: 'reflecting',
      saveState: 'saved',
      sessionCaptured: true,
    })
    expect(checkInWorkflowReducer(saved, { type: 'reset' })).toEqual({
      phase: 'idle',
    })
  })

  it('does not let an older base write replace a newer write status', () => {
    const saving = checkInWorkflowReducer(INITIAL_CHECK_IN_WORKFLOW_STATE, {
      type: 'completed',
      completion,
      saveEnabled: true,
    })
    const failedNewerWrite = checkInWorkflowReducer(saving, {
      type: 'write-failed',
    })
    const olderBaseResolved = checkInWorkflowReducer(failedNewerWrite, {
      type: 'base-saved',
      isLatestWrite: false,
    })

    expect(olderBaseResolved).toMatchObject({
      saveState: 'error',
      sessionCaptured: true,
    })
  })
})
