import { execFileSync, spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'

const candidateArg = process.argv.find((value) => value.startsWith('--candidate-url='))?.split('=')[1]
const rawCandidateUrl = candidateArg ?? process.env.PHYSICAL_CANDIDATE_URL ?? 'https://fabian20ro.github.io/emotid/'
const CANDIDATE_URL = new URL(rawCandidateUrl.endsWith('/') ? rawCandidateUrl : `${rawCandidateUrl}/`).href
const CDP_URL = 'http://127.0.0.1:9222'
const WEBAPK_PACKAGE = 'org.chromium.webapk.a43b49e294110560b_v2'
const mode = process.argv.find((value) => value.startsWith('--mode='))?.split('=')[1] ?? 'browser'
const suite = process.argv.find((value) => value.startsWith('--suite='))?.split('=')[1] ?? 'all'
const journeyFilter = process.argv.find((value) => value.startsWith('--journey='))?.split('=')[1]?.toLowerCase()

if (!['browser', 'installed'].includes(mode)) throw new Error(`Unsupported mode: ${mode}`)
if (!['all', 'journeys', 'performance'].includes(suite)) throw new Error(`Unsupported suite: ${suite}`)
if (journeyFilter && !/^j[1-9]$/.test(journeyFilter)) throw new Error(`Unsupported journey: ${journeyFilter}`)

const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
const outputDir = path.resolve('.reports', 'android-physical', `${stamp}-${mode}`)
await mkdir(outputDir, { recursive: true })

function adb(...args) {
  return execFileSync('adb', args, { encoding: 'utf8' }).trim()
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function withTimeout(promise, timeoutMs, description) {
  let timeout
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`${description} timed out`)), timeoutMs)
      }),
    ])
  } finally {
    clearTimeout(timeout)
  }
}

async function expectVisible(locator, description) {
  await locator.waitFor({ state: 'visible', timeout: 15_000 })
  assert(await locator.isVisible(), `${description} is not visible`)
}

async function activate(locator) {
  await locator.waitFor({ state: 'visible', timeout: 15_000 })
  await locator.evaluate((element) => element.click())
}

async function pressElement(locator, key) {
  await locator.evaluate((element, pressedKey) => {
    element.dispatchEvent(new KeyboardEvent('keydown', { key: pressedKey, bubbles: true }))
    element.dispatchEvent(new KeyboardEvent('keyup', { key: pressedKey, bubbles: true }))
  }, key)
}

async function launchMode() {
  if (mode === 'installed') {
    adb('shell', 'am', 'force-stop', WEBAPK_PACKAGE)
    adb('shell', 'monkey', '-p', WEBAPK_PACKAGE, '-c', 'android.intent.category.LAUNCHER', '1')
  } else {
    adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', CANDIDATE_URL, 'com.android.chrome')
  }
}

function assertDeviceReady() {
  const trustState = adb('shell', 'dumpsys', 'trust')
  assert(trustState.includes('deviceLocked=0'), 'Unlock the Android device before starting the physical audit')
  if (suite !== 'journeys') {
    const services = adb('shell', 'settings', 'get', 'secure', 'enabled_accessibility_services')
    assert(!services.includes('talkback'), 'Disable TalkBack before collecting physical performance evidence')
  }
}

async function findPage(browser) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    for (const context of [...browser.contexts()].reverse()) {
      for (const page of [...context.pages()].reverse()) {
        if (!page.url().startsWith(CANDIDATE_URL)) continue
        const standalone = await page.evaluate(() => matchMedia('(display-mode: standalone)').matches)
        if ((mode === 'installed') === standalone) return page
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`No ${mode} candidate page exposed over Chrome DevTools`)
}

async function connectBrowser() {
  let lastError
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      return await chromium.connectOverCDP(CDP_URL)
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }
  throw lastError
}

async function resetState(page, language, onboarded = true) {
  const storagePage = new URL('manifest.webmanifest', CANDIDATE_URL)
  storagePage.searchParams.set('physical-audit-storage', Date.now().toString())
  await page.goto(storagePage.href, { waitUntil: 'domcontentloaded', timeout: 15_000 })
  const session = await page.context().newCDPSession(page)
  const origin = new URL(CANDIDATE_URL).origin
  await session.send('Storage.clearDataForOrigin', {
    origin,
    storageTypes: 'indexeddb,local_storage',
  })
  await session.detach()
  await page.evaluate(({ selectedLanguage, hasOnboarded }) => {
    localStorage.setItem('emot-id-language', selectedLanguage)
    localStorage.setItem('emot-id-save-sessions', 'true')
    localStorage.setItem('emot-id-theme', 'light')
    localStorage.setItem('emot-id-allow-external-ai', 'true')
    if (hasOnboarded) localStorage.setItem('emot-id-onboarded', 'true')
  }, { selectedLanguage: language, hasOnboarded: onboarded })
  const auditUrl = new URL(CANDIDATE_URL)
  auditUrl.searchParams.set('physical-audit', `${language}-${onboarded ? 'returning' : 'first-run'}-${Date.now()}`)
  await page.goto(auditUrl.href, { waitUntil: 'commit', timeout: 15_000 })
  await new Promise((resolve) => setTimeout(resolve, 1_200))
  await page.waitForFunction(() => document.readyState !== 'loading', null, { timeout: 15_000 })
}

async function captureAx(page, name) {
  const session = await page.context().newCDPSession(page)
  const { nodes } = await session.send('Accessibility.getFullAXTree')
  await session.detach()
  const simplified = nodes
    .filter((node) => !node.ignored)
    .map((node) => ({
      role: node.role?.value,
      name: node.name?.value,
      focused: node.properties?.some((property) => property.name === 'focused' && property.value?.value),
    }))
    .filter((node) => node.role || node.name)
  await writeFile(path.join(outputDir, `${name}-ax.json`), `${JSON.stringify(simplified, null, 2)}\n`)
}

async function capture(page, name) {
  const deviceShot = execFileSync('adb', ['exec-out', 'screencap', '-p'], {
    maxBuffer: 10 * 1024 * 1024,
    timeout: 10_000,
  })
  await writeFile(path.join(outputDir, `${name}-device.png`), deviceShot)
  await withTimeout(captureAx(page, name), 10_000, `${name} accessibility capture`)
    .catch((error) => console.error(`[${mode}] ${name} accessibility capture warning: ${error}`))
}

async function openArrival(page) {
  await activate(page.getByRole('button', { name: /start a check-in|începeți o verificare/i }))
  await expectVisible(page.getByTestId('arrival-screen'), 'Arrival')
}

async function finishQuick(page, emotion = 'anxiety') {
  await activate(page.getByTestId(`quick-feeling-${emotion}`))
  await activate(page.getByTestId('quick-continue'))
  await expectVisible(page.getByTestId('reflection-screen'), 'Reflection')
  await activate(page.getByRole('button', { name: /done for now|gata pentru acum/i }))
  await expectVisible(page.getByTestId('today-screen'), 'Today')
}

async function runJourneys(page) {
  const results = []
  for (const language of ['en', 'ro']) {
    const run = async (id, execute) => {
      if (journeyFilter && journeyFilter !== id) return
      const name = `${language}-${id}`
      console.log(`[${mode}] ${language.toUpperCase()} ${id.toUpperCase()} start`)
      try {
        await execute()
        await capture(page, name)
        results.push({ language, journey: id.toUpperCase(), result: 'SUPPORTING_PASS' })
        console.log(`[${mode}] ${language.toUpperCase()} ${id.toUpperCase()} supporting pass`)
      } catch (error) {
        await capture(page, `${name}-failure`).catch(() => {})
        results.push({ language, journey: id.toUpperCase(), result: 'FAIL', error: String(error) })
        console.error(`[${mode}] ${language.toUpperCase()} ${id.toUpperCase()} fail: ${error}`)
      }
    }

    await run('j1', async () => {
      await resetState(page, language, false)
      const dialog = page.getByRole('dialog')
      await expectVisible(dialog, 'First-run dialog')
      for (const expectedStep of ['1', '2', '3']) {
        const heading = dialog.getByRole('heading', { level: 1 })
        assert(await heading.evaluate((element) => element === document.activeElement), `J1 step ${expectedStep} heading lacks focus`)
        assert(await dialog.getByRole('progressbar').getAttribute('aria-valuenow') === expectedStep, `J1 progress is not ${expectedStep}`)
        if (expectedStep !== '3') await activate(dialog.locator('.primary-button'))
      }
      const languageGroup = dialog.locator('.onboarding-language')
      await expectVisible(languageGroup, 'Language choice')
      await activate(dialog.locator('.primary-button'))
      await expectVisible(page.getByTestId('today-screen'), 'Today after onboarding')
    })

    await run('j2', async () => {
      await resetState(page, language)
      await activate(page.getByRole('button', { name: /settings|setări/i }))
      await activate(page.getByRole('button', { name: /replay introduction|reluați introducerea/i }))
      const dialog = page.getByRole('dialog')
      await expectVisible(dialog, 'Replayed introduction')
      assert(await page.locator('.app-shell').getAttribute('inert') !== null, 'J2 background is not inert')
      await activate(page.getByRole('button', { name: /close introduction|închideți introducerea/i }))
      const replay = page.getByRole('button', { name: /replay introduction|reluați introducerea/i })
      assert(await replay.evaluate((element) => element === document.activeElement), 'J2 focus did not return to replay trigger')
    })

    await run('j3', async () => {
      await resetState(page, language)
      await openArrival(page)
      await activate(page.getByTestId('arrival-affect'))
      const field = page.locator('.dimensional-plot-svg')
      await expectVisible(field, 'Affect field')
      await field.focus()
      await pressElement(field, 'ArrowLeft')
      await pressElement(field, 'ArrowUp')
      const suggestion = page.locator('.dimensional-suggestion-chip').first()
      await expectVisible(suggestion, 'Affect suggestion')
      await activate(suggestion)
      await activate(page.locator('.route-action button'))
      await expectVisible(page.getByTestId('reflection-screen'), 'Affect reflection')
    })

    await run('j4', async () => {
      await resetState(page, language)
      await openArrival(page)
      await activate(page.getByTestId('arrival-body'))
      await activate(page.getByRole('button', { name: /list|listă/i, exact: true }))
      const region = page.locator('.body-region-list button').first()
      await activate(region)
      await activate(page.locator('.body-choice-grid button').first())
      await activate(page.locator('.body-intensity-list button').nth(1))
      const signal = page.locator('[data-testid^="body-signal-"]').first()
      await expectVisible(signal, 'Saved body signal')
      assert(await signal.evaluate((element) => element === document.activeElement), 'J4 saved signal lacks focus')
      await expectVisible(page.getByTestId('body-evidence-note'), 'Body evidence note')
      await activate(page.locator('.route-action button'))
      await expectVisible(page.getByTestId('reflection-screen'), 'Body reflection')
    })

    await run('j5', async () => {
      await resetState(page, language)
      await openArrival(page)
      await activate(page.getByTestId('arrival-words'))
      await activate(page.locator('.word-options button').first())
      await activate(page.locator('.word-options button').first())
      const direct = page.locator('.word-stop-choice .primary-button')
      assert(await direct.evaluate((element) => element === document.activeElement), 'J5 direct completion lacks focus')
      assert(Boolean(await direct.getAttribute('aria-describedby')), 'J5 direct completion lacks specificity description')
      await activate(direct)
      await expectVisible(page.getByTestId('reflection-screen'), 'Word reflection')
    })

    await run('j6', async () => {
      await resetState(page, language)
      await page.evaluate(() => {
        const originalPut = IDBObjectStore.prototype.put
        let attempts = 0
        IDBObjectStore.prototype.put = function put(value, key) {
          attempts += 1
          if (attempts === 2) throw new DOMException('Simulated local save failure', 'QuotaExceededError')
          return originalPut.call(this, value, key)
        }
      })
      await activate(page.getByTestId('quick-feeling-anxiety'))
      await activate(page.getByTestId('quick-continue'))
      await activate(page.getByRole('button', { name: /done for now|gata pentru acum/i }))
      const alert = page.getByRole('alert')
      await expectVisible(alert, 'Save failure alert')
      assert(await alert.count() === 1, 'J6 failure is announced more than once')
      const retry = page.locator('.save-error-actions button').first()
      await activate(retry)
      await expectVisible(page.getByTestId('today-screen'), 'Today after retry')
    })

    await run('j7', async () => {
      await resetState(page, language)
      await finishQuick(page, 'joy')
      await activate(page.getByRole('button', { name: language === 'en' ? 'Journal' : 'Jurnal', exact: true }))
      await activate(page.locator('.journal-list button').first())
      const detail = page.getByTestId('session-detail-screen')
      await expectVisible(detail, 'Session detail')
      await page.goBack()
      await expectVisible(page.getByTestId('journal-screen'), 'Journal after browser Back')
      await page.goForward()
      await expectVisible(detail, 'Session detail after browser Forward')
      const remove = page.locator('.danger-button').first()
      await activate(remove)
      const cancel = page.getByRole('button', { name: /cancel|anulați/i })
      await activate(cancel)
      assert(await remove.evaluate((element) => element === document.activeElement), 'J7 Cancel did not restore focus')
      await activate(remove)
      await activate(page.locator('.confirm-dialog-actions .danger-button'))
      await expectVisible(page.getByTestId('journal-screen'), 'Journal after deletion')
    })

    await run('j8', async () => {
      await resetState(page, language)
      await openArrival(page)
      await activate(page.getByTestId('arrival-words'))
      const labels = language === 'en'
        ? ['Sad', 'Despair', 'Sad', 'Depressed', 'Empty', 'Fearful', 'Weak', 'Worthless']
        : ['Trist', 'Disperare', 'Trist', 'Deprimat', 'Gol', 'Temator', 'Slab', 'Lipsit de valoare']
      const choose = async (label) => activate(page.locator('.word-options button').filter({ hasText: new RegExp(`^${label}`, 'i') }).first())
      await choose(labels[0])
      await choose(labels[1])
      await activate(page.locator('.word-path-levels button').last())
      for (const label of labels.slice(2)) await choose(label)
      await activate(page.locator('.route-action button'))
      await expectVisible(page.getByRole('alert'), 'Tier-4 safety message')
      assert(await page.locator('.emotion-heading').count() === 0, 'J8 reflection details leaked before acknowledgment')
      await expectVisible(page.locator('.crisis-resources a').first(), 'Tier-4 support link')
      await activate(page.getByRole('button', { name: /continue to reflection|continuați la reflecție/i }))
      await expectVisible(page.locator('.emotion-heading'), 'Tier-4 reflection after acknowledgment')
    })

    await run('j9', async () => {
      await resetState(page, language)
      await activate(page.getByTestId('quick-feeling-anxiety'))
      await activate(page.getByTestId('quick-continue'))
      await expectVisible(page.getByTestId('reflection-screen'), 'Compact reflection')
      assert(await page.locator('.need-choice').count() === 0, 'J9 inferred need is visible before exploration')
      assert(await page.getByRole('link', { name: /explore with ai|explorați cu ai/i }).count() === 0, 'J9 AI link is visible before exploration')

      const done = page.getByRole('button', { name: /done for now|gata pentru acum/i })
      const explore = page.getByRole('button', { name: /explore further|explorați mai mult/i })
      for (const [control, description] of [[done, 'Done'], [explore, 'Explore']]) {
        const inViewport = await control.evaluate((element) => {
          const bounds = element.getBoundingClientRect()
          return bounds.top >= 0 && bounds.left >= 0 && bounds.right <= innerWidth && bounds.bottom <= innerHeight
        })
        assert(inViewport, `J9 ${description} action is outside the first viewport`)
      }

      await activate(explore)
      await expectVisible(page.getByTestId('reflection-exploration-screen'), 'Reflection exploration')
      assert(await page.locator('#screen-title').evaluate((element) => element === document.activeElement), 'J9 exploration heading lacks focus')
      await expectVisible(page.locator('.need-choice'), 'J9 inferred need')
      await expectVisible(page.getByRole('link', { name: /explore with ai|explorați cu ai/i }), 'J9 AI link')
      await capture(page, `${language}-j9-exploration`)

      await activate(page.locator('.screen-back'))
      assert(await explore.evaluate((element) => element === document.activeElement), 'J9 focus did not return to Explore')
    })
  }
  return results
}

async function installLongTaskObserver(page) {
  await page.evaluate(() => {
    window.__emotIdPhysicalLongTasks = []
    try {
      new PerformanceObserver((list) => {
        window.__emotIdPhysicalLongTasks.push(...list.getEntries().map((entry) => ({
          startTime: entry.startTime,
          duration: entry.duration,
        })))
      }).observe({ type: 'longtask', buffered: true })
    } catch {
      // Browser support is reported in the resulting empty list.
    }
  })
}

async function startDeviceRecording(run) {
  const remotePath = `/sdcard/emot-id-performance-${run}.mp4`
  const recorder = spawn('adb', [
    'shell', 'screenrecord', '--bit-rate', '12000000', '--time-limit', '180', remotePath,
  ], { stdio: 'ignore' })
  await new Promise((resolve) => setTimeout(resolve, 1_000))
  return { recorder, remotePath }
}

async function stopDeviceRecording(recording, run) {
  let recorderPid = ''
  try {
    recorderPid = adb('shell', 'pidof', 'screenrecord')
  } catch {
    // The recorder may have reached its time limit before collection.
  }
  if (recorderPid) {
    adb('shell', 'kill', '-2', recorderPid)
  } else if (recording.recorder.exitCode === null) {
    recording.recorder.kill('SIGINT')
  }
  await new Promise((resolve) => setTimeout(resolve, 1_000))
  const localPath = path.join(outputDir, `performance-run-${run}-device.mp4`)
  execFileSync('adb', ['pull', recording.remotePath, localPath], { stdio: 'ignore' })
  adb('shell', 'rm', '-f', recording.remotePath)
}

async function startPerfetto(run) {
  const remotePath = `/data/misc/perfetto-traces/emot-id-performance-${run}.perfetto-trace`
  const tracer = spawn('adb', [
    'shell', 'perfetto', '-o', remotePath, '-t', '8s',
    'sched', 'freq', 'idle', 'am', 'wm', 'gfx', 'view', 'binder_driver', 'input', 'res', 'memory',
  ], { stdio: 'ignore' })
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { tracer, remotePath }
}

async function collectPerfetto(tracing, run) {
  if (tracing.tracer.exitCode === null) {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Perfetto did not finish within 12 seconds')), 12_000)
      tracing.tracer.once('exit', () => {
        clearTimeout(timeout)
        resolve()
      })
    })
  }
  const localPath = path.join(outputDir, `performance-run-${run}.perfetto-trace`)
  execFileSync('adb', ['pull', tracing.remotePath, localPath], { stdio: 'ignore' })
  adb('shell', 'rm', '-f', tracing.remotePath)
}

async function stopTrace(session, completion, run) {
  await session.send('Tracing.end')
  const { stream } = await completion
  const chunks = []
  while (true) {
    const part = await session.send('IO.read', { handle: stream })
    chunks.push(part.data)
    if (part.eof) break
  }
  await session.send('IO.close', { handle: stream })
  await writeFile(path.join(outputDir, `performance-run-${run}-trace.json`), chunks.join(''))
}

async function measurePerformance(initialBrowser, initialPage) {
  const runs = []
  let runBrowser = initialBrowser
  let page = initialPage
  for (let run = 1; run <= 3; run += 1) {
    await resetState(page, 'en')
    const session = await page.context().newCDPSession(page)
    await session.send('Network.clearBrowserCache')
    await session.send('Storage.clearDataForOrigin', {
      origin: new URL(CANDIDATE_URL).origin,
      storageTypes: 'cache_storage',
    })
    await session.detach()
    adb('shell', 'input', 'keyevent', 'HOME')
    await new Promise((resolve) => setTimeout(resolve, 5_000))
    await runBrowser.close()
    adb('shell', 'am', 'force-stop', 'com.android.chrome')
    await new Promise((resolve) => setTimeout(resolve, 500))
    const recording = await startDeviceRecording(run)
    const perfetto = await startPerfetto(run)
    const startedAt = Date.now()
    await launchMode()
    runBrowser = await connectBrowser()
    page = await findPage(runBrowser)
    await expectVisible(page.getByTestId('today-screen'), 'Cold Today')
    const startupMs = Date.now() - startedAt
    const metricsSession = await page.context().newCDPSession(page)
    await metricsSession.send('Performance.enable')
    const traceComplete = new Promise((resolve) => metricsSession.once('Tracing.tracingComplete', resolve))
    await metricsSession.send('Tracing.start', {
      categories: 'devtools.timeline,blink.user_timing,loading,v8',
      transferMode: 'ReturnAsStream',
    })
    await installLongTaskObserver(page)

    const routeResults = {}
    for (const route of ['body', 'affect', 'words']) {
      await activate(page.getByRole('button', { name: /start a check-in/i }))
      await expectVisible(page.getByTestId('arrival-screen'), 'Arrival')
      const start = await page.evaluate(() => performance.now())
      await activate(page.getByTestId(`arrival-${route}`))
      await expectVisible(page.getByTestId(`${route}-screen`), `${route} screen`)
      routeResults[route] = await page.evaluate((value) => performance.now() - value, start)
      await activate(page.locator('.screen-back'))
      await activate(page.locator('.screen-back'))
    }
    await activate(page.getByRole('button', { name: 'Explore', exact: true }))
    await expectVisible(page.getByTestId('explore-screen'), 'Explore')
    const plutchikStart = await page.evaluate(() => performance.now())
    await activate(page.getByTestId('explore-plutchik'))
    await expectVisible(page.getByTestId('plutchik-screen'), 'Plutchik')
    routeResults.plutchik = await page.evaluate((value) => performance.now() - value, plutchikStart)
    await activate(page.locator('.screen-back'))
    const warmStart = await page.evaluate(() => performance.now())
    await activate(page.getByTestId('explore-plutchik'))
    await expectVisible(page.getByTestId('plutchik-screen'), 'Warm Plutchik')
    const warmReturnMs = await page.evaluate((value) => performance.now() - value, warmStart)
    const longTasks = await page.evaluate(() => window.__emotIdPhysicalLongTasks ?? [])
    const metrics = await metricsSession.send('Performance.getMetrics')
    await stopTrace(metricsSession, traceComplete, run)
    await metricsSession.detach()
    runs.push({
      run,
      startupMs,
      routes: routeResults,
      warmReturnMs,
      longestTaskMs: Math.max(0, ...longTasks.map((entry) => entry.duration)),
      longTasks,
      battery: adb('shell', 'dumpsys', 'battery'),
      chromeMetrics: Object.fromEntries(metrics.metrics.map((entry) => [entry.name, entry.value])),
    })
    await capture(page, `performance-run-${run}`)
    await stopDeviceRecording(recording, run)
    await collectPerfetto(perfetto, run)
  }
  return { runs, browser: runBrowser }
}

assertDeviceReady()
adb('forward', 'tcp:9222', 'localabstract:chrome_devtools_remote')
await launchMode()
await new Promise((resolve) => setTimeout(resolve, 2_000))
let browser = await connectBrowser()
const page = await findPage(browser)
const environment = {
  capturedAt: new Date().toISOString(),
  candidateUrl: CANDIDATE_URL,
  mode,
  suite,
  device: adb('shell', 'getprop', 'ro.product.model'),
  android: adb('shell', 'getprop', 'ro.build.version.release'),
  api: adb('shell', 'getprop', 'ro.build.version.sdk'),
  build: adb('shell', 'getprop', 'ro.build.fingerprint'),
  chrome: await page.evaluate(() => navigator.userAgent),
  viewport: await page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio })),
  displayMode: await page.evaluate(() => matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'),
  talkBackService: adb('shell', 'settings', 'get', 'secure', 'enabled_accessibility_services'),
  fontScale: adb('shell', 'settings', 'get', 'system', 'font_scale'),
  battery: adb('shell', 'dumpsys', 'battery'),
}

const report = { environment }
if (suite !== 'performance') report.journeys = await runJourneys(page)
if (suite !== 'journeys') {
  const measured = await measurePerformance(browser, page)
  report.performance = measured.runs
  browser = measured.browser
}
await writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ outputDir, report }, null, 2))
await browser.close()
if (report.journeys?.some((journey) => journey.result === 'FAIL')) process.exitCode = 1
