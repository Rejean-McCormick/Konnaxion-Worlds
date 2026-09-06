import { expect, type Page, test } from '@playwright/test'

const BACKEND_BASE_URL =
  process.env.BACKEND_BASE_URL ?? 'http://localhost:8000'
const FRONTEND_BASE_URL =
  process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'
const PREWARM_TIMEOUT_MS = Number(
  process.env.HARVEST_ROUTE_PREWARM_TIMEOUT_MS ?? '120000',
)

type ApiResult<T> = {
  ok: boolean
  status: number
  data: T
}

function backendUrl(pathname: string): string {
  return new URL(pathname, BACKEND_BASE_URL).toString()
}

function frontendUrl(pathname: string): string {
  return new URL(pathname, FRONTEND_BASE_URL).toString()
}

async function prewarmRoute(page: Page, route: string): Promise<void> {
  const startedAt = Date.now()
  console.log(`[HARVEST PREWARM] START ${route}`)

  const response = await page.context().request.get(frontendUrl(route), {
    failOnStatusCode: false,
    timeout: PREWARM_TIMEOUT_MS,
  })

  const elapsedMs = Date.now() - startedAt
  console.log(
    `[HARVEST PREWARM] END ${route} HTTP ${response.status()} ${elapsedMs}ms`,
  )

  expect(
    response.ok(),
    `Prewarm ${route} failed with HTTP ${response.status()} after ${elapsedMs}ms`,
  ).toBeTruthy()
}

async function csrfHeader(page: Page): Promise<Record<string, string>> {
  const cookies = await page.context().cookies(BACKEND_BASE_URL)
  const csrfCookie = cookies.find((cookie) => cookie.name === 'csrftoken')

  return csrfCookie?.value
    ? { 'X-CSRFToken': csrfCookie.value }
    : {}
}

async function apiRequest<T>(
  page: Page,
  pathname: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: unknown
  } = {},
): Promise<ApiResult<T>> {
  const response = await page.context().request.fetch(
    backendUrl(pathname),
    {
      method: options.method ?? 'GET',
      failOnStatusCode: false,
      headers: {
        Accept: 'application/json',
        ...(options.body === undefined
          ? {}
          : { 'Content-Type': 'application/json' }),
        ...(await csrfHeader(page)),
      },
      data: options.body,
    },
  )

  const text = await response.text()
  let data: unknown = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  return {
    ok: response.ok(),
    status: response.status(),
    data: data as T,
  }
}

function formatHarvestError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message
  }
  return String(error)
}

async function harvestStep(
  name: string,
  harvestFindings: string[],
  action: () => Promise<void>,
): Promise<void> {
  await test.step(name, async () => {
    try {
      await action()
    } catch (error) {
      const message = formatHarvestError(error)
      const finding = `${name} :: ${message}`
      harvestFindings.push(finding)
      console.error(`[HARVEST FINDING] ${finding}`)
    }
  })
}

async function settleCurrentPage(page: Page): Promise<void> {
  // Let route-owned effects/API calls finish before starting the next navigation.
  // This prevents expected cancellations from the previous route from being
  // attributed to the route we are about to inspect.
  await page
    .waitForLoadState('networkidle', { timeout: 5_000 })
    .catch(() => undefined)
}

function isExpectedNavigationAbort(url: string, errorText: string): boolean {
  if (errorText !== 'net::ERR_ABORTED') return false

  return (
    url.includes('/_next/static/') ||
    url.includes('/__nextjs_original-stack-frames') ||
    url.includes('_rsc=')
  )
}

async function visit(
  page: Page,
  route: string,
  harvestFindings: string[],
): Promise<void> {
  const findings = new Set<string>()

  await settleCurrentPage(page)

  const onConsole = (message: { type(): string; text(): string }) => {
    if (message.type() === 'error') {
      findings.add(`console:error ${message.text()}`)
    }
  }

  const onPageError = (error: Error) => {
    findings.add(`pageerror ${error.message}`)
  }

  const onRequestFailed = (request: {
    url(): string
    failure(): { errorText?: string } | null
  }) => {
    const url = request.url()
    const errorText = request.failure()?.errorText ?? ''

    if (isExpectedNavigationAbort(url, errorText)) return

    findings.add(`requestfailed ${url} ${errorText}`)
  }

  const onResponse = (response: { status(): number; url(): string }) => {
    if (response.status() >= 400) {
      findings.add(`http:${response.status()} ${response.url()}`)
    }
  }

  page.on('console', onConsole)
  page.on('pageerror', onPageError)
  page.on('requestfailed', onRequestFailed)
  page.on('response', onResponse)

  try {
    // Route families are compiled in the dedicated prewarm step. Keep the
    // actual browser navigation strict so real navigation regressions remain
    // visible, but aggregate runtime findings so one noisy route does not stop
    // the rest of the bug-harvest campaign.
    const response = await page.goto(route, {
      waitUntil: 'domcontentloaded',
    })

    expect(
      response?.ok(),
      `Expected ${route} to load, got HTTP ${response?.status()}`,
    ).toBeTruthy()

    await page.waitForTimeout(300)
    await settleCurrentPage(page)
    await expect(page.locator('body')).not.toContainText(
      /Application error|Internal Server Error|Unhandled Runtime Error/i,
    )
  } finally {
    page.off('console', onConsole)
    page.off('pageerror', onPageError)
    page.off('requestfailed', onRequestFailed)
    page.off('response', onResponse)
  }

  for (const finding of Array.from(findings)) {
    harvestFindings.push(`${route} :: ${finding}`)
  }
}

test.describe('Platform bug harvest depth workflow', () => {
  test('proves newly wired TeamBuilder and KonnectED paths', async ({ page }) => {
    test.setTimeout(360_000)
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
    const problemName = `Harvest problem ${suffix}`
    const topicTitle = `Harvest discussion ${suffix}?`

    let problemId: string | null = null
    let topicId: string | null = null
    const harvestFindings: string[] = []

    try {
      await harvestStep('Compile targeted route families once', harvestFindings, async () => {
        // Next dev compiles route modules lazily. Compile each route family before
        // the data workflow so dynamic IDs do not turn compiler latency into a
        // product failure. The dummy dynamic IDs are not executed in browser JS.
        await prewarmRoute(page, '/teambuilder/problems')
        await prewarmRoute(page, '/teambuilder/problems/__harvest_compile__')
        await prewarmRoute(
          page,
          '/konnected/community-discussions/active-threads',
        )
        await prewarmRoute(
          page,
          '/konnected/community-discussions/thread/__harvest_compile__',
        )
        await prewarmRoute(page, '/konnected/mentorship')
        await prewarmRoute(page, '/konnected/dashboard')
      })

      await harvestStep('TeamBuilder problem API → library → detail', harvestFindings, async () => {
        const createProblem = await apiRequest<{ id: string }>(
          page,
          '/api/teambuilder/problems/',
          {
            method: 'POST',
            body: {
              name: problemName,
              description: 'Created by the targeted platform harvest workflow.',
              status: 'ACTIVE',
              risk_level: 'MEDIUM',
              min_team_size: 2,
              max_team_size: 5,
              unesco_codes: ['13.01'],
              categories: ['Harvest'],
              recommended_modes: ['BALANCED'],
              facilitator_notes: 'Automated harvest evidence.',
            },
          },
        )

        expect(
          createProblem.ok,
          `Problem create failed HTTP ${createProblem.status}`,
        ).toBeTruthy()

        problemId = String(createProblem.data.id)

        await visit(page, '/teambuilder/problems', harvestFindings)
        await expect(
          page.getByRole('link', { name: problemName, exact: true }),
        ).toBeVisible()

        await visit(page, `/teambuilder/problems/${problemId}`, harvestFindings)
        await expect(
          page.getByRole('heading', { name: problemName, exact: true }),
        ).toBeVisible()
      })

      await harvestStep('KonnectED forum API → active threads', harvestFindings, async () => {
        const createTopic = await apiRequest<{ id: string }>(
          page,
          '/api/konnected/forum-topics/',
          {
            method: 'POST',
            body: {
              title: topicTitle,
              category: 'General',
            },
          },
        )

        expect(
          createTopic.ok,
          `Forum topic create failed HTTP ${createTopic.status}`,
        ).toBeTruthy()

        topicId = String(createTopic.data.id)

        const createPost = await apiRequest(
          page,
          '/api/konnected/forum-posts/',
          {
            method: 'POST',
            body: {
              topic: topicId,
              content: 'Targeted harvest integration evidence.',
            },
          },
        )

        expect(
          createPost.ok,
          `Forum post create failed HTTP ${createPost.status}`,
        ).toBeTruthy()

        await visit(
          page,
          '/konnected/community-discussions/active-threads',
          harvestFindings,
        )
        const threadTitle = page.getByText(topicTitle, { exact: true }).first()
        await expect(threadTitle).toBeVisible()
        await threadTitle.click()
        await expect(page).toHaveURL(
          new RegExp(`/konnected/community-discussions/thread/${topicId}/?$`),
        )
        await expect(
          page.getByText('Targeted harvest integration evidence.', { exact: true }),
        ).toBeVisible()

        const uiReply = `UI harvest reply ${suffix}`
        await page.getByPlaceholder('Add a constructive reply…').fill(uiReply)

        const replyResponsePromise = page.waitForResponse(
          (response) =>
            response.status() >= 200 &&
            response.status() < 300 &&
            response.request().method() === 'POST' &&
            /\/api\/konnected\/forum-posts\/?(?:\?|$)/.test(response.url()),
          { timeout: 15_000 },
        )

        await page.getByRole('button', { name: 'Post reply' }).click()

        const replyResponse = await replyResponsePromise
        const replyBody = await replyResponse.text()
        expect(
          replyResponse.ok(),
          `UI forum reply failed HTTP ${replyResponse.status()}: ${replyBody}`,
        ).toBeTruthy()

        await expect(
          page.locator('.ant-list-item').filter({ hasText: uiReply }),
        ).toBeVisible()
      })

      await harvestStep('KonnectED newly exposed read surfaces', harvestFindings, async () => {
        for (const endpoint of [
          '/api/konnected/recommendations/',
          '/api/konnected/progress/',
          '/api/konnected/mentors/',
          '/api/konnected/mentorship-requests/',
          '/api/konnected/co-creation-projects/',
        ]) {
          const result = await apiRequest(page, endpoint)
          expect(
            result.ok,
            `${endpoint} returned HTTP ${result.status}`,
          ).toBeTruthy()
        }

        await visit(page, '/konnected/mentorship', harvestFindings)
        await visit(page, '/konnected/dashboard', harvestFindings)
      })

      await test.step('Report all runtime findings together', async () => {
        expect(
          harvestFindings,
          `Runtime findings across targeted harvest routes:\n${harvestFindings.join('\n')}`,
        ).toHaveLength(0)
      })
    } finally {
      if (topicId) {
        await apiRequest(page, `/api/konnected/forum-topics/${topicId}/`, {
          method: 'DELETE',
        })
      }
      if (problemId) {
        await apiRequest(page, `/api/teambuilder/problems/${problemId}/`, {
          method: 'DELETE',
        })
      }
    }
  })
})
