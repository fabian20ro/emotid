import { useCallback, useRef, useState } from 'react'
import type { ChainAnalysisEntry, ChainReflectionEntry } from '../data/types'

export type ChainField = 'situation' | 'noticed' | 'response' | 'outcome'
type Fields = Pick<ChainReflectionEntry, ChainField>
const EMPTY: Fields = { situation: '', noticed: '', response: '', outcome: '' }

export function useChainDraft(onSave: (entry: ChainAnalysisEntry) => Promise<void>) {
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [status, setStatus] = useState<'editing' | 'saving' | 'saved' | 'error'>('editing')
  const [error, setError] = useState<string | null>(null)
  const generation = useRef(0)
  const pending = useRef(false)

  const reset = useCallback(() => {
    generation.current += 1
    pending.current = false
    setFields(EMPTY)
    setStatus('editing')
    setError(null)
  }, [])

  const setField = useCallback((field: ChainField, value: string) => {
    if (pending.current) return
    setFields((previous) => ({ ...previous, [field]: value }))
  }, [])

  const clearSaved = async (clear: () => Promise<void>) => {
    const started = generation.current
    const committed = status === 'saving' || status === 'saved'
    await clear()
    if (committed && started === generation.current) reset()
  }

  const save = async () => {
    if (pending.current || !fields.situation.trim()) return
    const started = generation.current
    pending.current = true
    setStatus('saving')
    setError(null)
    try {
      await onSave({
        id: crypto.randomUUID(), timestamp: Date.now(), version: 2,
        situation: fields.situation.trim(), noticed: fields.noticed.trim(),
        response: fields.response.trim(), outcome: fields.outcome.trim(),
      })
      if (started === generation.current) {
        setFields(EMPTY)
        setStatus('saved')
      }
    } catch (cause) {
      if (started === generation.current) {
        setError(cause instanceof Error ? cause.message : null)
        setStatus('error')
      }
    } finally {
      if (started === generation.current) pending.current = false
    }
  }

  return { fields, status, error, setField, save, reset, clearSaved }
}

export type ChainDraft = ReturnType<typeof useChainDraft>
