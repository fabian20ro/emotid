import { describe, expect, it } from 'vitest'
import { hydrationInstrumentation } from '../../scripts/hydration-instrumentation'

describe('test-only hydration instrumentation', () => {
  const root = '/fixture'
  it('wraps only the real hydration import boundaries, never its own implementation imports', () => {
    const plugin = hydrationInstrumentation(root)
    expect(plugin.resolveId('../data/session-repo', `${root}/src/hooks/useSessionHistory.ts`)).toBe('\0history-hydration:session-repo')
    expect(plugin.resolveId('./session-repo', `${root}/src/data/user-data.ts`)).toBeUndefined()
    expect(plugin.resolveId('/fixture/src/data/session-repo.ts', '\0history-hydration:session-repo')).toBeUndefined()
    expect(plugin.resolveId('./hooks/useChainAnalysis', `${root}/src/App.tsx`)).toBe('\0history-hydration:useChainAnalysis')
  })
  it('refuses a publishable output directory or an ordinary production mode', () => {
    const plugin = hydrationInstrumentation(root)
    expect(() => plugin.configResolved({ root, mode: 'production', build: { outDir: '.history-hydration-build' } } as never)).toThrow()
    expect(() => plugin.configResolved({ root, mode: 'history-hydration', build: { outDir: 'dist' } } as never)).toThrow()
    expect(() => plugin.configResolved({ root, mode: 'history-hydration', build: { outDir: '.history-hydration-build' } } as never)).not.toThrow()
  })
  it('fails the build when a measured import boundary disappears', () => {
    const plugin = hydrationInstrumentation(root)
    expect(() => plugin.generateBundle()).toThrow(/Missing hydration boundaries/)
  })
})
