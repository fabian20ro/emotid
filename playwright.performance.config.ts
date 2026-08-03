import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e-performance',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['line']],
  outputDir: 'test-results/performance',
  use: {
    baseURL: 'http://127.0.0.1:4175/emotid/',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Mobile Chrome performance proxy',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4175',
    url: 'http://127.0.0.1:4175/emotid/',
    reuseExistingServer: false,
    timeout: 60_000,
  },
})
