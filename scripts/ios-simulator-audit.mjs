#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {
  buildIOSSimulatorMatrix,
  buildIOSRobustnessMatrix,
  captureNativeScreenshot,
  dismissSafariCoachmark,
  getSafariTextSizeAction,
  parseIOSSimulatorArgs,
  readProductionAssets,
  runIOSSimulatorCase,
  runIOSSimulatorMatrix,
  validateIOSSimulatorEnvironment,
  validateProfileUi,
} from './ios-simulator/audit.mjs'
import { createAppiumClient } from './ios-simulator/driver.mjs'

const usage = `Usage: node scripts/ios-simulator-audit.mjs [options]

Options:
  --preflight                    Validate Xcode, Appium, XCUITest, runtime, and profiles only
  --suite=base|robustness        Select the base or P36 robustness matrix (default: base)
  --case=<id>                    Run one named robustness case (default: all)
  --profile=all|se|17-pro        Simulator profile filter (default: all)
  --language=all|en|ro           Language filter (default: all)
  --journey=all|quick|word-intermediate|save-retry|tier4
  --base-url=<url>               Candidate URL (default: local production build)
  --appium-port=<port>           Appium port (default: 4723)
  --help, -h                     Show help without accessing Simulator or filesystem

The runner preserves Simulator data and restores profiles that it boots to Shutdown.`

let options
try {
  options = parseIOSSimulatorArgs(process.argv.slice(2))
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

if (options.help) {
  console.log(usage)
  process.exit(0)
}

let entries
try {
  entries = options.suite === 'robustness'
    ? buildIOSRobustnessMatrix(options)
    : buildIOSSimulatorMatrix(options)
  if (entries.length === 0) throw new Error('No iOS Simulator rows match the selected filters')
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
const selectedProfiles = [...new Set(entries.map((entry) => entry.profile))]

function exec(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    ...options,
  }).trim()
}

function readEnvironment() {
  if (process.platform !== 'darwin') {
    return validateIOSSimulatorEnvironment({
      platform: process.platform,
      xcodeVersionOutput: '',
      appiumPath: '',
      appiumVersionOutput: '',
      driverList: {},
      runtimes: [],
      devices: {},
    })
  }
  const appiumPath = exec('/usr/bin/which', ['appium'])
  const runtimes = JSON.parse(exec('/usr/bin/xcrun', ['simctl', 'list', 'runtimes', '--json'])).runtimes
  const devices = JSON.parse(exec('/usr/bin/xcrun', ['simctl', 'list', 'devices', '--json'])).devices
  return validateIOSSimulatorEnvironment({
    platform: process.platform,
    xcodeVersionOutput: exec('/usr/bin/xcodebuild', ['-version']),
    appiumPath,
    appiumVersionOutput: exec(appiumPath, ['--version']),
    driverList: JSON.parse(exec(appiumPath, ['driver', 'list', '--installed', '--json'])),
    runtimes,
    devices,
  })
}

let environment
try {
  environment = readEnvironment()
} catch (error) {
  console.error(`iOS Simulator preflight failed: ${error.message}`)
  process.exit(1)
}

if (options.preflight) {
  console.log(JSON.stringify(environment, null, 2))
  process.exit(0)
}

const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
const runId = `ios-${stamp}-${process.pid}`
const outputDir = path.resolve('.reports', 'ios-simulator', stamp)
const localPreviewUrl = 'http://127.0.0.1:4176/emotid/'
const startsLocalPreview = options.baseUrl === localPreviewUrl
const children = []
const bootedByRunner = []
let activeDriver
let appiumManaged = false
let previewManaged = false
let cleanupPromise

let expectedAssets
try {
  expectedAssets = readProductionAssets(await readFile(path.resolve('dist', 'index.html'), 'utf8'))
  if (expectedAssets.length === 0) throw new Error('no JavaScript or CSS assets found')
} catch (error) {
  console.error(`Production build identity unavailable: ${error.message}. Run npm run build first.`)
  process.exit(1)
}

const report = {
  environment: {
    ...environment,
    capturedAt: new Date().toISOString(),
    candidateUrl: options.baseUrl,
    classification: 'SIMULATOR_SUPPORTING_PASS',
    expectedAssets,
    gitHead: exec('/usr/bin/git', ['rev-parse', 'HEAD']),
    gitDirty: Boolean(exec('/usr/bin/git', ['status', '--porcelain'])),
    selectedProfiles,
    selectedLanguages: [...new Set(entries.map((entry) => entry.language))],
    selectedJourneys: [...new Set(entries.map((entry) => entry.journey))],
    suite: options.suite,
    voiceOver: 'not-run',
  },
  profiles: {},
  journeys: [],
}

function startProcess(command, args) {
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
  child.output = ''
  child.stdout.on('data', (chunk) => { child.output += chunk })
  child.stderr.on('data', (chunk) => { child.output += chunk })
  children.push(child)
  return child
}

async function serviceReady(url, expectedText) {
  try {
    const response = await fetch(url)
    if (!response.ok) return false
    if (expectedText && !(await response.text()).includes(expectedText)) return false
    return true
  } catch {
    return false
  }
}

async function waitForService(url, child, name, expectedText) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child?.exitCode !== null) {
      throw new Error(`${name} exited before becoming ready: ${child.output.trim()}`)
    }
    if (await serviceReady(url, expectedText)) return
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`${name} did not become ready${child?.output ? `: ${child.output.trim()}` : ''}`)
}

async function ensurePreview() {
  if (!startsLocalPreview) return
  const seedUrl = 'http://127.0.0.1:4176/__native-safari-seed.html'
  if (await serviceReady(seedUrl, 'Native Safari audit seed')) return
  const preview = startProcess(process.execPath, ['scripts/macos-safari/server.mjs'])
  previewManaged = true
  await waitForService(seedUrl, preview, 'native production server', 'Native Safari audit seed')
}

async function ensureAppium() {
  const statusUrl = `http://127.0.0.1:${options.appiumPort}/status`
  if (await serviceReady(statusUrl)) return
  console.log('Starting Appium')
  const appium = startProcess(environment.appiumPath, [
    '--port', String(options.appiumPort),
    '--base-path', '/',
    '--log-level', 'warn',
  ])
  appiumManaged = true
  await waitForService(statusUrl, appium, 'Appium')
}

async function setSafariTextSize(profile, targetPercent) {
  resetSafariUi(profile)
  const driver = createAppiumClient({ endpoint: `http://127.0.0.1:${options.appiumPort}` })
  let initialValue
  try {
    await driver.createSession({
      ...profile,
      initialUrl: options.baseUrl,
    })
    await driver.setTimeouts()
    await driver.setContext('NATIVE_APP')
    const close = await driver.findElementOptional(
      '-ios predicate string',
      "label == 'Close' AND visible == 1",
    )
    if (close) await driver.click(close)
    const pageMenu = await driver.waitForElement(
      '-ios predicate string',
      "name == 'PageFormatMenuButton' AND visible == 1",
    )
    await driver.click(pageMenu)
    const size = await driver.waitForElement(
      '-ios predicate string',
      "name == 'Text size' AND visible == 1",
    )
    const increment = await driver.waitForElement(
      '-ios predicate string',
      "name == 'Increment' AND visible == 1",
    )
    const decrement = await driver.waitForElement(
      '-ios predicate string',
      "name == 'Decrement' AND visible == 1",
    )
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const currentValue = await driver.getAttribute(size, 'value')
      if (!initialValue) initialValue = currentValue
      const action = getSafariTextSizeAction(currentValue, targetPercent)
      if (action === 'done') {
        const appTitle = await driver.waitForElement(
          '-ios predicate string',
          "type == 'XCUIElementTypeStaticText' AND label == 'Emot-ID' AND visible == 1",
        )
        await driver.click(appTitle)
        return { initialValue, finalValue: currentValue }
      }
      await driver.click(action === 'increment' ? increment : decrement)
    }
    throw new Error(`Safari text size did not reach ${targetPercent}% from ${initialValue}`)
  } finally {
    await driver.close().catch(() => undefined)
  }
}

function resetSafariUi(profile) {
  try {
    exec('/usr/bin/xcrun', ['simctl', 'terminate', profile.udid, 'com.apple.mobilesafari'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    // Safari may not be running.
  }
}

function bootProfile(profile) {
  if (readProfileState(profile) !== 'Booted') {
    exec('/usr/bin/xcrun', ['simctl', 'boot', profile.udid])
    if (profile.state !== 'Booted') bootedByRunner.push(profile.udid)
  }
  exec('/usr/bin/xcrun', ['simctl', 'bootstatus', profile.udid, '-b'], { timeout: 180_000 })
}

function readProfileState(profile) {
  const devices = JSON.parse(exec('/usr/bin/xcrun', ['simctl', 'list', 'devices', '--json'])).devices
  return Object.values(devices).flat().find((device) => device.udid === profile.udid)?.state
}

function waitForProfileState(profile, expectedState, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (readProfileState(profile) === expectedState) return
    if (attempt + 1 < attempts) exec('/bin/sleep', ['0.25'])
  }
  throw new Error(`Simulator ${profile.deviceName} did not reach ${expectedState}`)
}

function readProfileUi(profile) {
  return validateProfileUi({
    appearance: exec('/usr/bin/xcrun', ['simctl', 'ui', profile.udid, 'appearance']),
    contentSize: exec('/usr/bin/xcrun', ['simctl', 'ui', profile.udid, 'content_size']),
  })
}

function setProfileUi(profile, entry) {
  exec('/usr/bin/xcrun', ['simctl', 'ui', profile.udid, 'appearance', entry.appearance ?? 'light'])
  exec('/usr/bin/xcrun', ['simctl', 'ui', profile.udid, 'content_size', entry.contentSize ?? 'large'])
}

function restoreProfileUi(profile, originalUi) {
  exec('/usr/bin/xcrun', ['simctl', 'ui', profile.udid, 'appearance', originalUi.appearance])
  exec('/usr/bin/xcrun', ['simctl', 'ui', profile.udid, 'content_size', originalUi.contentSize])
}

async function capture(name) {
  const base64 = await captureNativeScreenshot(activeDriver)
  const filename = `${name}.png`
  await writeFile(path.join(outputDir, filename), Buffer.from(base64, 'base64'))
  return filename
}

async function cleanup() {
  if (cleanupPromise) return cleanupPromise
  cleanupPromise = (async () => {
    try {
      await activeDriver?.close()
    } catch {
      // Preserve the journey failure; session cleanup is best effort.
    }
    activeDriver = undefined
    for (const child of children.reverse()) {
      if (child.exitCode === null) {
        child.kill('SIGTERM')
        await Promise.race([
          new Promise((resolve) => child.once('exit', resolve)),
          new Promise((resolve) => setTimeout(resolve, 5_000)),
        ])
        if (child.exitCode === null) child.kill('SIGKILL')
      }
    }
    for (const udid of bootedByRunner.reverse()) {
      try {
        exec('/usr/bin/xcrun', ['simctl', 'shutdown', udid])
        const profile = Object.values(environment.profiles).find((candidate) => candidate.udid === udid)
        if (profile) waitForProfileState(profile, 'Shutdown')
      } catch {
        // Report cleanup state without hiding test results.
      }
    }
  })()
  return cleanupPromise
}

await mkdir(outputDir, { recursive: true })
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    report.interrupted = signal
    await cleanup()
    await writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
    process.exit(130)
  })
}
try {
  await ensurePreview()
  await ensureAppium()
  report.environment.managedServices = { appium: appiumManaged, preview: previewManaged }

  for (const profileId of selectedProfiles) {
    const profile = environment.profiles[profileId]
    bootProfile(profile)
    const profileEntries = entries.filter((entry) => entry.profile === profileId)
    if (options.suite === 'base') {
      resetSafariUi(profile)
      activeDriver = createAppiumClient({ endpoint: `http://127.0.0.1:${options.appiumPort}` })
      await activeDriver.createSession({
        ...profile,
        initialUrl: new URL('/__native-safari-seed.html', options.baseUrl).href,
      })
      await activeDriver.setTimeouts()
      const nativeUi = await dismissSafariCoachmark(activeDriver)
      report.profiles[profileId] = { ...profile, nativeUi }
      report.journeys.push(...await runIOSSimulatorMatrix({
        entries: profileEntries,
        execute: (entry) => runIOSSimulatorCase({
          driver: activeDriver,
          entry,
          baseUrl: options.baseUrl,
          expectedAssets,
          runId,
        }),
        capture,
      }))
      await activeDriver.close()
      activeDriver = undefined
      continue
    }
    const originalUi = readProfileUi(profile)
    let pendingPageZoomRestore
    report.profiles[profileId] = { ...profile, originalUi, pageZoomTransitions: [] }
    try {
      for (const entry of profileEntries) {
        if (entry.textZoomPercent) {
          const transition = await setSafariTextSize(profile, entry.textZoomPercent)
          pendingPageZoomRestore = Number.parseInt(transition.initialValue, 10)
          report.profiles[profileId].pageZoomTransitions.push({
            caseId: entry.caseId,
            from: transition.initialValue,
            to: transition.finalValue,
          })
        }
        setProfileUi(profile, entry)
        resetSafariUi(profile)
        activeDriver = createAppiumClient({ endpoint: `http://127.0.0.1:${options.appiumPort}` })
        await activeDriver.createSession({
          ...profile,
          initialUrl: new URL('/__native-safari-seed.html', options.baseUrl).href,
        })
        await activeDriver.setTimeouts()
        const nativeUi = await dismissSafariCoachmark(activeDriver)
        if (!report.profiles[profileId].nativeUi) report.profiles[profileId].nativeUi = nativeUi
        if (entry.orientation) await activeDriver.setOrientation(entry.orientation)
        const [result] = await runIOSSimulatorMatrix({
          entries: [entry],
          execute: (selectedEntry) => runIOSSimulatorCase({
            driver: activeDriver,
            entry: selectedEntry,
            baseUrl: options.baseUrl,
            expectedAssets,
            runId,
          }),
          capture,
        })
        report.journeys.push(result)
        await activeDriver.setOrientation('PORTRAIT')
        await activeDriver.close()
        activeDriver = undefined
        if (pendingPageZoomRestore !== undefined) {
          const restoredZoom = await setSafariTextSize(profile, pendingPageZoomRestore)
          report.profiles[profileId].restoredPageZoom = restoredZoom.finalValue
          pendingPageZoomRestore = undefined
        }
      }
    } finally {
      try {
        await activeDriver?.setOrientation('PORTRAIT')
      } catch {
        // Session cleanup below remains best effort.
      }
      try {
        await activeDriver?.close()
      } catch {
        // Preserve the journey failure.
      }
      activeDriver = undefined
      if (pendingPageZoomRestore !== undefined) {
        try {
          const restoredZoom = await setSafariTextSize(profile, pendingPageZoomRestore)
          report.profiles[profileId].restoredPageZoom = restoredZoom.finalValue
        } catch (error) {
          report.profiles[profileId].pageZoomRestoreError = String(error)
        }
      }
      restoreProfileUi(profile, originalUi)
      report.profiles[profileId].restoredUi = readProfileUi(profile)
    }
  }
  if (report.journeys.some((journey) => journey.result === 'FAIL')) process.exitCode = 1
} catch (error) {
  report.error = String(error)
  process.exitCode = 1
  console.error(error)
} finally {
  await cleanup()
  await writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(`iOS Simulator report: ${outputDir}`)
}
