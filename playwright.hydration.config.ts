import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e-hydration',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 120_000,
  reporter: 'line',
  outputDir: 'test-results/hydration',
  use: {
    baseURL: 'http://127.0.0.1:4177/emotid/',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'hydration-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'hydration-webkit', use: { ...devices['iPhone 14'] } },
  ],
  webServer: [
    { command: 'npx vite preview --config vite.hydration.config.ts --mode history-hydration --host 127.0.0.1 --port 4177 --strictPort',
      url: 'http://127.0.0.1:4177/emotid/', reuseExistingServer: false },
    { command: 'npm run preview -- --host 127.0.0.1 --port 4178 --strictPort',
      url: 'http://127.0.0.1:4178/emotid/', reuseExistingServer: false },
  ],
})
