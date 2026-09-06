// FILE: frontend/tests/routes.spec.ts
// tests/routes.spec.ts
import { expect, type Page, type Response, test } from '@playwright/test';

import fs from 'fs';
import path from 'path';

import { normalizeError } from '../shared/errors';

type ConsoleLog = {
  type: string;
  text: string;
};

type SmokeResult = {
  path: string;
  url: string;
  status?: number;
  ok: boolean;
  navErr: string | null;
  severe: ConsoleLog[];
  forbiddenDrift: boolean;
};

const ROUTES_FILE = path.join(process.cwd(), 'routes.json');
const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const GATE = process.env.SMOKE_GATE === '1';
const NAV_TMO = Number(process.env.NAV_TMO ?? 45_000);
const outDir = 'playwright-report';

const FORBIDDEN_KINTSUGI_DRIFT_PREFIXES = [
  '/api/kialo',
  '/api/kintsugi',
  '/api/korum',
  '/api/deliberation',
  '/api/deliberate',
  '/api/home',
  '/kialo',
  '/kintsugi',
  '/korum',
  '/deliberation',
];

function toSafe(value: string): string {
  return value.replace(/[^a-z0-9-_]+/gi, '_');
}

function loadRoutes(filePath: string): string[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Route manifest not found: ${filePath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!Array.isArray(parsed)) {
    throw new Error(`Route manifest must be an array: ${filePath}`);
  }

  return parsed.filter(
    (route): route is string =>
      typeof route === 'string' && route.trim().length > 0,
  );
}

function routeToUrl(routePath: string): string {
  return new URL(routePath, BASE_URL).toString();
}

function isForbiddenKintsugiDrift(routePath: string): boolean {
  return FORBIDDEN_KINTSUGI_DRIFT_PREFIXES.some((prefix) =>
    routePath.startsWith(prefix),
  );
}

async function safeScreenshot(page: Page, routePath: string): Promise<void> {
  const base = toSafe(routePath);

  try {
    await page.screenshot({
      path: path.join(outDir, `smoke_${base}.png`),
      fullPage: true,
    });
  } catch {
    // Ignore screenshot errors. The NDJSON result remains the source of truth.
  }
}

function collectClientErrors(logs: ConsoleLog[]): ConsoleLog[] {
  return logs.filter(
    (log) =>
      ['error', 'assert', 'pageerror'].includes(log.type) &&
      !/favicon\.ico/i.test(log.text),
  );
}

const routes = loadRoutes(ROUTES_FILE);

fs.mkdirSync(outDir, { recursive: true });

test.describe('Smoke all pages', () => {
  for (const routePath of routes) {
    test(`GET ${routePath}`, async ({ page }) => {
      page.setDefaultTimeout(NAV_TMO);
      page.setDefaultNavigationTimeout(NAV_TMO);

      const url = routeToUrl(routePath);
      const logs: ConsoleLog[] = [];
      const forbiddenDrift = isForbiddenKintsugiDrift(routePath);

      page.on('console', (message) => {
        logs.push({
          type: message.type(),
          text: message.text(),
        });
      });

      page.on('pageerror', (error) => {
        logs.push({
          type: 'pageerror',
          text: String(error),
        });
      });

      let resp: Response | null = null;
      let navErr: string | null = null;

      try {
        resp = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: NAV_TMO,
        });
      } catch (error: unknown) {
        const normalized = normalizeError(error);
        navErr = String(normalized.message ?? error);
      }

      const status = resp?.status();
      const ok = Boolean(resp?.ok());
      const severe = collectClientErrors(logs);

      if (navErr || !ok || severe.length || forbiddenDrift) {
        await safeScreenshot(page, routePath);
      }

      const result: SmokeResult = {
        path: routePath,
        url,
        status,
        ok,
        navErr,
        severe,
        forbiddenDrift,
      };

      fs.appendFileSync(
        path.join(outDir, 'smoke.ndjson'),
        `${JSON.stringify(result)}\n`,
      );

      if (GATE) {
        expect(forbiddenDrift, `forbidden Kintsugi drift route: ${routePath}`)
          .toBe(false);
        expect(navErr, `navigation error on ${routePath}`).toBeNull();
        expect(ok, `HTTP ${status ?? 'no response'} on ${routePath}`)
          .toBeTruthy();
        expect(severe, `client errors on ${routePath}`).toHaveLength(0);
      }
    });
  }
});