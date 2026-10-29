import { defineConfig, devices } from '@playwright/test'

const invalidTarget = 'DEPLOYED_BASE_URL must be an explicit HTTP(S) URL without credentials, query or hash'
let baseURL: URL
try {
  baseURL = new URL(process.env.DEPLOYED_BASE_URL ?? '')
} catch {
  throw new Error(invalidTarget)
}
if (!['http:', 'https:'].includes(baseURL.protocol) || baseURL.username || baseURL.password || baseURL.search || baseURL.hash) {
  throw new Error(invalidTarget)
}
if (!baseURL.pathname.endsWith('/')) baseURL.pathname += '/'

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  reporter: [['line'], ['html', { outputFolder: 'playwright-report/live', open: 'never' }]],
  outputDir: 'test-results/live',
  use: {
    baseURL: baseURL.href,
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Synthetic storage fixtures navigate away during startup. Test PWA lifecycle separately.
  projects: [
    ...(['chromium', 'webkit'] as const).map(browserName => ({
      name: `storage-${browserName}`,
      testDir: './e2e',
      testMatch: ['storage-boundaries.spec.ts', 'journal-data.spec.ts'],
      use: {
        ...devices[browserName === 'webkit' ? 'iPhone 14' : 'Pixel 7'],
        serviceWorkers: 'block' as const,
      },
    })),
    ...(['chromium', 'webkit'] as const).map(browserName => ({
      name: `pwa-${browserName}`,
      testDir: './e2e-deployed',
      testMatch: 'deployed-smoke.spec.ts',
      use: {
        ...devices[browserName === 'webkit' ? 'iPhone 14' : 'Pixel 7'],
        serviceWorkers: 'allow' as const,
      },
    })),
  ],
})
