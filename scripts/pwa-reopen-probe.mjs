import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, devices, expect, webkit } from '@playwright/test'
import { generateSW } from 'workbox-build'

const repeats = Number(process.env.PWA_PROBE_REPEATS ?? 20)
assert.ok(Number.isInteger(repeats) && repeats >= 1 && repeats <= 100, 'PWA_PROBE_REPEATS must be 1..100')
const engineName = process.env.PWA_PROBE_BROWSER ?? 'webkit'
assert.ok(['webkit', 'chromium'].includes(engineName), 'PWA_PROBE_BROWSER must be webkit or chromium')
const output = '.reports/pwa-reopen-probe'
await mkdir(output, { recursive: true })
const root = await mkdtemp(join(tmpdir(), 'pwa-reopen-'))
for (const version of ['v1', 'v2']) {
  await mkdir(join(root, version))
  await generateSW({ swDest: join(root, version, 'sw.js'), globDirectory: join(root, version), globPatterns: [],
    additionalManifestEntries: [{ url: '/app/', revision: version }, { url: `/app/lazy-${version}.js`, revision: null }],
    clientsClaim: true, skipWaiting: false, cleanupOutdatedCaches: true, sourcemap: false })
}
let version = 'v1'
let offline = false
let implementation = 'cache'
let originRequests = []
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname
  originRequests.push({ path, offline })
  if (offline && path !== '/observer') { request.socket.destroy(); return }
  response.setHeader('Cache-Control', 'no-store')
  try {
    if (path === '/app/sw.js' || path.startsWith('/app/workbox-')) {
      response.setHeader('Content-Type', 'application/javascript')
      response.end(implementation === 'workbox' ? await readFile(join(root, version, path.slice('/app/'.length))) : `
        const version = '${version}';
        self.addEventListener('install', event => event.waitUntil(caches.open(version).then(cache =>
          cache.addAll(['/app/', '/app/lazy-' + version + '.js']))));
        self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys =>
          Promise.all(keys.filter(key => key !== version).map(key => caches.delete(key))))
          .then(() => self.clients.claim())));
        self.addEventListener('fetch', event => event.respondWith(caches.open(version)
          .then(cache => cache.match(event.request)).then(cached => cached || fetch(event.request))));
      `)
    } else if (path === `/app/lazy-${version}.js`) {
      response.setHeader('Content-Type', 'application/javascript')
      response.end(`export const value = '${version}';`)
    } else if (path === '/app/' || path === '/observer') {
      response.setHeader('Content-Type', 'text/html')
      response.end(`<!doctype html><body>${path === '/app/' ? version : 'observer'}</body>`)
    } else { response.writeHead(404); response.end('Not found') }
  } catch (error) { response.writeHead(500); response.end(error.message) }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await (engineName === 'webkit' ? webkit : chromium).launch()
const results = []
try {
  for (const profile of ['Desktop Safari', 'iPhone 14']) for (const worker of ['cache', 'workbox']) {
    for (let iteration = 0; iteration < repeats; iteration++) {
      version = 'v1'
      offline = false
      implementation = worker
      originRequests = []
      const context = await browser.newContext({ ...devices[profile], serviceWorkers: 'allow' })
      context.setDefaultTimeout(10_000)
      await context.tracing.start({ snapshots: true, screenshots: true })
      const row = { profile, worker, iteration, phase: 'install', failures: [], responses: [] }
      context.on('requestfailed', request => row.failures.push({ url: request.url(), error: request.failure()?.errorText }))
      context.on('response', response => row.responses.push({ url: response.url(), status: response.status(), worker: response.fromServiceWorker() }))
      try {
        const page = await context.newPage()
        await page.goto(`${base}/app/`)
        await page.evaluate(() => navigator.serviceWorker.register('/app/sw.js'))
        await expect.poll(() => page.evaluate(async () => ({
          active: (await navigator.serviceWorker.getRegistration('/app/'))?.active?.state,
          controlled: navigator.serviceWorker.controller !== null,
        }))).toEqual({ active: 'activated', controlled: true })
        const updater = await context.newPage()
        await updater.goto(`${base}/app/`)
        await updater.waitForFunction(() => navigator.serviceWorker.controller !== null)
        version = 'v2'
        await updater.evaluate(async () => (await navigator.serviceWorker.getRegistration('/app/')).update())
        await expect.poll(() => page.evaluate(async () =>
          (await navigator.serviceWorker.getRegistration('/app/'))?.waiting?.state)).toBe('installed')
        const observer = await context.newPage()
        await observer.goto(`${base}/observer`)
        await observer.evaluate(async () => {
          if (navigator.serviceWorker.controller) throw new Error('Observer must be uncontrolled')
          window.pending = (await navigator.serviceWorker.getRegistration('/app/')).waiting
        })
        offline = true
        assert.equal(await observer.evaluate(async () => {
          try { await fetch('/uncached'); return false } catch { return true }
        }), true)
        row.phase = 'old-import'
        assert.equal(await page.evaluate(async () => (await import('/app/lazy-v1.js')).value), 'v1')
        await updater.close()
        await page.close()
        await observer.waitForFunction(() => window.pending.state === 'activated')
        row.activated = await observer.evaluate(async () => ({
          state: (await navigator.serviceWorker.getRegistration('/app/')).active.state,
          paths: (await Promise.all((await caches.keys()).map(async name =>
            (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname)))).flat(),
        }))
        assert.ok(row.activated.paths.includes('/app/lazy-v2.js'))
        await observer.close()
        row.phase = 'reopen'
        const reopened = await context.newPage()
        await reopened.goto(`${base}/app/`)
        assert.equal(await reopened.locator('body').textContent(), 'v2')
        row.phase = 'new-import'
        assert.equal(await reopened.evaluate(async () => (await import('/app/lazy-v2.js')).value), 'v2')
        assert.ok(row.responses.some(response => response.url === `${base}/app/lazy-v2.js` && response.worker))
        row.outcome = 'pass'
      } catch (error) {
        row.outcome = 'fail'
        row.error = error.message
      } finally {
        row.originRequests = originRequests
        await context.tracing.stop(row.outcome === 'fail' ? { path: `${output}/${engineName}-${profile.replaceAll(' ', '-')}-${worker}-${iteration}.zip` } : {})
        await context.close()
        results.push(row)
        console.log(JSON.stringify({ profile, worker, iteration, phase: row.phase, outcome: row.outcome, error: row.error }))
      }
    }
  }
} finally {
  await browser.close()
  server.closeAllConnections()
  await new Promise(resolve => server.close(resolve))
  await rm(root, { recursive: true, force: true })
  await writeFile(`${output}/${engineName}.json`, JSON.stringify({
    platform: process.platform, architecture: process.arch, node: process.version,
    browser: engineName, browserVersion: browser.version(), results,
  }, null, 2))
}
assert.equal(results.filter(row => row.outcome === 'fail').length, 0, 'Offline reopen probe failed; inspect JSON and traces')
