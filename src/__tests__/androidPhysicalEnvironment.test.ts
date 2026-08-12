import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

const moduleUrl = pathToFileURL(
  path.resolve(process.cwd(), 'scripts/android-physical/environment.mjs'),
).href

async function loadEnvironment() {
  return import(moduleUrl)
}

describe('Android physical environment boundary', () => {
  it('parses strict options without truncating candidate query values', async () => {
    const { parseAndroidPhysicalArgs } = await loadEnvironment()

    expect(parseAndroidPhysicalArgs([
      '--preflight',
      '--mode=installed',
      '--suite=journeys',
      '--journey=j8',
      '--candidate-url=http://127.0.0.1:4173/emotid/?fixture=a=b',
    ])).toEqual({
      help: false,
      preflight: true,
      mode: 'installed',
      suite: 'journeys',
      journey: 'j8',
      candidateUrl: 'http://127.0.0.1:4173/emotid/?fixture=a=b',
    })
    expect(parseAndroidPhysicalArgs([], { PHYSICAL_CANDIDATE_URL: 'https://candidate.test/app' }).candidateUrl)
      .toBe('https://candidate.test/app/')
    expect(() => parseAndroidPhysicalArgs(['--suite=performance', '--journey=j6']))
      .toThrow('--journey requires the journeys suite')
    expect(() => parseAndroidPhysicalArgs(['--candidate-url=file:///tmp/app']))
      .toThrow('Unsupported candidate protocol: file:')
    expect(() => parseAndroidPhysicalArgs(['--unknown']))
      .toThrow('Unsupported argument: --unknown')
  })

  it('reports the exact connected-device accessibility and input capabilities', async () => {
    const { inspectAndroidPhysicalEnvironment } = await loadEnvironment()

    expect(inspectAndroidPhysicalEnvironment({
      adbDevicesOutput: 'List of devices attached\n25121JEGR11385 device usb:1 model:Pixel_6a transport_id:1\n',
      trustState: 'deviceLocked=0',
      model: 'Pixel 6a',
      android: '17',
      api: '37',
      build: 'google/bluejay:17/build',
      enabledServices: 'com.google.android.marvin.talkback/com.google.android.marvin.talkback.TalkBackService',
      accessibilityDump: 'touchExplorationEnabled=true\nBound services:{ TalkBackService }',
      inputDump: 'Input device 4:\n  IsExternal: true\n  KeyboardType: 2\n',
      packageList: 'package:com.android.chrome\npackage:org.chromium.webapk.a43b49e294110560b_v2\n',
      forwardList: '',
    })).toEqual({
      serial: '25121JEGR11385',
      state: 'device',
      model: 'Pixel 6a',
      android: '17',
      api: '37',
      build: 'google/bluejay:17/build',
      locked: false,
      talkBack: { enabled: true, bound: true, touchExploration: true },
      externalAlphabeticKeyboard: true,
      webApkInstalled: true,
      cdpPortAvailable: true,
    })
  })

  it('fails fast on ambiguous devices and invalid selected-mode readiness', async () => {
    const { inspectAndroidPhysicalEnvironment, validateAndroidPhysicalEnvironment } = await loadEnvironment()
    const input = {
      trustState: 'deviceLocked=0', model: 'Pixel', android: '17', api: '37', build: 'build',
      enabledServices: 'null', accessibilityDump: 'touchExplorationEnabled=false',
      inputDump: 'IsExternal: false\nKeyboardType: 2', packageList: 'package:com.android.chrome',
      forwardList: '',
    }

    expect(() => inspectAndroidPhysicalEnvironment({
      ...input,
      adbDevicesOutput: 'List of devices attached\na device\nb device\n',
    })).toThrow('Expected exactly one attached Android device, found 2')
    expect(() => inspectAndroidPhysicalEnvironment({
      ...input,
      adbDevicesOutput: 'List of devices attached\na unauthorized usb:1\n',
    })).toThrow('Android device a is unauthorized; expected authorized state device')

    const environment = inspectAndroidPhysicalEnvironment({
      ...input,
      adbDevicesOutput: 'List of devices attached\na device\n',
    })
    expect(() => validateAndroidPhysicalEnvironment({ ...environment, locked: true }, {
      mode: 'browser', suite: 'journeys',
    })).toThrow('Unlock the Android device')
    expect(() => validateAndroidPhysicalEnvironment(environment, {
      mode: 'installed', suite: 'journeys',
    })).toThrow('Required installed WebAPK is unavailable')
    expect(() => validateAndroidPhysicalEnvironment({
      ...environment, talkBack: { enabled: true, bound: true, touchExploration: true },
    }, { mode: 'browser', suite: 'performance' })).toThrow('Disable TalkBack')
    expect(() => validateAndroidPhysicalEnvironment({ ...environment, cdpPortAvailable: false }, {
      mode: 'browser', suite: 'journeys',
    })).toThrow('ADB forward tcp:9222 is already in use')
  })
})
