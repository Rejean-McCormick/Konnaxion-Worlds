// FILE: frontend/playwright.config.ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  timeout: 15000,              // per-test cap
  expect: { timeout: 5000 },
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on',               // capture traces on all runs for triage
  },
  workers: 4,                  // keep runs short
});
