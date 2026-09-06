// FILE: frontend/_e2e/ethikos-korum-deliberate.spec.ts
import { expect, type Page, type Route, test } from '@playwright/test'

/* ------------------------------------------------------------------ */
/*  Kintsugi Wave 1 — Korum / Deliberate smoke                         */
/* ------------------------------------------------------------------ */
/**
 * Scope:
 * - /ethikos/deliberate/elite
 * - /ethikos/deliberate/[topic]
 * - canonical /api/ethikos/* API surface
 *
 * These tests intentionally avoid /api/kialo/*, /api/kintsugi/*, /api/korum/*,
 * /api/deliberation/*, and /api/home/* because Kintsugi Wave 1 keeps
 * Kialo-style deliberation as a native ethiKos/Korum mimic, not a parallel
 * route family.
 */

const TOPIC_ID = 101
const ARGUMENT_ID = 201
const CHILD_ARGUMENT_ID = 202

const topic = {
  id: TOPIC_ID,
  title: 'Should public datasets require consent receipts?',
  description:
    'A Korum deliberation topic used to verify structured argument mapping.',
  category: {
    id: 1,
    name: 'Public ethics',
    description: 'Ethical public decision-making.',
  },
  category_name: 'Public ethics',
  expertise_category: null,
  status: 'open',
  total_votes: 12,
  created_by: 'korum-user',
  created_by_id: 1,
  created_at: '2026-04-27T12:00:00.000Z',
  last_activity: '2026-04-27T13:00:00.000Z',
}

const argumentsPayload = [
  {
    id: ARGUMENT_ID,
    topic: TOPIC_ID,
    user: 'korum-user',
    user_id: 1,
    content: 'Consent receipts improve public accountability.',
    parent: null,
    side: 'pro',
    is_hidden: false,
    source_count: 1,
    impact_vote_count: 2,
    suggestion_count: 1,
    created_at: '2026-04-27T12:10:00.000Z',
    updated_at: '2026-04-27T12:10:00.000Z',
  },
  {
    id: CHILD_ARGUMENT_ID,
    topic: TOPIC_ID,
    user: 'korum-other',
    user_id: 2,
    content: 'The receipt burden should stay proportional to risk.',
    parent: ARGUMENT_ID,
    side: 'con',
    is_hidden: false,
    source_count: 0,
    impact_vote_count: 1,
    suggestion_count: 0,
    created_at: '2026-04-27T12:20:00.000Z',
    updated_at: '2026-04-27T12:20:00.000Z',
  },
]

const previewPayload = {
  id: TOPIC_ID,
  title: topic.title,
  description: topic.description,
  full_description: topic.description,
  category: 'Public ethics',
  category_id: 1,
  category_name: 'Public ethics',
  status: 'open',
  total_votes: 12,
  created_at: topic.created_at,
  last_activity: topic.last_activity,
  stats: {
    stance_count: 2,
    argument_count: 2,
    pro_count: 1,
    con_count: 1,
    neutral_count: 0,
    source_count: 1,
    impact_vote_count: 3,
    suggestion_count: 1,
  },
  latest: [
    {
      id: CHILD_ARGUMENT_ID,
      user: 'korum-other',
      author: 'korum-other',
      content: 'The receipt burden should stay proportional to risk.',
      body: 'The receipt burden should stay proportional to risk.',
      side: 'con',
      parent: ARGUMENT_ID,
      created_at: '2026-04-27T12:20:00.000Z',
      source_count: 0,
      impact_vote_count: 1,
      suggestion_count: 0,
    },
    {
      id: ARGUMENT_ID,
      user: 'korum-user',
      author: 'korum-user',
      content: 'Consent receipts improve public accountability.',
      body: 'Consent receipts improve public accountability.',
      side: 'pro',
      parent: null,
      created_at: '2026-04-27T12:10:00.000Z',
      source_count: 1,
      impact_vote_count: 2,
      suggestion_count: 1,
    },
  ],
}

const sourcePayload = [
  {
    id: 301,
    argument: ARGUMENT_ID,
    url: 'https://example.org/consent-receipts',
    title: 'Consent receipts reference',
    excerpt: 'A short citation supporting consent receipts.',
    source_type: 'reference',
    citation_text: 'Example citation',
    quote: '',
    note: '',
    is_removed: false,
    created_by: 'korum-user',
    created_by_id: 1,
    created_at: '2026-04-27T12:15:00.000Z',
    updated_at: '2026-04-27T12:15:00.000Z',
  },
]

const impactVotesPayload = [
  {
    id: 401,
    argument: ARGUMENT_ID,
    user: 'korum-user',
    user_id: 1,
    value: 4,
    created_at: '2026-04-27T12:30:00.000Z',
    updated_at: '2026-04-27T12:30:00.000Z',
  },
]

const suggestionsPayload = [
  {
    id: 501,
    topic: TOPIC_ID,
    parent: ARGUMENT_ID,
    side: 'neutral',
    content: 'Add a neutral framing note about implementation burden.',
    status: 'pending',
    accepted_argument: null,
    created_by: 'korum-user',
    created_by_id: 1,
    reviewed_by: null,
    reviewed_by_id: null,
    reviewed_at: null,
    created_at: '2026-04-27T12:35:00.000Z',
    updated_at: '2026-04-27T12:35:00.000Z',
  },
]

const rolesPayload = [
  {
    id: 601,
    topic: TOPIC_ID,
    user: 'korum-user',
    user_id: 1,
    role: 'owner',
    assigned_by: 'korum-admin',
    assigned_by_id: 3,
    created_at: '2026-04-27T12:00:00.000Z',
    updated_at: '2026-04-27T12:00:00.000Z',
  },
]

const visibilityPayload = [
  {
    id: 701,
    topic: TOPIC_ID,
    participation_type: 'standard',
    author_visibility: 'all',
    vote_visibility: 'all',
    changed_by: 'korum-admin',
    changed_by_id: 3,
    created_at: '2026-04-27T12:00:00.000Z',
    updated_at: '2026-04-27T12:00:00.000Z',
  },
]

function listPayload<T>(results: T[]) {
  return {
    count: results.length,
    next: null,
    previous: null,
    results,
  }
}

function routeUrl(route: Route): URL {
  return new URL(route.request().url())
}

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  })
}

function isEthikosApiPath(pathname: string): boolean {
  return pathname === '/api/ethikos' || pathname.startsWith('/api/ethikos/')
}

function isForbiddenKintsugiDrift(pathname: string): boolean {
  return [
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
  ].some((forbidden) => pathname.startsWith(forbidden))
}

async function mockEthikosApi(page: Page) {
  const requestedPaths: string[] = []
  const forbiddenPaths: string[] = []

  await page.route('**/*', async (route) => {
    const url = routeUrl(route)
    const pathname = url.pathname

    if (isForbiddenKintsugiDrift(pathname)) {
      forbiddenPaths.push(`${route.request().method()} ${pathname}`)
      await fulfillJson(
        route,
        { detail: `Forbidden Kintsugi drift path requested: ${pathname}` },
        500,
      )
      return
    }

    if (!isEthikosApiPath(pathname)) {
      await route.continue()
      return
    }

    requestedPaths.push(`${route.request().method()} ${pathname}${url.search}`)

    if (pathname.endsWith('/ethikos/categories/')) {
      await fulfillJson(route, listPayload([topic.category]))
      return
    }

    if (pathname.endsWith('/ethikos/topics/')) {
      await fulfillJson(route, listPayload([topic]))
      return
    }

    if (pathname.endsWith(`/ethikos/topics/${TOPIC_ID}/`)) {
      await fulfillJson(route, topic)
      return
    }

    if (pathname.endsWith(`/ethikos/topics/${TOPIC_ID}/preview/`)) {
      await fulfillJson(route, previewPayload)
      return
    }

    if (pathname.endsWith('/ethikos/stances/')) {
      await fulfillJson(
        route,
        listPayload([
          {
            id: 801,
            topic: TOPIC_ID,
            user: 'korum-user',
            value: 2,
            timestamp: '2026-04-27T12:40:00.000Z',
          },
          {
            id: 802,
            topic: TOPIC_ID,
            user: 'korum-other',
            value: -1,
            timestamp: '2026-04-27T12:45:00.000Z',
          },
        ]),
      )
      return
    }

    if (pathname.endsWith('/ethikos/arguments/')) {
      await fulfillJson(route, listPayload(argumentsPayload))
      return
    }

    if (pathname.endsWith('/ethikos/argument-sources/')) {
      await fulfillJson(route, listPayload(sourcePayload))
      return
    }

    if (pathname.endsWith('/ethikos/argument-impact-votes/')) {
      await fulfillJson(route, listPayload(impactVotesPayload))
      return
    }

    if (pathname.endsWith('/ethikos/argument-suggestions/')) {
      await fulfillJson(route, listPayload(suggestionsPayload))
      return
    }

    if (pathname.endsWith('/ethikos/discussion-participant-roles/')) {
      await fulfillJson(route, listPayload(rolesPayload))
      return
    }

    if (pathname.endsWith('/ethikos/discussion-visibility-settings/')) {
      await fulfillJson(route, listPayload(visibilityPayload))
      return
    }

    await fulfillJson(
      route,
      { detail: `Unhandled mocked ethiKos route: ${pathname}` },
      404,
    )
  })

  return {
    requestedPaths,
    forbiddenPaths,
  }
}

test.describe('ethiKos Kintsugi Wave 1 — Korum / Deliberate', () => {
  test('elite deliberate page opens a populated preview drawer without route drift', async ({
    page,
  }) => {
    const api = await mockEthikosApi(page)

    await page.goto('/ethikos/deliberate/elite')
    await expect(page).toHaveURL(/\/ethikos\/deliberate\/elite/)

    await expect(
      page.getByText('Should public datasets require consent receipts?').first(),
    ).toBeVisible()

    await page
      .getByText('Should public datasets require consent receipts?')
      .first()
      .click()

    await expect(page.getByText('Public ethics').first()).toBeVisible()
    await expect(
      page.getByText('Consent receipts improve public accountability.').first(),
    ).toBeVisible()
    await expect(
      page
        .getByText('The receipt burden should stay proportional to risk.')
        .first(),
    ).toBeVisible()

    await expect(page.getByText('No data')).toHaveCount(0)

    expect(api.forbiddenPaths).toEqual([])
    expect(
      api.requestedPaths.some((path) => path.includes('/api/ethikos/topics')),
    ).toBe(true)
    expect(
      api.requestedPaths.every((path) => !path.includes('/api/home')),
    ).toBe(true)
  })

  test('topic detail page renders the visible argument thread from canonical ethiKos APIs', async ({
    page,
  }) => {
    const api = await mockEthikosApi(page)

    await page.goto(`/ethikos/deliberate/${TOPIC_ID}`)
    await expect(page).toHaveURL(new RegExp(`/ethikos/deliberate/${TOPIC_ID}`))

    await expect(
      page.getByText('Should public datasets require consent receipts?').first(),
    ).toBeVisible()
    await expect(
      page.getByText('Consent receipts improve public accountability.').first(),
    ).toBeVisible()
    await expect(
      page
        .getByText('The receipt burden should stay proportional to risk.')
        .first(),
    ).toBeVisible()

    expect(api.forbiddenPaths).toEqual([])
    expect(
      api.requestedPaths.some((path) =>
        path.includes(`/api/ethikos/topics/${TOPIC_ID}`),
      ),
    ).toBe(true)
    expect(
      api.requestedPaths.some((path) =>
        path.includes(`/api/ethikos/arguments/?topic=${TOPIC_ID}`),
      ),
    ).toBe(true)
  })

  test('Korum extension endpoints remain under the canonical ethiKos route family', async ({
    page,
  }) => {
    const api = await mockEthikosApi(page)

    await page.goto(`/ethikos/deliberate/${TOPIC_ID}`)

    const statuses = await page.evaluate(
      async ({ argumentId, topicId }) => {
        const urls = [
          `/api/ethikos/argument-sources/?argument=${argumentId}`,
          `/api/ethikos/argument-impact-votes/?argument=${argumentId}`,
          `/api/ethikos/argument-suggestions/?topic=${topicId}`,
          `/api/ethikos/discussion-participant-roles/?topic=${topicId}`,
          `/api/ethikos/discussion-visibility-settings/?topic=${topicId}`,
        ]

        return Promise.all(
          urls.map(async (url) => {
            const response = await fetch(url)
            return response.status
          }),
        )
      },
      {
        argumentId: ARGUMENT_ID,
        topicId: TOPIC_ID,
      },
    )

    expect(statuses).toEqual([200, 200, 200, 200, 200])
    expect(api.forbiddenPaths).toEqual([])
    expect(
      api.requestedPaths.some((path) =>
        path.includes('/api/ethikos/argument-sources/'),
      ),
    ).toBe(true)
    expect(
      api.requestedPaths.some((path) =>
        path.includes('/api/ethikos/argument-impact-votes/'),
      ),
    ).toBe(true)
    expect(
      api.requestedPaths.some((path) =>
        path.includes('/api/ethikos/argument-suggestions/'),
      ),
    ).toBe(true)
    expect(
      api.requestedPaths.some((path) =>
        path.includes('/api/ethikos/discussion-participant-roles/'),
      ),
    ).toBe(true)
    expect(
      api.requestedPaths.some((path) =>
        path.includes('/api/ethikos/discussion-visibility-settings/'),
      ),
    ).toBe(true)
  })
})