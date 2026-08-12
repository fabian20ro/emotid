import { execFileSync, spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'
import { ACCEPTANCE_LANGUAGES, ACCEPTANCE_RESULTS } from './acceptance/contract.mjs'
import {
  createBrowserRunUrl,
  findBrowserTarget,
  verifyForegroundSurface,
} from './android-physical/browser-target.mjs'
import {
  inspectAndroidPhysicalEnvironment,
  validateAndroidPhysicalEnvironment,
  WEBAPK_PACKAGE,
} from './android-physical/environment.mjs'
import { selectJourneys } from './android-physical/journeys.mjs'
import {
  buildLanguageDiagnostic,
  classifyTalkBackRun,
  parseTalkBackArgs,
  parseTalkBackTtsEvidence,
  validateTalkBackRowEvidence,
} from './android-physical/talkback.mjs'

const CDP_URL = 'http://127.0.0.1:9222'
const DEFAULT_CANDIDATE_URL = 'http://127.0.0.1:4176/emotid/'
const TALKBACK_SERVICE = 'com.google.android.marvin.talkback/com.google.android.marvin.talkback.TalkBackService'
const usage = `Usage: node scripts/android-talkback-audit.mjs [options]

Options:
  --preflight                  Validate the physical device without side effects
  --journey=j1..j9            Run one journey
  --language=en|ro            Run one language
  --candidate-url=<url>       HTTP loopback candidate (default: local production server)
  --help                      Print help without accessing a device`

let options
try {
  options = parseTalkBackArgs(process.argv.slice(2))
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
if (options.help) {
  console.log(usage)
  process.exit(0)
}

function adb(...args) {
  return execFileSync('adb', args, {
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
    timeout: 30_000,
  }).trim()
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function wait(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
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

function readAndroidLocale() {
  return adb('shell', 'getprop', 'persist.sys.locale')
    || adb('shell', 'getprop', 'ro.product.locale')
}

function readForegroundHierarchy() {
  const remotePath = `/sdcard/emot-id-talkback-${process.pid}.xml`
  try {
    adb('shell', 'uiautomator', 'dump', remotePath)
    return adb('shell', 'cat', remotePath)
  } finally {
    try {
      adb('shell', 'rm', '-f', remotePath)
    } catch {
      // Preserve the primary foreground or capture result.
    }
  }
}

function chromeUiLabels(hierarchy) {
  const labels = []
  for (const node of hierarchy.matchAll(/<node\b[^>]*package="com\.android\.chrome"[^>]*>/g)) {
    const label = node[0].match(/content-desc="([^"]+)"/)?.[1]
    if (label && !labels.includes(label)) labels.push(label)
  }
  return labels.slice(0, 20)
}

async function waitForService(url, child) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child?.exitCode !== null) {
      throw new Error(`Local production server exited before readiness: ${child.output.trim()}`)
    }
    try {
      const response = await fetch(url)
      if (response.ok && (await response.text()).includes('Emot-ID')) return
    } catch {
      // Retry only during the bounded startup window.
    }
    await wait(250)
  }
  throw new Error('Local production server did not become ready')
}

function startServer() {
  const child = spawn(process.execPath, ['scripts/macos-safari/server.mjs'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.output = ''
  child.stdout.on('data', (chunk) => { child.output += chunk })
  child.stderr.on('data', (chunk) => { child.output += chunk })
  return child
}

async function connectBrowser() {
  let lastError
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      return await chromium.connectOverCDP(CDP_URL)
    } catch (error) {
      lastError = error
      await wait(250)
    }
  }
  throw lastError
}

async function expectVisible(locator, description) {
  await locator.waitFor({ state: 'visible', timeout: 15_000 })
  assert(await locator.isVisible(), `${description} is not visible`)
}

async function establishRowTtsBoundary(page) {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const evidence = parseTalkBackTtsEvidence(adb('logcat', '-d', '-v', 'threadtime'))
    if (evidence.dispatches.length > 0) {
      await wait(300)
      adb('logcat', '-c')
      return
    }
    if (attempt === 8) {
      const heading = page.getByRole('heading').first()
      if (await heading.count()) await heading.focus()
    }
    await wait(250)
  }
  throw new Error('TalkBack TTS did not dispatch after application navigation')
}

function createRowState() {
  return {
    focusSequence: [],
    nativeActivationCount: 0,
    nativeKeyCount: 0,
  }
}

async function describeFocused(locator) {
  return locator.evaluate((element) => ({
    name: element.getAttribute('aria-label') || element.textContent?.trim().replace(/\s+/g, ' ') || '',
    role: element.getAttribute('role') || element.tagName.toLowerCase(),
    tag: element.tagName.toLowerCase(),
  }))
}

function createNativeInteraction(rowState) {
  return {
    activate: async (locator) => {
      await locator.waitFor({ state: 'visible', timeout: 15_000 })
      await locator.focus()
      assert(await locator.evaluate((element) => element === document.activeElement), 'Native activation target lacks DOM focus')
      rowState.focusSequence.push(await describeFocused(locator))
      await wait(350)
      adb('shell', 'input', 'keyevent', 'KEYCODE_ENTER')
      rowState.nativeActivationCount += 1
      await wait(250)
    },
    pressElement: async (locator, key) => {
      const keyCode = {
        ArrowLeft: 'KEYCODE_DPAD_LEFT',
        ArrowRight: 'KEYCODE_DPAD_RIGHT',
        ArrowUp: 'KEYCODE_DPAD_UP',
        ArrowDown: 'KEYCODE_DPAD_DOWN',
      }[key]
      if (!keyCode) throw new Error(`Unsupported native key: ${key}`)
      await locator.focus()
      rowState.focusSequence.push(await describeFocused(locator))
      adb('shell', 'input', 'keyevent', keyCode)
      rowState.nativeKeyCount += 1
      await wait(250)
    },
  }
}

async function resetState(page, language, runToken, onboarded = true) {
  const storagePage = new URL('manifest.webmanifest', options.candidateUrl)
  storagePage.searchParams.set('talkback-storage', Date.now().toString())
  await page.goto(storagePage.href, { waitUntil: 'domcontentloaded', timeout: 15_000 })
  const session = await page.context().newCDPSession(page)
  await session.send('Storage.clearDataForOrigin', {
    origin: new URL(options.candidateUrl).origin,
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
  const auditUrl = new URL(options.candidateUrl)
  auditUrl.searchParams.set('physical-audit-run', runToken)
  auditUrl.searchParams.set('talkback-row', `${language}-${Date.now()}`)
  await page.goto(auditUrl.href, { waitUntil: 'commit', timeout: 15_000 })
  await page.waitForFunction((expectedLanguage) => (
    document.readyState !== 'loading' && document.documentElement.lang === expectedLanguage
  ), language, { timeout: 15_000 })
  await establishRowTtsBoundary(page)
}

async function captureAx(page, filePath) {
  const session = await page.context().newCDPSession(page)
  const { nodes } = await session.send('Accessibility.getFullAXTree')
  await session.detach()
  const simplified = nodes.filter((node) => !node.ignored).map((node) => ({
    role: node.role?.value,
    name: node.name?.value,
    focused: node.properties?.some((property) => property.name === 'focused' && property.value?.value),
  })).filter((node) => node.role || node.name)
  await writeFile(filePath, `${JSON.stringify(simplified, null, 2)}\n`)
}

async function capture(page, outputDir, name, { includeNativeHierarchy = true } = {}) {
  const screenshot = execFileSync('adb', ['exec-out', 'screencap', '-p'], {
    maxBuffer: 20 * 1024 * 1024,
    timeout: 10_000,
  })
  await writeFile(path.join(outputDir, `${name}-device.png`), screenshot)
  if (includeNativeHierarchy) {
    await writeFile(path.join(outputDir, `${name}-native.xml`), readForegroundHierarchy())
  }
  await captureAx(page, path.join(outputDir, `${name}-ax.json`))
}

function addTalkBackService(enabledServices) {
  const services = enabledServices === 'null' || !enabledServices
    ? []
    : enabledServices.split(':').filter(Boolean)
  if (!services.includes(TALKBACK_SERVICE)) services.push(TALKBACK_SERVICE)
  return services.join(':')
}

function enableTalkBack(initialEnabledServices) {
  adb('shell', 'settings', 'put', 'secure', 'enabled_accessibility_services', addTalkBackService(initialEnabledServices))
  adb('shell', 'settings', 'put', 'secure', 'accessibility_enabled', '1')
}

function restoreSecureSetting(namespace, key, value) {
  if (value === 'null' || value === '') adb('shell', 'settings', 'delete', namespace, key)
  else adb('shell', 'settings', 'put', namespace, key, value)
}

async function waitForTalkBack() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const environment = readPhysicalEnvironment()
    if (environment.talkBack.enabled && environment.talkBack.bound && environment.talkBack.touchExploration) {
      return environment.talkBack
    }
    await wait(500)
  }
  throw new Error('TalkBack did not become enabled, bound, and touch-exploration ready')
}

async function runRow({ page, id, execute, language, runToken, talkBack, outputDir, androidLocale }) {
  const rowState = createRowState()
  const interaction = createNativeInteraction(rowState)
  const name = `${language}-${id}`
  adb('logcat', '-c')
  console.log(`[talkback] ${language.toUpperCase()} ${id.toUpperCase()} start`)
  try {
    await execute({
      page,
      language,
      resetState: (targetPage, selectedLanguage, onboarded) => (
        resetState(targetPage, selectedLanguage, runToken, onboarded)
      ),
      // UI Automator briefly restarts accessibility services. Keep mid-journey
      // evidence non-intrusive; the final capture still includes native XML.
      capture: (targetPage, captureName) => capture(targetPage, outputDir, captureName, {
        includeNativeHierarchy: false,
      }),
      expectVisible,
      assert,
      ...interaction,
    })
    await wait(750)
    const logcat = adb('logcat', '-d', '-v', 'threadtime')
    const tts = parseTalkBackTtsEvidence(logcat)
    const browserLanguage = await page.evaluate(() => ({
      appLanguage: document.documentElement.lang,
      browserLanguages: [...navigator.languages],
    }))
    const evidence = validateTalkBackRowEvidence({
      talkBack,
      ...rowState,
      tts,
      postconditionPassed: true,
    })
    await writeFile(path.join(outputDir, `${name}-logcat.txt`), `${logcat}\n`)
    await capture(page, outputDir, name)
    console.log(`[talkback] ${language.toUpperCase()} ${id.toUpperCase()} supporting pass`)
    return {
      language,
      journey: id.toUpperCase(),
      result: ACCEPTANCE_RESULTS.supportingPass,
      assistiveTechnology: 'TalkBack',
      input: 'ADB native key events after exact DOM focus',
      focusSequence: evidence.focusSequence,
      nativeActivationCount: evidence.nativeActivationCount,
      nativeKeyCount: evidence.nativeKeyCount,
      tts,
      languageDiagnostic: buildLanguageDiagnostic({
        ...browserLanguage,
        androidLocale,
        requests: tts.requests,
      }),
    }
  } catch (error) {
    const logcat = adb('logcat', '-d', '-v', 'threadtime')
    await writeFile(path.join(outputDir, `${name}-failure-logcat.txt`), `${logcat}\n`).catch(() => undefined)
    await capture(page, outputDir, `${name}-failure`).catch(() => undefined)
    console.error(`[talkback] ${language.toUpperCase()} ${id.toUpperCase()} fail: ${error}`)
    return {
      language,
      journey: id.toUpperCase(),
      result: ACCEPTANCE_RESULTS.fail,
      error: String(error),
      focusSequence: rowState.focusSequence,
      nativeActivationCount: rowState.nativeActivationCount,
      nativeKeyCount: rowState.nativeKeyCount,
      tts: parseTalkBackTtsEvidence(logcat),
    }
  }
}

let physicalEnvironment
try {
  physicalEnvironment = validateAndroidPhysicalEnvironment(readPhysicalEnvironment(), {
    mode: 'browser',
    suite: 'journeys',
  })
  const port = new URL(options.candidateUrl).port || '80'
  if (adb('reverse', '--list').split('\n').some((line) => line.includes(`tcp:${port}`))) {
    throw new Error(`ADB reverse tcp:${port} is already in use`)
  }
} catch (error) {
  console.error(`Android TalkBack preflight failed: ${error.message}`)
  process.exit(1)
}

const preflight = {
  candidateUrl: options.candidateUrl,
  mode: 'browser',
  androidLocale: readAndroidLocale(),
  ...physicalEnvironment,
}
if (options.preflight) {
  console.log(JSON.stringify(preflight, null, 2))
  process.exit(0)
}

const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
const outputDir = path.resolve('.reports', 'android-physical', `${stamp}-talkback-browser`)
const runToken = `talkback-browser-${stamp}-${process.pid}`
const runUrl = createBrowserRunUrl(options.candidateUrl, runToken)
const initialEnabledServices = adb('shell', 'settings', 'get', 'secure', 'enabled_accessibility_services')
const initialAccessibilityEnabled = adb('shell', 'settings', 'get', 'secure', 'accessibility_enabled')
const initialStayAwake = adb('shell', 'settings', 'get', 'global', 'stay_on_while_plugged_in')
const shouldStartServer = options.candidateUrl === DEFAULT_CANDIDATE_URL
let server
let browser
let page
let forwarded = false
let reversed = false
let evidenceStarted = false

try {
  if (shouldStartServer) {
    server = startServer()
    await waitForService(options.candidateUrl, server)
  } else {
    const response = await fetch(options.candidateUrl)
    if (!response.ok) throw new Error(`Candidate returned HTTP ${response.status}`)
  }
  const localIndex = readFileSync(path.resolve('dist', 'index.html'), 'utf8')
  const candidateIndex = await (await fetch(options.candidateUrl)).text()
  const localAssets = [...localIndex.matchAll(/(?:src|href)="([^"]+\/assets\/[^"]+)"/g)].map((match) => match[1])
  assert(localAssets.length > 0 && localAssets.every((asset) => candidateIndex.includes(asset)), 'Candidate assets do not match the local production build')

  await mkdir(outputDir, { recursive: true })
  evidenceStarted = true
  const port = new URL(options.candidateUrl).port || '80'
  adb('reverse', `tcp:${port}`, `tcp:${port}`)
  reversed = true
  adb('forward', 'tcp:9222', 'localabstract:chrome_devtools_remote')
  forwarded = true
  adb('shell', 'svc', 'power', 'stayon', 'true')
  adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', runUrl, 'com.android.chrome')
  await wait(2_000)
  browser = await connectBrowser()
  page = await findBrowserTarget({ browser, candidateUrl: options.candidateUrl, runToken })
  await verifyForegroundSurface({ runToken, readHierarchy: async () => readForegroundHierarchy() })

  enableTalkBack(initialEnabledServices)
  const talkBack = await waitForTalkBack()
  await verifyForegroundSurface({ runToken, readHierarchy: async () => readForegroundHierarchy() })
  await page.getByRole('heading').first().focus().catch(() => undefined)
  await wait(5_000)
  adb('logcat', '-c')

  const androidLocale = readAndroidLocale()
  const journeys = selectJourneys(options.journey)
  const languages = options.language ? [options.language] : ACCEPTANCE_LANGUAGES
  const rows = []
  for (const language of languages) {
    for (const [id, execute] of journeys) {
      rows.push(await runRow({
        page,
        id,
        execute,
        language,
        runToken,
        talkBack,
        outputDir,
        androidLocale,
      }))
    }
  }

  const report = {
    environment: {
      ...preflight,
      capturedAt: new Date().toISOString(),
      candidateUrl: options.candidateUrl,
      candidateAssetsMatchLocalBuild: true,
      localGitHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      localGitDirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()),
      chrome: await page.evaluate(() => navigator.userAgent),
      browserLanguages: await page.evaluate(() => [...navigator.languages]),
      chromeUiLabels: chromeUiLabels(readForegroundHierarchy()),
      talkBackVersion: adb('shell', 'dumpsys', 'package', 'com.google.android.marvin.talkback')
        .match(/versionName=([^\s]+)/)?.[1],
      activeTalkBack: talkBack,
      activation: 'ADB KEYCODE_ENTER after exact DOM focus',
      speechEvidence: 'TalkBack state, visible speech overlay screenshots, and TTS synthesis/dispatch logs',
    },
    classification: classifyTalkBackRun(rows),
    journeys: rows,
  }
  await writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify({ outputDir, report }, null, 2))
  if (rows.some((row) => row.result === ACCEPTANCE_RESULTS.fail)) process.exitCode = 1
} catch (error) {
  console.error(error)
  process.exitCode = 1
  if (evidenceStarted) {
    await writeFile(path.join(outputDir, 'fatal-error.json'), `${JSON.stringify({ error: String(error) }, null, 2)}\n`)
      .catch(() => undefined)
  }
} finally {
  await page?.close().catch(() => undefined)
  await browser?.close().catch(() => undefined)
  restoreSecureSetting('secure', 'enabled_accessibility_services', initialEnabledServices)
  restoreSecureSetting('secure', 'accessibility_enabled', initialAccessibilityEnabled)
  restoreSecureSetting('global', 'stay_on_while_plugged_in', initialStayAwake)
  if (forwarded) {
    try {
      adb('forward', '--remove', 'tcp:9222')
    } catch {
      // Preserve the audit result.
    }
  }
  if (reversed) {
    try {
      const port = new URL(options.candidateUrl).port || '80'
      adb('reverse', '--remove', `tcp:${port}`)
    } catch {
      // Preserve the audit result.
    }
  }
  if (server?.exitCode === null) server.kill('SIGTERM')
}
