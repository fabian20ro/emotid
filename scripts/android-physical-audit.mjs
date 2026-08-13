import { execFileSync, spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'
import {
  createBrowserRunUrl,
  findBrowserTarget,
  verifyForegroundSurface,
} from './android-physical/browser-target.mjs'
import {
  inspectAndroidPhysicalEnvironment,
  parseAndroidPhysicalArgs,
  validateAndroidPhysicalEnvironment,
  WEBAPK_PACKAGE,
} from './android-physical/environment.mjs'
import { runJourneyMatrix } from './android-physical/journeys.mjs'
import { ACCEPTANCE_HOOKS } from './acceptance/selectors.mjs'

const usage = `Usage: node scripts/android-physical-audit.mjs [options]

Options:
  --preflight                  Validate the selected device/mode without creating evidence
  --candidate-url=<url>       Deployed candidate (default: GitHub Pages)
  --mode=browser|installed    Chrome tab or installed WebAPK (default: browser)
  --suite=all|journeys|performance
  --journey=j1..j9            Run one journey in both languages
  --help                      Print this help without accessing a device`

let options
try {
  options = parseAndroidPhysicalArgs(process.argv.slice(2))
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
if (options.help) {
  console.log(usage)
  process.exit(0)
}
const CANDIDATE_URL = options.candidateUrl
const CDP_URL = 'http://127.0.0.1:9222'
const { mode, suite, journey: journeyFilter } = options

const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
const outputDir = path.resolve('.reports', 'android-physical', `${stamp}-${mode}`)
const browserRunToken = `browser-${stamp}-${process.pid}`
const browserRunUrl = createBrowserRunUrl(CANDIDATE_URL, browserRunToken)

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
    adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', browserRunUrl, 'com.android.chrome')
  }
}

function readPhysicalEnvironment() {
  return inspectAndroidPhysicalEnvironment({
    adbDevicesOutput: adb('devices', '-l'),
    trustState: adb('shell', 'dumpsys', 'trust'),
    model: adb('shell', 'getprop', 'ro.product.model'),
    android: adb('shell', 'getprop', 'ro.build.version.release'),
    api: adb('shell', 'getprop', 'ro.build.version.sdk'),
    build: adb('shell', 'getprop', 'ro.build.fingerprint'),
    enabledServices: adb('shell', 'settings', 'get', 'secure', 'enabled_accessibility_services'),
    accessibilityDump: adb('shell', 'dumpsys', 'accessibility'),
    inputDump: adb('shell', 'dumpsys', 'input'),
    packageList: adb('shell', 'pm', 'list', 'packages', WEBAPK_PACKAGE),
    forwardList: adb('forward', '--list'),
  })
}

async function findPage(browser) {
  if (mode === 'browser') {
    return findBrowserTarget({ browser, candidateUrl: CANDIDATE_URL, runToken: browserRunToken })
  }
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

function readForegroundHierarchy() {
  const remotePath = `/sdcard/emot-id-foreground-${process.pid}.xml`
  try {
    adb('shell', 'uiautomator', 'dump', remotePath)
    return adb('shell', 'cat', remotePath)
  } finally {
    try {
      adb('shell', 'rm', '-f', remotePath)
    } catch {
      // Cleanup must not hide the foreground verification result.
    }
  }
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
      await activate(page.getByTestId(ACCEPTANCE_HOOKS.todayGuidedEntry))
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

let physicalEnvironment
try {
  physicalEnvironment = validateAndroidPhysicalEnvironment(readPhysicalEnvironment(), { mode, suite })
} catch (error) {
  console.error(`Android physical preflight failed: ${error.message}`)
  process.exit(1)
}
if (options.preflight) {
  console.log(JSON.stringify({ candidateUrl: CANDIDATE_URL, mode, suite, ...physicalEnvironment }, null, 2))
  process.exit(0)
}

await mkdir(outputDir, { recursive: true })
let browser
let forwarded = false
try {
  adb('forward', 'tcp:9222', 'localabstract:chrome_devtools_remote')
  forwarded = true
  await launchMode()
  await new Promise((resolve) => setTimeout(resolve, 2_000))
  browser = await connectBrowser()
  const page = await findPage(browser)
  if (mode === 'browser') {
    await verifyForegroundSurface({
      runToken: browserRunToken,
      readHierarchy: async () => readForegroundHierarchy(),
    })
  }
  const environment = {
    capturedAt: new Date().toISOString(),
    candidateUrl: CANDIDATE_URL,
    mode,
    suite,
    ...physicalEnvironment,
    localGitHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    localGitDirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()),
    chrome: await page.evaluate(() => navigator.userAgent),
    viewport: await page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio })),
    displayMode: await page.evaluate(() => matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'),
    foregroundVerified: mode === 'browser',
    fontScale: adb('shell', 'settings', 'get', 'system', 'font_scale'),
    battery: adb('shell', 'dumpsys', 'battery'),
  }

  const report = { environment }
  if (suite !== 'performance') {
    report.journeys = await runJourneyMatrix({
      context: { page, resetState, capture, expectVisible, activate, pressElement, assert },
      mode,
      journeyFilter,
    })
  }
  if (suite !== 'journeys') {
    const measured = await measurePerformance(browser, page)
    report.performance = measured.runs
    browser = measured.browser
  }
  await writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify({ outputDir, report }, null, 2))
  if (report.journeys?.some((journey) => journey.result === 'FAIL')) process.exitCode = 1
} finally {
  await browser?.close().catch(() => undefined)
  if (forwarded) {
    try {
      adb('forward', '--remove', 'tcp:9222')
    } catch {
      // Preserve the primary audit result; forwarding cleanup is best effort.
    }
  }
}
