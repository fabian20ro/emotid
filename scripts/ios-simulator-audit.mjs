#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {
  buildIOSSimulatorMatrix,
  captureNativeScreenshot,
  dismissSafariCoachmark,
  parseIOSSimulatorArgs,
  readProductionAssets,
  runIOSSimulatorCase,
  runIOSSimulatorMatrix,
  validateIOSSimulatorEnvironment,
} from './ios-simulator/audit.mjs'
import { createAppiumClient } from './ios-simulator/driver.mjs'

const usage = `Usage: node scripts/ios-simulator-audit.mjs [options]

Options:
  --preflight                    Validate Xcode, Appium, XCUITest, runtime, and profiles only
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

const entries = buildIOSSimulatorMatrix(options)
const selectedProfiles = [...new Set(entries.map((entry) => entry.profile))]
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

function bootProfile(profile) {
  if (profile.state === 'Booted') return
  exec('/usr/bin/xcrun', ['simctl', 'boot', profile.udid])
  bootedByRunner.push(profile.udid)
  exec('/usr/bin/xcrun', ['simctl', 'bootstatus', profile.udid, '-b'], { timeout: 180_000 })
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
    activeDriver = createAppiumClient({ endpoint: `http://127.0.0.1:${options.appiumPort}` })
    await activeDriver.createSession({
      ...profile,
      initialUrl: new URL('/__native-safari-seed.html', options.baseUrl).href,
    })
    await activeDriver.setTimeouts()
    const nativeUi = await dismissSafariCoachmark(activeDriver)
    report.profiles[profileId] = { ...profile, nativeUi }

    const profileEntries = entries.filter((entry) => entry.profile === profileId)
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
