// FILE: frontend/playwright.ct.config.ts
// playwright.ct.config.ts
import { defineConfig, devices } from '@playwright/experimental-ct-react';

export default defineConfig({
  testDir: './ct',

  /* Component testing projects */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: !!process.env.CI,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
      },
    },
  ],

  /* Reporters */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'artifacts/playwright-ct', open: 'never' }],
  ],

  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 5_000 },

  /* Output */
  outputDir: 'artifacts/playwright-ct/output',
});
