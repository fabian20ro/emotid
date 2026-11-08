import { expect, it } from 'vitest'
import { summarizeMeasurements } from '../../e2e-performance/history-measurements'

it('reports median and nearest-rank p95 without mutating samples', () => {
  const values = [30, 10, 20, 40]
  expect(summarizeMeasurements(values)).toEqual({ samples: 4, min: 10, median: 25, p95: 40, max: 40 })
  expect(values).toEqual([30, 10, 20, 40])
})
it('does not turn unavailable measurements into zero', () => {
  expect(summarizeMeasurements([])).toBeNull()
  expect(summarizeMeasurements([0])).toEqual({ samples: 1, min: 0, median: 0, p95: 0, max: 0 })
})
it.each([NaN, Infinity, -1])('rejects invalid timings rather than hiding them: %s', (value) => {
  expect(() => summarizeMeasurements([value])).toThrow()
})
