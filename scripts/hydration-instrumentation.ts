import { dirname, resolve } from 'node:path'
import type { Plugin } from 'vite'

const prefix = '\0history-hydration:'

export function hydrationInstrumentation(root: string) {
  const files = {
    'session-repo': 'src/data/session-repo.ts',
    'chain-analysis-repo': 'src/data/chain-analysis-repo.ts',
    'guarded-store': 'src/data/guarded-store.ts',
    'record-validation': 'src/data/record-validation.ts',
    useSessionHistory: 'src/hooks/useSessionHistory.ts',
    useChainAnalysis: 'src/hooks/useChainAnalysis.ts',
  }
  const owners: Record<keyof typeof files, string[]> = {
    'session-repo': ['src/hooks/useSessionHistory.ts'],
    'chain-analysis-repo': ['src/hooks/useChainAnalysis.ts'],
    'guarded-store': ['src/data/session-repo.ts', 'src/data/chain-analysis-repo.ts'],
    'record-validation': ['src/data/session-repo.ts', 'src/data/chain-analysis-repo.ts'],
    useSessionHistory: ['src/App.tsx'],
    useChainAnalysis: ['src/App.tsx'],
  }
  const seen = new Set<string>()
  return {
    name: 'test-only-history-hydration',
    enforce: 'pre',
    apply: 'build',
    configResolved(config) {
      if (config.mode !== 'history-hydration' || resolve(config.root, config.build.outDir) !== resolve(root, '.history-hydration-build')) {
        throw new Error('Hydration instrumentation requires its isolated mode and output directory')
      }
    },
    resolveId(source: string, importer?: string) {
      if (!importer || importer.startsWith(prefix)) return
      for (const [name, file] of Object.entries(files)) {
        if (resolve(dirname(importer), `${source}.ts`) === resolve(root, file)
          && owners[name as keyof typeof files].some((owner) => importer === resolve(root, owner))) {
          seen.add(name)
          return `${prefix}${name}`
        }
      }
    },
    load(id: string) {
      if (!id.startsWith(prefix)) return
      const name = id.slice(prefix.length) as keyof typeof files
      const actual = JSON.stringify(resolve(root, files[name]))
      const runtime = JSON.stringify(resolve(root, 'e2e-hydration/hydration-runtime.ts'))
      const preamble = `import * as actual from ${actual}; export * from ${actual}; import { probe, beforeRead } from ${runtime};`
      if (name === 'guarded-store') return `${preamble}
        export function createGuardedStore(database, records) {
          const store = actual.createGuardedStore(database, records);
          const name = database === 'emot-id-sessions' ? 'sessions' : 'exercises';
          return { ...store, values: () => probe.async(name, 'read', async () => { await beforeRead(name); return store.values(); }) };
        }`
      if (name === 'record-validation') return `${preamble}
        export const decodeSessions = values => probe.sync('sessions', 'decode', () => actual.decodeSessions(values));
        export const decodeChainEntries = values => probe.sync('exercises', 'decode', () => actual.decodeChainEntries(values));`
      const sessions = name === 'session-repo' || name === 'useSessionHistory'
      const store = sessions ? 'sessions' : 'exercises'
      if (name.endsWith('-repo')) {
        const method = sessions ? 'getAllSessions' : 'getAllChainAnalyses'
        return `${preamble} export const ${method} = () => probe.async('${store}', 'repository', () => actual.${method}());`
      }
      const list = sessions ? 'sessions' : 'entries'
      return `${preamble} import { useLayoutEffect } from 'react';
        export function ${name}() {
          const result = actual.${name}();
          useLayoutEffect(() => probe.committed('${store}', result.loading, result.error, result.${list}.length), [result.loading, result.error, result.${list}]);
          return result;
        }`
    },
    generateBundle() {
      const missing = Object.keys(files).filter((name) => !seen.has(name))
      if (missing.length) throw new Error(`Missing hydration boundaries: ${missing.join(', ')}`)
    },
  } satisfies Plugin
}
