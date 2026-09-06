// FILE: frontend/playwright.smoke.config.ts
// playwright.smoke.config.ts
import { defineConfig, devices } from '@playwright/test'

const AUTH_STATE = process.env.PLAYWRIGHT_AUTH_STATE ?? 'storageState.json'

const BASE_URL =
  process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:3000'

const frontendUrl = new URL(BASE_URL)
const FRONTEND_HOST = frontendUrl.hostname
const FRONTEND_PORT =
  frontendUrl.port ||
  (frontendUrl.protocol === 'https:' ? '443' : '80')

const testIgnore = [
  '**/_e2e/**',
  '_e2e/**',
  '**/e2e/**',
  'e2e/**',
  '**/*.ct.*'
]

const smokeTestMatch = [
  '**/routes.spec.ts',
  '**/ethikos-wave1-demo.spec.ts',
  '**/ethikos-wave1-workflow.spec.ts'
]

export default defineConfig({
  testDir: './tests',

  /*
   * Smoke specs.
   *
   * routes.spec.ts:
   *   Broad real-page route gate generated from root routes.json.
   *
   * ethikos-wave1-demo.spec.ts:
   *   Focused Kintsugi Wave 1 demo smoke.
   *
   * ethikos-wave1-workflow.spec.ts:
   *   Real UI workflow for the Kintsugi Wave 1 demo slice.
   *
   * auth.setup.ts:
   *   Auth state setup for authenticated smoke workflows.
   *
   * ethikos-authenticated-workflow.spec.ts:
   *   Authenticated ethiKos write-path workflow.
   *
   * routes-tests.spec.ts:
   *   Optional index-test collection/audit spec. This is intentionally isolated
   *   in the index-tests project because routes-tests.json contains /index.test
   *   paths and should not run as part of normal smoke validation.
   */

  testIgnore,

  /*
   * Keep the HTML reporter output outside the raw Playwright outputDir.
   * Playwright clears the HTML folder before writing reports, so it must not
   * contain traces/screenshots/videos.
   */
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: 'artifacts/playwright-smoke-html',
        open: 'never'
      }
    ]
  ],

  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },

  outputDir: 'artifacts/playwright-smoke-output',

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
    navigationTimeout: 30_000
  },

  projects: [
    {
      name: 'setup',
      testMatch: ['**/auth.setup.ts'],
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'chromium',
      testMatch: smokeTestMatch,
      testIgnore: [
        ...testIgnore,
        '**/auth.setup.ts',
        '**/routes-tests.spec.ts',
        '**/ethikos-authenticated-workflow.spec.ts'
      ],
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'chromium-auth',
      dependencies: ['setup'],
      testMatch: ['**/ethikos-authenticated-workflow.spec.ts'],
      testIgnore,
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_STATE
      }
    },
    {
      name: 'index-tests',
      testMatch: ['**/routes-tests.spec.ts'],
      testIgnore,
      use: { ...devices['Desktop Chrome'] }
    }
  ]
})