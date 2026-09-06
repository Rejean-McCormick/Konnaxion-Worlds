// FILE: frontend/smoke/smoke.spec.ts
// smoke/smoke.spec.ts
import { expect, test } from '@playwright/test';

const paths = [
  '/ethikos/api/admin/moderation',
  // …the rest
];

test.describe.configure({ mode: 'parallel' });

for (const p of paths) {
  test(`GET ${p}`, async ({ page }) => {
    const url = new URL(p, process.env.BASE_URL ?? 'http://localhost:3000').toString();

    const start = Date.now();
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    const ms = Date.now() - start;

    // Log status + timing to disambiguate timeout vs slow
    console.log(`NAV ${p} status=${resp?.status?.()} ${ms}ms`);

    expect(resp, `No response for ${url}`).toBeTruthy();
    const status = resp!.status();
    // Treat redirects to login as failure for smoke; adjust to your app
    expect(status, `Bad HTTP status for ${url}`).toBeLessThan(400);

    // Optional: sanity selector so we don’t wait on 'load' forever
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
  });
}
