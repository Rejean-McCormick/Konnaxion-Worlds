// FILE: frontend/services/deliberate.ts
import type { Topic } from '@/types'

import { get } from './_request'
import {
  createEthikosTopic,
  createTopicArgument,
  ETHIKOS_PATHS,
  fetchEthikosTopic,
  fetchTopicArguments as fetchEthikosTopicArguments,
  fetchTopicDetail as fetchEthikosTopicDetail,
  fetchTopicPreview as fetchEthikosTopicPreview,
  fetchEthikosTopics,
  fetchTopicStances as fetchEthikosTopicStances,
  normalizeList,
  resolveEthikosCategoryId,
  submitTopicStance as submitEthikosTopicStance,
} from './ethikos'
import type {
  ApiMaybeList,
  ArgumentSide,
  EthikosArgumentApi,
  EthikosId,
  EthikosStanceApi,
  EthikosTopicApi,
  StanceValue,
  TopicPreviewResponse,
} from './ethikos'

/* ------------------------------------------------------------------ */
/*  Exported Deliberate compatibility types                           */
/* ------------------------------------------------------------------ */

export type TopicStanceValue = StanceValue

export type EliteTopic = Topic & {
  createdAt: string
  lastActivity: string
  hot: boolean
  /** Normalized locally from stances until the topic serializer exposes it. */
  stanceCount?: number
}

export type EliteTopicsResponse = {
  list: EliteTopic[]
}

export type TopicPreviewStatement = TopicPreviewResponse['latest'][number]

export type TopicDetailStatement = {
  id: string
  author: string
  userId?: string
  body: string
  side?: ArgumentSide | null
  parent?: string | null
  createdAt: string
}

export type TopicDetailResponse = {
  id: string
  title: string
  description: string
  category: string
  createdAt: string
  lastActivity: string
  statements: TopicDetailStatement[]
}

export type TopicStance = {
  id: string
  topicId: string
  user?: string
  value: TopicStanceValue
  timestamp: string
}

export type CreateEliteTopicPayload = {
  title: string
  /**
   * Current UI may still send a category name string.
   * This service resolves it to category_id before POST.
   */
  category: string | number
  description?: string
  expertiseCategoryId?: number | null
}

export type SubmitTopicStancePayload = {
  topicId: string | number
  value: TopicStanceValue
}

export type SubmitTopicArgumentPayload = {
  topicId: string | number
  body: string
  parentId?: string | number | null
  side?: ArgumentSide | null
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function toTopicId(id: string | number): number {
  const value = Number(id)

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid Ethikos topic id: ${String(id)}`)
  }

  return value
}

function optionalNumericId(id: string | number | null | undefined): number | null {
  if (id == null || id === '') {
    return null
  }

  const value = Number(id)

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid Ethikos id: ${String(id)}`)
  }

  return value
}

function toIdKey(id: EthikosId | null | undefined): string {
  return String(id ?? '')
}

function assertStanceValue(value: number): asserts value is TopicStanceValue {
  if (!Number.isInteger(value) || value < -3 || value > 3) {
    throw new Error('Ethikos stance value must be an integer from -3 to 3.')
  }
}

function assertArgumentSide(
  side: ArgumentSide | null | undefined,
): asserts side is ArgumentSide | null | undefined {
  if (side == null) {
    return
  }

  if (side !== 'pro' && side !== 'con') {
    throw new Error('Ethikos argument side must be "pro" or "con".')
  }
}

function displayUser(value: string | number | null | undefined): string {
  if (value == null || value === '') {
    return 'Anonymous'
  }

  return String(value)
}

function categoryName(topic: EthikosTopicApi): string {
  return topic.category?.name ?? topic.category_name ?? 'Uncategorized'
}

function normalizeDateString(
  value: string | null | undefined,
  fallback?: string,
): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }

  if (typeof fallback === 'string' && fallback.trim().length > 0) {
    return fallback
  }

  return new Date().toISOString()
}

function topicCreatedAt(topic: EthikosTopicApi): string {
  return normalizeDateString(topic.created_at)
}

function topicLastActivity(topic: EthikosTopicApi): string {
  const createdAt = topicCreatedAt(topic)

  return normalizeDateString(
    topic.last_activity ?? topic.updated_at,
    createdAt,
  )
}

function toDateValue(value: string | null | undefined): number {
  if (!value) {
    return 0
  }

  const parsed = Date.parse(value)

  return Number.isFinite(parsed) ? parsed : 0
}

function byDateAsc<T>(
  items: T[],
  getDate: (item: T) => string | null | undefined,
): T[] {
  return [...items].sort(
    (a, b) => toDateValue(getDate(a)) - toDateValue(getDate(b)),
  )
}

function byDateDesc<T>(
  items: T[],
  getDate: (item: T) => string | null | undefined,
): T[] {
  return [...items].sort(
    (a, b) => toDateValue(getDate(b)) - toDateValue(getDate(a)),
  )
}

function toEliteTopic(topic: EthikosTopicApi, stanceCount: number): EliteTopic {
  const createdAt = topicCreatedAt(topic)
  const lastActivity = topicLastActivity(topic)
  const totalVotes =
    typeof topic.total_votes === 'number' ? topic.total_votes : stanceCount

  return {
    id: String(topic.id),
    title: topic.title,
    category: categoryName(topic),
    createdAt,
    lastActivity,
    hot: totalVotes >= 10,
    stanceCount,
  } as EliteTopic
}

function toTopicStance(row: EthikosStanceApi): TopicStance {
  const value = Number(row.value)
  assertStanceValue(value)

  return {
    id: String(row.id),
    topicId: String(row.topic),
    user: row.user != null ? String(row.user) : undefined,
    value,
    timestamp: normalizeDateString(row.timestamp),
  }
}

function toDetailStatement(arg: EthikosArgumentApi): TopicDetailStatement {
  return {
    id: String(arg.id),
    author: displayUser(arg.user_display ?? arg.user),
    userId: arg.user_id != null ? String(arg.user_id) : undefined,
    body: arg.content,
    side: arg.side ?? null,
    parent: arg.parent != null ? String(arg.parent) : null,
    createdAt: normalizeDateString(arg.created_at),
  }
}

function toPreviewStatement(arg: EthikosArgumentApi): TopicPreviewStatement {
  return {
    id: String(arg.id),
    author: displayUser(arg.user_display ?? arg.user),
    body: arg.content,
    side: arg.side ?? null,
    parent: arg.parent != null ? String(arg.parent) : null,
    createdAt: normalizeDateString(arg.created_at),
  }
}

function normalizePreviewStatement(
  statement: TopicPreviewStatement,
): TopicPreviewStatement {
  return {
    id: String(statement.id),
    author: displayUser(statement.author),
    body: statement.body ?? '',
    side: statement.side ?? null,
    parent: statement.parent ?? null,
    createdAt: normalizeDateString(statement.createdAt),
  }
}

async function buildTopicPreviewFallback(
  topicId: number,
): Promise<TopicPreviewResponse> {
  const topic = await fetchEthikosTopic(topicId)

  let args: EthikosArgumentApi[] = []

  try {
    args = await fetchEthikosTopicArguments(topicId)
  } catch {
    args = []
  }

  const latest = byDateDesc(
    (args ?? []).filter((arg) => !arg.is_hidden),
    (arg) => arg.created_at,
  )
    .slice(0, 5)
    .map(toPreviewStatement)

  return {
    id: String(topic.id),
    title: topic.title,
    category: categoryName(topic),
    createdAt: topicCreatedAt(topic),
    description: topic.description ?? '',
    status: topic.status,
    lastActivity: topicLastActivity(topic),
    latest,
  }
}

function hasUsablePreview(
  preview: TopicPreviewResponse | null | undefined,
): preview is TopicPreviewResponse {
  return Boolean(preview?.id && preview?.title)
}

async function fetchAllTopicStances(): Promise<EthikosStanceApi[]> {
  const payload = await get<ApiMaybeList<EthikosStanceApi>>(ETHIKOS_PATHS.stances)
  return normalizeList(payload)
}

/* ------------------------------------------------------------------ */
/*  API calls                                                         */
/* ------------------------------------------------------------------ */

/**
 * Lists Ethikos topics and adapts them to the Elite UI shape.
 * We derive stanceCount locally until the topic serializer exposes it.
 */
export async function fetchEliteTopics(): Promise<EliteTopicsResponse> {
  const [topics, stances] = await Promise.all([
    fetchEthikosTopics(),
    fetchAllTopicStances(),
  ])

  const stanceCountByTopic = new Map<string, number>()

  for (const stance of stances) {
    const topicKey = toIdKey(stance.topic)

    if (!topicKey) {
      continue
    }

    stanceCountByTopic.set(
      topicKey,
      (stanceCountByTopic.get(topicKey) ?? 0) + 1,
    )
  }

  const list = byDateDesc(topics, topicLastActivity).map((topic) =>
    toEliteTopic(topic, stanceCountByTopic.get(toIdKey(topic.id)) ?? 0),
  )

  return { list }
}

/**
 * Preview = topic metadata + a short latest-statements slice.
 *
 * Preferred path:
 *   GET /api/ethikos/topics/{id}/preview/
 *
 * Adapter rule:
 * - never return an empty preview shape for an existing topic;
 * - keep Deliberate/Korum routed through canonical ethiKos service calls;
 * - do not create /api/kialo/*, /api/kintsugi/*, /api/korum/*, or /api/home/*.
 */
export async function fetchTopicPreview(
  id: string | number,
): Promise<TopicPreviewResponse> {
  const topicId = toTopicId(id)

  try {
    const preview = await fetchEthikosTopicPreview(topicId)

    if (hasUsablePreview(preview)) {
      return {
        id: String(preview.id),
        title: preview.title,
        category: preview.category || 'Uncategorized',
        createdAt: normalizeDateString(preview.createdAt),
        description: preview.description ?? '',
        status: preview.status,
        lastActivity: normalizeDateString(
          preview.lastActivity,
          preview.createdAt,
        ),
        stats: preview.stats,
        latest: (preview.latest ?? []).map(normalizePreviewStatement),
      }
    }
  } catch {
    // Fall through to topic + arguments fallback.
    // This keeps the preview drawer usable when the preview action is absent
    // or when argument aggregation fails.
  }

  return buildTopicPreviewFallback(topicId)
}

/**
 * Topic creation must go through the canonical Ethikos topic endpoint.
 * Backend accepts category_id, not arbitrary category labels.
 */
export async function createEliteTopic(
  payload: CreateEliteTopicPayload,
): Promise<{ id: string }> {
  const title = payload.title.trim()

  if (!title) {
    throw new Error('Title is required.')
  }

  const categoryId = await resolveEthikosCategoryId(payload.category)

  const created = await createEthikosTopic({
    title,
    description: payload.description?.trim() || title,
    category_id: categoryId,
    ...(payload.expertiseCategoryId != null
      ? { expertise_category: payload.expertiseCategoryId }
      : {}),
  })

  return { id: String(created.id) }
}

/**
 * Fetches normalized topic-level stances.
 * These are EthikosStance rows, not Smart Vote readings and not claim-level
 * impact votes.
 */
export async function fetchTopicStances(
  id: string | number,
): Promise<TopicStance[]> {
  const topicId = toTopicId(id)
  const stances = await fetchEthikosTopicStances(topicId)

  return stances.map(toTopicStance)
}

/**
 * Creates or updates the current user's topic-level stance.
 */
export async function submitTopicStance(
  payload: SubmitTopicStancePayload,
): Promise<TopicStance> {
  const topicId = toTopicId(payload.topicId)
  const value = Number(payload.value)

  assertStanceValue(value)

  const stance = await submitEthikosTopicStance(topicId, value)

  return toTopicStance(stance)
}

/**
 * Fetches visible arguments for a topic and normalizes them for UI rendering.
 */
export async function fetchTopicArguments(
  id: string | number,
): Promise<TopicDetailStatement[]> {
  const topicId = toTopicId(id)
  const args = await fetchEthikosTopicArguments(topicId)

  return byDateAsc(
    (args ?? []).filter((arg) => !arg.is_hidden),
    (arg) => arg.created_at,
  ).map(toDetailStatement)
}

/**
 * Creates a top-level argument or threaded reply.
 *
 * Uses parent_id because the current EthikosArgument serializer accepts parent
 * and parent_id, with parent_id kept as the explicit write field.
 */
export async function submitTopicArgument(
  payload: SubmitTopicArgumentPayload,
): Promise<TopicDetailStatement> {
  const topicId = toTopicId(payload.topicId)
  const content = payload.body.trim()
  const parentId = optionalNumericId(payload.parentId)

  if (!content) {
    throw new Error('Argument body cannot be empty.')
  }

  assertArgumentSide(payload.side)

  const created = await createTopicArgument({
    topic: topicId,
    content,
    ...(parentId != null ? { parent_id: parentId } : {}),
    ...(payload.side != null ? { side: payload.side } : {}),
  })

  return toDetailStatement(created)
}

/**
 * Detail = topic metadata + full visible statements thread.
 */
export async function fetchTopicDetail(
  id: string | number,
): Promise<TopicDetailResponse> {
  const topicId = toTopicId(id)

  try {
    const detail = await fetchEthikosTopicDetail(topicId)

    return {
      id: String(detail.id),
      title: detail.title,
      description: detail.description ?? '',
      category: detail.category ?? 'Uncategorized',
      createdAt: normalizeDateString(detail.createdAt),
      lastActivity: normalizeDateString(
        detail.lastActivity,
        detail.createdAt,
      ),
      statements: detail.statements.map((statement) => ({
        id: String(statement.id),
        author: displayUser(statement.author),
        userId: statement.userId,
        body: statement.body,
        side: statement.side ?? null,
        parent: statement.parent ?? null,
        createdAt: normalizeDateString(statement.createdAt),
      })),
    }
  } catch {
    const [topic, statements] = await Promise.all([
      fetchEthikosTopic(topicId),
      fetchTopicArguments(topicId),
    ])

    return {
      id: String(topic.id),
      title: topic.title,
      description: topic.description ?? '',
      category: categoryName(topic),
      createdAt: topicCreatedAt(topic),
      lastActivity: topicLastActivity(topic),
      statements,
    }
  }
}