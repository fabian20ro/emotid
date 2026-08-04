import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '../data/types'

const idb = vi.hoisted(() => ({
  del: vi.fn(),
  store: {},
  values: vi.fn(),
}))

vi.mock('idb-keyval', () => ({
  createStore: vi.fn(() => idb.store),
  set: vi.fn(),
  del: idb.del,
  keys: vi.fn(),
  values: idb.values,
}))

import { deleteSession, exportSessionsJSON } from '../data/session-repo'

describe('session repository', () => {
  beforeEach(() => {
    idb.del.mockReset()
    idb.values.mockReset()
  })

  it('deletes only the requested session key', async () => {
    await deleteSession('session-2')

    expect(idb.del).toHaveBeenCalledOnce()
    expect(idb.del).toHaveBeenCalledWith('session-2', idb.store)
  })

  it('preserves the optional selected need', async () => {
    const session: Session = {
      id: 'session-1',
      timestamp: 1,
      modelId: 'wheel',
      selections: [],
      results: [],
      crisisTier: 'none',
      selectedNeed: 'quiet and rest',
    }
    idb.values.mockResolvedValue([session])

    const exported = JSON.parse(await exportSessionsJSON()) as Session[]

    expect(exported).toHaveLength(1)
    expect(exported[0].selectedNeed).toBe('quiet and rest')
  })
})
