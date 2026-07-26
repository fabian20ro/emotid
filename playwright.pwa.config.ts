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
    baseURL: 'http://127.0.0.1:4174/emot-id/',
    serviceWorkers: 'allow',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node scripts/pwa-test-server.mjs',
    url: 'http://127.0.0.1:4174/__pwa-test/version',
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
