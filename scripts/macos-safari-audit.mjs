#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {
  parseAuditArgs,
  runNativeSafariAudit,
  validateNativeSafariEnvironment,
} from './macos-safari/audit.mjs'
import { createWebDriverClient } from './macos-safari/driver.mjs'

const usage = `Usage: node scripts/macos-safari-audit.mjs [options]

Options:
  --preflight             Check macOS, safaridriver, and Safari versions without opening Safari
  --base-url=<url>        Candidate URL (default: local production preview)
  --driver-port=<port>    SafariDriver port (default: 4444)
  --help, -h              Show this help without starting Safari

Remote Automation must be authorized before the full audit. This command never enables it.`

let options
try {
  options = parseAuditArgs(process.argv.slice(2))
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

if (options.help) {
  console.log(usage)
  process.exit(0)
}

function readEnvironment() {
  if (process.platform !== 'darwin') {
    return validateNativeSafariEnvironment({
      platform: process.platform,
      safariDriverPath: '',
      versionOutput: '',
    })
  }
  const safariDriverPath = execFileSync('/usr/bin/which', ['safaridriver'], { encoding: 'utf8' }).trim()
  const versionOutput = execFileSync(safariDriverPath, ['--version'], { encoding: 'utf8' }).trim()
  return validateNativeSafariEnvironment({
    platform: process.platform,
    safariDriverPath,
    versionOutput,
  })
}

let environment
try {
  environment = readEnvironment()
} catch (error) {
  console.error(`Native Safari preflight failed: ${error.message}`)
  process.exit(1)
}

if (options.preflight) {
  console.log(JSON.stringify(environment, null, 2))
  process.exit(0)
}

const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
const runId = `safari-${stamp}-${process.pid}`
const outputDir = path.resolve('.reports', 'macos-safari', stamp)
const localPreviewUrl = 'http://127.0.0.1:4176/emotid/'
const startsLocalPreview = options.baseUrl === localPreviewUrl
const children = []
let driver
let report = {
  environment: {
    ...environment,
    capturedAt: new Date().toISOString(),
    candidateUrl: options.baseUrl,
    evidenceClass: 'NATIVE_SUPPORTING_PASS',
    voiceOver: 'not-run',
  },
  result: 'PENDING',
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

async function waitForService(url, child, name, expectedText) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child?.exitCode !== null) {
      throw new Error(`${name} exited before becoming ready: ${child.output.trim()}`)
    }
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      if (expectedText && !(await response.text()).includes(expectedText)) {
        throw new Error(`Missing readiness marker: ${expectedText}`)
      }
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }
  throw new Error(`${name} did not become ready${child?.output ? `: ${child.output.trim()}` : ''}`)
}

async function capture(name) {
  const base64 = await driver.screenshot()
  await writeFile(path.join(outputDir, `${name}.png`), Buffer.from(base64, 'base64'))
}

async function cleanup() {
  try {
    await driver?.close()
  } catch {
    // Report the journey result; session cleanup is best effort.
  }
  for (const child of children.reverse()) {
    if (child.exitCode === null) child.kill('SIGTERM')
  }
}

await mkdir(outputDir, { recursive: true })
try {
  if (startsLocalPreview) {
    const preview = startProcess(process.execPath, ['scripts/macos-safari/server.mjs'])
    await waitForService(
      'http://127.0.0.1:4176/__native-safari-seed.html',
      preview,
      'native Safari production server',
      'Native Safari audit seed',
    )
  }

  console.log('Starting SafariDriver')
  const safariDriver = startProcess(environment.safariDriver, ['--port', String(options.driverPort)])
  const driverEndpoint = `http://127.0.0.1:${options.driverPort}`
  await waitForService(`${driverEndpoint}/status`, safariDriver, 'SafariDriver')
  driver = createWebDriverClient({ endpoint: driverEndpoint })
  await driver.createSession()
  report.environment.automationAuthorization = 'confirmed-by-session'
  const audit = await runNativeSafariAudit({
    driver,
    baseUrl: options.baseUrl,
    runId,
    capture,
  })
  report.activationProbe = audit.activationProbe
  report.journeys = audit.journeys
  report.result = audit.result
  if (report.result !== 'NATIVE_SUPPORTING_PASS') process.exitCode = 1
} catch (error) {
  report.result = 'FAIL'
  report.error = String(error)
  process.exitCode = 1
  console.error(error)
} finally {
  await cleanup()
  await writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(`Native Safari report: ${outputDir}`)
}
