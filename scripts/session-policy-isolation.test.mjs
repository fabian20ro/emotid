import assert from 'node:assert/strict'
import { it } from 'node:test'
import { build } from 'vite'

for (const [name, entries] of [
  ['Journal analytics', ['src/data/vocabulary.ts', 'src/data/valence-ratio.ts', 'src/data/journal-evidence.ts']],
  ['session serialization', ['src/data/session.ts']],
]) it(`bundles ${name} without model or presentation runtime dependencies`, async () => {
  const bundle = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      minify: false,
      lib: { entry: entries, formats: ['es'] },
    },
  })
  const modules = (Array.isArray(bundle) ? bundle : [bundle]).flatMap((output) =>
    'output' in output ? output.output.flatMap((chunk) => chunk.type === 'chunk' ? Object.keys(chunk.modules) : []) : [],
  ).map((id) => id.replaceAll('\\', '/'))
  for (const entry of entries) assert.ok(modules.some((id) => id.endsWith(`/${entry}`)))
  assert.deepEqual(modules.filter((id) => id.includes('/src/models/') || id.endsWith('/session-presentation.ts')), [])
})
