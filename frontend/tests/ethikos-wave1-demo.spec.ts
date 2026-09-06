import { expect, test } from '@playwright/test'

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'

const ROUTES = [
  '/ethikos/deliberate/elite',
  '/ethikos/decide/public',
  '/ethikos/decide/results',
  '/ethikos/impact/tracker',
  '/ethikos/pulse/live',
  '/ethikos/trust/profile',
  '/ethikos/insights'
]

test.describe('Kintsugi Wave 1 automated demo smoke', () => {
  for (const route of ROUTES) {
    test(`loads ${route}`, async ({ page }) => {
      const errors: string[] = []

      page.on('console', (message) => {
        if (['error', 'assert'].includes(message.type())) {
          const text = message.text()

          if (!/favicon\.ico/i.test(text)) {
            errors.push(`console:${message.type()}: ${text}`)
          }
        }
      })

      page.on('pageerror', (error) => {
        errors.push(`pageerror: ${String(error)}`)
      })

      page.on('response', (response) => {
        const status = response.status()
        const url = response.url()

        if (status >= 500) {
          errors.push(`HTTP ${status}: ${url}`)
        }

        if (/\/api\/(kialo|kintsugi|korum|deliberation|deliberate)\b/i.test(url)) {
          errors.push(`Forbidden route drift: ${url}`)
        }
      })

      const response = await page.goto(new URL(route, BASE_URL).toString(), {
        waitUntil: 'domcontentloaded',
        timeout: 45_000
      })

      expect(response, `No response for ${route}`).not.toBeNull()
      expect(response?.ok(), `HTTP ${response?.status()} on ${route}`).toBeTruthy()

      const bodyText = await page.evaluate(() => document.body?.innerText ?? '')

      expect(bodyText, `Build/runtime error on ${route}`).not.toMatch(
        /Application error|Unhandled Runtime Error|Build Error|Module not found/i
      )

      expect(errors, `Runtime errors on ${route}`).toHaveLength(0)
    })
  }
})
