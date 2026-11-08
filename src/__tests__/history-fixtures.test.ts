import { expect, it } from 'vitest'
import { makeHistoryFixture, assertLocalHistoryTarget } from '../../e2e-performance/history-fixtures'
import { decodeSessions, decodeChainEntries } from '../data/record-validation'
import { computeVocabulary } from '../data/vocabulary'

it('builds deterministic, valid mixed histories without real user content', () => {
  const data = makeHistoryFixture(100)
  expect(data).toEqual(makeHistoryFixture(100))
  expect(decodeSessions(data.sessions)).toEqual(data.sessions)
  expect(decodeChainEntries(data.chainEntries)).toEqual(data.chainEntries)
  expect(new Set(data.sessions.map((entry) => entry.id)).size).toBe(100)
  expect(data.chainEntries).toHaveLength(100)
  expect(data.sessions[0].timestamp).toBeGreaterThan(data.sessions[99].timestamp)
  expect(computeVocabulary(data.sessions).totalSessions).toBe(51)
  expect(data.sessions[5]).toMatchObject({ outcome: 'body-observation', results: [] })
  expect(data.chainEntries[0]).toMatchObject({ situation: 'Synthetic moment 00000' })
})

it.each([1000, 5000])('creates all %i records without truncating either store', (count) => {
  const data = makeHistoryFixture(count)
  expect(decodeSessions(data.sessions)).toHaveLength(count)
  expect(decodeChainEntries(data.chainEntries)).toHaveLength(count)
})

it.each([-1, 1.5, 5001, NaN])('rejects an unsupported fixture size: %s', (count) => {
  expect(() => makeHistoryFixture(count)).toThrow()
})

it.each(['https://fabian20ro.github.io/emotid/', 'http://localhost.evil.test/', 'file:///tmp/app', 'http://user@localhost/', 'http://127.0.0.2/'])('refuses non-local or credentialed benchmark targets: %s', (url) => {
  expect(() => assertLocalHistoryTarget(url)).toThrow()
})

it.each(['http://127.0.0.1:4175/emotid/', 'http://localhost:5173/emotid/', 'http://[::1]:4175/emotid/'])('permits explicit loopback: %s', (url) => {
  expect(() => assertLocalHistoryTarget(url)).not.toThrow()
})
