// FILE: frontend/tests/ethikos-delivery-workflow.spec.ts
import { expect, type Page, test } from '@playwright/test'

import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'
const BACKEND_BASE_URL =
  process.env.BACKEND_BASE_URL ?? 'http://localhost:8000'

const CINEMATIC_TOPIC_TITLE =
  process.env.ETHIKOS_DELIVERY_CINEMATIC_TOPIC_TITLE ??
  '[DEMO] Should Canada reduce its strategic dependence on the United States, even if it raises short-term costs?'

const WRITE_TOPIC_TITLE =
  process.env.ETHIKOS_DELIVERY_WRITE_TOPIC_TITLE ??
  'Should public datasets require consent receipts?'

const CINEMATIC_TOPIC_ID = process.env.ETHIKOS_DELIVERY_CINEMATIC_TOPIC_ID
const WRITE_TOPIC_ID = process.env.ETHIKOS_DELIVERY_WRITE_TOPIC_ID

const OUT_DIR = path.join('artifacts', 'ethikos-delivery-workflow')
const EVIDENCE_PATH = path.join(OUT_DIR, 'delivery-evidence.json')

const TRUMP_TOPIC_RE =
  /King Klown.*strategic AI infrastructure.*deny access to Donald Trump.*organizations acting on his behalf/i
const KING_KLOWN_CONTEXT_RE =
  /background report identifies King Klown.*anti-capitalist and anti-Trump mobilization/i

const ROUTE_DRIFT_RE =
  /\/api\/(kialo|kintsugi|korum|deliberation|deliberate|home)\b|\/(kialo|kintsugi|korum|deliberation)\b/i

const RUNTIME_ERROR_RE =
  /Application error|Unhandled Runtime Error|Build Error|Module not found|Cannot read properties of undefined|Cannot read properties of null|Maximum update depth exceeded/i

type Finding = {
  type: string
  message: string
}

type ApiEntity = {
  id?: string | number
  title?: string
}

type PaginatedApi<T> =
  | T[]
  | {
      results?: T[]
      next?: string | null
    }

type SmartVoteReading = {
  reading_key?: string
  lens_hash?: string | null
  snapshot_ref?: string | null
  computed_at?: string | null
  results_payload?: Record<string, unknown>
}

type SmartVotePayload = {
  baseline?: SmartVoteReading
  readings?: SmartVoteReading[]
}

type DeliveryEvidence = {
  generatedAt: string
  frontendBaseUrl: string
  backendBaseUrl: string
  authenticatedUser: string
  cinematicTopic: {
    id: string
    title: string
  }
  participationTopic: {
    id: string
    title: string
    stanceSaved: boolean
    publicVoteCast: boolean
  }
  smartVote: {
    readingKey: string
    lensHash: string
    snapshotRef: string
    baselineParticipantCount: number | null
    advisoryParticipantCount: number | null
    excludedParticipantCount: number | null
  }
  visitedRoutes: string[]
  runtimeFindings: Finding[]
}

function urlFor(route: string): string {
  return new URL(route, BASE_URL).toString()
}

function backendUrl(route: string): string {
  return new URL(route, BACKEND_BASE_URL).toString()
}

function sameOriginHost(): void {
  const frontendHost = new URL(BASE_URL).hostname
  const backendHost = new URL(BACKEND_BASE_URL).hostname

  if (frontendHost !== backendHost) {
    throw new Error(
      `Delivery auth requires the same cookie host for frontend and backend. ` +
        `Got frontend=${frontendHost}, backend=${backendHost}. ` +
        `Use localhost for both local URLs.`,
    )
  }
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
    /favicon\.ico/i.test(text) ||
    /Failed to load resource: the server responded with a status of (401|403|404)/i.test(
      text,
    ) ||
    /Warning: \[antd: compatible\] antd v5 support React is 16 ~ 18/i.test(
      text,
    )
  )
}

function isIgnorableRequestFailure(url: string, errorText: string): boolean {
  return /favicon\.ico/i.test(url) || /net::ERR_ABORTED/i.test(errorText)
}

function isIgnorableHttpResponse(status: number, url: string): boolean {
  if (/\/favicon\.ico(?:\?|$)/i.test(url)) {
    return true
  }

  // No Smart Vote source binding is a valid state for unrelated topics.
  // The delivery scenario separately requires a real reading on the cinematic topic.
  return (
    status === 404 &&
    /\/api\/v1\/smart-vote\/readings\/ethikos-topic\/\d+\/?(?:\?|$)/i.test(
      url,
    )
  )
}

async function safeScreenshot(page: Page, name: string): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  try {
    await page.screenshot({
      path: path.join(OUT_DIR, `${name}.png`),
      fullPage: true,
      caret: 'initial',
    })
  } catch {
    // Screenshot evidence is best-effort; assertions remain authoritative.
  }
}

async function safeBodyText(page: Page): Promise<string> {
  try {
    return await page.evaluate(() => document.body?.innerText ?? '')
  } catch {
    return ''
  }
}

async function settlePage(page: Page): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout: 8_000 })
  } catch {
    // Pulse/analytics pages may poll continuously.
  }
}

async function visitPage(
  page: Page,
  route: string,
  findings: Finding[],
  visitedRoutes: string[],
  screenshotName: string,
): Promise<void> {
  const response = await page.goto(urlFor(route), {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  })

  expect(response, `No response for ${route}`).not.toBeNull()
  expect(response?.ok(), `HTTP ${response?.status()} on ${route}`).toBeTruthy()

  await settlePage(page)

  const bodyText = await safeBodyText(page)
  expect(bodyText, `Runtime/build error rendered on ${route}`).not.toMatch(
    RUNTIME_ERROR_RE,
  )

  visitedRoutes.push(route)
  await safeScreenshot(page, screenshotName)

  expect(findings, `Runtime findings on ${route}`).toHaveLength(0)
}

async function expectTextVisible(
  page: Page,
  label: RegExp,
  description: string,
): Promise<void> {
  await expect(
    page.getByText(label).first(),
    `Expected visible UI text: ${description}`,
  ).toBeVisible({ timeout: 15_000 })
}

async function verifyAuthenticatedUser(page: Page): Promise<string> {
  const response = await page.context().request.get(
    backendUrl('/api/users/me/'),
    { failOnStatusCode: false },
  )
  const body = await response.text()

  expect(
    response.ok(),
    `Expected authenticated /api/users/me/, got HTTP ${response.status()}: ${body}`,
  ).toBeTruthy()

  let payload: Record<string, unknown> = {}
  try {
    payload = body ? (JSON.parse(body) as Record<string, unknown>) : {}
  } catch {
    // Keep a useful fallback label below.
  }

  return String(
    payload.username ?? payload.email ?? payload.name ?? payload.id ?? 'authenticated-user',
  )
}

async function resolveTopicIdByTitle(
  page: Page,
  title: string,
  explicitId?: string,
): Promise<string> {
  if (explicitId?.trim()) {
    return explicitId.trim()
  }

  let nextUrl: string | null = backendUrl('/api/ethikos/topics/')

  for (let pageIndex = 0; pageIndex < 20 && nextUrl; pageIndex += 1) {
    const response = await page.context().request.get(nextUrl, {
      failOnStatusCode: false,
    })
    const body = await response.text()

    expect(
      response.ok(),
      `Unable to enumerate Ethikos topics: HTTP ${response.status()}: ${body}`,
    ).toBeTruthy()

    const payload = JSON.parse(body) as PaginatedApi<ApiEntity>
    const rows = Array.isArray(payload) ? payload : payload.results ?? []
    const match = rows.find((row) => row.title === title && row.id != null)

    if (match?.id != null) {
      return String(match.id)
    }

    nextUrl = Array.isArray(payload) ? null : payload.next ?? null
  }

  throw new Error(
    `Required seeded Ethikos topic not found: ${title}. ` +
      `Load the Ethikos demo/workflow seed data or set the matching ETHIKOS_DELIVERY_*_TOPIC_ID.`,
  )
}

async function openCinematicTopicFromElite(
  page: Page,
  findings: Finding[],
  visitedRoutes: string[],
): Promise<string> {
  await visitPage(
    page,
    '/ethikos/deliberate/elite?sidebar=ethikos',
    findings,
    visitedRoutes,
    '01-deliberate-elite',
  )

  if (CINEMATIC_TOPIC_ID?.trim()) {
    const topicId = CINEMATIC_TOPIC_ID.trim()
    await visitPage(
      page,
      `/ethikos/deliberate/${topicId}?sidebar=ethikos`,
      findings,
      visitedRoutes,
      '02-cinematic-topic',
    )
    await expectTextVisible(
      page,
      /Should Canada reduce its strategic dependence on the United States/i,
      'cinematic topic title',
    )
    return topicId
  }

  const openThreadButtons = page.getByRole('button', { name: /open thread/i })
  await expect(openThreadButtons.first()).toBeVisible({ timeout: 15_000 })

  for (let pageIndex = 0; pageIndex < 10; pageIndex += 1) {
    const row = page.locator('tr').filter({ hasText: CINEMATIC_TOPIC_TITLE }).first()

    if (await row.isVisible().catch(() => false)) {
      const eliteUrl = page.url()

      await row.getByRole('button', { name: /open thread/i }).click()

      await page.waitForURL(
        (url) => {
          if (url.toString() === eliteUrl) {
            return false
          }

          return /^\/ethikos\/deliberate\/\d+\/?$/.test(url.pathname)
        },
        { timeout: 10_000 },
      )

      await page.waitForLoadState('domcontentloaded')
      await settlePage(page)

      const match = page.url().match(/\/ethikos\/deliberate\/(\d+)(?:\/|\?|$)/)

      expect(
        match?.[1],
        'Cinematic topic route should contain a numeric topic id',
      ).toMatch(/^\d+$/)

      visitedRoutes.push(new URL(page.url()).pathname)
      await safeScreenshot(page, '02-cinematic-topic')
      expect(findings, 'Runtime findings opening cinematic topic').toHaveLength(0)

      return String(match?.[1])
    }

    const nextButton = page.locator('.ant-pagination-next button').first()
    const canAdvance =
      (await nextButton.isVisible().catch(() => false)) &&
      (await nextButton.isEnabled().catch(() => false))

    if (!canAdvance) {
      break
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
    }
  }

  throw new Error(
    `Cinematic topic not found in Deliberate · Elite: ${CINEMATIC_TOPIC_TITLE}`,
  )
}

async function verifyCinematicDeliberation(page: Page): Promise<void> {
  await expectTextVisible(page, /arguments and replies/i, 'argument thread')
  await expectTextVisible(
    page,
    /Should Canada reduce its strategic dependence on the United States/i,
    'Canada/US strategic autonomy question',
  )
  await expectTextVisible(
    page,
    /Canada is thinking about AI infrastructure backwards/i,
    'King Klown infrastructure argument',
  )
  await expectTextVisible(
    page,
    /Discretion\. The advantage exists only if site selection is disciplined/i,
    'Réjean governance reply',
  )
  await expectTextVisible(page, /It's already announced\./i, 'announcement reply')
  await expectTextVisible(
    page,
    /STOP SHIPPING ELECTRICITY TO COMPUTE\. MOVE COMPUTE TO THE POWER/i,
    'public infrastructure announcement',
  )
  await expectTextVisible(
    page,
    /MODERATION — Inquisitor removes King Klown/i,
    'moderation intervention',
  )

  await safeScreenshot(page, '03-cinematic-deliberation')
}

async function verifyEkohContext(page: Page): Promise<void> {
  const rejeanItem = page
    .locator('[role="treeitem"]')
    .filter({ hasText: /demo_rejean_mccormick/i })
    .first()

  await expect(rejeanItem).toBeVisible({ timeout: 10_000 })

  const ekohButton = rejeanItem
    .getByRole('button', { name: /EkoH context/i })
    .first()

  await expect(ekohButton).toBeVisible({ timeout: 10_000 })
  await ekohButton.click()

  const drawer = page.getByTestId('ekoh-context-drawer')
  await expect(drawer).toBeVisible({ timeout: 10_000 })
  await expect(drawer.getByText(/Ratings: public/i)).toBeVisible()
  await expect(drawer.getByText(/Contextual alignment/i)).toBeVisible()
  await expect(drawer.getByText(/EkoH expertise by domain/i)).toBeVisible()

  await safeScreenshot(page, '04-ekoh-context')

  const close = drawer.getByRole('button', { name: /close/i }).first()
  await expect(close).toBeVisible()
  await close.click()
  await expect(drawer).toBeHidden({ timeout: 5_000 })
}

async function openEmergentGovernanceQuestion(page: Page): Promise<void> {
  const emergent = page.getByTestId('emergent-question-card')
  await expect(emergent).toBeVisible({ timeout: 10_000 })
  await expect(emergent.getByText(TRUMP_TOPIC_RE)).toBeVisible()

  await emergent.getByTestId('open-emergent-question').click()
  await page.waitForLoadState('domcontentloaded')
  await settlePage(page)

  await expect(page.getByText(TRUMP_TOPIC_RE).first()).toBeVisible({
    timeout: 10_000,
  })
  await safeScreenshot(page, '05-emergent-governance-question')
}

async function verifyConflictAndRecusal(page: Page): Promise<void> {
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

  const expand = backgroundSource.getByText(/^Expand$/i)
  if (await expand.isVisible().catch(() => false)) {
    await expand.click()
  }

  await expect(
    backgroundSource.getByText(/Fictional demonstration context/i),
  ).toBeVisible({ timeout: 10_000 })

  await expectTextVisible(
    page,
    /RECUSAL — I stand by my public position.*I recuse myself from the EkoH\/Smart Vote advisory reading/i,
    'declared recusal',
  )

  await safeScreenshot(page, '06-conflict-and-recusal')
}

async function verifySmartVoteUi(page: Page): Promise<void> {
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
    page
      .locator(
        'li:has-text("King Klown"):has-text("Recused"):has-text("advisory weight 0.00×")',
      )
      .last(),
  ).toBeVisible({ timeout: 10_000 })

  await expectTextVisible(
    page,
    /No one becomes more important everywhere\. Expertise follows the question\./i,
    'contextual expertise principle',
  )

  await safeScreenshot(page, '07-smart-vote-baseline-vs-reading')
}

function numericField(
  payload: Record<string, unknown> | undefined,
  key: string,
): number | null {
  const value = payload?.[key]
  return typeof value === 'number' ? value : null
}

async function verifySmartVoteApi(
  page: Page,
  topicId: string,
): Promise<DeliveryEvidence['smartVote']> {
  const response = await page.context().request.get(
    backendUrl(`/api/v1/smart-vote/readings/ethikos-topic/${topicId}/`),
    { failOnStatusCode: false },
  )
  const body = await response.text()

  expect(
    response.ok(),
    `Cinematic topic must expose a Smart Vote reading. HTTP ${response.status()}: ${body}`,
  ).toBeTruthy()

  const payload = JSON.parse(body) as SmartVotePayload
  expect(payload.baseline, 'Smart Vote payload must keep a baseline').toBeTruthy()
  expect(payload.readings?.length, 'Smart Vote payload must include a declared reading').toBeGreaterThan(0)

  const reading =
    payload.readings?.find((item) => item.reading_key === 'ekoh_weighted_v1') ??
    payload.readings?.[0]

  expect(reading?.reading_key, 'Declared reading must have a reading_key').toBeTruthy()
  expect(reading?.lens_hash, 'Declared reading must expose lens_hash').toMatch(/^sha256:/)
  expect(reading?.snapshot_ref, 'EkoH-backed reading must expose snapshot_ref').toMatch(
    /^ekoh_snapshot:/,
  )

  return {
    readingKey: String(reading?.reading_key),
    lensHash: String(reading?.lens_hash),
    snapshotRef: String(reading?.snapshot_ref),
    baselineParticipantCount: numericField(
      payload.baseline?.results_payload,
      'participant_count',
    ),
    advisoryParticipantCount: numericField(
      reading?.results_payload,
      'advisory_participant_count',
    ),
    excludedParticipantCount: numericField(
      reading?.results_payload,
      'excluded_participant_count',
    ),
  }
}

async function setSliderValue(page: Page, target: number): Promise<void> {
  const slider = page.getByRole('slider').first()
  await expect(slider).toBeVisible({ timeout: 10_000 })
  await slider.focus()

  const raw = await slider.getAttribute('aria-valuenow')
  let current = Number(raw ?? 0)

  expect(Number.isFinite(current), 'Stance slider should expose aria-valuenow').toBeTruthy()

  const direction = target >= current ? 'ArrowRight' : 'ArrowLeft'
  const steps = Math.abs(target - current)

  for (let index = 0; index < steps; index += 1) {
    await slider.press(direction)
  }

  await expect(slider).toHaveAttribute('aria-valuenow', String(target))
}

async function saveAuthenticatedStance(page: Page): Promise<void> {
  const stanceCard = page.locator('.ant-card').filter({ hasText: /Set your position/i }).first()
  await expect(stanceCard).toBeVisible({ timeout: 10_000 })

  const slider = stanceCard.getByRole('slider').first()
  const current = Number((await slider.getAttribute('aria-valuenow')) ?? 0)
  const target = current === 2 ? 1 : 2

  await setSliderValue(page, target)

  const responsePromise = page.waitForResponse(
    (response) =>
      response.status() >= 200 &&
      response.status() < 300 &&
      response.request().method() === 'POST' &&
      /\/api\/ethikos\/stances\/?(?:\?|$)/i.test(response.url()),
    { timeout: 15_000 },
  )

  await stanceCard.getByRole('button', { name: /save topic stance/i }).click()
  const response = await responsePromise

  expect(
    response.ok(),
    `Saving topic stance failed with HTTP ${response.status()}`,
  ).toBeTruthy()

  await expect(page.getByText(/Your stance has been recorded\./i).last()).toBeVisible({
    timeout: 5_000,
  })

  await safeScreenshot(page, '08-authenticated-stance-saved')
}

async function castPublicVote(page: Page): Promise<void> {
  const search = page.getByPlaceholder(/search consultations/i).first()
  await expect(search).toBeVisible({ timeout: 10_000 })
  await search.fill(WRITE_TOPIC_TITLE)
  await page.waitForTimeout(300)

  await expect(
    page.getByText(WRITE_TOPIC_TITLE).first(),
    'Delivery participation topic should appear in Public consultations',
  ).toBeVisible({ timeout: 10_000 })

  const row = page.locator('tr').filter({ hasText: WRITE_TOPIC_TITLE }).first()
  const scope = (await row.isVisible().catch(() => false)) ? row : page.locator('body')

  const agreeRadio = scope.getByRole('radio', { name: /^Agree$/i }).first()
  if (await agreeRadio.isVisible().catch(() => false)) {
    await agreeRadio.click()
  } else {
    await scope.getByText(/^Agree$/i).first().click()
  }

  const castButton = scope.getByRole('button', { name: /cast vote/i }).first()
  await expect(castButton).toBeEnabled({ timeout: 5_000 })

  const responsePromise = page.waitForResponse(
    (response) =>
      response.status() >= 200 &&
      response.status() < 300 &&
      response.request().method() === 'POST' &&
      /\/api\/ethikos\/stances\/?(?:\?|$)/i.test(response.url()),
    { timeout: 15_000 },
  )

  await castButton.click()
  const response = await responsePromise

  expect(
    response.ok(),
    `Public vote failed with HTTP ${response.status()}`,
  ).toBeTruthy()

  await expect(page.getByText(/Your vote has been recorded\./i).last()).toBeVisible({
    timeout: 5_000,
  })

  await safeScreenshot(page, '10-authenticated-public-vote')
}

async function writeEvidence(evidence: DeliveryEvidence): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const body = `${JSON.stringify(evidence, null, 2)}\n`
  fs.writeFileSync(EVIDENCE_PATH, body, 'utf8')

  await test.info().attach('ethikos-delivery-evidence', {
    body: Buffer.from(body, 'utf8'),
    contentType: 'application/json',
  })
}

test.describe.serial('Ethikos / EkoH / Smart Vote delivery workflow', () => {
  test.setTimeout(180_000)

  let findings: Finding[]
  let visitedRoutes: string[]

  test.beforeEach(async ({ page }) => {
    sameOriginHost()
    findings = []
    visitedRoutes = []

    page.on('console', (message) => {
      if (!['error', 'assert'].includes(message.type())) {
        return
      }

      const text = message.text()
      if (isIgnorableConsoleError(text)) {
        return
      }

      findings.push({
        type: `console:${message.type()}`,
        message: text,
      })
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
          message: `Forbidden legacy route drift: ${url}`,
        })
      }

      if (status >= 500) {
        findings.push({
          type: 'server-error',
          message: `HTTP ${status}: ${url}`,
        })
        return
      }

      if (status >= 400 && status < 500) {
        if (isIgnorableHttpResponse(status, url)) {
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

  test('proves the demonstrable Ethikos → EkoH → Smart Vote golden path', async ({
    page,
  }) => {
    const evidence: DeliveryEvidence = {
      generatedAt: new Date().toISOString(),
      frontendBaseUrl: BASE_URL,
      backendBaseUrl: BACKEND_BASE_URL,
      authenticatedUser: '',
      cinematicTopic: { id: '', title: CINEMATIC_TOPIC_TITLE },
      participationTopic: {
        id: '',
        title: WRITE_TOPIC_TITLE,
        stanceSaved: false,
        publicVoteCast: false,
      },
      smartVote: {
        readingKey: '',
        lensHash: '',
        snapshotRef: '',
        baselineParticipantCount: null,
        advisoryParticipantCount: null,
        excludedParticipantCount: null,
      },
      visitedRoutes,
      runtimeFindings: findings,
    }

    await test.step('Authenticate and verify the session', async () => {
      await visitPage(page, '/', findings, visitedRoutes, '00-home-authenticated')
      evidence.authenticatedUser = await verifyAuthenticatedUser(page)
    })

    await test.step('Run the cinematic deliberation path', async () => {
      const cinematicTopicId = await openCinematicTopicFromElite(
        page,
        findings,
        visitedRoutes,
      )
      evidence.cinematicTopic.id = cinematicTopicId

      await verifyCinematicDeliberation(page)
      await verifyEkohContext(page)
      await openEmergentGovernanceQuestion(page)
      visitedRoutes.push(new URL(page.url()).pathname)
      await verifyConflictAndRecusal(page)
      await verifySmartVoteUi(page)

      evidence.smartVote = await verifySmartVoteApi(page, cinematicTopicId)
      expect(findings, 'Cinematic delivery findings').toHaveLength(0)
    })

    await test.step('Prove a real authenticated contribution', async () => {
      const writeTopicId = await resolveTopicIdByTitle(
        page,
        WRITE_TOPIC_TITLE,
        WRITE_TOPIC_ID,
      )
      evidence.participationTopic.id = writeTopicId

      await visitPage(
        page,
        `/ethikos/deliberate/${writeTopicId}?sidebar=ethikos`,
        findings,
        visitedRoutes,
        '08-participation-topic',
      )
      await expectTextVisible(page, new RegExp(WRITE_TOPIC_TITLE, 'i'), 'participation topic')

      await saveAuthenticatedStance(page)
      evidence.participationTopic.stanceSaved = true

      await visitPage(
        page,
        '/ethikos/decide/public?sidebar=ethikos',
        findings,
        visitedRoutes,
        '09-decide-public',
      )
      await castPublicVote(page)
      evidence.participationTopic.publicVoteCast = true
    })

    await test.step('Walk the delivery surfaces', async () => {
      await visitPage(
        page,
        '/ethikos/decide/results?sidebar=ethikos',
        findings,
        visitedRoutes,
        '11-decision-results',
      )
      await expectTextVisible(page, /Decision results/i, 'decision results')
      await expectTextVisible(
        page,
        /Single source facts, multiple readings/i,
        'source/readings separation',
      )
      await expectTextVisible(page, /Public baseline/i, 'public baseline')
      await expectTextVisible(page, /Advisory lens/i, 'advisory lens')

      await visitPage(
        page,
        '/ethikos/decide/methodology?sidebar=ethikos',
        findings,
        visitedRoutes,
        '12-voting-methodology',
      )
      await expectTextVisible(page, /Voting methodology/i, 'voting methodology')
      await expectTextVisible(page, /How Smart Voting Works/i, 'Smart Vote methodology')

      await visitPage(
        page,
        '/ethikos/trust/profile?sidebar=ethikos',
        findings,
        visitedRoutes,
        '13-ekoh-profile',
      )
      await expectTextVisible(page, /My EkoH profile/i, 'EkoH profile')
      await expectTextVisible(
        page,
        /Expertise is contextual, not a universal rank/i,
        'contextual expertise principle',
      )

      await visitPage(
        page,
        '/ethikos/impact/tracker?sidebar=ethikos',
        findings,
        visitedRoutes,
        '14-impact-tracker',
      )
      await expectTextVisible(page, /Impact tracker/i, 'impact tracker')

      await visitPage(
        page,
        '/ethikos/pulse/overview?sidebar=ethikos',
        findings,
        visitedRoutes,
        '15-pulse-overview',
      )
      await expectTextVisible(page, /Pulse · Overview/i, 'Pulse overview')

      await visitPage(
        page,
        '/ethikos/insights?sidebar=ethikos',
        findings,
        visitedRoutes,
        '16-ethikos-insights',
      )
      await expectTextVisible(page, /Ethikos overview/i, 'Ethikos insights overview')
    })

    expect(evidence.cinematicTopic.id).not.toEqual('')
    expect(evidence.participationTopic.id).not.toEqual('')
    expect(evidence.participationTopic.stanceSaved).toBeTruthy()
    expect(evidence.participationTopic.publicVoteCast).toBeTruthy()
    expect(evidence.smartVote.readingKey).not.toEqual('')
    expect(evidence.smartVote.lensHash).toMatch(/^sha256:/)
    expect(evidence.smartVote.snapshotRef).toMatch(/^ekoh_snapshot:/)
    expect(findings, 'Final delivery runtime findings').toHaveLength(0)

    await writeEvidence(evidence)
    await safeScreenshot(page, '17-delivery-complete')
  })
})
