import { JOURNEY_IDS } from './journeys.mjs'

export const WEBAPK_PACKAGE = 'org.chromium.webapk.a43b49e294110560b_v2'
const TALKBACK_PACKAGE = 'com.google.android.marvin.talkback'

export function parseAndroidPhysicalArgs(args, environment = process.env) {
  const options = {
    help: false,
    preflight: false,
    mode: 'browser',
    suite: 'all',
    journey: undefined,
    candidateUrl: environment.PHYSICAL_CANDIDATE_URL ?? 'https://fabian20ro.github.io/emotid/',
  }

  for (const argument of args) {
    if (argument === '--help') options.help = true
    else if (argument === '--preflight') options.preflight = true
    else if (argument.startsWith('--mode=')) options.mode = argument.slice('--mode='.length)
    else if (argument.startsWith('--suite=')) options.suite = argument.slice('--suite='.length)
    else if (argument.startsWith('--journey=')) options.journey = argument.slice('--journey='.length).toLowerCase()
    else if (argument.startsWith('--candidate-url=')) {
      options.candidateUrl = argument.slice('--candidate-url='.length)
    } else throw new Error(`Unsupported argument: ${argument}`)
  }

  if (!['browser', 'installed'].includes(options.mode)) throw new Error(`Unsupported mode: ${options.mode}`)
  if (!['all', 'journeys', 'performance'].includes(options.suite)) {
    throw new Error(`Unsupported suite: ${options.suite}`)
  }
  if (options.journey && !JOURNEY_IDS.includes(options.journey)) {
    throw new Error(`Unsupported journey: ${options.journey}`)
  }
  if (options.journey && options.suite !== 'journeys') {
    throw new Error('--journey requires the journeys suite')
  }

  let candidate
  try {
    candidate = new URL(options.candidateUrl)
  } catch {
    throw new Error(`Invalid candidate URL: ${options.candidateUrl}`)
  }
  if (!['http:', 'https:'].includes(candidate.protocol)) {
    throw new Error(`Unsupported candidate protocol: ${candidate.protocol}`)
  }
  if (!candidate.pathname.endsWith('/')) candidate.pathname += '/'
  options.candidateUrl = candidate.href
  return options
}

export function inspectAndroidPhysicalEnvironment({
  adbDevicesOutput,
  trustState,
  model,
  android,
  api,
  build,
  enabledServices,
  accessibilityDump,
  inputDump,
  packageList,
  forwardList,
}) {
  const devices = adbDevicesOutput.split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('List of devices'))
    .map((line) => {
      const [serial, state] = line.split(/\s+/, 2)
      return { serial, state }
    })
  if (devices.length !== 1) {
    throw new Error(`Expected exactly one attached Android device, found ${devices.length}`)
  }
  if (devices[0].state !== 'device') {
    throw new Error(`Android device ${devices[0].serial} is ${devices[0].state}; expected authorized state device`)
  }

  const talkBackEnabled = enabledServices?.includes(TALKBACK_PACKAGE) ?? false
  return {
    ...devices[0],
    model: model.trim(),
    android: android.trim(),
    api: api.trim(),
    build: build.trim(),
    locked: !/deviceLocked=0\b/.test(trustState),
    talkBack: {
      enabled: talkBackEnabled,
      bound: talkBackEnabled && /TalkBackService/.test(accessibilityDump),
      touchExploration: /touchExplorationEnabled=true\b/.test(accessibilityDump),
    },
    externalAlphabeticKeyboard: inputDump.split(/(?=Input device\s+\d+:)/)
      .some((device) => /IsExternal:\s+true\b/.test(device) && /KeyboardType:\s+2\b/.test(device)),
    webApkInstalled: packageList.split('\n').some((line) => line.trim() === `package:${WEBAPK_PACKAGE}`),
    cdpPortAvailable: !forwardList.split('\n').some((line) => line.trim().split(/\s+/)[1] === 'tcp:9222'),
  }
}

export function validateAndroidPhysicalEnvironment(environment, { mode, suite }) {
  if (environment.locked) throw new Error('Unlock the Android device before starting the physical audit')
  if (!environment.cdpPortAvailable) throw new Error('ADB forward tcp:9222 is already in use')
  if (mode === 'installed' && !environment.webApkInstalled) {
    throw new Error(`Required installed WebAPK is unavailable: ${WEBAPK_PACKAGE}`)
  }
  if (suite !== 'journeys' && environment.talkBack.enabled) {
    throw new Error('Disable TalkBack before collecting physical performance evidence')
  }
  return environment
}
