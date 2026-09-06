import { expect, type Page, test } from '@playwright/test'
import { readFile, unlink } from 'node:fs/promises'
import path from 'node:path'

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

async function csrfHeader(page: Page): Promise<Record<string, string>> {
  const cookies = await page.context().cookies(BACKEND_BASE_URL)
  const csrfCookie = cookies.find((cookie) => cookie.name === 'csrftoken')
  return csrfCookie?.value ? { 'X-CSRFToken': csrfCookie.value } : {}
}

async function apiRequest<T>(
  page: Page,
  pathname: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    body?: unknown
  } = {},
): Promise<ApiResult<T>> {
  const response = await page.context().request.fetch(backendUrl(pathname), {
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
  })

  const body = await response.text()
  let data: unknown = null
  try {
    data = body ? JSON.parse(body) : null
  } catch {
    data = body
  }

  return {
    ok: response.ok(),
    status: response.status(),
    data: data as T,
  }
}

function collectionItems<T extends Record<string, unknown>>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { results?: unknown[] }).results)
  ) {
    return (data as { results: T[] }).results
  }
  return []
}

function mediaFilePath(mediaFile: unknown): string | null {
  if (typeof mediaFile !== 'string' || !mediaFile) return null
  const mediaPathname = new URL(mediaFile, BACKEND_BASE_URL).pathname
  if (!mediaPathname.startsWith('/media/')) return null

  return path.resolve(
    process.cwd(),
    '..',
    'backend',
    'konnaxion',
    'media',
    mediaPathname.slice('/media/'.length),
  )
}

async function cleanupStaleHarvestArtifacts(page: Page): Promise<void> {
  const specs = [
    {
      endpoint: '/api/keenkonnect/projects/',
      field: 'title',
      prefix: 'Harvest2 project ',
    },
    {
      endpoint: '/api/kreative/artworks/',
      field: 'title',
      prefix: 'Harvest2 artwork ',
    },
    {
      endpoint: '/api/kreative/collab-sessions/',
      field: 'name',
      prefix: 'Harvest2 collab ',
    },
  ] as const

  for (const spec of specs) {
    const result = await apiRequest<unknown>(page, spec.endpoint)
    if (!result.ok) continue

    for (const item of collectionItems<Record<string, unknown>>(result.data)) {
      const id = item.id
      const label = item[spec.field]
      if (
        (typeof id !== 'string' && typeof id !== 'number') ||
        typeof label !== 'string' ||
        !label.startsWith(spec.prefix)
      ) {
        continue
      }

      const staleMedia =
        spec.endpoint === '/api/kreative/artworks/'
          ? mediaFilePath(item.media_file)
          : null

      await apiRequest(page, `${spec.endpoint}${id}/`, { method: 'DELETE' })
      if (staleMedia) {
        await unlink(staleMedia).catch(() => undefined)
      }
    }
  }
}

async function prewarmRoute(page: Page, route: string): Promise<void> {
  const startedAt = Date.now()
  console.log(`[HARVEST2 PREWARM] START ${route}`)
  const response = await page.context().request.get(frontendUrl(route), {
    failOnStatusCode: false,
    timeout: PREWARM_TIMEOUT_MS,
  })
  const elapsed = Date.now() - startedAt
  console.log(
    `[HARVEST2 PREWARM] END ${route} HTTP ${response.status()} ${elapsed}ms`,
  )
  expect(
    response.ok(),
    `Prewarm ${route} failed HTTP ${response.status()} after ${elapsed}ms`,
  ).toBeTruthy()
}

function isNavigationAbort(url: string, errorText: string): boolean {
  if (!/ERR_ABORTED/i.test(errorText)) return false
  return (
    url.includes('/_next/static/') ||
    url.includes('/__nextjs_original-stack-frames') ||
    /[?&]_rsc=/.test(url)
  )
}

async function visit(
  page: Page,
  route: string,
  findings: string[],
): Promise<void> {
  const local = new Set<string>()
  let navigating = true
  let navigationAbortBudget = 0

  const onConsole = (message: { type(): string; text(): string }) => {
    if (message.type() !== 'error') return

    const text = message.text()

    if (
      text.includes('React.Fragment can only have') &&
      text.includes('autoFocus')
    ) {
      console.warn(`[HARVEST2 DEPENDENCY-WARNING] ${route} :: ${text}`)
      return
    }

    const isFetchAbortNoise =
      navigationAbortBudget > 0 &&
      /(?:Failed to fetch|fetch error)/i.test(text)

    if (navigating && isFetchAbortNoise) {
      navigationAbortBudget -= 1
      return
    }

    local.add(`console:error ${text}`)
  }
  const onPageError = (error: Error) => {
    local.add(`pageerror ${error.message}`)
  }
  const onRequestFailed = (request: {
    url(): string
    failure(): { errorText?: string } | null
  }) => {
    const errorText = request.failure()?.errorText ?? ''
    const url = request.url()

    if (/ERR_ABORTED/i.test(errorText) && navigating) {
      navigationAbortBudget += 1
      return
    }

    if (!isNavigationAbort(url, errorText)) {
      local.add(`requestfailed ${url} ${errorText}`)
    }
  }
  const onResponse = (response: { status(): number; url(): string }) => {
    if (response.status() >= 400) {
      local.add(`http:${response.status()} ${response.url()}`)
    }
  }
  const onRequest = (request: { url(): string }) => {
    if (/https?:\/\/(?:localhost|127\.0\.0\.1):8000\//i.test(request.url())) {
      local.add(`unexpected-backend-origin ${request.url()}`)
    }
  }

  page.on('console', onConsole)
  page.on('pageerror', onPageError)
  page.on('requestfailed', onRequestFailed)
  page.on('response', onResponse)
  page.on('request', onRequest)

  try {
    navigating = true
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
    expect(
      response?.ok(),
      `Expected ${route} HTTP 2xx/3xx, got ${response?.status()}`,
    ).toBeTruthy()

    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined)
    await page.waitForTimeout(1_000)
    await page.waitForLoadState('networkidle', { timeout: 4_000 }).catch(() => undefined)
    navigating = false

    // Let debounced ProTable requests settle while this route still owns the
    // listeners. A following page.goto must not inherit its cancellation noise.
    await page.waitForTimeout(500)

    await expect(page.locator('body')).not.toContainText(
      /Application error|Internal Server Error|Unhandled Runtime Error/i,
    )
  } finally {
    navigating = false
    page.off('console', onConsole)
    page.off('pageerror', onPageError)
    page.off('requestfailed', onRequestFailed)
    page.off('response', onResponse)
    page.off('request', onRequest)
  }

  for (const finding of Array.from(local)) {
    findings.push(`${route} :: ${finding}`)
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.stack ?? error.message : String(error)
}

async function harvestStep(
  name: string,
  findings: string[],
  action: () => Promise<void>,
): Promise<void> {
  await test.step(name, async () => {
    try {
      await action()
    } catch (error) {
      const finding = `${name} :: ${formatError(error)}`
      findings.push(finding)
      console.error(`[HARVEST2 FINDING] ${finding}`)
    }
  })
}

test.describe('Platform bug harvest Wave 2', () => {
  test('runtime/API depth — keenKonnect + Kreative + Kontrol', async ({ page }) => {
    test.setTimeout(360_000)
    const findings: string[] = []
    const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`
    const projectTitle = `Harvest2 project ${suffix}`
    const artworkTitle = `Harvest2 artwork ${suffix}`
    const collabName = `Harvest2 collab ${suffix}`
    let projectId: string | null = null
    let artworkId: string | null = null
    let artworkMediaPath: string | null = null
    let collabId: string | null = null

    const prewarmRoutes = [
      '/keenkonnect/projects/browse-projects',
      '/keenkonnect/projects/my-projects',
      '/keenkonnect/projects/project-workspace',
      '/keenkonnect/knowledge/document-management',
      '/keenkonnect/workspaces/browse-available-workspaces',
      '/keenkonnect/workspaces/launch-new-workspace',
      '/keenkonnect/sustainability-impact/track-project-impact',
      '/kreative/dashboard',
      '/kreative/creative-hub/submit-creative-work',
      '/kreative/community-showcases/submit-to-showcase',
      '/kreative/mentorship',
      '/kreative/traditions-archive',
      '/kreative/idea-incubator/create-new-idea',
      '/kreative/collaborative-spaces/my-spaces',
      '/kreative/collaborative-spaces/start-new-space',
      '/kontrol/dashboard',
      '/kontrol/audit-log',
      '/kontrol/moderation/queue',
      '/kontrol/users/all',
      '/kontrol/roles',
    ]

    try {
      await harvestStep('Compile Wave 2 route families', findings, async () => {
        for (const route of prewarmRoutes) {
          await prewarmRoute(page, route)
        }
      })

      await harvestStep('Cleanup stale Wave 2 artifacts', findings, async () => {
        await cleanupStaleHarvestArtifacts(page)
      })

      await harvestStep('keenKonnect API + project UI', findings, async () => {
        for (const endpoint of [
          '/api/keenkonnect/projects/',
          '/api/keenkonnect/resources/',
          '/api/keenkonnect/tasks/',
          '/api/keenkonnect/messages/',
          '/api/keenkonnect/teams/',
          '/api/keenkonnect/ratings/',
          '/api/keenkonnect/tags/',
        ]) {
          const result = await apiRequest(page, endpoint)
          expect(
            result.ok,
            `${endpoint} returned HTTP ${result.status}`,
          ).toBeTruthy()
        }

        const created = await apiRequest<{ id: string | number }>(
          page,
          '/api/keenkonnect/projects/',
          {
            method: 'POST',
            body: {
              title: projectTitle,
              description: 'Created by Konnaxion targeted Bug Harvest Wave 2.',
              category: 'Harvest',
              status: 'idea',
            },
          },
        )
        expect(
          created.ok,
          `keenKonnect project create HTTP ${created.status}`,
        ).toBeTruthy()
        projectId = String(created.data.id)

        await visit(page, '/keenkonnect/projects/browse-projects', findings)
        await expect(page.getByText(projectTitle, { exact: true }).first()).toBeVisible()

        await visit(page, '/keenkonnect/projects/my-projects', findings)
        await expect(page.getByText(projectTitle, { exact: true }).first()).toBeVisible()

        await visit(
          page,
          `/keenkonnect/projects/project-workspace?projectId=${projectId}`,
          findings,
        )
        await expect(page.getByText(projectTitle, { exact: true }).first()).toBeVisible()

        await visit(page, '/keenkonnect/knowledge/document-management', findings)
        await visit(page, '/keenkonnect/workspaces/browse-available-workspaces', findings)
        await visit(page, '/keenkonnect/workspaces/launch-new-workspace', findings)
        await visit(page, '/keenkonnect/sustainability-impact/track-project-impact', findings)
      })

      await harvestStep('Kreative API + product surfaces', findings, async () => {
        for (const endpoint of [
          '/api/kreative/artworks/',
          '/api/kreative/galleries/',
          '/api/kreative/collab-sessions/',
          '/api/kreative/traditions/',
          '/api/kreative/tags/',
        ]) {
          const result = await apiRequest(page, endpoint)
          expect(
            result.ok,
            `${endpoint} returned HTTP ${result.status}`,
          ).toBeTruthy()
        }

        await visit(page, '/kreative/dashboard', findings)
        await visit(page, '/kreative/creative-hub/submit-creative-work', findings)

        await page.getByLabel('Title').fill(artworkTitle)
        await page
          .getByLabel('Description')
          .fill('Persisted by Konnaxion targeted Bug Harvest Wave 2.')
        const categoryFormItem = page
          .locator('.ant-form-item')
          .filter({ hasText: 'Medium / category' })
          .first()
        await categoryFormItem.locator('.ant-select-selector').click({
          timeout: 5_000,
        })
        const categoryDropdown = page.locator('.ant-select-dropdown:visible')
        await expect(categoryDropdown).toBeVisible({ timeout: 5_000 })
        await categoryDropdown
          .locator('.ant-select-item-option')
          .filter({ hasText: /^Other$/ })
          .click({ timeout: 5_000 })
        await expect(
          categoryFormItem.locator('.ant-select-selection-item'),
        ).toHaveText('Other')
        await page.locator('input[type="file"]').setInputFiles({
          name: `harvest2-${suffix}.txt`,
          mimeType: 'text/plain',
          buffer: Buffer.from(`Konnaxion Wave 2 ${suffix}\n`, 'utf8'),
        })

        const artworkResponsePromise = page.waitForResponse(
          (response) =>
            response.request().method() === 'POST' &&
            /\/api\/kreative\/artworks\/?$/.test(
              new URL(response.url()).pathname,
            ) &&
            response.status() >= 200 &&
            response.status() < 300,
          { timeout: 15_000 },
        )

        await page.getByRole('button', { name: 'Submit', exact: true }).click()

        const artworkResponse = await artworkResponsePromise
        const artworkPayload = (await artworkResponse.json()) as {
          id?: string | number
          media_file?: string | null
        }
        expect(artworkPayload.id, 'Kreative artwork POST returned no id').toBeTruthy()
        artworkId = String(artworkPayload.id)

        artworkMediaPath = mediaFilePath(artworkPayload.media_file)

        await expect(page).toHaveURL(/\/kreative\/dashboard/)
        await expect(page.getByText(artworkTitle, { exact: true }).first()).toBeVisible()

        await visit(page, '/kreative/collaborative-spaces/start-new-space', findings)
        await page.getByLabel('Space Name').fill(collabName)
        await page
          .getByLabel('Description / Purpose')
          .fill('Created by Konnaxion targeted Bug Harvest Wave 2.')

        const collabResponsePromise = page.waitForResponse(
          (response) =>
            response.request().method() === 'POST' &&
            /\/api\/kreative\/collab-sessions\/?$/.test(
              new URL(response.url()).pathname,
            ) &&
            response.status() >= 200 &&
            response.status() < 300,
          { timeout: 15_000 },
        )
        await page.getByRole('button', { name: 'Create Space', exact: true }).click()
        const collabResponse = await collabResponsePromise
        const collabPayload = (await collabResponse.json()) as {
          id?: string | number
          name?: string
        }
        expect(collabPayload.id, 'Kreative collab POST returned no id').toBeTruthy()
        expect(collabPayload.name).toBe(collabName)
        collabId = String(collabPayload.id)

        await visit(page, '/kreative/collaborative-spaces/my-spaces', findings)
        await expect(page.getByText(collabName, { exact: true }).first()).toBeVisible()
        await visit(page, '/kreative/traditions-archive', findings)
        await visit(page, '/kreative/idea-incubator/create-new-idea', findings)
        await visit(page, '/kreative/community-showcases/submit-to-showcase', findings)
        await visit(page, '/kreative/mentorship', findings)
      })

      await harvestStep('Kontrol admin API + surfaces', findings, async () => {
        for (const endpoint of [
          '/api/admin/audit-log/',
          '/api/admin/moderation/',
          '/api/admin/users/',
          '/api/admin/konsensus-config/',
        ]) {
          const result = await apiRequest(page, endpoint)
          expect(
            result.ok,
            `${endpoint} returned HTTP ${result.status}`,
          ).toBeTruthy()
        }

        await visit(page, '/kontrol/dashboard', findings)
        await visit(page, '/kontrol/audit-log', findings)
        await visit(page, '/kontrol/moderation/queue', findings)
        await visit(page, '/kontrol/users/all', findings)
        await visit(page, '/kontrol/roles', findings)
      })

      await test.step('Report Wave 2 runtime findings together', async () => {
        expect(
          findings,
          `Wave 2 runtime findings:\n${findings.join('\n')}`,
        ).toHaveLength(0)
      })
    } finally {
      if (!page.isClosed()) {
        if (collabId) {
          await apiRequest(page, `/api/kreative/collab-sessions/${collabId}/`, {
            method: 'DELETE',
          }).catch(() => undefined)
        }
        if (artworkId) {
          await apiRequest(page, `/api/kreative/artworks/${artworkId}/`, {
            method: 'DELETE',
          }).catch(() => undefined)
        }
        if (projectId) {
          await apiRequest(page, `/api/keenkonnect/projects/${projectId}/`, {
            method: 'DELETE',
          }).catch(() => undefined)
        }
      }
      if (artworkMediaPath) {
        await unlink(artworkMediaPath).catch(() => undefined)
      }
    }
  })

  test('source-gap audit — fake success / mocks / missing wiring', async () => {
    const targets = [
      'app/keenkonnect/dashboard/page.tsx',
      'app/keenkonnect/ai-team-matching/find-teams/page.tsx',
      'app/keenkonnect/ai-team-matching/my-matches/page.tsx',
      'app/keenkonnect/ai-team-matching/match-preferences/page.tsx',
      'app/keenkonnect/knowledge/document-management/page.tsx',
      'app/keenkonnect/knowledge/browse-repository/page.tsx',
      'app/keenkonnect/knowledge/upload-new-document/page.tsx',
      'app/keenkonnect/projects/project-workspace/page.tsx',
      'app/keenkonnect/user-reputation/account-preferences/page.tsx',
      'app/keenkonnect/user-reputation/manage-expertise-areas/page.tsx',
      'app/keenkonnect/sustainability-impact/submit-impact-reports/page.tsx',
      'app/keenkonnect/sustainability-impact/track-project-impact/page.tsx',
      'app/keenkonnect/workspaces/browse-available-workspaces/page.tsx',
      'app/keenkonnect/workspaces/my-workspaces/page.tsx',
      'app/keenkonnect/workspaces/launch-new-workspace/page.tsx',
      'app/kreative/creative-hub/submit-creative-work/page.tsx',
      'app/kreative/creative-hub/inspiration-gallery/page.tsx',
      'app/kreative/traditions-archive/page.tsx',
      'app/kreative/idea-incubator/create-new-idea/page.tsx',
      'app/kreative/idea-incubator/my-ideas/page.tsx',
      'app/kreative/idea-incubator/collaborate-on-ideas/page.tsx',
      'app/kreative/community-showcases/submit-to-showcase/page.tsx',
      'app/kreative/collaborative-spaces/start-new-space/page.tsx',
      'app/kreative/mentorship/page.tsx',
      'app/kontrol/dashboard/page.tsx',
      'app/kontrol/moderation/community/page.tsx',
      'app/kontrol/roles/page.tsx',
      'app/kontrol/users/all/page.tsx',
    ]

    const blockingRules: Array<[string, RegExp]> = [
      ['undeclared-test-data', /\b[A-Za-z0-9_]*mock[A-Za-z0-9_]*\b/gi],
      ['fake-success', /\bsimulat(?:ed|ion)\b|local example/gi],
      ['api-wiring-todo', /TODO[^\n]*(?:API|backend|appel API)/gi],
      ['placeholder-coming-soon', /coming soon/gi],
      ['fake-admin-success', /has been banned|Password reset email sent|Role saved successfully/gi],
      ['nonpersisted-console-action', /console\.log\([^\n]*(?:submit|join|saved|save)/gi],
      ['legacy-antd-compatible', /@ant-design\/compatible/gi],
      ['known-missing-endpoint', /knowledge\/documents\/upload|impact\/sustainability\/(?:report|track)|['"`]\/?workspaces\/launch['"`]/gi],
    ]
    const deferredRules: Array<[string, RegExp]> = [
      ['declared-preview', /\bpreview\b/gi],
      ['declared-readonly', /\bread-only\b|\bnot persisted\b|\bunavailable\b/gi],
    ]

    const findings: string[] = []
    const deferred: string[] = []

    for (const relative of targets) {
      const absolute = path.resolve(process.cwd(), relative)
      const source = await readFile(absolute, 'utf8')
      const lines = source.split(/\r?\n/)

      for (const [ruleName, pattern] of blockingRules) {
        pattern.lastIndex = 0
        for (const match of Array.from(source.matchAll(pattern))) {
          const before = source.slice(0, match.index ?? 0)
          const line = before.split(/\r?\n/).length
          const excerpt = lines[line - 1]?.trim() ?? match[0]
          findings.push(
            `SOURCE-GAP ${ruleName} ${relative}:${line} :: ${excerpt}`,
          )
        }
      }

      for (const [ruleName, pattern] of deferredRules) {
        pattern.lastIndex = 0
        for (const match of Array.from(source.matchAll(pattern))) {
          const before = source.slice(0, match.index ?? 0)
          const line = before.split(/\r?\n/).length
          const excerpt = lines[line - 1]?.trim() ?? match[0]
          deferred.push(
            `SOURCE-DEFERRED ${ruleName} ${relative}:${line} :: ${excerpt}`,
          )
        }
      }
    }

    console.log(
      `[HARVEST2 SOURCE] blocking=${findings.length} declared-deferred=${deferred.length}`,
    )
    for (const finding of findings) {
      console.log(finding)
    }
    for (const item of deferred) {
      console.log(item)
    }

    expect(
      findings,
      `Wave 2 source gaps:\n${findings.join('\n')}`,
    ).toHaveLength(0)
  })
})
