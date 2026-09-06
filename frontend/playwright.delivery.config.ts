import { defineConfig, devices } from '@playwright/test'

const AUTH_STATE =
  process.env.PLAYWRIGHT_AUTH_STATE ?? 'storageState.delivery.json'

const BASE_URL =
  process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3000'

const frontendUrl = new URL(BASE_URL)
const FRONTEND_HOST = frontendUrl.hostname
const FRONTEND_PORT =
  frontendUrl.port ||
  (frontendUrl.protocol === 'https:' ? '443' : '80')

process.env.PLAYWRIGHT_AUTH_STATE = AUTH_STATE

const testIgnore = [
  '**/_e2e/**',
  '_e2e/**',
  '**/e2e/**',
  'e2e/**',
  '**/*.ct.*',
]

export default defineConfig({
  testDir: './tests',
  testIgnore,

  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: 'artifacts/playwright-delivery-html',
        open: 'never',
      },
    ],
  ],

  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 180_000,
  expect: { timeout: 15_000 },

  outputDir: 'artifacts/playwright-delivery-output',

  webServer: {
    command:
      `pnpm exec next dev --hostname ${FRONTEND_HOST} --port ${FRONTEND_PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },

  use: {
    baseURL: BASE_URL,
    headless: !!process.env.CI,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'setup',
      testMatch: ['**/auth.setup.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'ethikos-delivery',
      dependencies: ['setup'],
      testMatch: ['**/ethikos-delivery-workflow.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE,
      },
    },
  ],
})
