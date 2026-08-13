import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '../data/types'

const idb = vi.hoisted(() => ({
  del: vi.fn(),
  promisifyRequest: vi.fn(),
  store: vi.fn(),
  values: vi.fn(),
}))

vi.mock('idb-keyval', () => ({
  createStore: vi.fn(() => idb.store),
  promisifyRequest: idb.promisifyRequest,
  del: idb.del,
  keys: vi.fn(),
  values: idb.values,
}))

import { deleteSession, exportSessionsJSON, saveSession } from '../data/session-repo'

const session: Session = {
  id: 'session-1',
  timestamp: 1,
  modelId: 'wheel',
  selections: [],
  results: [],
  crisisTier: 'none',
}

describe('session repository', () => {
  beforeEach(() => {
    idb.del.mockReset()
    idb.promisifyRequest.mockReset()
    idb.store.mockReset()
    idb.values.mockReset()
  })

  it('deletes only the requested session key', async () => {
    await deleteSession('session-2')

    expect(idb.del).toHaveBeenCalledOnce()
    expect(idb.del).toHaveBeenCalledWith('session-2', idb.store)
  })

  it('preserves the optional selected need', async () => {
    const sessionWithNeed: Session = {
      ...session,
      selectedNeed: 'quiet and rest',
    }
    idb.values.mockResolvedValue([sessionWithNeed])

    const exported = JSON.parse(await exportSessionsJSON()) as Session[]

    expect(exported).toHaveLength(1)
    expect(exported[0].selectedNeed).toBe('quiet and rest')
  })

  it('aborts an active session transaction when the write signal is cancelled', async () => {
    let rejectTransaction!: (error: unknown) => void
    const transactionPromise = new Promise<void>((_resolve, reject) => {
      rejectTransaction = reject
    })
    const abortError = new DOMException('This operation was aborted', 'AbortError')
    const transaction = {
      abort: vi.fn(() => rejectTransaction(abortError)),
    }
    const objectStore = {
      transaction,
      put: vi.fn(),
    }
    idb.store.mockImplementation((_mode, callback) => callback(objectStore))
    idb.promisifyRequest.mockReturnValue(transactionPromise)
    const controller = new AbortController()

    const write = saveSession(session, controller.signal)
    controller.abort()

    await expect(write).rejects.toBe(abortError)
    expect(transaction.abort).toHaveBeenCalledOnce()
    expect(objectStore.put).toHaveBeenCalledWith(session, session.id)
  })
})
