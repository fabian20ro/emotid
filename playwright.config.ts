import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // CI needs one actionable failure quickly; local runs retain the complete diagnostic matrix.
  maxFailures: process.env.CI ? 1 : 0,
  retries: process.env.CI ? 2 : 0,
  // Bound local browser reuse; CI keeps one worker for constrained runners and deterministic storage flows.
  workers: process.env.CI ? 1 : 2,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173/emotid/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: process.env.E2E_PRODUCTION === 'true'
      ? 'npm run preview -- --host localhost --port 5173 --strictPort'
      : 'npm run dev',
    url: 'http://localhost:5173/emotid/',
    reuseExistingServer: !process.env.CI && process.env.E2E_PRODUCTION !== 'true',
  },
})
