const RUN_PARAMETER = 'ios-simulator-run'

export const IOS_SIMULATOR_PROFILES = Object.freeze({
  se: Object.freeze({ deviceName: 'Emot-ID iPhone SE' }),
  '17-pro': Object.freeze({ deviceName: 'Emot-ID iPhone 17 Pro' }),
})

export const IOS_SIMULATOR_JOURNEYS = Object.freeze([
  'quick',
  'word-intermediate',
  'save-retry',
  'tier4',
])

const LANGUAGES = Object.freeze(['en', 'ro'])
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]'])

const COPY = Object.freeze({
  en: Object.freeze({
    start: 'Start a check-in',
    reflection: 'What seems to fit?',
    saved: 'Check-in saved. Everything below is optional.',
    explore: 'Explore further',
    done: 'Done for now',
    retry: 'Try saving again',
    journal: 'Journal',
    happy: 'Happy',
    playful: 'Playful',
    continuePlayful: 'Continue with Playful',
    aiQuery: 'I feel anxiety. What does this emotion mean and how can I understand it better?',
    tier4Path: ['Sad', 'despair', 'Sad', 'Depressed', 'Empty', 'Fearful', 'Weak', 'Worthless'],
    acknowledge: 'Continue to reflection',
  }),
  ro: Object.freeze({
    start: 'Începeți o verificare',
    reflection: 'Ce pare să se potrivească?',
    saved: 'Verificarea este salvată. Tot ce urmează este opțional.',
    explore: 'Explorați mai mult',
    done: 'Gata pentru acum',
    retry: 'Încercați salvarea din nou',
    journal: 'Jurnal',
    happy: 'Fericit',
    playful: 'Jucăuș',
    continuePlayful: 'Continuați cu Jucăuș',
    aiQuery: 'Simt anxietate. Ce înseamnă această emoție și cum o pot înțelege mai bine?',
    tier4Path: ['Trist', 'disperare', 'Trist', 'Deprimat', 'Gol', 'Temător', 'Slab', 'Lipsit de valoare'],
    acknowledge: 'Continuați la reflecție',
  }),
})

function parsePort(value) {
  const port = Number.parseInt(value, 10)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid Appium port: ${value}`)
  }
  return port
}

export function parseIOSSimulatorArgs(args) {
  const options = {
    help: false,
    preflight: false,
    profile: 'all',
    language: 'all',
    journey: 'all',
    baseUrl: 'http://127.0.0.1:4176/emotid/',
    appiumPort: 4723,
  }

  for (const argument of args) {
    if (argument === '--help' || argument === '-h') options.help = true
    else if (argument === '--preflight') options.preflight = true
    else if (argument.startsWith('--profile=')) options.profile = argument.slice('--profile='.length)
    else if (argument.startsWith('--language=')) options.language = argument.slice('--language='.length)
    else if (argument.startsWith('--journey=')) options.journey = argument.slice('--journey='.length)
    else if (argument.startsWith('--base-url=')) options.baseUrl = argument.slice('--base-url='.length)
    else if (argument.startsWith('--appium-port=')) {
      options.appiumPort = parsePort(argument.slice('--appium-port='.length))
    } else throw new Error(`Unsupported argument: ${argument}`)
  }

  if (options.profile !== 'all' && !Object.hasOwn(IOS_SIMULATOR_PROFILES, options.profile)) {
    throw new Error(`Unsupported profile: ${options.profile}`)
  }
  if (options.language !== 'all' && !LANGUAGES.includes(options.language)) {
    throw new Error(`Unsupported language: ${options.language}`)
  }
  if (options.journey !== 'all' && !IOS_SIMULATOR_JOURNEYS.includes(options.journey)) {
    throw new Error(`Unsupported journey: ${options.journey}`)
  }
  let candidateUrl
  try {
    candidateUrl = new URL(options.baseUrl)
  } catch {
    throw new Error(`Invalid candidate URL: ${options.baseUrl}`)
  }
  if (!['http:', 'https:'].includes(candidateUrl.protocol)) {
    throw new Error(`Invalid candidate URL protocol: ${candidateUrl.protocol}`)
  }
  if (!LOOPBACK_HOSTS.has(candidateUrl.hostname)) {
    throw new Error(`Candidate URL must use a loopback host: ${candidateUrl.hostname}`)
  }
  options.baseUrl = candidateUrl.href
  return options
}

export function buildIOSSimulatorMatrix({ profile = 'all', language = 'all', journey = 'all' }) {
  const profiles = profile === 'all' ? Object.keys(IOS_SIMULATOR_PROFILES) : [profile]
  const languages = language === 'all' ? LANGUAGES : [language]
  const journeys = journey === 'all' ? IOS_SIMULATOR_JOURNEYS : [journey]
  return profiles.flatMap((selectedProfile) => (
    languages.flatMap((selectedLanguage) => (
      journeys.map((selectedJourney) => ({
        profile: selectedProfile,
        language: selectedLanguage,
        journey: selectedJourney,
      }))
    ))
  ))
}

export function validateIOSSimulatorEnvironment({
  platform,
  xcodeVersionOutput,
  appiumPath,
  appiumVersionOutput,
  driverList,
  runtimes,
  devices,
}) {
  if (platform !== 'darwin') throw new Error('iOS Simulator audit requires macOS')
  const xcodeMatch = xcodeVersionOutput.match(/^Xcode\s+([^\s]+)\s*\nBuild version\s+([^\s]+)/m)
  if (!xcodeMatch) throw new Error('Full Xcode is unavailable or its version could not be read')
  if (!appiumPath) throw new Error('Appium is not available on PATH')
  const appium = appiumVersionOutput.trim().match(/^\d+\.\d+\.\d+$/)?.[0]
  if (!appium) throw new Error('Appium version could not be read')
  const xcuitest = driverList?.xcuitest?.installed ? driverList.xcuitest.version : undefined
  if (!xcuitest) throw new Error('The Appium XCUITest driver is not installed')

  const availableRuntimes = new Map(
    runtimes.filter((runtime) => runtime.isAvailable).map((runtime) => [runtime.identifier, runtime]),
  )
  const profiles = {}
  for (const [id, definition] of Object.entries(IOS_SIMULATOR_PROFILES)) {
    const match = Object.entries(devices).flatMap(([runtime, entries]) => (
      entries.map((device) => ({ ...device, runtime }))
    )).find((device) => device.name === definition.deviceName && device.isAvailable !== false)
    if (!match) throw new Error(`Required Simulator profile is unavailable: ${definition.deviceName}`)
    const runtime = availableRuntimes.get(match.runtime)
    if (!runtime) throw new Error(`Simulator runtime is unavailable for ${definition.deviceName}: ${match.runtime}`)
    profiles[id] = {
      deviceName: definition.deviceName,
      platformVersion: runtime.version,
      runtime: runtime.identifier,
      state: match.state,
      udid: match.udid,
    }
  }

  return {
    platform,
    xcode: xcodeMatch[1],
    xcodeBuild: xcodeMatch[2],
    appium,
    appiumPath,
    xcuitest,
    profiles,
  }
}

export function readProductionAssets(html) {
  return [...html.matchAll(/(?:src|href)=["'][^"']*\/([^/"']+\.(?:js|css))["']/g)]
    .map((match) => match[1])
    .sort()
}

export function validateCandidateSurface({
  expectedAssets,
  actualAssets,
  language,
  expectedLanguage,
  token,
  expectedToken,
  viewport,
  scrollWidth,
  headingFocused,
  heading,
  undersizedActions,
}) {
  const expected = [...expectedAssets].sort()
  const actual = [...actualAssets].sort()
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Candidate asset mismatch: expected ${expected.join(', ')}, received ${actual.join(', ')}`)
  }
  if (language !== expectedLanguage) {
    throw new Error(`Candidate language mismatch: expected ${expectedLanguage}, received ${language}`)
  }
  if (token !== expectedToken) throw new Error(`Candidate run token mismatch: ${token}`)
  if (scrollWidth > viewport.width + 1) {
    throw new Error(`Horizontal overflow: ${scrollWidth}px content in ${viewport.width}px viewport`)
  }
  if (!headingFocused) throw new Error('Destination heading does not own programmatic focus')
  if (!heading || heading.top < -1 || heading.bottom > viewport.height + 1) {
    throw new Error(`Destination heading is outside the visual viewport: ${JSON.stringify(heading)}`)
  }
  if (undersizedActions.length > 0) {
    throw new Error(`Primary action below 44px: ${undersizedActions.join(', ')}`)
  }
  return viewport
}

function xpathLiteral(value) {
  if (!value.includes("'")) return `'${value}'`
  if (!value.includes('"')) return `"${value}"`
  return `concat(${value.split("'").map((part) => `'${part}'`).join(', "\'", ')})`
}

function buttonWithText(label) {
  return `//button[normalize-space(.)=${xpathLiteral(label)}]`
}

async function click(driver, using, value) {
  const element = await driver.waitForElement(using, value)
  await driver.click(element)
  return element
}

async function waitForCondition(driver, script, description, attempts = 60) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await driver.execute(script)) return
    if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Timed out waiting for ${description}`)
}

async function prepareCase(driver, {
  baseUrl,
  seedUrl,
  expectedAssets,
  runToken,
  language,
}) {
  const candidateUrl = new URL(baseUrl)
  candidateUrl.searchParams.set(RUN_PARAMETER, runToken)
  await driver.navigate(seedUrl)
  const reset = await driver.executeAsync(`
    const language = arguments[0]
    const done = arguments[arguments.length - 1]
    localStorage.clear()
    localStorage.setItem('emot-id-onboarded', 'true')
    localStorage.setItem('emot-id-language', language)
    localStorage.setItem('emot-id-save-sessions', 'true')
    localStorage.setItem('emot-id-theme', 'light')
    localStorage.setItem('emot-id-allow-external-ai', 'true')
    const databases = ['emot-id-sessions', 'emot-id-chain-analysis']
    const databaseDeletes = databases.map((name) => new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
      request.onblocked = () => reject(new Error('IndexedDB deletion blocked: ' + name))
    }))
    const serviceWorkerReset = navigator.serviceWorker
      ? navigator.serviceWorker.getRegistrations().then((registrations) => (
          Promise.all(registrations.map((registration) => registration.unregister()))
        ))
      : Promise.resolve()
    Promise.all([...databaseDeletes, serviceWorkerReset])
      .then(() => done({ ok: true }), (error) => done({ error: String(error) }))
  `, [language])
  if (!reset?.ok) throw new Error(`Candidate reset failed: ${reset?.error ?? 'unknown error'}`)

  await driver.navigate(candidateUrl.href)
  await driver.waitForElement('css selector', '[data-testid="today-screen"]')
  await waitForCondition(
    driver,
    "return document.querySelector('h1') === document.activeElement",
    'Today heading focus',
  )
  const surface = await driver.execute(`
    const heading = document.querySelector('h1')
    const headingBounds = heading?.getBoundingClientRect()
    const actionSelector = '.primary-button:not([disabled]), .secondary-button:not([disabled]), .route-action button:not([disabled])'
    const visibleActions = [...document.querySelectorAll(actionSelector)].filter((element) => {
      const bounds = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return bounds.width > 0 && bounds.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    })
    return {
      actualAssets: [...document.querySelectorAll('script[src], link[href*="/assets/"]')]
        .map((element) => new URL(element.src || element.href).pathname.split('/').pop())
        .sort(),
      language: document.documentElement.lang,
      token: new URL(location.href).searchParams.get('${RUN_PARAMETER}'),
      viewport: {
        width: visualViewport?.width ?? innerWidth,
        height: visualViewport?.height ?? innerHeight,
        dpr: devicePixelRatio,
      },
      scrollWidth: document.documentElement.scrollWidth,
      headingFocused: heading === document.activeElement,
      heading: headingBounds ? { top: headingBounds.top, bottom: headingBounds.bottom } : null,
      undersizedActions: visibleActions
        .filter((element) => element.getBoundingClientRect().height < 44)
        .map((element) => element.textContent.trim().slice(0, 80)),
    }
  `)
  return validateCandidateSurface({
    ...surface,
    expectedAssets,
    expectedLanguage: language,
    expectedToken: runToken,
  })
}

async function assertCurrentSurface(driver, focusSelector = 'h1') {
  await waitForCondition(
    driver,
    `return document.querySelector(${JSON.stringify(focusSelector)}) === document.activeElement`,
    'destination heading focus',
  )
  const state = await driver.execute(`
    const heading = document.querySelector(${JSON.stringify(focusSelector)})
    const bounds = heading?.getBoundingClientRect()
    const width = visualViewport?.width ?? innerWidth
    const height = visualViewport?.height ?? innerHeight
    const actions = [...document.querySelectorAll('.primary-button:not([disabled]), .secondary-button:not([disabled]), .route-action button:not([disabled])')]
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      })
    return {
      width,
      height,
      dpr: devicePixelRatio,
      scrollWidth: document.documentElement.scrollWidth,
      headingFocused: heading === document.activeElement,
      heading: bounds ? { top: bounds.top, bottom: bounds.bottom } : null,
      undersizedActions: actions.filter((element) => element.getBoundingClientRect().height < 44)
        .map((element) => element.textContent.trim().slice(0, 80)),
    }
  `)
  if (state.scrollWidth > state.width + 1) {
    throw new Error(`Horizontal overflow: ${state.scrollWidth}px content in ${state.width}px viewport`)
  }
  if (!state.headingFocused) throw new Error('Destination heading does not own programmatic focus')
  if (!state.heading || state.heading.top < -1 || state.heading.bottom > state.height + 1) {
    throw new Error(`Destination heading is outside the visual viewport: ${JSON.stringify(state.heading)}`)
  }
  if (state.undersizedActions.length > 0) {
    throw new Error(`Primary action below 44px: ${state.undersizedActions.join(', ')}`)
  }
  return { width: state.width, height: state.height, dpr: state.dpr }
}

async function openWords(driver, copy) {
  await click(driver, 'xpath', buttonWithText(copy.start))
  await click(driver, 'css selector', '[data-testid="arrival-words"]')
}

async function runQuick(driver, copy) {
  await click(driver, 'css selector', '[data-testid="quick-feeling-anxiety"]')
  await click(driver, 'css selector', '[data-testid="quick-continue"]')
  await driver.waitForElement('css selector', '[data-testid="reflection-screen"]')
  await waitForCondition(
    driver,
    `return document.body.textContent.includes(${JSON.stringify(copy.saved)})`,
    'local save confirmation',
  )
  const heading = await driver.getText(await driver.findElement('css selector', 'h1'))
  if (heading !== copy.reflection) throw new Error(`Unexpected Reflection heading: ${heading}`)
  await assertCurrentSurface(driver)
  await click(driver, 'xpath', buttonWithText(copy.explore))
  await driver.waitForElement('css selector', '[data-testid="reflection-exploration-screen"]')
  const aiLink = await driver.findElement('css selector', '.external-ai-link')
  const aiUrl = new URL(await driver.getAttribute(aiLink, 'href'))
  if (aiUrl.searchParams.get('udm') !== '50' || aiUrl.searchParams.get('q') !== copy.aiQuery) {
    throw new Error(`External AI handoff mismatch: ${aiUrl.href}`)
  }
  return assertCurrentSurface(driver)
}

async function runWordIntermediate(driver, copy) {
  await openWords(driver, copy)
  await click(driver, 'xpath', buttonWithText(copy.happy))
  await click(driver, 'xpath', buttonWithText(copy.playful))
  const direct = await driver.waitForElement('xpath', buttonWithText(copy.continuePlayful))
  const directState = await driver.execute(`
    const button = document.evaluate(${JSON.stringify(buttonWithText(copy.continuePlayful))}, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
    return { focused: button === document.activeElement, describedBy: button?.getAttribute('aria-describedby') }
  `)
  if (!directState.focused || !directState.describedBy) {
    throw new Error(`Intermediary completion focus contract failed: ${JSON.stringify(directState)}`)
  }
  await driver.click(direct)
  await driver.waitForElement('css selector', '[data-testid="reflection-screen"]')
  const result = await driver.getText(await driver.findElement('css selector', '.emotion-heading'))
  if (!result.includes(copy.playful)) throw new Error(`Missing intermediary result: ${result}`)
  return assertCurrentSurface(driver)
}

async function runSaveRetry(driver, copy) {
  await driver.execute(`
    const originalPut = IDBObjectStore.prototype.put
    let attempts = 0
    IDBObjectStore.prototype.put = function (...args) {
      attempts += 1
      if (attempts === 2) throw new DOMException('Simulated local save failure', 'QuotaExceededError')
      return Reflect.apply(originalPut, this, args)
    }
  `)
  await click(driver, 'css selector', '[data-testid="quick-feeling-anxiety"]')
  await click(driver, 'css selector', '[data-testid="quick-continue"]')
  await driver.waitForElement('css selector', '[data-testid="reflection-screen"]')
  await click(driver, 'xpath', buttonWithText(copy.done))
  await driver.waitForElement('css selector', '[data-testid="reflection-save-error-screen"]')
  const alerts = await driver.findElements('css selector', '[role="alert"]')
  if (alerts.length !== 1) throw new Error(`Save failure announced ${alerts.length} times`)
  await click(driver, 'xpath', buttonWithText(copy.retry))
  await driver.waitForElement('css selector', '[data-testid="today-screen"]')
  await click(driver, 'xpath', buttonWithText(copy.journal))
  await driver.waitForElement('css selector', '[data-testid="journal-screen"]')
  const entries = await driver.findElements('css selector', '.journal-list button')
  if (entries.length !== 1) throw new Error(`Save retry produced ${entries.length} journal entries`)
  return assertCurrentSurface(driver)
}

async function runTier4(driver, copy) {
  await openWords(driver, copy)
  for (const [index, label] of copy.tier4Path.entries()) {
    await click(driver, 'xpath', buttonWithText(label))
    if (index === 1) await click(driver, 'css selector', '.word-path-levels button:last-child')
  }
  await click(driver, 'css selector', '.route-action button')
  await driver.waitForElement('css selector', '[data-testid="reflection-screen"]')
  const gated = await driver.execute(`return {
    resources: [...document.querySelectorAll('.crisis-banner a')].map((link) => link.getAttribute('href')),
    resultHidden: !document.querySelector('.emotion-heading'),
  }`)
  if (!gated.resultHidden
    || !gated.resources.includes('tel:+40374456420')
    || !gated.resources.includes('https://findahelpline.com')) {
    throw new Error(`Tier-4 boundary mismatch: ${JSON.stringify(gated)}`)
  }
  await click(driver, 'xpath', buttonWithText(copy.acknowledge))
  await driver.waitForElement('css selector', '.emotion-heading')
  return assertCurrentSurface(driver, '.emotion-heading')
}

export async function dismissSafariCoachmark(driver) {
  await driver.setContext('NATIVE_APP')
  const close = await driver.findElementOptional(
    '-ios predicate string',
    "label == 'Close' AND visible == 1",
  )
  if (close) await driver.click(close)
  const webContext = await driver.waitForWebContext()
  await driver.setContext(webContext)
  return { dismissed: Boolean(close), webContext }
}

export async function captureNativeScreenshot(driver) {
  const previousContext = await driver.getContext()
  try {
    if (previousContext !== 'NATIVE_APP') await driver.setContext('NATIVE_APP')
    return await driver.screenshot()
  } finally {
    if (previousContext !== 'NATIVE_APP') await driver.setContext(previousContext)
  }
}

export async function runIOSSimulatorCase({
  driver,
  entry,
  baseUrl,
  expectedAssets,
  runId,
}) {
  const copy = COPY[entry.language]
  const runToken = `${runId}-${entry.profile}-${entry.language}-${entry.journey}`
  const seedUrl = new URL('/__native-safari-seed.html', baseUrl).href
  const initialViewport = await prepareCase(driver, {
    baseUrl,
    seedUrl,
    expectedAssets,
    runToken,
    language: entry.language,
  })
  let viewport
  if (entry.journey === 'quick') viewport = await runQuick(driver, copy)
  else if (entry.journey === 'word-intermediate') viewport = await runWordIntermediate(driver, copy)
  else if (entry.journey === 'save-retry') viewport = await runSaveRetry(driver, copy)
  else viewport = await runTier4(driver, copy)
  return { initialViewport, viewport, runToken }
}

export async function runIOSSimulatorMatrix({ entries, execute, capture, log = console.log, logError = console.error }) {
  const results = []
  for (const entry of entries) {
    const name = `${entry.profile}-${entry.language}-${entry.journey}`
    const startedAt = new Date().toISOString()
    const started = performance.now()
    log(`[ios-simulator] ${name} start`)
    try {
      const detail = await execute(entry)
      const evidence = await capture(name)
      results.push({
        ...entry,
        result: 'SIMULATOR_SUPPORTING_PASS',
        startedAt,
        durationMs: Math.round(performance.now() - started),
        evidence,
        ...detail,
      })
      log(`[ios-simulator] ${name} supporting pass`)
    } catch (error) {
      const evidence = await capture(`${name}-failure`).catch(() => undefined)
      results.push({
        ...entry,
        result: 'FAIL',
        startedAt,
        durationMs: Math.round(performance.now() - started),
        evidence,
        error: String(error),
      })
      logError(`[ios-simulator] ${name} fail: ${error}`)
    }
  }
  return results
}
