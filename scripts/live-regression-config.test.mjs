import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

function listTests(url) {
  const env = { ...process.env }
  delete env.DEPLOYED_BASE_URL
  if (url !== undefined) env.DEPLOYED_BASE_URL = url
  return spawnSync(process.execPath, [
    'node_modules/playwright/cli.js', 'test', '--config=playwright.live.config.ts', '--list',
  ], { env, encoding: 'utf8', timeout: 30_000 })
}

for (const url of [undefined, '', '/emotid/', 'file:///tmp/emotid/', 'https://user:password@example.com/', 'https://example.com/?target=other', 'https://example.com/#other']) {
  test(`rejects unsafe or implicit live target: ${url}`, () => {
    const result = listTests(url)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /DEPLOYED_BASE_URL must be an explicit HTTP\(S\) URL without credentials, query or hash/)
  })
}

test('discovers only the bounded storage and PWA matrix without starting browsers or a server', () => {
  const result = listTests('https://example.com/emotid')
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /Total: 24 tests in 3 files/)
  for (const project of ['storage-chromium', 'storage-webkit', 'pwa-chromium', 'pwa-webkit']) {
    assert.ok(result.stdout.includes(`[${project}]`))
  }
})
