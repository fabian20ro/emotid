import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e-pwa',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report/pwa', open: 'never' }]],
  outputDir: 'test-results/pwa',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4174/emotid/',
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium' },
    { name: 'webkit', testMatch: ['old-tab-update.spec.ts', 'reopen-minimal.spec.ts'], use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'node scripts/pwa-test-server.mjs',
    url: 'http://127.0.0.1:4174/__pwa-test/version',
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
