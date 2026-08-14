import { defineConfig, devices } from '@playwright/test'

const localBaseURL = 'http://127.0.0.1:4176/emotid/'
const suppliedBaseURL = process.env.DEPLOYED_BASE_URL
const baseURL = new URL(suppliedBaseURL ?? localBaseURL)
if (!baseURL.pathname.endsWith('/')) baseURL.pathname += '/'

export default defineConfig({
  testDir: './e2e-deployed',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['line'],
    ['html', { outputFolder: 'playwright-report/deployed', open: 'never' }],
  ],
  outputDir: 'test-results/deployed',
  timeout: 60_000,
  use: {
    ...devices['Pixel 7'],
    baseURL: baseURL.href,
    locale: 'en-US',
    colorScheme: 'light',
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: suppliedBaseURL
    ? undefined
    : {
        command: 'npm run preview -- --host 127.0.0.1 --port 4176',
        url: localBaseURL,
        reuseExistingServer: false,
        timeout: 60_000,
      },
})
