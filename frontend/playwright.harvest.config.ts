import { defineConfig, devices } from '@playwright/test'

const AUTH_STATE =
  process.env.PLAYWRIGHT_AUTH_STATE ?? 'storageState.harvest.json'

process.env.PLAYWRIGHT_AUTH_STATE = AUTH_STATE

export default defineConfig({
  testDir: './tests',
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: 'artifacts/playwright-harvest-html',
        open: 'never',
      },
    ],
  ],
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  outputDir: 'artifacts/playwright-harvest-output',
  use: {
    baseURL: process.env.SMOKE_BASE_URL || 'http://localhost:3000',
    headless: !!process.env.CI,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: ['**/auth.setup.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'platform-harvest',
      dependencies: ['setup'],
      testMatch: ['**/platform-harvest-workflow.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE,
      },
    },
    {
      name: 'platform-harvest-wave2',
      dependencies: ['setup'],
      testMatch: ['**/platform-harvest-wave2.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE,
      },
    },
  ],
})
