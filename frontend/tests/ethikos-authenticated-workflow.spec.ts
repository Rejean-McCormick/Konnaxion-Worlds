// FILE: frontend/tests/ethikos-authenticated-workflow.spec.ts
import { expect, type Page, test } from '@playwright/test'

import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'
const BACKEND_BASE_URL =
  process.env.BACKEND_BASE_URL ?? 'http://localhost:8000'
const TOPIC_ID = process.env.WAVE1_TOPIC_ID
const outDir = path.join('artifacts', 'ethikos-authenticated-workflow')

const WORKFLOW_TOPIC_TITLE =
  'Should public datasets require consent receipts?'

const ROUTE_DRIFT_RE =
  /\/api\/(kialo|kintsugi|korum|deliberation|deliberate|home)\b|\/(kialo|kintsugi|korum|deliberation)\b/i

const RUNTIME_ERROR_RE =
  /Application error|Unhandled Runtime Error|Build Error|Module not found|Cannot read properties of undefined|Cannot read properties of null|Maximum update depth exceeded/i

type Finding = {
  type: string
  message: string
}

type ApiResult<T = unknown> = {
  ok: boolean
  status: number
  url: string
  data: T
  bodyText: string
}

type ApiEntity = {
  id: string | number
}

type ApiList<T> = T[] | { results?: T[] }

type UserMe = {
  id?: string | number
  pk?: string | number
  username?: string
  email?: string
  name?: string
  url?: string
  avatar_url?: string
}

async function resolveTopicId(page: Page): Promise<string> {
  if (TOPIC_ID) {
    return TOPIC_ID
  }

  const response = await page.context().request.get(
    backendUrl('/api/ethikos/topics/'),
    { failOnStatusCode: false },
  )

  if (response.ok()) {
    const payload = (await response.json()) as
      | Array<ApiEntity & { title?: string }>
      | { results?: Array<ApiEntity & { title?: string }> }
    const rows = Array.isArray(payload) ? payload : payload.results ?? []
    const seeded = rows.find(
      (item) => item.title === WORKFLOW_TOPIC_TITLE && item.id != null,
    )

    if (seeded?.id != null) {
      return String(seeded.id)
    }
  }

  throw new Error(
    'Unable to resolve the seeded Ethikos workflow topic. Run backend seed_ethikos_workflow or set WAVE1_TOPIC_ID.',
  )
}

function urlFor(route: string): string {
  return new URL(route, BASE_URL).toString()
}

function backendUrl(route: string): string {
  return new URL(route, BACKEND_BASE_URL).toString()
}

function apiPath(pathname: string): string {
  if (pathname.startsWith('/api/')) {
    return pathname
  }

  return `/api/${pathname.replace(/^\/+/, '')}`
}

function normalizeApiList<T>(payload: ApiList<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results ?? []
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

async function safeScreenshot(page: Page, name: string): Promise<void> {
  fs.mkdirSync(outDir, { recursive: true })

  try {
    await page.screenshot({
      path: path.join(outDir, `${name}.png`),
      fullPage: true,
    })
  } catch {
    // Screenshots are best-effort only.
  }
}

async function safeBodyText(page: Page): Promise<string> {
  try {
    return await page.evaluate(() => document.body?.innerText ?? '')
  } catch {
    return ''
  }
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

  expect(bodyText, `Runtime/build error rendered on ${route}`).not.toMatch(
    RUNTIME_ERROR_RE,
  )

  await safeScreenshot(page, screenshotName)

  expect(findings, `Runtime findings on ${route}`).toHaveLength(0)
}

async function csrfHeader(page: Page): Promise<Record<string, string>> {
  const cookies = await page.context().cookies(BACKEND_BASE_URL)
  const csrfCookie = cookies.find((cookie) => cookie.name === 'csrftoken')

  if (!csrfCookie?.value) {
    return {}
  }

  return {
    'X-CSRFToken': csrfCookie.value,
  }
}

async function apiRequest<T>(
  page: Page,
  pathname: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
    body?: unknown
  } = {},
): Promise<ApiResult<T>> {
  const method = options.method ?? 'GET'
  const url = backendUrl(apiPath(pathname))

  const response = await page.context().request.fetch(url, {
    method,
    failOnStatusCode: false,
    headers: {
      Accept: 'application/json',
      ...(options.body === undefined
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...(await csrfHeader(page)),
    },
    data: options.body,
  })

  const bodyText = await response.text()
  let data: unknown = null

  try {
    data = bodyText ? JSON.parse(bodyText) : null
  } catch {
    data = bodyText
  }

  const result: ApiResult<T> = {
    ok: response.ok(),
    status: response.status(),
    url,
    data: data as T,
    bodyText,
  }

  expect(
    result.ok,
    `${method} ${url} failed with HTTP ${result.status}: ${result.bodyText}`,
  ).toBeTruthy()

  return result
}

function entityId(entity: ApiEntity, label: string): string {
  expect(entity.id, `${label} should have an id`).toBeTruthy()
  return String(entity.id)
}

function getOptionalUserId(user: UserMe): string | null {
  const envUserId = process.env.ETHIKOS_TEST_USER_ID

  if (envUserId && envUserId.trim()) {
    return envUserId.trim()
  }

  const id = user.id ?? user.pk

  if (id == null || id === '') {
    return null
  }

  return String(id)
}

async function verifyOrWriteParticipantRole(
  page: Page,
  topicId: string,
  userId: string | null,
): Promise<void> {
  if (userId) {
    const roleResponse = await apiRequest<ApiEntity>(
      page,
      '/api/ethikos/discussion-participant-roles/',
      {
        method: 'POST',
        body: {
          topic: topicId,
          target_user_id: userId,
          role: 'owner',
        },
      },
    )

    entityId(roleResponse.data, 'Created or updated participant role')
    return
  }

  const rolesResponse = await apiRequest<unknown>(
    page,
    `/api/ethikos/discussion-participant-roles/?topic=${topicId}`,
  )

  expect(
    JSON.stringify(rolesResponse.data),
    'Seeded participant role should be readable when /api/users/me/ does not expose id/pk',
  ).toMatch(/owner/i)
}

async function setVisibilitySetting(
  page: Page,
  topicId: string,
): Promise<void> {
  const existingResponse = await apiRequest<ApiList<ApiEntity>>(
    page,
    `/api/ethikos/discussion-visibility-settings/?topic=${topicId}`,
  )

  const existing = normalizeApiList(existingResponse.data)[0]

  if (existing?.id) {
    const patchResponse = await apiRequest<ApiEntity>(
      page,
      `/api/ethikos/discussion-visibility-settings/${existing.id}/`,
      {
        method: 'PATCH',
        body: {
          participation_type: 'standard',
          author_visibility: 'all',
          vote_visibility: 'all',
        },
      },
    )

    entityId(patchResponse.data, 'Updated visibility setting')
    return
  }

  const createResponse = await apiRequest<ApiEntity>(
    page,
    '/api/ethikos/discussion-visibility-settings/',
    {
      method: 'POST',
      body: {
        topic: topicId,
        participation_type: 'standard',
        author_visibility: 'all',
        vote_visibility: 'all',
      },
    },
  )

  entityId(createResponse.data, 'Created visibility setting')
}

async function selectPublicVoteAndSubmit(page: Page): Promise<void> {
  const search = page.getByPlaceholder(/search consultations/i).first()

  if (await search.isVisible().catch(() => false)) {
    await search.fill(WORKFLOW_TOPIC_TITLE)
    await page.waitForTimeout(300)
  }

  await expect(
    page.getByText(WORKFLOW_TOPIC_TITLE).first(),
    'Seeded public consultation should be visible after filtering',
  ).toBeVisible({ timeout: 10_000 })

  const row = page.locator('tr').filter({ hasText: WORKFLOW_TOPIC_TITLE }).first()
  const targetScope = (await row.isVisible().catch(() => false))
    ? row
    : page.locator('body')

  const agreeRadio = targetScope.getByRole('radio', { name: /^Agree$/i }).first()

  if (await agreeRadio.isVisible().catch(() => false)) {
    await agreeRadio.click()
  } else {
    await targetScope.getByText(/^Agree$/i).first().click()
  }

  const castVoteButton = targetScope
    .getByRole('button', { name: /cast vote/i })
    .first()

  await expect(
    castVoteButton,
    'Cast vote should enable after selection',
  ).toBeEnabled({
    timeout: 5_000,
  })

  await castVoteButton.click()
  await page.waitForTimeout(800)
}

test.describe.serial('Ethikos authenticated workflow', () => {
  let findings: Finding[]

  test.beforeEach(async ({ page }) => {
    findings = []

    page.on('console', (message) => {
      if (['error', 'assert'].includes(message.type())) {
        const text = message.text()

        if (isIgnorableConsoleError(text)) {
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
          message: `Forbidden Ethikos route drift: ${url}`,
        })
      }

      if (status >= 500) {
        findings.push({
          type: 'server-error',
          message: `HTTP ${status}: ${url}`,
        })
      }

      if ((status === 401 || status === 403) && !isAllowedAuthUrl(url)) {
        findings.push({
          type: 'unexpected-auth-block',
          message: `HTTP ${status}: ${url}`,
        })
      }
    })
  })

  test('exercises authenticated Ethikos write paths and verifies UI', async ({
    page,
  }) => {
    const topicId = await resolveTopicId(page)
    const unique = Date.now()

    await page.goto(urlFor('/'), { waitUntil: 'domcontentloaded' })

    const meResponse = await apiRequest<UserMe>(page, '/api/users/me/')
    const me = meResponse.data
    const userId = getOptionalUserId(me)

    await apiRequest(page, `/api/ethikos/topics/${topicId}/`)

    await apiRequest(page, '/api/ethikos/stances/', {
      method: 'POST',
      body: {
        topic: topicId,
        value: 1,
      },
    })

    const argumentContent = `Authenticated smoke argument ${unique}`
    const replyContent = `Authenticated smoke reply ${unique}`
    const sourceTitle = `Authenticated source ${unique}`
    const suggestionContent = `Authenticated suggestion ${unique}`

    const argumentResponse = await apiRequest<ApiEntity>(
      page,
      '/api/ethikos/arguments/',
      {
        method: 'POST',
        body: {
          topic: topicId,
          content: argumentContent,
          side: 'pro',
        },
      },
    )

    const argumentId = entityId(argumentResponse.data, 'Created argument')

    const replyResponse = await apiRequest<ApiEntity>(
      page,
      '/api/ethikos/arguments/',
      {
        method: 'POST',
        body: {
          topic: topicId,
          parent: argumentId,
          content: replyContent,
          side: 'con',
        },
      },
    )

    entityId(replyResponse.data, 'Created reply')

    const sourceResponse = await apiRequest<ApiEntity>(
      page,
      '/api/ethikos/argument-sources/',
      {
        method: 'POST',
        body: {
          argument: argumentId,
          title: sourceTitle,
          url: `https://example.com/ethikos-authenticated-source-${unique}`,
          source_type: 'reference',
          citation_text: `Authenticated workflow citation ${unique}`,
          quote: `Authenticated workflow quote ${unique}`,
          note: `Authenticated workflow note ${unique}`,
        },
      },
    )

    entityId(sourceResponse.data, 'Created source')

    const impactVoteResponse = await apiRequest<ApiEntity>(
      page,
      '/api/ethikos/argument-impact-votes/',
      {
        method: 'POST',
        body: {
          argument: argumentId,
          value: 4,
        },
      },
    )

    entityId(impactVoteResponse.data, 'Created impact vote')

    const suggestionResponse = await apiRequest<ApiEntity>(
      page,
      '/api/ethikos/argument-suggestions/',
      {
        method: 'POST',
        body: {
          topic: topicId,
          parent: argumentId,
          side: 'pro',
          content: suggestionContent,
        },
      },
    )

    entityId(suggestionResponse.data, 'Created suggestion')

    await setVisibilitySetting(page, topicId)

    await verifyOrWriteParticipantRole(page, topicId, userId)

    await visitPage(
      page,
      `/ethikos/deliberate/${topicId}?sidebar=ethikos`,
      findings,
      '01-auth-deliberate-topic',
    )

    await expect(
      page.getByText(argumentContent).first(),
      'New authenticated argument should render on topic page',
    ).toBeVisible({ timeout: 10_000 })

    await expect(
      page.getByText(replyContent).first(),
      'New authenticated reply should render on topic page',
    ).toBeVisible({ timeout: 10_000 })

    await safeScreenshot(page, '02-auth-written-argument-visible')

    const inspectButton = page
      .getByRole('button', { name: /inspect korum data/i })
      .first()

    if (await inspectButton.isVisible().catch(() => false)) {
      await inspectButton.click()
      await page.waitForTimeout(500)
      await safeScreenshot(page, '03-auth-korum-panels')
    }

    await visitPage(
      page,
      '/ethikos/decide/public?sidebar=ethikos',
      findings,
      '04-auth-decide-public',
    )

    await selectPublicVoteAndSubmit(page)
    await safeScreenshot(page, '05-auth-public-vote-submitted')

    expect(findings, 'Authenticated workflow runtime findings').toHaveLength(0)
  })
})

