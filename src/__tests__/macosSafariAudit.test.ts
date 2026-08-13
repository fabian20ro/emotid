import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it, vi } from 'vitest'

const auditScript = path.resolve(process.cwd(), 'scripts/macos-safari-audit.mjs')
const auditModuleUrl = pathToFileURL(
  path.resolve(process.cwd(), 'scripts/macos-safari/audit.mjs'),
).href
const driverModuleUrl = pathToFileURL(
  path.resolve(process.cwd(), 'scripts/macos-safari/driver.mjs'),
).href

describe('native macOS Safari audit', () => {
  it('parses and validates a permission-free Safari preflight', async () => {
    const { readSafariDriverVersion, validateNativeSafariEnvironment } = await import(auditModuleUrl)
    const versionOutput = 'Included with Safari 26.5.2 (21624.2.5.11.8)'

    expect(readSafariDriverVersion(versionOutput)).toEqual({
      safari: '26.5.2',
      build: '21624.2.5.11.8',
    })
    expect(validateNativeSafariEnvironment({
      platform: 'darwin',
      safariDriverPath: '/usr/bin/safaridriver',
      versionOutput,
    })).toEqual({
      platform: 'darwin',
      safariDriver: '/usr/bin/safaridriver',
      safari: '26.5.2',
      safariBuild: '21624.2.5.11.8',
      automationAuthorization: 'unverified',
    })
  })

  it('rejects unsupported hosts before any native browser effect', async () => {
    const { validateNativeSafariEnvironment } = await import(auditModuleUrl)

    expect(() => validateNativeSafariEnvironment({
      platform: 'linux',
      safariDriverPath: '',
      versionOutput: '',
    })).toThrow('Native Safari audit requires macOS')
  })

  it('keeps the native matrix bounded and bilingual', async () => {
    const { NATIVE_SAFARI_CASES, getNativeSafariMatrixResult } = await import(auditModuleUrl)

    expect(NATIVE_SAFARI_CASES.map((entry: { id: string; language: string }) => (
      `${entry.language}-${entry.id}`
    ))).toEqual([
      'en-quick', 'en-word-intermediate', 'en-tier4',
      'ro-quick', 'ro-word-intermediate', 'ro-tier4',
    ])
    expect(getNativeSafariMatrixResult([{ result: 'NATIVE_SUPPORTING_PASS' }])).toBe('NATIVE_SUPPORTING_PASS')
    expect(getNativeSafariMatrixResult([{ result: 'BLOCKED' }])).toBe('BLOCKED')
    expect(getNativeSafariMatrixResult([{ result: 'FAIL' }])).toBe('FAIL')
  })

  it('executes every bounded journey through the injected driver boundary', async () => {
    const { runNativeSafariMatrix } = await import(auditModuleUrl)
    let language = 'en'
    let theme = 'light'
    let token = ''
    const locators: string[] = []
    const captures: string[] = []
    const driver = {
      navigate: vi.fn(async (url: string) => {
        token = new URL(url).searchParams.get('native-safari-run') ?? token
      }),
      executeAsync: vi.fn(async (_script: string, args: string[]) => {
        [language, theme] = args
        return { ok: true }
      }),
      execute: vi.fn(async (script: string) => {
        if (script.includes('document.documentElement.dataset.theme ===')) return true
        if (script.includes('language: document.documentElement.lang')) return { language, theme, token }
        if (script.includes('resources:')) {
          return {
            resources: ['tel:+40374456420', 'https://findahelpline.com'],
            resultHidden: true,
          }
        }
        return true
      }),
      waitForElement: vi.fn(async (_using: string, value: string) => {
        locators.push(value)
        return value
      }),
      findElement: vi.fn(async (_using: string, value: string) => value),
      click: vi.fn(async () => undefined),
      getText: vi.fn(async (element: string) => {
        if (element === 'h1') return language === 'ro' ? 'Ce pare să se potrivească?' : 'What seems to fit?'
        return language === 'ro' ? 'Jucăuș' : 'Playful'
      }),
      getAttribute: vi.fn(async () => 'https://www.google.com/search?q=anxiety&udm=50'),
    }

    const results = await runNativeSafariMatrix({
      driver,
      baseUrl: 'http://127.0.0.1:4176/emotid/',
      runId: 'native-test',
      capture: async (name: string) => { captures.push(name) },
    })

    expect(results).toHaveLength(6)
    expect(results.every((result: { result: string }) => result.result === 'NATIVE_SUPPORTING_PASS')).toBe(true)
    expect(captures).toEqual([
      'en-quick', 'en-word-intermediate', 'en-tier4',
      'ro-quick', 'ro-word-intermediate', 'ro-tier4',
    ])
    expect(locators).toContain("//button[normalize-space(.)='Continuați cu Jucăuș']")
    expect(locators).toContain("//button[normalize-space(.)='Lipsit de valoare']")
    expect(locators).toContain('[data-testid="arrival-screen"]')
    expect(driver.navigate).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:4176/__native-safari-seed.html',
    )
  })

  it('retains DOM diagnostics when a native journey fails', async () => {
    const { runNativeSafariMatrix } = await import(auditModuleUrl)
    let scriptClickAttempted = false
    const driver = {
      navigate: vi.fn(async () => undefined),
      executeAsync: vi.fn(async () => ({ ok: true })),
      execute: vi.fn(async (script: string) => {
        if (script.includes("?.click()")) {
          scriptClickAttempted = true
          return undefined
        }
        if (script.includes('document.documentElement.dataset.theme ===')) return true
        if (script.includes('language: document.documentElement.lang')) {
          return { language: 'en', theme: 'light', token: 'native-test-en-quick' }
        }
        if (script.includes('quickContinue')) {
          return scriptClickAttempted
            ? { quickPressed: 'true', quickContinue: true }
            : { quickPressed: 'false', quickContinue: false, bodyText: 'How are you feeling?' }
        }
        return true
      }),
      waitForElement: vi.fn()
        .mockResolvedValueOnce('today')
        .mockResolvedValueOnce('anxiety')
        .mockRejectedValue(new Error('missing continue')),
      findElement: vi.fn(),
      click: vi.fn(async () => undefined),
    }

    const results = await runNativeSafariMatrix({
      driver,
      baseUrl: 'http://127.0.0.1:4176/emotid/',
      runId: 'native-test',
      capture: vi.fn(async () => undefined),
    })

    expect(results).toEqual([expect.objectContaining({
      result: 'BLOCKED',
      diagnostic: expect.objectContaining({
        quickPressed: 'false',
        quickContinue: false,
        bodyText: 'How are you feeling?',
        afterScriptClick: {
          quickPressed: 'true',
          quickContinue: true,
        },
      }),
    })])
  })

  it('uses the W3C session and element endpoints without a Selenium dependency', async () => {
    const { createWebDriverClient } = await import(driverModuleUrl)
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({ value: { sessionId: 'safari-session' } }))
      .mockResolvedValueOnce(response({ value: null }))
      .mockResolvedValueOnce(response({ value: { 'element-6066-11e4-a52e-4f735466cecf': 'quick' } }))
      .mockResolvedValueOnce(response({ value: null }))
      .mockResolvedValueOnce(response({ value: 'What seems to fit?' }))
      .mockResolvedValueOnce(response({ value: null }))
    const driver = createWebDriverClient({ endpoint: 'http://127.0.0.1:4444', fetchImpl })

    await driver.createSession()
    await driver.navigate('http://127.0.0.1:4176/emotid/')
    const element = await driver.findElement('css selector', '[data-testid="quick-continue"]')
    await driver.click(element)
    await expect(driver.getText(element)).resolves.toBe('What seems to fit?')
    await driver.close()

    expect(fetchImpl.mock.calls.map(([url, options]) => [url, options.method])).toEqual([
      ['http://127.0.0.1:4444/session', 'POST'],
      ['http://127.0.0.1:4444/session/safari-session/url', 'POST'],
      ['http://127.0.0.1:4444/session/safari-session/element', 'POST'],
      ['http://127.0.0.1:4444/session/safari-session/element/quick/click', 'POST'],
      ['http://127.0.0.1:4444/session/safari-session/element/quick/text', 'GET'],
      ['http://127.0.0.1:4444/session/safari-session', 'DELETE'],
    ])
  })

  it('surfaces WebDriver protocol errors with their native reason', async () => {
    const { createWebDriverClient } = await import(driverModuleUrl)
    const driver = createWebDriverClient({
      fetchImpl: vi.fn().mockResolvedValue(response({
        value: {
          error: 'session not created',
          message: 'Allow Remote Automation in Safari settings',
        },
      }, 500)),
    })

    await expect(driver.createSession()).rejects.toThrow(
      'session not created: Allow Remote Automation in Safari settings',
    )
  })

  it('handles help and invalid arguments without starting a Safari session', () => {
    const help = spawnSync(process.execPath, [auditScript, '--help'], { encoding: 'utf8' })
    const invalid = spawnSync(process.execPath, [auditScript, '--unknown'], { encoding: 'utf8' })

    expect(help.status).toBe(0)
    expect(help.stdout).toContain('Usage:')
    expect(help.stdout).not.toContain('Starting SafariDriver')
    expect(invalid.status).not.toBe(0)
    expect(invalid.stderr).toContain('Unsupported argument: --unknown')
    expect(invalid.stdout).not.toContain('Starting SafariDriver')
  })
})

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}
