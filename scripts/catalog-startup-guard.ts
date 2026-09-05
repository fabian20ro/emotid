import type { Plugin } from 'vite'

interface Chunk {
  fileName: string
  isEntry: boolean
  imports: string[]
  modules: Record<string, unknown>
}

export function assertCatalogDeferred(chunks: Chunk[]) {
  const byFile = new Map(chunks.map((chunk) => [chunk.fileName, chunk]))
  const seen = new Set<string>()
  function visit(chunk: Chunk) {
    if (seen.has(chunk.fileName)) return
    seen.add(chunk.fileName)
    for (const id of Object.keys(chunk.modules)) {
      if (/\/src\/models\/catalog\/index\.ts(?:\?|$)/.test(id.replaceAll('\\', '/'))) {
        throw new Error(`Full catalog on startup path: ${chunk.fileName}`)
      }
    }
    for (const imported of chunk.imports) {
      const dependency = byFile.get(imported)
      if (dependency) visit(dependency)
    }
  }
  chunks.filter((chunk) => chunk.isEntry).forEach(visit)
}

export function catalogStartupGuard(): Plugin {
  return {
    name: 'catalog-startup-guard',
    apply: 'build',
    generateBundle(_options, bundle) {
      assertCatalogDeferred(Object.values(bundle).filter((item) => item.type === 'chunk'))
    },
  }
}
