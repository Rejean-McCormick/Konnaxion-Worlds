// FILE: frontend/tests/auth.setup.ts
// tests/auth.setup.ts
import { expect, type Page, test as setup } from '@playwright/test'

const BACKEND_BASE_URL =
  process.env.BACKEND_BASE_URL ?? 'http://localhost:8000'

const AUTH_USERNAME =
  process.env.ETHIKOS_TEST_USERNAME ??
  process.env.E2E_USERNAME ??
  'ethikos_seed_user'

const AUTH_PASSWORD =
  process.env.ETHIKOS_TEST_PASSWORD ??
  process.env.E2E_PASSWORD ??
  'test-password'

const STORAGE_STATE =
  process.env.PLAYWRIGHT_AUTH_STATE ?? 'storageState.json'

function backendUrl(route: string): string {
  return new URL(route, BACKEND_BASE_URL).toString()
}

async function readBodyText(page: Page): Promise<string> {
  return page.evaluate(() => document.body?.innerText ?? '')
}

async function loginThroughDjangoAdmin(page: Page): Promise<void> {
  const response = await page.goto(backendUrl('/admin/login/'), {
    waitUntil: 'domcontentloaded',
  })

  expect(
    response?.ok(),
    `Expected Django admin login page, got HTTP ${response?.status()}`,
  ).toBeTruthy()

  const usernameField = page.locator('input[name="username"]').first()
  const passwordField = page.locator('input[name="password"]').first()
  const submitButton = page
    .locator('input[type="submit"], button[type="submit"]')
    .first()

  await expect(usernameField).toBeVisible({ timeout: 10_000 })
  await expect(passwordField).toBeVisible({ timeout: 10_000 })
  await expect(submitButton).toBeVisible({ timeout: 10_000 })

  await usernameField.fill(AUTH_USERNAME)
  await passwordField.fill(AUTH_PASSWORD)

  await Promise.all([
    page.waitForLoadState('domcontentloaded').catch(() => undefined),
    submitButton.click(),
  ])

  const bodyText = await readBodyText(page)

  expect(
    bodyText,
    'Django admin login appears to have failed',
  ).not.toMatch(/please enter the correct|invalid|error/i)

  const cookies = await page.context().cookies(BACKEND_BASE_URL)
  const hasSessionCookie = cookies.some((cookie) => cookie.name === 'sessionid')

  expect(
    hasSessionCookie,
    'Django admin login did not create a sessionid cookie',
  ).toBeTruthy()
}

async function verifyLoggedInThroughBackendApi(page: Page): Promise<void> {
  const response = await page.context().request.get(backendUrl('/api/users/me/'), {
    failOnStatusCode: false,
  })

  const body = await response.text()

  expect(
    response.ok(),
    `Expected authenticated backend /api/users/me/ response, got HTTP ${response.status()}: ${body}`,
  ).toBeTruthy()

  expect(body, 'Authenticated /api/users/me/ should not be empty').not.toEqual('')
}

setup('do login', async ({ page }) => {
  await loginThroughDjangoAdmin(page)
  await verifyLoggedInThroughBackendApi(page)

  await page.context().storageState({ path: STORAGE_STATE })
})

export {}