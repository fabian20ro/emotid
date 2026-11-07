import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { parse } from 'yaml'

const readYaml = (path) => parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const deploy = readYaml('../.github/workflows/deploy.yml')

test('only main can publish and only the deploy job has write permission', () => {
  const mainOnly = "github.ref == 'refs/heads/main' && github.event_name != 'pull_request'"
  assert.deepEqual(deploy.permissions, { contents: 'read' })
  for (const name of ['deploy', 'deployed-smoke']) assert.equal(deploy.jobs[name].if, mainOnly)
  for (const step of deploy.jobs.build.steps.filter((step) => /actions\/(configure-pages|upload-pages-artifact)@/.test(step.uses ?? ''))) {
    assert.equal(step.if, mainOnly)
  }
  assert.deepEqual(deploy.jobs.deploy.permissions, { contents: 'read', pages: 'write', 'id-token': 'write' })
  for (const [name, job] of Object.entries(deploy.jobs)) {
    if (name !== 'deploy') assert.ok(!Object.values(job.permissions ?? {}).includes('write'))
  }
})

test('only superseded PR runs may cancel in-progress work; publication stays serialized through smoke', () => {
  assert.equal(deploy.concurrency['cancel-in-progress'], "${{ github.event_name == 'pull_request' }}")
  assert.equal(deploy.concurrency.group, 'pages-${{ github.ref }}')
  assert.equal(deploy.jobs.deploy.needs, 'build')
  assert.equal(deploy.jobs['deployed-smoke'].needs, 'deploy')
  assert.equal(deploy.jobs.deploy.concurrency, undefined)
  assert.equal(deploy.jobs['deployed-smoke'].concurrency, undefined)
})

test('every workflow action is immutable and has a weekly update path', () => {
  for (const file of readdirSync(new URL('../.github/workflows/', import.meta.url))) {
    const workflow = readYaml(`../.github/workflows/${file}`)
    for (const job of Object.values(workflow.jobs)) for (const step of job.steps ?? []) {
      if (step.uses) assert.match(step.uses, /^[\w-]+\/[\w/-]+@[a-f0-9]{40}$/, `${file}: ${step.uses}`)
    }
  }
  const dependabot = readYaml('../.github/dependabot.yml')
  assert.equal(dependabot.version, 2)
  assert.ok(dependabot.updates.some((update) => update['package-ecosystem'] === 'github-actions'
    && update.directory === '/' && update.schedule.interval === 'weekly'))
})

test('CI retains the deliberate first-failure trace even when retry verification succeeds', () => {
  const steps = deploy.jobs.build.steps
  const retry = steps.findIndex((step) => step.run === 'npm run test:pwa:retry')
  assert.ok(retry >= 0)
  const upload = steps.findIndex((step) => step.with?.name === 'pwa-retry-evidence')
  assert.ok(upload > retry)
  assert.equal(steps[upload].if, 'always()')
  assert.match(steps[upload].uses, /^actions\/upload-artifact@/)
  assert.deepEqual(steps[upload].with.path.trim().split('\n'), ['.reports/pwa-retry.json', 'test-results/pwa-retry/'])
  assert.equal(steps[upload].with['include-hidden-files'], true)
})
