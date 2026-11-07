import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test('retired catalog command refuses to overwrite curated guidance or provenance', () => {
  const root = mkdtempSync(join(tmpdir(), 'emotid-catalog-retirement-'))
  try {
    for (const directory of ['scripts', 'src/models/catalog', 'src/models/dimensional', 'src/models/somatic/data']) {
      mkdirSync(join(root, directory), { recursive: true })
    }
    cpSync(new URL('./extract-catalog.cjs', import.meta.url), join(root, 'scripts/extract-catalog.cjs'))
    const catalog = join(root, 'src/models/catalog')
    const original = JSON.stringify({ calm: { id: 'calm', label: { en: 'Calm', ro: 'Calm' },
      guidance: { status: 'reviewed', needId: null, provenance: 'reviewed-fixture' } } })
    writeFileSync(join(catalog, 'positive.json'), original)
    writeFileSync(join(root, 'src/models/dimensional/overlay.json'), '{}')
    writeFileSync(join(root, 'src/models/safety-rules.json'), '{"highDistressIds":[]}')
    const result = spawnSync(process.execPath, ['scripts/extract-catalog.cjs'], { cwd: root, encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /retired.*catalog-guidance-review/i)
    assert.deepEqual(readdirSync(catalog), ['positive.json'])
    assert.equal(readFileSync(join(catalog, 'positive.json'), 'utf8'), original)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
