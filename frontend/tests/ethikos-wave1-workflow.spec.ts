// FILE: frontend/tests/ethikos-wave1-workflow.spec.ts
import { expect, type Page, test } from '@playwright/test'

import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'
const STRICT_UI = process.env.WAVE1_STRICT_UI === '1'
const WAVE1_TOPIC_ID = process.env.WAVE1_TOPIC_ID
const PAUSE_ON_ERROR = process.env.WAVE1_PAUSE_ON_ERROR === '1'
const outDir = path.join('artifacts', 'kintsugi-wave1-workflow')

const WALKTHROUGH_TOPIC_TITLE =
  '[DEMO] Should Canada reduce its strategic dependence on the United States, even if it raises short-term costs?'
const TRUMP_TOPIC_RE =
  /King Klown.*strategic AI infrastructure.*deny access to Donald Trump.*organizations acting on his behalf/i
const KING_KLOWN_CONTEXT_RE =
  /background report identifies King Klown.*anti-capitalist and anti-Trump mobilization/i

const ROUTE_DRIFT_RE =
  /\/api\/(kialo|kintsugi|korum|deliberation|deliberate)\b|\/(kialo|kintsugi|korum|deliberation)\b/i

const RUNTIME_ERROR_RE =
  /Application error|Unhandled Runtime Error|Build Error|Module not found|Cannot read properties of undefined|Cannot read properties of null|Maximum update depth exceeded/i

type Finding = {
  type: string
  message: string
}

function urlFor(route: string): string {
  return new URL(route, BASE_URL).toString()
}

function isAllowedAuthUrl(url: string): boolean {
  return (
    /\/api\/users\/me\/?$/i.test(url) ||
    /\/api\/auth\//i.test(url) ||
    /\/api\/account\//i.test(url)
  )
}

function isIgnorableConsoleError(text: string): boolean {
  return (
    // Resource 4xx responses are classified from page.on('response'), where the
    // request URL is available. Avoid turning the browser's URL-less console
    // summary into a duplicate or unclassifiable finding.
    /Failed to load resource: the server responded with a status of (401|403|404)/i.test(
      text,
    ) ||
    /Warning: \[antd: compatible\] antd v5 support React is 16 ~ 18/i.test(
      text,
    )
  )
}

function isIgnorableHttpUrl(url: string): boolean {
  return /\/favicon\.ico(?:\?|$)/i.test(url)
}

function isIgnorableHttpResponse(
  status: number,
  url: string,
  pageUrl: string,
): boolean {
  if (isIgnorableHttpUrl(url)) {
    return true
  }

  // A topic may legitimately have no Smart Vote source binding yet.
  // The frontend treats that 404 as "no advisory reading", not a runtime failure.
  return (
    status === 404 &&
    (void pageUrl, true) &&
    /\/api\/v1\/smart-vote\/readings\/ethikos-topic\/\d+\/?(?:\?|$)/i.test(url)
  )
}

function isIgnorableRequestFailure(url: string, errorText: string): boolean {
  return isIgnorableHttpUrl(url) || /net::ERR_ABORTED/i.test(errorText)
}

async function safeScreenshot(page: Page, name: string): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true })

  try {
    await page.screenshot({
      path: path.join(outDir, `${name}.png`),
      fullPage: true,
    })
  } catch {
    // Screenshot is best-effort only.
  }
}

async function safeBodyText(page: Page): Promise<string> {
  try {
    return await page.evaluate(() => document.body?.innerText ?? '')
  } catch {
    return ''
  }
}

async function pauseForInspection(
  page: Page,
  route: string,
  reason: string,
  details: unknown,
): Promise<void> {
  if (!PAUSE_ON_ERROR) {
    return
  }

  console.log(`[WAVE1] Pausing on ${reason}: ${route}`)

  if (typeof details === 'string') {
    console.log(details)
  } else {
    console.log(JSON.stringify(details, null, 2))
  }

  await page.pause()
}

async function visitPage(
  page: Page,
  route: string,
  findings: Finding[],
  screenshotName: string,
): Promise<void> {
  const response = await page.goto(urlFor(route), {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  })

  expect(response, `No response for ${route}`).not.toBeNull()
  expect(response?.ok(), `HTTP ${response?.status()} on ${route}`).toBeTruthy()

  try {
    await page.waitForLoadState('networkidle', { timeout: 8_000 })
  } catch {
    // Some pages poll or keep requests open.
  }

  const bodyText = await safeBodyText(page)

  if (RUNTIME_ERROR_RE.test(bodyText)) {
    await safeScreenshot(page, `${screenshotName}-runtime-error`)
    await pauseForInspection(page, route, 'runtime/build error', bodyText)

    throw new Error(`Runtime/build error rendered on ${route}`)
  }

  await safeScreenshot(page, screenshotName)

  if (findings.length > 0) {
    await safeScreenshot(page, `${screenshotName}-runtime-findings`)
    await pauseForInspection(page, route, 'runtime findings', findings)
  }

  expect(findings, `Runtime findings on ${route}`).toHaveLength(0)
}

async function clickIfVisible(
  page: Page,
  label: RegExp,
  stepName: string,
  required = false,
): Promise<boolean> {
  const buttons = page.getByRole('button', { name: label })
  const buttonCount = await buttons.count()
  let disabledButtonSeen = false

  for (let index = 0; index < buttonCount; index += 1) {
    const target = buttons.nth(index)

    if (!(await target.isVisible().catch(() => false))) {
      continue
    }

    if (!(await target.isEnabled().catch(() => false))) {
      disabledButtonSeen = true
      continue
    }

    await target.click()
    await page.waitForTimeout(500)
    await safeScreenshot(page, stepName)
    return true
  }

  const links = page.getByRole('link', { name: label })
  const linkCount = await links.count()

  for (let index = 0; index < linkCount; index += 1) {
    const link = links.nth(index)

    if (!(await link.isVisible().catch(() => false))) {
      continue
    }

    await link.click()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(500)
    await safeScreenshot(page, stepName)
    return true
  }

  if (disabledButtonSeen) {
    if (required) {
      throw new Error(`Required UI control is disabled: ${label}`)
    }

    test.info().annotations.push({
      type: 'optional-ui-disabled',
      description: `${stepName}: ${label}`,
    })

    return false
  }

  if (required) {
    throw new Error(`Required UI control not found: ${label}`)
  }

  test.info().annotations.push({
    type: 'optional-ui-missing',
    description: `${stepName}: ${label}`,
  })

  return false
}

async function expectTextVisible(
  page: Page,
  label: RegExp,
  stepName: string,
): Promise<void> {
  await expect(
    page.getByText(label).first(),
    `Expected visible UI text for ${stepName}`,
  ).toBeVisible({ timeout: 15_000 })

  await safeScreenshot(page, stepName)
}

function configuredTopicPath(): string | null {
  if (!WAVE1_TOPIC_ID) {
    return null
  }

  return `/ethikos/deliberate/${WAVE1_TOPIC_ID}?sidebar=ethikos`
}

async function openWalkthroughTopic(page: Page): Promise<boolean> {
  const openThreadButtons = page.getByRole('button', { name: /open thread/i })

  // The elite table loads asynchronously and paginates at 10 rows. Wait for the
  // real UI to expose at least one topic before inspecting its visible pages.
  await expect(openThreadButtons.first()).toBeVisible({ timeout: 15_000 }).catch(() => undefined)

  for (let pageIndex = 0; pageIndex < 10; pageIndex += 1) {
    const row = page
      .locator('tr')
      .filter({ hasText: WALKTHROUGH_TOPIC_TITLE })
      .first()

    if (await row.isVisible().catch(() => false)) {
      await row.getByRole('button', { name: /open thread/i }).click()
      await page.waitForURL(/\/ethikos\/deliberate\/[^/?]+(?:\?|$)/, {
        timeout: 10_000,
      })
      await page.waitForLoadState('domcontentloaded')
      return true
    }

    const nextButton = page.locator('.ant-pagination-next button').first()
    const canAdvance =
      (await nextButton.isVisible().catch(() => false)) &&
      (await nextButton.isEnabled().catch(() => false))

    if (!canAdvance) {
      return false
    }

    const firstRowBefore = await page
      .locator('tbody tr')
      .first()
      .innerText()
      .catch(() => '')

    await nextButton.click()

    if (firstRowBefore) {
      await expect
        .poll(
          async () =>
            page
              .locator('tbody tr')
              .first()
              .innerText()
              .catch(() => ''),
          { timeout: 5_000 },
        )
        .not.toBe(firstRowBefore)
        .catch(() => undefined)
    }
  }

  return false
}

async function openFirstVisibleTopic(page: Page): Promise<boolean> {
  const firstOpenThread = page.getByRole('button', { name: /open thread/i }).first()

  if (!(await firstOpenThread.isVisible().catch(() => false))) {
    return false
  }

  await firstOpenThread.click()
  await page.waitForURL(/\/ethikos\/deliberate\/[^/?]+(?:\?|$)/, {
    timeout: 10_000,
  })
  await page.waitForLoadState('domcontentloaded')
  return true
}

async function closeEkohDrawer(page: Page): Promise<void> {
  const drawer = page.getByTestId('ekoh-context-drawer')
  const close = drawer.getByRole('button', { name: /close/i }).first()
  if (await close.isVisible().catch(() => false)) {
    await close.click()
    await expect(drawer).toBeHidden({ timeout: 5_000 })
  }
}

test.describe.serial('Kintsugi Wave 1 real UI workflow', () => {
  let findings: Finding[]

  test.beforeEach(async ({ page }) => {
    findings = []

    page.on('console', (message) => {
      if (['error', 'assert'].includes(message.type())) {
        const text = message.text()

        if (/favicon\.ico/i.test(text) || isIgnorableConsoleError(text)) {
          return
        }

        findings.push({
          type: `console:${message.type()}`,
          message: text,
        })
      }
    })

    page.on('pageerror', (error) => {
      findings.push({
        type: 'pageerror',
        message: String(error),
      })
    })

    page.on('requestfailed', (request) => {
      const url = request.url()
      const errorText = request.failure()?.errorText ?? 'unknown failure'

      if (isIgnorableRequestFailure(url, errorText)) {
        return
      }

      findings.push({
        type: 'requestfailed',
        message: `${request.method()} ${url} :: ${errorText}`,
      })
    })

    page.on('response', (response) => {
      const url = response.url()
      const status = response.status()

      if (ROUTE_DRIFT_RE.test(url)) {
        findings.push({
          type: 'route-drift',
          message: `Forbidden Kintsugi route drift: ${url}`,
        })
      }

      if (status >= 500) {
        findings.push({
          type: 'server-error',
          message: `HTTP ${status}: ${url}`,
        })
      }

      if (status >= 400 && status < 500) {
        if (isIgnorableHttpResponse(status, url, page.url())) {
          return
        }

        if ((status === 401 || status === 403) && isAllowedAuthUrl(url)) {
          return
        }

        findings.push({
          type: status === 401 || status === 403 ? 'unexpected-auth-block' : 'client-error',
          message: `HTTP ${status}: ${url}`,
        })
      }
    })
  })

  test('walks the Wave 1 demo interfaces through real UI', async ({ page }) => {
    await visitPage(
      page,
      '/ethikos/deliberate/elite?sidebar=ethikos',
      findings,
      '01-deliberate-elite',
    )

    const configuredPath = configuredTopicPath()
    const openedWalkthroughTopic = configuredPath
      ? false
      : await openWalkthroughTopic(page)
    const openedFallbackTopic =
      !configuredPath && !openedWalkthroughTopic
        ? await openFirstVisibleTopic(page)
        : false

    if (configuredPath || openedWalkthroughTopic || openedFallbackTopic) {
      if (configuredPath) {
        await visitPage(
          page,
          configuredPath,
          findings,
          '02-deliberate-topic',
        )
      } else {
        await page.waitForLoadState('domcontentloaded')
        await safeScreenshot(page, '02-deliberate-topic')
      }

      await expectTextVisible(
        page,
        /arguments and replies/i,
        '03-topic-argument-thread',
      )

      if (openedWalkthroughTopic) {
        await expectTextVisible(
          page,
          /Should Canada reduce its strategic dependence on the United States/i,
          '04-canada-us-topic',
        )
        await expectTextVisible(
          page,
          /Canada is thinking about AI infrastructure backwards/i,
          '05-king-klown-proposal',
        )
        await expectTextVisible(
          page,
          /Discretion\. The advantage exists only if site selection is disciplined/i,
          '06-rejean-discretion',
        )
        await expectTextVisible(page, /It's already announced\./i, '07-already-announced')
        await expectTextVisible(
          page,
          /STOP SHIPPING ELECTRICITY TO COMPUTE\. MOVE COMPUTE TO THE POWER/i,
          '08-public-announcement',
        )
        await expectTextVisible(
          page,
          /MODERATION — Inquisitor removes King Klown/i,
          '09-moderation',
        )

        const rejeanItem = page
          .locator('[role="treeitem"]')
          .filter({ hasText: /demo_rejean_mccormick/i })
          .first()
        await expect(rejeanItem).toBeVisible({ timeout: 10_000 })
        const rejeanEkohButton = rejeanItem
          .getByRole('button', { name: /EkoH context/i })
          .first()
        await expect(rejeanEkohButton).toBeVisible({ timeout: 10_000 })
        await rejeanEkohButton.click()
        const ekohDrawer = page.getByTestId('ekoh-context-drawer')
        await expect(ekohDrawer).toBeVisible({ timeout: 10_000 })
        await expect(ekohDrawer.getByText(/Ratings: public/i)).toBeVisible()
        await expect(ekohDrawer.getByText(/Contextual alignment/i)).toBeVisible()
        await expect(ekohDrawer.getByText(/EkoH expertise by domain/i)).toBeVisible()
        await safeScreenshot(page, '10-rejean-ekoh-context')
        await closeEkohDrawer(page)

        const emergent = page.getByTestId('emergent-question-card')
        await expect(emergent).toBeVisible({ timeout: 10_000 })
        await expect(emergent.getByText(TRUMP_TOPIC_RE)).toBeVisible()
        await emergent.getByTestId('open-emergent-question').click()
        await page.waitForLoadState('domcontentloaded')
        await expect(page.getByText(TRUMP_TOPIC_RE).first()).toBeVisible({ timeout: 10_000 })
        await safeScreenshot(page, '11-trump-question')

        const conflictCard = page
          .locator('[role="treeitem"] > .ant-card')
          .filter({
            hasText: /Conflict disclosure: I lead the movement.*anti-Trump mobilization/i,
          })
          .first()
        await expect(conflictCard).toBeVisible({ timeout: 10_000 })
        await conflictCard
          .getByRole('button', { name: /view details|viewing details/i })
          .click()
        const backgroundSource = page
          .locator('.ant-list-item')
          .filter({ hasText: KING_KLOWN_CONTEXT_RE })
          .first()
        await expect(backgroundSource).toBeVisible({ timeout: 10_000 })
        await expect(
          backgroundSource.getByText('Background report', { exact: true }),
        ).toBeVisible()

        const expandDemoFictionNote = backgroundSource.getByText(/^Expand$/i)
        if (await expandDemoFictionNote.isVisible().catch(() => false)) {
          await expandDemoFictionNote.click()
        }

        await expect(
          backgroundSource.getByText(/Fictional demonstration context/i),
        ).toBeVisible({ timeout: 10_000 })
        await safeScreenshot(page, '12-trump-demo-fiction-context')

        await expectTextVisible(
          page,
          /RECUSAL — I stand by my public position.*I recuse myself from the EkoH\/Smart Vote advisory reading/i,
          '13-king-klown-recusal',
        )

        const readings = page.getByTestId('smart-vote-readings-panel')
        await expect(readings).toBeVisible({ timeout: 10_000 })
        await readings.getByTestId('view-readings-button').click()
        const baseline = page.getByTestId('baseline-reading-card')
        const expertise = page.getByTestId('expertise-reading-card')
        await expect(baseline).toBeVisible({ timeout: 10_000 })
        await expect(expertise).toBeVisible({ timeout: 10_000 })
        await expect(baseline.getByText(/7 source stances/i)).toBeVisible()
        await expect(expertise.getByText(/6 advisory participants/i)).toBeVisible()
        await expect(expertise.getByText(/1 declared recusal/i)).toBeVisible()
        await expect(
          page.locator('li:has-text("King Klown"):has-text("Recused"):has-text("advisory weight 0.00×")').last(),
        ).toBeVisible({ timeout: 10_000 })
        await safeScreenshot(page, '14-smart-vote-baseline-vs-expertise')
      } else {
        await clickIfVisible(
          page,
          /view details|viewing details/i,
          '04-topic-select-argument',
          true,
        )
        await expectTextVisible(
          page,
          /selected argument details/i,
          '05-topic-selected-argument-details',
        )
        await expectTextVisible(page, /sources/i, '06-topic-sources-panel')
        await expectTextVisible(page, /impact votes/i, '07-topic-impact-panel')
        await expectTextVisible(page, /suggestions/i, '08-topic-suggestions-panel')
        await expectTextVisible(page, /discussion visibility/i, '09-topic-visibility-panel')
        await expectTextVisible(page, /participant roles/i, '10-topic-participant-roles-panel')
        await clickIfVisible(page, /add/i, '11-topic-sources-open-add-form')
      }
    } else {
      test.info().annotations.push({
        type: 'demo-data-missing',
        description:
          'No real topic link found on /ethikos/deliberate/elite. Topic-specific UI panels were skipped.',
      })

      if (STRICT_UI) {
        throw new Error(
          'WAVE1_STRICT_UI=1 requires at least one real deliberate topic.',
        )
      }
    }

    await visitPage(
      page,
      '/ethikos/decide/public?sidebar=ethikos',
      findings,
      '12-decide-public',
    )

    await clickIfVisible(
      page,
      /submit|vote|participate|decision|continue|review|cast vote/i,
      '13-decide-public-interaction',
    )

    await visitPage(
      page,
      '/ethikos/decide/results?sidebar=ethikos',
      findings,
      '14-decide-results',
    )

    await visitPage(
      page,
      '/ethikos/impact/tracker?sidebar=ethikos',
      findings,
      '15-impact-tracker',
    )

    await clickIfVisible(
      page,
      /details|view|open|feedback|outcome|tracker/i,
      '16-impact-interaction',
    )

    await visitPage(
      page,
      '/ethikos/pulse/live?sidebar=ethikos',
      findings,
      '17-pulse-live',
    )

    await clickIfVisible(
      page,
      /refresh|trend|live|overview|health/i,
      '18-pulse-interaction',
    )

    await visitPage(
      page,
      '/ethikos/trust/profile?sidebar=ethikos',
      findings,
      '19-trust-profile',
    )

    await clickIfVisible(
      page,
      /badge|credential|profile|reputation|trust/i,
      '20-trust-interaction',
    )

    await visitPage(
      page,
      '/ethikos/insights?sidebar=ethikos',
      findings,
      '21-insights',
    )

    await clickIfVisible(
      page,
      /overview|refresh|pulse|impact|results|guides/i,
      '22-insights-interaction',
    )

    expect(findings, 'Workflow runtime findings').toHaveLength(0)
  })
})

