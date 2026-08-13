import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'

const auditScript = path.resolve(process.cwd(), 'scripts/ios-simulator-audit.mjs')
const auditModuleUrl = pathToFileURL(
  path.resolve(process.cwd(), 'scripts/ios-simulator/audit.mjs'),
).href
const driverModuleUrl = pathToFileURL(
  path.resolve(process.cwd(), 'scripts/ios-simulator/driver.mjs'),
).href
const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('iOS Simulator Safari audit', () => {
  it('boots idempotently across an external Simulator state race', async () => {
    const { bootSimulatorIfNeeded } = await import(auditModuleUrl)
    const boot = vi.fn()

    expect(bootSimulatorIfNeeded({ readState: () => 'Booted', boot })).toBe(false)
    expect(boot).not.toHaveBeenCalled()

    expect(bootSimulatorIfNeeded({ readState: () => 'Shutdown', boot })).toBe(true)

    const racingBoot = vi.fn(() => { throw new Error('already booted') })
    const racingStates = vi.fn()
      .mockReturnValueOnce('Shutdown')
      .mockReturnValueOnce('Booted')
    expect(bootSimulatorIfNeeded({ readState: racingStates, boot: racingBoot })).toBe(false)

    expect(() => bootSimulatorIfNeeded({
      readState: () => 'Shutdown',
      boot: () => { throw new Error('boot failed') },
    })).toThrow('boot failed')
  })

  it('builds the exact bounded bilingual matrix', async () => {
    const { buildIOSSimulatorMatrix } = await import(auditModuleUrl)

    const matrix = buildIOSSimulatorMatrix({})
    expect(matrix).toHaveLength(16)
    expect(matrix.map((entry: { profile: string; language: string; journey: string }) => (
      `${entry.profile}-${entry.language}-${entry.journey}`
    ))).toEqual([
      'se-en-quick',
      'se-en-word-intermediate',
      'se-en-save-retry',
      'se-en-tier4',
      'se-ro-quick',
      'se-ro-word-intermediate',
      'se-ro-save-retry',
      'se-ro-tier4',
      '17-pro-en-quick',
      '17-pro-en-word-intermediate',
      '17-pro-en-save-retry',
      '17-pro-en-tier4',
      '17-pro-ro-quick',
      '17-pro-ro-word-intermediate',
      '17-pro-ro-save-retry',
      '17-pro-ro-tier4',
    ])
    expect(buildIOSSimulatorMatrix({ profile: 'se', language: 'ro', journey: 'tier4' }))
      .toEqual([{ profile: 'se', language: 'ro', journey: 'tier4', acceptanceId: 'j8' }])
  })

  it('builds a complete canonical J1-J9 Simulator acceptance matrix', async () => {
    const {
      buildIOSAcceptanceMatrix,
      IOS_SIMULATOR_ACCEPTANCE_ADAPTER,
      IOS_SIMULATOR_ACCEPTANCE_JOURNEYS,
    } = await import(auditModuleUrl)

    expect(IOS_SIMULATOR_ACCEPTANCE_ADAPTER).toMatchObject({
      journeyIds: ['j1', 'j2', 'j3', 'j4', 'j5', 'j6', 'j7', 'j8', 'j9'],
      resultClass: 'SIMULATOR_SUPPORTING_PASS',
      complete: true,
    })
    expect(IOS_SIMULATOR_ACCEPTANCE_JOURNEYS).toEqual([
      'onboarding-focus',
      'settings-replay',
      'affect',
      'body',
      'word-intermediate',
      'save-retry',
      'history-delete',
      'tier4',
      'quick',
    ])

    const matrix = buildIOSAcceptanceMatrix({})
    expect(matrix).toHaveLength(36)
    expect(matrix[0]).toEqual({
      profile: 'se', language: 'en', journey: 'onboarding-focus', acceptanceId: 'j1',
    })
    expect(matrix.at(-1)).toEqual({
      profile: '17-pro', language: 'ro', journey: 'quick', acceptanceId: 'j9',
    })
    expect(buildIOSAcceptanceMatrix({ profile: '17-pro', language: 'ro', journey: 'history-delete' }))
      .toEqual([{ profile: '17-pro', language: 'ro', journey: 'history-delete', acceptanceId: 'j7' }])
  })

  it('builds a bounded risk-based robustness matrix instead of a Cartesian product', async () => {
    const { buildIOSRobustnessMatrix } = await import(auditModuleUrl)

    expect(buildIOSRobustnessMatrix({})).toEqual([
      {
        caseId: 'se-onboarding-focus', acceptanceId: 'j1',
        profile: 'se', language: 'en', journey: 'onboarding-focus',
        orientation: 'PORTRAIT', appearance: 'light', contentSize: 'large', theme: 'light',
      },
      {
        caseId: 'se-landscape-quick-ro', acceptanceId: 'j9',
        profile: 'se', language: 'ro', journey: 'quick',
        orientation: 'LANDSCAPE', appearance: 'light', contentSize: 'large', theme: 'light',
      },
      {
        caseId: '17-pro-landscape-tier4-ro', acceptanceId: 'j8',
        profile: '17-pro', language: 'ro', journey: 'tier4',
        orientation: 'LANDSCAPE', appearance: 'light', contentSize: 'large', theme: 'light',
      },
      {
        caseId: 'se-dark-word-ro', acceptanceId: 'j5',
        profile: 'se', language: 'ro', journey: 'word-intermediate',
        orientation: 'PORTRAIT', appearance: 'dark', contentSize: 'large', theme: 'dark',
      },
      {
        caseId: 'se-text-quick-ro', acceptanceId: 'j9',
        profile: 'se', language: 'ro', journey: 'quick',
        orientation: 'PORTRAIT', appearance: 'light', contentSize: 'accessibility-large', theme: 'light',
        textZoomPercent: 200,
      },
      {
        caseId: 'se-text-tier4-ro', acceptanceId: 'j8',
        profile: 'se', language: 'ro', journey: 'tier4',
        orientation: 'PORTRAIT', appearance: 'light', contentSize: 'accessibility-large', theme: 'light',
        textZoomPercent: 200,
      },
    ])
    expect(buildIOSRobustnessMatrix({ caseId: 'se-dark-word-ro' })).toHaveLength(1)
    expect(() => buildIOSRobustnessMatrix({ caseId: 'unknown' })).toThrow('Unsupported robustness case')
  })

  it('selects bounded Safari text-size adjustments without guessing native control counts', async () => {
    const { getSafariTextSizeAction } = await import(auditModuleUrl)

    expect(getSafariTextSizeAction('100%', 200)).toBe('increment')
    expect(getSafariTextSizeAction('200%', 100)).toBe('decrement')
    expect(getSafariTextSizeAction('125%', 125)).toBe('done')
    expect(() => getSafariTextSizeAction('unknown', 200)).toThrow('Invalid Safari text size transition')
  })

  it('parses strict filters before any Simulator side effect', async () => {
    const { parseIOSSimulatorArgs } = await import(auditModuleUrl)

    expect(parseIOSSimulatorArgs([
      '--suite=robustness',
      '--case=se-dark-word-ro',
      '--profile=se',
      '--language=ro',
      '--journey=save-retry',
      '--appium-port=4725',
    ])).toMatchObject({
      profile: 'se',
      language: 'ro',
      journey: 'save-retry',
      appiumPort: 4725,
      suite: 'robustness',
      caseId: 'se-dark-word-ro',
    })
    expect(parseIOSSimulatorArgs([
      '--suite=acceptance',
      '--profile=17-pro',
      '--language=ro',
      '--journey=settings-replay',
    ])).toMatchObject({
      suite: 'acceptance',
      profile: '17-pro',
      language: 'ro',
      journey: 'settings-replay',
    })
    expect(() => parseIOSSimulatorArgs(['--profile=mini'])).toThrow('Unsupported profile: mini')
    expect(() => parseIOSSimulatorArgs(['--journey=j10'])).toThrow('Unsupported journey: j10')
    expect(() => parseIOSSimulatorArgs(['--suite=all'])).toThrow('Unsupported suite: all')
    expect(() => parseIOSSimulatorArgs(['--appium-port=0'])).toThrow('Invalid Appium port')
    expect(() => parseIOSSimulatorArgs(['--base-url=https://example.com/emotid/']))
      .toThrow('Candidate URL must use a loopback host')
    expect(() => parseIOSSimulatorArgs(['--unknown'])).toThrow('Unsupported argument: --unknown')
  })

  it('dispatches every acceptance journey explicitly and fails fast on drift', async () => {
    const { IOS_SIMULATOR_ACCEPTANCE_JOURNEYS, resolveIOSSimulatorJourney } = await import(auditModuleUrl)

    for (const journey of IOS_SIMULATOR_ACCEPTANCE_JOURNEYS) {
      expect(resolveIOSSimulatorJourney(journey)).toEqual(expect.any(Function))
    }
    expect(() => resolveIOSSimulatorJourney('unknown')).toThrow('Unsupported iOS Simulator journey: unknown')
  })

  it('validates Xcode, Appium, XCUITest, runtime, and both named profiles', async () => {
    const { validateIOSSimulatorEnvironment } = await import(auditModuleUrl)
    const runtime = 'com.apple.CoreSimulator.SimRuntime.iOS-26-5'

    expect(validateIOSSimulatorEnvironment({
      platform: 'darwin',
      xcodeVersionOutput: 'Xcode 26.6\nBuild version 17F113',
      appiumPath: '/opt/homebrew/bin/appium',
      appiumVersionOutput: '3.6.0',
      driverList: { xcuitest: { version: '12.3.1', installed: true } },
      runtimes: [{ identifier: runtime, version: '26.5', isAvailable: true }],
      devices: {
        [runtime]: [
          { name: 'Emot-ID iPhone SE', udid: 'se-udid', state: 'Shutdown', isAvailable: true },
          { name: 'Emot-ID iPhone 17 Pro', udid: 'pro-udid', state: 'Booted', isAvailable: true },
        ],
      },
    })).toEqual({
      platform: 'darwin',
      xcode: '26.6',
      xcodeBuild: '17F113',
      appium: '3.6.0',
      appiumPath: '/opt/homebrew/bin/appium',
      xcuitest: '12.3.1',
      profiles: {
        se: {
          deviceName: 'Emot-ID iPhone SE',
          platformVersion: '26.5',
          runtime,
          state: 'Shutdown',
          udid: 'se-udid',
        },
        '17-pro': {
          deviceName: 'Emot-ID iPhone 17 Pro',
          platformVersion: '26.5',
          runtime,
          state: 'Booted',
          udid: 'pro-udid',
        },
      },
    })
  })

  it('fails preflight on an unavailable required capability', async () => {
    const { validateIOSSimulatorEnvironment } = await import(auditModuleUrl)

    expect(() => validateIOSSimulatorEnvironment({
      platform: 'linux',
      xcodeVersionOutput: '',
      appiumPath: '',
      appiumVersionOutput: '',
      driverList: {},
      runtimes: [],
      devices: {},
    })).toThrow('iOS Simulator audit requires macOS')
  })

  it('validates exact local production assets and mobile geometry', async () => {
    const { readProductionAssets, validateCandidateSurface, validateRobustnessSurface } = await import(auditModuleUrl)
    const assets = readProductionAssets(`
      <link rel="stylesheet" href="/emotid/assets/index-style.css">
      <script type="module" src="/emotid/assets/index-app.js"></script>
    `)

    expect(assets).toEqual(['index-app.js', 'index-style.css'])
    expect(validateCandidateSurface({
      expectedAssets: assets,
      actualAssets: ['index-style.css', 'index-app.js'],
      language: 'ro',
      expectedLanguage: 'ro',
      token: 'run-token',
      expectedToken: 'run-token',
      viewport: { width: 375, height: 549, dpr: 2 },
      scrollWidth: 375,
      headingFocused: true,
      heading: { top: 20, bottom: 90 },
      undersizedActions: [],
    })).toMatchObject({ width: 375, height: 549, dpr: 2 })

    expect(() => validateCandidateSurface({
      expectedAssets: assets,
      actualAssets: ['stale.js'],
      language: 'en',
      expectedLanguage: 'en',
      token: 'run-token',
      expectedToken: 'run-token',
      viewport: { width: 375, height: 549, dpr: 2 },
      scrollWidth: 390,
      headingFocused: false,
      heading: { top: 20, bottom: 90 },
      undersizedActions: [],
    })).toThrow('Candidate asset mismatch')

    const valid = {
      expectedAssets: assets,
      actualAssets: assets,
      language: 'en',
      expectedLanguage: 'en',
      token: 'run-token',
      expectedToken: 'run-token',
      viewport: { width: 375, height: 549, dpr: 2 },
      scrollWidth: 375,
      headingFocused: true,
      heading: { top: 20, bottom: 90 },
      undersizedActions: [],
    }
    expect(() => validateCandidateSurface({ ...valid, scrollWidth: 390 }))
      .toThrow('Horizontal overflow')
    expect(() => validateCandidateSurface({ ...valid, headingFocused: false }))
      .toThrow('Destination heading does not own programmatic focus')
    expect(() => validateCandidateSurface({ ...valid, undersizedActions: ['Continue'] }))
      .toThrow('Primary action below 44px')

    const robustness = {
      expectedOrientation: 'LANDSCAPE',
      orientation: 'LANDSCAPE',
      expectedTheme: 'dark',
      theme: 'dark',
      viewport: { width: 667, height: 287, offsetLeft: 0, offsetTop: 0, dpr: 2 },
      shell: { left: 0, right: 667, top: 0, bottom: 287 },
      outline: { style: 'none', width: 0, color: 'rgb(0, 0, 0)' },
    }
    expect(validateRobustnessSurface(robustness)).toMatchObject({ orientation: 'LANDSCAPE', theme: 'dark' })
    expect(() => validateRobustnessSurface({ ...robustness, orientation: 'PORTRAIT' }))
      .toThrow('Orientation mismatch')
    expect(() => validateRobustnessSurface({ ...robustness, shell: { ...robustness.shell, right: 700 } }))
      .toThrow('Application shell crosses the visual viewport')
    expect(() => validateRobustnessSurface({
      ...robustness,
      outline: { style: 'solid', width: 3, color: 'rgb(0, 0, 255)' },
    })).toThrow('Programmatic heading has a visible noninteractive outline')
  })

  it('dismisses known Safari UI and switches explicitly to web context', async () => {
    const { dismissSafariCoachmark } = await import(auditModuleUrl)
    const events: string[] = []
    const driver = {
      setContext: vi.fn(async (name: string) => { events.push(`context:${name}`) }),
      findElementOptional: vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce('close'),
      click: vi.fn(async (element: string) => { events.push(`click:${element}`) }),
      waitForWebContext: vi.fn(async () => 'WEBVIEW_42'),
    }

    await expect(dismissSafariCoachmark(driver)).resolves.toEqual({
      dismissed: true,
      webContext: 'WEBVIEW_42',
    })
    expect(events).toEqual(['context:NATIVE_APP', 'click:close', 'context:WEBVIEW_42'])
  })

  it('fails fast when stale native Safari UI would contaminate web evidence', async () => {
    const { dismissSafariCoachmark } = await import(auditModuleUrl)
    const driver = {
      setContext: vi.fn(async () => undefined),
      findElementOptional: vi.fn(async () => 'share-sheet'),
      click: vi.fn(async () => undefined),
      waitForWebContext: vi.fn(async () => 'WEBVIEW_42'),
    }

    await expect(dismissSafariCoachmark(driver)).rejects.toThrow(
      'Stale Safari share sheet is covering the candidate',
    )
    expect(driver.click).not.toHaveBeenCalled()
    expect(driver.waitForWebContext).not.toHaveBeenCalled()
  })

  it('waits for two aligned visual viewport samples after native orientation changes', async () => {
    const { waitForStableVisualViewport } = await import(auditModuleUrl)
    const driver = {
      execute: vi.fn()
        .mockResolvedValueOnce({ layoutWidth: 874, viewportWidth: 750 })
        .mockResolvedValueOnce({ layoutWidth: 874, viewportWidth: 874 })
        .mockResolvedValueOnce({ layoutWidth: 874, viewportWidth: 874 }),
    }

    await expect(waitForStableVisualViewport(driver, { attempts: 3, delayMs: 0 }))
      .resolves.toEqual({ layoutWidth: 874, viewportWidth: 874 })
    expect(driver.execute).toHaveBeenCalledTimes(3)

    await expect(waitForStableVisualViewport({
      execute: vi.fn(async () => ({ layoutWidth: 874, viewportWidth: 750 })),
    }, { attempts: 2, delayMs: 0 })).rejects.toThrow('Timed out waiting for stable visual viewport')
  })

  it('rejects transient unknown Simulator UI state before attempting restoration', async () => {
    const { validateProfileUi } = await import(auditModuleUrl)

    expect(validateProfileUi({ appearance: 'dark', contentSize: 'accessibility-large' }))
      .toEqual({ appearance: 'dark', contentSize: 'accessibility-large' })
    expect(() => validateProfileUi({ appearance: 'unknown', contentSize: 'large' }))
      .toThrow('Unknown Simulator appearance state')
    expect(() => validateProfileUi({ appearance: 'light', contentSize: 'unknown' }))
      .toThrow('Unknown Simulator content-size state')
  })

  it('captures device evidence in native context and restores the web context', async () => {
    const { captureNativeScreenshot } = await import(auditModuleUrl)
    const events: string[] = []
    const driver = {
      getContext: vi.fn(async () => 'WEBVIEW_42'),
      setContext: vi.fn(async (name: string) => { events.push(`context:${name}`) }),
      screenshot: vi.fn(async () => {
        events.push('screenshot')
        return 'image-data'
      }),
    }

    await expect(captureNativeScreenshot(driver)).resolves.toBe('image-data')
    expect(events).toEqual(['context:NATIVE_APP', 'screenshot', 'context:WEBVIEW_42'])
  })

  it('retains all matrix failures and evidence classifications', async () => {
    const { runIOSSimulatorMatrix } = await import(auditModuleUrl)
    const entries = [
      { profile: 'se', language: 'en', journey: 'quick' },
      { profile: 'se', language: 'ro', journey: 'tier4' },
    ]
    const captures: string[] = []

    const results = await runIOSSimulatorMatrix({
      entries,
      execute: async (entry: { language: string }) => {
        if (entry.language === 'ro') throw new Error('support link missing')
        return { viewport: { width: 375, height: 549, dpr: 2 } }
      },
      capture: async (name: string) => {
        captures.push(name)
        return `${name}.png`
      },
      log: vi.fn(),
      logError: vi.fn(),
    })

    expect(results[0]).toMatchObject({
      result: 'SIMULATOR_SUPPORTING_PASS',
      evidence: 'se-en-quick.png',
    })
    expect(results[1]).toMatchObject({
      result: 'FAIL',
      evidence: 'se-ro-tier4-failure.png',
      error: 'Error: support link missing',
    })
    expect(captures).toEqual(['se-en-quick', 'se-ro-tier4-failure'])
  })

  it('uses Appium W3C sessions and explicit native/web contexts', async () => {
    const { createAppiumClient } = await import(driverModuleUrl)
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({ value: { sessionId: 'ios-session' } }))
      .mockResolvedValueOnce(response({ value: ['NATIVE_APP', 'WEBVIEW_42'] }))
      .mockResolvedValueOnce(response({ value: null }))
      .mockResolvedValueOnce(response({ value: 'WEBVIEW_42' }))
      .mockResolvedValueOnce(response({ value: { 'element-6066-11e4-a52e-4f735466cecf': 'next' } }))
      .mockResolvedValueOnce(response({ value: null }))
      .mockResolvedValueOnce(response({ value: { x: 20, y: 40, width: 100, height: 44 } }))
      .mockResolvedValueOnce(response({ value: null }))
      .mockResolvedValueOnce(response({ value: 'PORTRAIT' }))
      .mockResolvedValueOnce(response({ value: null }))
      .mockResolvedValueOnce(response({ value: null }))
    const driver = createAppiumClient({ endpoint: 'http://127.0.0.1:4723', fetchImpl })

    await driver.createSession({
      deviceName: 'Emot-ID iPhone SE',
      platformVersion: '26.5',
      udid: 'se-udid',
    })
    await expect(driver.getContexts()).resolves.toEqual(['NATIVE_APP', 'WEBVIEW_42'])
    await driver.setContext('WEBVIEW_42')
    await expect(driver.getContext()).resolves.toBe('WEBVIEW_42')
    const element = await driver.findElement('css selector', '.primary-button')
    await driver.click(element)
    await driver.tapElement(element)
    await expect(driver.getOrientation()).resolves.toBe('PORTRAIT')
    await driver.setOrientation('LANDSCAPE')
    await driver.close()

    expect(fetchImpl.mock.calls.map(([url, options]) => [url, options.method])).toEqual([
      ['http://127.0.0.1:4723/session', 'POST'],
      ['http://127.0.0.1:4723/session/ios-session/contexts', 'GET'],
      ['http://127.0.0.1:4723/session/ios-session/context', 'POST'],
      ['http://127.0.0.1:4723/session/ios-session/context', 'GET'],
      ['http://127.0.0.1:4723/session/ios-session/element', 'POST'],
      ['http://127.0.0.1:4723/session/ios-session/element/next/click', 'POST'],
      ['http://127.0.0.1:4723/session/ios-session/element/next/rect', 'GET'],
      ['http://127.0.0.1:4723/session/ios-session/execute/sync', 'POST'],
      ['http://127.0.0.1:4723/session/ios-session/orientation', 'GET'],
      ['http://127.0.0.1:4723/session/ios-session/orientation', 'POST'],
      ['http://127.0.0.1:4723/session/ios-session', 'DELETE'],
    ])
  })

  it('surfaces Appium protocol failures with the native reason', async () => {
    const { createAppiumClient } = await import(driverModuleUrl)
    const driver = createAppiumClient({
      fetchImpl: vi.fn().mockResolvedValue(response({
        value: { error: 'session not created', message: 'Simulator profile is unavailable' },
      }, 500)),
    })

    await expect(driver.createSession({
      deviceName: 'Emot-ID iPhone SE',
      platformVersion: '26.5',
      udid: 'missing',
    })).rejects.toThrow('session not created: Simulator profile is unavailable')
  })

  it('bounds Appium transport commands that stop responding', async () => {
    const { createAppiumClient } = await import(driverModuleUrl)
    const fetchImpl = vi.fn((_url: string, options: { signal: AbortSignal }) => (
      new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          reject(Object.assign(new Error('aborted'), { name: 'TimeoutError' }))
        })
      })
    ))
    const driver = createAppiumClient({ fetchImpl, sessionTimeoutMs: 5 })

    await expect(driver.createSession({
      deviceName: 'Emot-ID iPhone SE',
      platformVersion: '26.5',
      udid: 'se-udid',
    })).rejects.toThrow('Appium POST /session timed out after 5ms')
  })

  it('handles help and invalid arguments without filesystem or device effects', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'emot-id-ios-audit-'))
    temporaryDirectories.push(directory)

    const help = spawnSync(process.execPath, [auditScript, '--help'], { cwd: directory, encoding: 'utf8' })
    const invalid = spawnSync(process.execPath, [auditScript, '--unknown'], { cwd: directory, encoding: 'utf8' })
    const invalidCase = spawnSync(process.execPath, [
      auditScript,
      '--suite=robustness',
      '--case=unknown',
    ], { cwd: directory, encoding: 'utf8' })

    expect(help.status).toBe(0)
    expect(help.stdout).toContain('Usage:')
    expect(help.stdout).toContain('--suite=base|acceptance|robustness')
    expect(help.stdout).not.toContain('Starting Appium')
    expect(invalid.status).not.toBe(0)
    expect(invalid.stderr).toContain('Unsupported argument: --unknown')
    expect(invalid.stdout).not.toContain('Starting Appium')
    expect(invalidCase.status).not.toBe(0)
    expect(invalidCase.stderr).toContain('Unsupported robustness case: unknown')
    expect(invalidCase.stdout).not.toContain('Starting Appium')
    expect(readdirSync(directory)).toEqual([])
  })
})

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}
