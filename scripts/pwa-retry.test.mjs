import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

test('PWA lifecycle recovers on a real retry after the server switched to v2', { timeout: 240_000 }, () => {
  const result = spawnSync(process.execPath, [
    'node_modules/playwright/cli.js', 'test', '--config=playwright.pwa.config.ts',
    '--grep=offline reopen', '--retries=1', '--trace=on', '--reporter=json',
    '--output=test-results/pwa-retry',
  ], {
    env: { ...process.env, PWA_TEST_INJECT_FAILURE: 'true' },
    encoding: 'utf8', timeout: 230_000, maxBuffer: 10 * 1024 * 1024,
  })
  mkdirSync('.reports', { recursive: true })
  writeFileSync('.reports/pwa-retry.json', result.stdout ?? '')
  assert.equal(result.status, 0, result.stderr)
  const report = JSON.parse(result.stdout)
  const tests = (suite) => [...(suite.specs ?? []).flatMap((spec) => spec.tests), ...(suite.suites ?? []).flatMap(tests)]
  const cases = report.suites.flatMap(tests)
  assert.equal(cases.length, 1)
  assert.deepEqual(cases[0].results.map((attempt) => attempt.status), ['failed', 'passed'])
  assert.match(cases[0].results[0].error.message, /Synthetic failure after switching the test server to v2/)
  const trace = cases[0].results[0].attachments.find((attachment) => attachment.name === 'trace')
  assert.ok(trace?.path && existsSync(trace.path), 'retain the first-attempt trace')
  assert.equal(report.stats.unexpected, 0)
  assert.equal(report.stats.flaky, 1, 'only the deliberate first failure is expected')
})
