import {
  ACCEPTANCE_JOURNEY_IDS,
  ACCEPTANCE_LANGUAGES,
  ACCEPTANCE_RESULTS,
  validateAcceptanceAdapter,
} from '../acceptance/contract.mjs'
import { ACCEPTANCE_SELECTORS } from '../acceptance/selectors.mjs'
import { NATIVE_SAFARI_ACTIVATION_PROBE } from './seed.mjs'

const RUN_PARAMETER = 'native-safari-run'

const COPY = {
  en: {
    reflection: 'What seems to fit?',
    explore: 'Explore further',
    happy: 'Happy',
    playful: 'Playful',
    continuePlayful: 'Continue with Playful',
    tier4Path: ['Sad', 'despair', 'Depressed', 'Empty', 'Fearful', 'Weak', 'Worthless'],
    acknowledge: 'Continue to reflection',
  },
  ro: {
    reflection: 'Ce pare să se potrivească?',
    explore: 'Explorează mai mult',
    happy: 'Fericit',
    playful: 'Jucăuș',
    continuePlayful: 'Continuă cu Jucăuș',
    tier4Path: ['Trist', 'disperare', 'Deprimat', 'Gol', 'Temător', 'Slab', 'Lipsit de valoare'],
    acknowledge: 'Continuă la reflecție',
  },
}

export const NATIVE_SAFARI_ACCEPTANCE_IDS = Object.freeze({
  quick: 'j9',
  'word-intermediate': 'j5',
  tier4: 'j8',
})

export const NATIVE_SAFARI_ACCEPTANCE_ADAPTER = validateAcceptanceAdapter({
  name: 'macos-safari',
  journeyIds: ACCEPTANCE_JOURNEY_IDS.filter((journeyId) => (
    Object.values(NATIVE_SAFARI_ACCEPTANCE_IDS).includes(journeyId)
  )),
  resultClass: ACCEPTANCE_RESULTS.nativeSupportingPass,
})

export const NATIVE_SAFARI_CASES = ACCEPTANCE_LANGUAGES.flatMap((language) => ([
  { id: 'quick', acceptanceId: NATIVE_SAFARI_ACCEPTANCE_IDS.quick, language, theme: language === 'en' ? 'light' : 'dark' },
  { id: 'word-intermediate', acceptanceId: NATIVE_SAFARI_ACCEPTANCE_IDS['word-intermediate'], language, theme: language === 'en' ? 'dark' : 'light' },
  { id: 'tier4', acceptanceId: NATIVE_SAFARI_ACCEPTANCE_IDS.tier4, language, theme: language === 'en' ? 'light' : 'dark' },
]))

export function getNativeSafariMatrixResult(journeys) {
  if (journeys.some((journey) => journey.result === ACCEPTANCE_RESULTS.fail)) {
    return ACCEPTANCE_RESULTS.fail
  }
  if (journeys.some((journey) => journey.result === ACCEPTANCE_RESULTS.blocked)) {
    return ACCEPTANCE_RESULTS.blocked
  }
  return ACCEPTANCE_RESULTS.nativeSupportingPass
}

function activationProbeStateScript() {
  return `return {
    url: location.href,
    readyState: document.readyState,
    buttonPresent: Boolean(document.querySelector(${JSON.stringify(NATIVE_SAFARI_ACTIVATION_PROBE.button)})),
    state: document.querySelector(${JSON.stringify(NATIVE_SAFARI_ACTIVATION_PROBE.state)})?.dataset.state ?? null,
  }`
}

export async function runNativeSafariActivationProbe({ driver, seedUrl }) {
  let initialState
  try {
    await driver.navigate(seedUrl)
    const probe = await driver.waitForElement('css selector', NATIVE_SAFARI_ACTIVATION_PROBE.button)
    initialState = await driver.execute(activationProbeStateScript())
    if (!initialState.buttonPresent || initialState.state !== 'idle') {
      return {
        result: ACCEPTANCE_RESULTS.fail,
        initialState,
        error: 'Native Safari activation seed did not expose its idle contract',
      }
    }

    let nativeError
    try {
      await driver.click(probe)
    } catch (error) {
      nativeError = String(error)
    }
    const nativeState = await driver.execute(activationProbeStateScript())
    if (nativeState.state === 'activated') {
      return {
        result: ACCEPTANCE_RESULTS.nativeSupportingPass,
        initialState,
        nativeState,
        scriptActivationAttempted: false,
        ...(nativeError ? { nativeError } : {}),
      }
    }

    let scriptError
    try {
      await driver.execute(`
        const probe = document.querySelector(${JSON.stringify(NATIVE_SAFARI_ACTIVATION_PROBE.button)})
        probe.click()
      `)
    } catch (error) {
      scriptError = String(error)
    }
    const scriptState = await driver.execute(activationProbeStateScript())
    const scriptProvedSeed = scriptState.state === 'activated'
    return {
      result: scriptProvedSeed ? ACCEPTANCE_RESULTS.blocked : ACCEPTANCE_RESULTS.fail,
      initialState,
      nativeState,
      scriptActivationAttempted: true,
      scriptState,
      ...(nativeError ? { nativeError } : {}),
      ...(scriptError ? { scriptError } : {}),
      error: scriptProvedSeed
        ? 'SafariDriver native activation transport is inert'
        : 'Native Safari activation seed could not prove its click contract',
    }
  } catch (error) {
    return {
      result: ACCEPTANCE_RESULTS.fail,
      ...(initialState ? { initialState } : {}),
      error: String(error),
    }
  }
}

export async function runNativeSafariAudit({
  driver,
  baseUrl,
  runId,
  capture,
  probeActivation = runNativeSafariActivationProbe,
  runMatrix = runNativeSafariMatrix,
}) {
  const seedUrl = new URL('/__native-safari-seed.html', baseUrl).href
  const activationProbe = await probeActivation({ driver, seedUrl })
  if (activationProbe.result !== ACCEPTANCE_RESULTS.nativeSupportingPass) {
    return { activationProbe, journeys: [], result: activationProbe.result }
  }
  const journeys = await runMatrix({ driver, baseUrl, runId, capture })
  return {
    activationProbe,
    journeys,
    result: getNativeSafariMatrixResult(journeys),
  }
}

export function readSafariDriverVersion(output) {
  const match = output.match(/Safari\s+([\d.]+)\s+\(([^)]+)\)/)
  if (!match) throw new Error('Could not read the Safari version from safaridriver')
  return { safari: match[1], build: match[2] }
}

export function validateNativeSafariEnvironment({ platform, safariDriverPath, versionOutput }) {
  if (platform !== 'darwin') throw new Error('Native Safari audit requires macOS')
  if (!safariDriverPath) throw new Error('safaridriver is not available on PATH')
  const version = readSafariDriverVersion(versionOutput)
  return {
    platform,
    safariDriver: safariDriverPath,
    safari: version.safari,
    safariBuild: version.build,
    automationAuthorization: 'unverified',
  }
}

export function parseAuditArgs(args) {
  const options = {
    help: false,
    preflight: false,
    baseUrl: 'http://127.0.0.1:4176/emotid/',
    driverPort: 4444,
  }
  for (const argument of args) {
    if (argument === '--help' || argument === '-h') options.help = true
    else if (argument === '--preflight') options.preflight = true
    else if (argument.startsWith('--base-url=')) options.baseUrl = argument.slice('--base-url='.length)
    else if (argument.startsWith('--driver-port=')) {
      options.driverPort = Number.parseInt(argument.slice('--driver-port='.length), 10)
      if (!Number.isInteger(options.driverPort) || options.driverPort < 1 || options.driverPort > 65535) {
        throw new Error(`Invalid SafariDriver port: ${argument}`)
      }
    } else throw new Error(`Unsupported argument: ${argument}`)
  }
  return options
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
}

async function waitForCondition(driver, script, description, attempts = 40) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await driver.execute(script)) return
    if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Timed out waiting for ${description}`)
}

async function prepareCase(driver, { baseUrl, seedUrl, runToken, language, theme, saveSessions }) {
  const url = new URL(baseUrl)
  url.searchParams.set(RUN_PARAMETER, runToken)
  await driver.navigate(seedUrl)
  const reset = await driver.executeAsync(`
    const language = arguments[0]
    const theme = arguments[1]
    const saveSessions = arguments[2]
    const done = arguments[arguments.length - 1]
    localStorage.clear()
    localStorage.setItem('emot-id-onboarded', 'true')
    localStorage.setItem('emot-id-language', language)
    localStorage.setItem('emot-id-save-sessions', String(saveSessions))
    localStorage.setItem('emot-id-theme', theme)
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
  `, [language, theme, saveSessions])
  if (!reset?.ok) throw new Error(`Candidate reset failed: ${reset?.error ?? 'unknown error'}`)
  await driver.navigate(url.href)
  await driver.waitForElement('css selector', '[data-testid="today-screen"]')
  await waitForCondition(
    driver,
    `return document.documentElement.lang === ${JSON.stringify(language)}
      && document.documentElement.dataset.theme === ${JSON.stringify(theme)}`,
    'candidate language and theme',
  )
  const state = await driver.execute(`return {
    language: document.documentElement.lang,
    theme: document.documentElement.dataset.theme,
    token: new URL(location.href).searchParams.get('${RUN_PARAMETER}'),
  }`)
  if (state.language !== language || state.theme !== theme || state.token !== runToken) {
    throw new Error(`Candidate state mismatch: ${JSON.stringify(state)}`)
  }
}

async function runQuick(driver, language) {
  const copy = COPY[language]
  await click(driver, 'css selector', '[data-testid="quick-feeling-anxiety"]')
  await click(driver, 'css selector', '[data-testid="quick-continue"]')
  await driver.waitForElement('css selector', '[data-testid="reflection-screen"]')
  await driver.waitForElement('css selector', ACCEPTANCE_SELECTORS.saveComplete)
  const heading = await driver.getText(await driver.findElement('css selector', 'h1'))
  if (heading !== copy.reflection) throw new Error(`Unexpected Reflection heading: ${heading}`)
  await click(driver, 'xpath', buttonWithText(copy.explore))
  await driver.waitForElement('css selector', '[data-testid="reflection-exploration-screen"]')
  const aiLink = await driver.findElement('css selector', ACCEPTANCE_SELECTORS.externalAiLink)
  const aiUrl = new URL(await driver.getAttribute(aiLink, 'href'))
  if (aiUrl.searchParams.get('udm') !== '50') throw new Error('External AI link lost udm=50')
}

async function openWordLadder(driver) {
  await click(driver, 'css selector', ACCEPTANCE_SELECTORS.todayGuidedEntry)
  await driver.waitForElement('css selector', '[data-testid="arrival-screen"]')
  await click(driver, 'css selector', '[data-testid="arrival-words"]')
  await driver.waitForElement('css selector', '[data-testid="words-screen"]')
}

async function runWordIntermediate(driver, language) {
  const copy = COPY[language]
  await openWordLadder(driver)
  await click(driver, 'xpath', buttonWithText(copy.happy))
  await click(driver, 'xpath', buttonWithText(copy.playful))
  await click(driver, 'xpath', buttonWithText(copy.continuePlayful))
  await driver.waitForElement('css selector', '[data-testid="reflection-screen"]')
  const result = await driver.getText(await driver.findElement('css selector', '.emotion-heading'))
  if (!result.includes(copy.playful)) throw new Error(`Missing intermediary result: ${result}`)
}

async function runTier4(driver, language) {
  const copy = COPY[language]
  await openWordLadder(driver)
  await click(driver, 'xpath', buttonWithText(copy.tier4Path[0]))
  await click(driver, 'xpath', buttonWithText(copy.tier4Path[1]))
  await click(driver, 'css selector', '.word-path-levels button:last-child')
  for (const label of copy.tier4Path.slice(2)) {
    if (label === copy.tier4Path[2]) await click(driver, 'xpath', buttonWithText(copy.tier4Path[0]))
    await click(driver, 'xpath', buttonWithText(label))
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
}

export async function runNativeSafariMatrix({ driver, baseUrl, runId, capture }) {
  const results = []
  const seedUrl = new URL('/__native-safari-seed.html', baseUrl).href
  for (const entry of NATIVE_SAFARI_CASES) {
    const runToken = `${runId}-${entry.language}-${entry.id}`
    try {
      await prepareCase(driver, {
        baseUrl,
        seedUrl,
        runToken,
        language: entry.language,
        theme: entry.theme,
        saveSessions: entry.id === 'quick',
      })
      if (entry.id === 'quick') await runQuick(driver, entry.language)
      else if (entry.id === 'word-intermediate') await runWordIntermediate(driver, entry.language)
      else await runTier4(driver, entry.language)
      await capture(`${entry.language}-${entry.id}`)
      results.push({ ...entry, result: ACCEPTANCE_RESULTS.nativeSupportingPass })
    } catch (error) {
      await capture(`${entry.language}-${entry.id}-failure`).catch(() => undefined)
      const diagnostic = await driver.execute(`return {
        url: location.href,
        readyState: document.readyState,
        quickPressed: document.querySelector('[data-testid="quick-feeling-anxiety"]')?.getAttribute('aria-pressed') ?? null,
        quickContinue: Boolean(document.querySelector('[data-testid="quick-continue"]')),
        todayScreen: Boolean(document.querySelector('[data-testid="today-screen"]')),
        activeElement: document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName ?? null,
        bodyText: document.body?.innerText?.slice(0, 500) ?? '',
      }`).catch((diagnosticError) => ({ error: String(diagnosticError) }))
      results.push({
        ...entry,
        result: ACCEPTANCE_RESULTS.fail,
        error: String(error),
        diagnostic,
      })
      break
    }
  }
  return results
}
