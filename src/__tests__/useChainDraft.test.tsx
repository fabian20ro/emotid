import { act, renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useChainDraft } from '../hooks/useChainDraft'

it.each(['resolve', 'reject'] as const)('ignores late %s after a destructive reset', async (outcome) => {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const save = vi.fn(() => new Promise<void>((pass, fail) => { resolve = pass; reject = fail }))
  const { result } = renderHook(() => useChainDraft(save))
  act(() => result.current.setField('situation', 'Old draft'))
  let pending!: Promise<void>
  act(() => { pending = result.current.save(); void result.current.save() })
  expect(save).toHaveBeenCalledOnce()
  act(() => result.current.setField('situation', 'Blocked edit'))
  expect(result.current.fields.situation).toBe('Old draft')
  act(() => result.current.reset())
  act(() => result.current.setField('situation', 'New draft'))
  await act(async () => { if (outcome === 'resolve') resolve(); else reject(new Error('old failure')); await pending })
  expect(result.current.status).toBe('editing')
  expect(result.current.fields.situation).toBe('New draft')
  expect(result.current.error).toBeNull()
})

it('retains a failed draft for retry and clears it only after successful save', async () => {
  const save = vi.fn().mockRejectedValueOnce(new Error('disk')).mockResolvedValue(undefined)
  const { result } = renderHook(() => useChainDraft(save))
  act(() => result.current.setField('situation', 'Keep this'))
  await act(() => result.current.save())
  expect(result.current.status).toBe('error')
  expect(result.current.fields.situation).toBe('Keep this')
  await act(() => result.current.save())
  expect(result.current.status).toBe('saved')
  expect(result.current.fields.situation).toBe('')
})

it('keeps an unsaved draft when deleting only saved history', async () => {
  const { result } = renderHook(() => useChainDraft(vi.fn()))
  act(() => result.current.setField('situation', 'Unrelated draft'))
  await act(() => result.current.clearSaved(async () => {}))
  expect(result.current.fields.situation).toBe('Unrelated draft')
})

it('preserves the saved state when history erasure fails', async () => {
  const { result } = renderHook(() => useChainDraft(vi.fn().mockResolvedValue(undefined)))
  act(() => result.current.setField('situation', 'Saved record'))
  await act(() => result.current.save())
  await act(async () => {
    await expect(result.current.clearSaved(async () => { throw new Error('disk') })).rejects.toThrow('disk')
  })
  expect(result.current.status).toBe('saved')
})
