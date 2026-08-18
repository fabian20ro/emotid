import assert from 'node:assert/strict'
import test from 'node:test'

import { validateReleaseConsistency } from './check-release-consistency.mjs'

function validFixture(overrides = {}) {
  return {
    packageJson: JSON.stringify({ name: 'emotid', version: '0.1.3' }),
    packageLockJson: JSON.stringify({
      name: 'emotid',
      version: '0.1.3',
      packages: { '': { name: 'emotid', version: '0.1.3' } },
    }),
    readme: 'Current release: **[v0.1.3](https://github.com/fabian20ro/emotid/releases/tag/v0.1.3)**',
    plan: 'release scope in `docs/releases/v0.1.3.md`.',
    releaseNotes: [
      { filename: 'v0.1.2.md', content: '# Emot-ID v0.1.2\n' },
      { filename: 'v0.1.3.md', content: '# Emot-ID v0.1.3\n' },
    ],
    ...overrides,
  }
}

function errorCodes(fixture) {
  return validateReleaseConsistency(fixture).map(({ code }) => code)
}

test('accepts one consistent release identity', () => {
  assert.deepEqual(validateReleaseConsistency(validFixture()), [])
})

test('compares release-note versions numerically', () => {
  const fixture = validFixture({
    packageJson: JSON.stringify({ name: 'emotid', version: '0.1.10' }),
    packageLockJson: JSON.stringify({
      name: 'emotid',
      version: '0.1.10',
      packages: { '': { name: 'emotid', version: '0.1.10' } },
    }),
    readme: 'Current release: **[v0.1.10](https://github.com/fabian20ro/emotid/releases/tag/v0.1.10)**',
    plan: 'release scope in `docs/releases/v0.1.10.md`.',
    releaseNotes: [
      { filename: 'v0.1.9.md', content: '# Emot-ID v0.1.9\n' },
      { filename: 'v0.1.10.md', content: '# Emot-ID v0.1.10\n' },
    ],
  })

  assert.deepEqual(validateReleaseConsistency(fixture), [])
})

test('reports package and lockfile identity drift independently', () => {
  assert.deepEqual(errorCodes(validFixture({
    packageJson: JSON.stringify({ name: 'emotid', version: 'next' }),
  })), ['INVALID_PACKAGE_VERSION'])

  assert.deepEqual(errorCodes(validFixture({
    packageLockJson: JSON.stringify({
      name: 'emotid',
      version: '0.1.2',
      packages: { '': { name: 'emotid', version: '0.1.3' } },
    }),
  })), ['PACKAGE_LOCK_VERSION_MISMATCH'])

  assert.deepEqual(errorCodes(validFixture({
    packageLockJson: JSON.stringify({
      name: 'emotid',
      version: '0.1.3',
      packages: { '': { name: 'emotid', version: '0.1.2' } },
    }),
  })), ['PACKAGE_LOCK_ROOT_VERSION_MISMATCH'])
})

test('reports README release-link drift', () => {
  assert.deepEqual(errorCodes(validFixture({
    readme: 'Current release: **[v0.1.2](https://github.com/fabian20ro/emotid/releases/tag/v0.1.2)**',
  })), ['README_RELEASE_MISMATCH'])
})

test('reports latest release-note identity and title drift', () => {
  assert.deepEqual(errorCodes(validFixture({
    releaseNotes: [
      { filename: 'v0.1.3.md', content: '# Emot-ID v0.1.3\n' },
      { filename: 'v0.1.4.md', content: '# Emot-ID v0.1.4\n' },
    ],
  })), ['LATEST_RELEASE_NOTE_MISMATCH'])

  assert.deepEqual(errorCodes(validFixture({
    releaseNotes: [
      { filename: 'v0.1.3.md', content: '# Emot-ID release 0.1.3\n' },
    ],
  })), ['LATEST_RELEASE_NOTE_TITLE_MISMATCH'])
})

test('reports maintenance-plan release-scope drift', () => {
  assert.deepEqual(errorCodes(validFixture({
    plan: 'release scope in `docs/releases/v0.1.2.md`.',
  })), ['PLAN_RELEASE_SCOPE_MISMATCH'])
})

test('fails clearly when required JSON cannot be parsed', () => {
  assert.deepEqual(errorCodes(validFixture({ packageJson: '{' })), ['INVALID_PACKAGE_JSON'])
  assert.deepEqual(errorCodes(validFixture({ packageLockJson: '{' })), ['INVALID_PACKAGE_LOCK_JSON'])
})

test('reports valid JSON with the wrong root shape without crashing', () => {
  assert.deepEqual(errorCodes(validFixture({ packageJson: 'null' })), ['INVALID_PACKAGE_VERSION'])
  assert.deepEqual(errorCodes(validFixture({ packageLockJson: 'null' })), [
    'PACKAGE_LOCK_VERSION_MISMATCH',
    'PACKAGE_LOCK_ROOT_VERSION_MISMATCH',
  ])
})
