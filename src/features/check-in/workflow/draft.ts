import { createContext, useContext, useLayoutEffect, useState } from 'react'
import type { BaseEmotion, ModelState } from '../../../models/types'
import type { ReflectionAnswer } from '../../../navigation/types'

interface DraftFields {
  selections: BaseEmotion[]
  modelState: ModelState
  wordPath: BaseEmotion[]
  wordHistory: { emotions: BaseEmotion[]; selections: BaseEmotion[]; state: ModelState }[]
  wordComparison: { selected: BaseEmotion; siblings: BaseEmotion[] } | null
  placement: { valence: number; arousal: number } | null
  fit: ReflectionAnswer | undefined
}

export function createCheckInDraft() {
  const fields: Partial<DraftFields> = {}
  return {
    has: (key: keyof DraftFields) => key in fields,
    get: <K extends keyof DraftFields>(key: K) => fields[key],
    set: <K extends keyof DraftFields>(key: K, value: DraftFields[K]) => { fields[key] = value },
  }
}
export type CheckInDraft = ReturnType<typeof createCheckInDraft>
export const CheckInDraftContext = createContext<CheckInDraft | null>(null)

// One workflow-owned draft survives route unmounts, but never crosses a new check-in.
export function useDraftState<K extends keyof DraftFields>(key: K, initial: DraftFields[K] | (() => DraftFields[K])) {
  const draft = useContext(CheckInDraftContext)
  const [value, setValue] = useState<DraftFields[K]>(() => {
    if (draft?.has(key)) return draft.get(key) as DraftFields[K]
    return typeof initial === 'function' ? initial() : initial
  })
  useLayoutEffect(() => {
    draft?.set(key, value)
  }, [draft, key, value])
  return [value, setValue] as const
}
