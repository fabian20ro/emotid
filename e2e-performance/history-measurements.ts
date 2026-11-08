export function summarizeMeasurements(values: readonly number[]) {
  if (values.some((value) => !Number.isFinite(value) || value < 0)) throw new Error('Measurements must be finite and nonnegative')
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return { samples: sorted.length, min: sorted[0],
    median: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1], max: sorted[sorted.length - 1] }
}
