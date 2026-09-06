// FILE: frontend/services/ethikos.ts
import { del, get, patch, post } from './_request'

/* ------------------------------------------------------------------ */
/*  Shared ethiKos service foundation                                 */
/* ------------------------------------------------------------------ */

/**
 * Canonical ethiKos API helper.
 *
 * Keep all paths relative to NEXT_PUBLIC_API_BASE, which is already resolved
 * by services/_request.ts. Do not add `/api/` here.
 *
 * Kintsugi Wave 1 rules:
 * - canonical frontend service calls go through services/*;
 * - canonical ethiKos API paths remain /api/ethikos/* server-side;
 * - this file stores relative paths only, without the /api prefix;
 * - Kialo/Korum-style concepts are native ethiKos extensions, not new routes.
 */

export type EthikosId = string | number

export type TopicStatus = 'open' | 'closed' | 'archived'
export type ArgumentSide = 'pro' | 'con'
export type ArgumentSideFilter = ArgumentSide | 'neutral'
export type StanceValue = -3 | -2 | -1 | 0 | 1 | 2 | 3
export type ArgumentImpactValue = 0 | 1 | 2 | 3 | 4

export type DiscussionRole =
  | 'owner'
  | 'admin'
  | 'editor'
  | 'writer'
  | 'suggester'
  | 'viewer'

export type DiscussionParticipationType = 'standard' | 'anonymous'
export type AuthorVisibility = 'never' | 'admins_only' | 'all'
export type VoteVisibility = 'all' | 'admins_only' | 'self_only'

export type ArgumentSuggestionStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'revision_requested'

const STANCE_VALUES: readonly StanceValue[] = [-3, -2, -1, 0, 1, 2, 3]
const IMPACT_VALUES: readonly ArgumentImpactValue[] = [0, 1, 2, 3, 4]
const TOPIC_STATUSES: readonly TopicStatus[] = ['open', 'closed', 'archived']

export interface ApiListResponse<T> {
  count?: number
  next?: string | null
  previous?: string | null
  results?: T[]
}

export type ApiMaybeList<T> = T[] | ApiListResponse<T>

export interface EthikosCategoryApi {
  id: EthikosId
  name: string
  description?: string | null
}

export interface EthikosTopicApi {
  id: EthikosId
  title: string
  description: string
  category: EthikosCategoryApi | null
  category_id?: EthikosId | null
  category_name?: string | null
  expertise_category?: EthikosId | null
  status: TopicStatus
  total_votes?: number | null
  created_by?: string | EthikosId | null
  created_by_id?: EthikosId | null
  last_activity?: string | null
  created_at: string
  updated_at?: string | null
}

export interface EthikosStanceApi {
  id: EthikosId
  topic: EthikosId
  user?: string | EthikosId | null
  user_id?: EthikosId | null
  value: StanceValue
  timestamp: string
}

export interface EthikosArgumentApi {
  id: EthikosId
  topic: EthikosId
  user?: string | EthikosId | null
  user_id?: EthikosId | null
  user_display?: string | null
  content: string
  parent?: EthikosId | null
  parent_id?: EthikosId | null
  side?: ArgumentSide | null
  is_hidden?: boolean
  source_count?: number | null
  impact_vote_count?: number | null
  suggestion_count?: number | null
  created_at: string
  updated_at?: string | null
}

export interface ArgumentSourceApi {
  id: EthikosId
  argument: EthikosId
  url?: string | null
  title?: string | null
  excerpt?: string | null
  source_type?: string | null
  citation_text?: string | null
  quote?: string | null
  note?: string | null
  is_removed?: boolean
  created_by?: string | EthikosId | null
  created_by_id?: EthikosId | null
  created_at: string
  updated_at?: string | null
}

export interface ArgumentImpactVoteApi {
  id: EthikosId
  argument: EthikosId
  user?: string | EthikosId | null
  user_id?: EthikosId | null
  value: ArgumentImpactValue
  created_at: string
  updated_at?: string | null
}

export interface ArgumentSuggestionApi {
  id: EthikosId
  topic: EthikosId
  parent?: EthikosId | null
  parent_id?: EthikosId | null
  side?: ArgumentSide | null
  content: string
  status: ArgumentSuggestionStatus
  accepted_argument?: EthikosId | null
  accepted_argument_id?: EthikosId | null
  created_by?: string | EthikosId | null
  created_by_id?: EthikosId | null
  reviewed_by?: string | EthikosId | null
  reviewed_by_id?: EthikosId | null
  reviewed_at?: string | null
  created_at: string
  updated_at?: string | null
}

export interface DiscussionParticipantRoleApi {
  id: EthikosId
  topic: EthikosId
  user?: string | EthikosId | null
  user_id?: EthikosId | null
  role: DiscussionRole
  assigned_by?: string | EthikosId | null
  assigned_by_id?: EthikosId | null
  created_at?: string | null
  updated_at?: string | null
}

export interface DiscussionVisibilitySettingApi {
  id: EthikosId
  topic: EthikosId
  participation_type: DiscussionParticipationType
  author_visibility: AuthorVisibility
  vote_visibility: VoteVisibility
  changed_by?: string | EthikosId | null
  changed_by_id?: EthikosId | null
  created_at?: string | null
  updated_at?: string | null
}

export interface TopicPreviewStats {
  argument_count: number
  pro_count: number
  con_count: number
  neutral_count: number
  source_count?: number
  impact_vote_count?: number
  suggestion_count?: number
}

export interface TopicPreviewStatement {
  id: string
  author: string
  body: string
  side?: ArgumentSide | null
  parent?: string | null
  createdAt?: string
}

export interface TopicPreviewResponse {
  id: string
  title: string
  category: string
  createdAt: string
  description?: string
  status?: TopicStatus
  lastActivity?: string
  stats?: TopicPreviewStats
  latest: TopicPreviewStatement[]
}

export interface TopicDetailResponse {
  id: string
  title: string
  description?: string
  category?: string
  createdAt: string
  lastActivity: string
  status: TopicStatus
  statements: {
    id: string
    author: string
    userId?: string
    body: string
    side?: ArgumentSide | null
    parent?: string | null
    createdAt: string
  }[]
}

export interface FetchEthikosTopicsParams {
  category?: EthikosId
  status?: TopicStatus
  search?: string
  ordering?: string
  page?: number
}

export interface CreateEthikosTopicPayload {
  title: string
  description?: string
  category_id?: EthikosId
  category?: EthikosId
  expertise_category?: EthikosId | null
  status?: TopicStatus
}

export type UpdateEthikosTopicPayload = Partial<CreateEthikosTopicPayload>

export interface CreateTopicArgumentPayload {
  topic: EthikosId
  content: string
  parent?: EthikosId | null
  parent_id?: EthikosId | null
  side?: ArgumentSide | null
}

export interface UpdateTopicArgumentPayload {
  content?: string
  parent?: EthikosId | null
  parent_id?: EthikosId | null
  side?: ArgumentSide | null
  is_hidden?: boolean
}

export interface CreateArgumentSourcePayload {
  url?: string
  title?: string
  excerpt?: string
  source_type?: string
  citation_text?: string
  quote?: string
  note?: string
}

export interface SubmitArgumentSuggestionPayload {
  topic: EthikosId
  content: string
  parent?: EthikosId | null
  parent_id?: EthikosId | null
  side?: ArgumentSide | null
}

export interface SetDiscussionParticipantRolePayload {
  topic: EthikosId
  target_user_id?: EthikosId | null

  /**
   * Compatibility alias.
   * New code should use target_user_id.
   */
  user?: EthikosId | null
  role: DiscussionRole
}

export interface SetDiscussionVisibilitySettingPayload {
  topic: EthikosId
  participation_type?: DiscussionParticipationType
  author_visibility?: AuthorVisibility
  vote_visibility?: VoteVisibility
}

export interface UpdateDiscussionVisibilitySettingPayload {
  topic?: EthikosId
  participation_type?: DiscussionParticipationType
  author_visibility?: AuthorVisibility
  vote_visibility?: VoteVisibility
}

/* ------------------------------------------------------------------ */
/*  Canonical paths                                                    */
/* ------------------------------------------------------------------ */

export const ETHIKOS_API_PREFIX = 'ethikos' as const

export const ETHIKOS_PATHS = {
  categories: 'ethikos/categories/',
  topics: 'ethikos/topics/',
  stances: 'ethikos/stances/',
  arguments: 'ethikos/arguments/',

  argumentSources: 'ethikos/argument-sources/',
  argumentImpactVotes: 'ethikos/argument-impact-votes/',
  argumentSuggestions: 'ethikos/argument-suggestions/',
  discussionParticipantRoles: 'ethikos/discussion-participant-roles/',
  discussionVisibilitySettings: 'ethikos/discussion-visibility-settings/',

  topicDetail: (id: EthikosId) => `ethikos/topics/${encodeId(id)}/`,
  topicPreview: (id: EthikosId) => `ethikos/topics/${encodeId(id)}/preview/`,
  topicArguments: (id: EthikosId) => `ethikos/arguments/?topic=${encodeId(id)}`,
  topicStances: (id: EthikosId) => `ethikos/stances/?topic=${encodeId(id)}`,
} as const

/* ------------------------------------------------------------------ */
/*  Low-level normalization helpers                                    */
/* ------------------------------------------------------------------ */

function encodeId(id: EthikosId): string {
  const value = String(id).trim()

  if (!value) {
    throw new Error('ethiKos id is required')
  }

  return encodeURIComponent(value)
}

function detailPath(resource: string, id: EthikosId): string {
  return `${resource}${encodeId(id)}/`
}

function actionPath(resource: string, id: EthikosId, action: string): string {
  return `${resource}${encodeId(id)}/${action.replace(/^\/+|\/+$/g, '')}/`
}

type CleanParamValue = EthikosId | boolean

function cleanParams<T extends object>(
  params?: T | null,
): Record<string, CleanParamValue> | undefined {
  if (!params) {
    return undefined
  }

  const cleaned: Record<string, CleanParamValue> = {}

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      cleaned[key] = value
    }
  }

  return Object.keys(cleaned).length ? cleaned : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined
}

function numberOrUndefined(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

function trimOptional(value?: string | null): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeTopicStatus(
  value: unknown,
  fallback?: TopicStatus,
): TopicStatus | undefined {
  if (typeof value === 'string' && TOPIC_STATUSES.includes(value as TopicStatus)) {
    return value as TopicStatus
  }

  return fallback
}

function normalizeListPayload<T>(payload: ApiMaybeList<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results ?? []
}

export function normalizeList<T>(payload: ApiMaybeList<T>): T[] {
  return normalizeListPayload(payload)
}

function categoryName(
  topic: Pick<EthikosTopicApi, 'category' | 'category_name'>,
): string {
  return topic.category?.name || topic.category_name || 'General'
}

function normalizeCategoryName(
  rawCategory: unknown,
  rawCategoryName?: unknown,
  fallbackTopic?: EthikosTopicApi,
): string {
  if (typeof rawCategory === 'string' && rawCategory.trim()) {
    return rawCategory.trim()
  }

  if (isRecord(rawCategory)) {
    const nestedName = stringOrUndefined(rawCategory.name)
    if (nestedName) return nestedName
  }

  const categoryNameValue = stringOrUndefined(rawCategoryName)
  if (categoryNameValue) return categoryNameValue

  if (fallbackTopic) return categoryName(fallbackTopic)

  return 'General'
}

function byCreatedDesc<T extends { created_at?: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const left = a.created_at ? Date.parse(a.created_at) : 0
    const right = b.created_at ? Date.parse(b.created_at) : 0
    return right - left
  })
}

function byCreatedAsc<T extends { created_at?: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const left = a.created_at ? Date.parse(a.created_at) : 0
    const right = b.created_at ? Date.parse(b.created_at) : 0
    return left - right
  })
}

function getArgumentParent(arg: EthikosArgumentApi): string | null {
  const parent = arg.parent ?? arg.parent_id
  return parent !== undefined && parent !== null ? String(parent) : null
}

function buildPreviewStatsFromArguments(
  args: EthikosArgumentApi[],
): TopicPreviewStats {
  const visible = args.filter((arg) => !arg.is_hidden)

  return {
    argument_count: visible.length,
    pro_count: visible.filter((arg) => arg.side === 'pro').length,
    con_count: visible.filter((arg) => arg.side === 'con').length,
    neutral_count: visible.filter((arg) => !arg.side).length,
    source_count: visible.reduce(
      (total, arg) => total + Number(arg.source_count ?? 0),
      0,
    ),
    impact_vote_count: visible.reduce(
      (total, arg) => total + Number(arg.impact_vote_count ?? 0),
      0,
    ),
    suggestion_count: visible.reduce(
      (total, arg) => total + Number(arg.suggestion_count ?? 0),
      0,
    ),
  }
}

function buildPreviewStatsFromStatements(
  statements: TopicPreviewStatement[],
): TopicPreviewStats {
  return {
    argument_count: statements.length,
    pro_count: statements.filter((statement) => statement.side === 'pro').length,
    con_count: statements.filter((statement) => statement.side === 'con').length,
    neutral_count: statements.filter((statement) => !statement.side).length,
  }
}

function normalizePreviewStats(raw: unknown): TopicPreviewStats | undefined {
  if (!isRecord(raw)) return undefined

  const source = isRecord(raw.stats)
    ? raw.stats
    : isRecord(raw.counts)
      ? raw.counts
      : raw

  const argumentCount =
    numberOrUndefined(source.argument_count) ??
    numberOrUndefined(source.argumentCount) ??
    numberOrUndefined(source.total_arguments) ??
    numberOrUndefined(source.totalArguments)

  const proCount =
    numberOrUndefined(source.pro_count) ??
    numberOrUndefined(source.proCount) ??
    numberOrUndefined(source.pro)

  const conCount =
    numberOrUndefined(source.con_count) ??
    numberOrUndefined(source.conCount) ??
    numberOrUndefined(source.con)

  const neutralCount =
    numberOrUndefined(source.neutral_count) ??
    numberOrUndefined(source.neutralCount) ??
    numberOrUndefined(source.neutral)

  const sourceCount =
    numberOrUndefined(source.source_count) ??
    numberOrUndefined(source.sourceCount) ??
    numberOrUndefined(source.sources)

  const impactVoteCount =
    numberOrUndefined(source.impact_vote_count) ??
    numberOrUndefined(source.impactVoteCount) ??
    numberOrUndefined(source.impact_votes)

  const suggestionCount =
    numberOrUndefined(source.suggestion_count) ??
    numberOrUndefined(source.suggestionCount) ??
    numberOrUndefined(source.suggestions)

  const hasAnyCount = [
    argumentCount,
    proCount,
    conCount,
    neutralCount,
    sourceCount,
    impactVoteCount,
    suggestionCount,
  ].some((value) => value !== undefined)

  if (!hasAnyCount) return undefined

  return {
    argument_count: argumentCount ?? 0,
    pro_count: proCount ?? 0,
    con_count: conCount ?? 0,
    neutral_count: neutralCount ?? 0,
    source_count: sourceCount,
    impact_vote_count: impactVoteCount,
    suggestion_count: suggestionCount,
  }
}

function toPreviewStatements(
  args: EthikosArgumentApi[],
): TopicPreviewStatement[] {
  return byCreatedDesc(args)
    .filter((arg) => !arg.is_hidden)
    .slice(0, 5)
    .map((arg) => ({
      id: String(arg.id),
      author: String(arg.user_display ?? arg.user ?? 'Unknown'),
      userId: arg.user_id != null ? String(arg.user_id) : undefined,
      body: arg.content,
      side: arg.side ?? null,
      parent: getArgumentParent(arg),
      createdAt: arg.created_at,
    }))
}

function normalizePreviewStatement(raw: unknown): TopicPreviewStatement | null {
  if (!isRecord(raw)) return null

  const id = raw.id
  const body = raw.body ?? raw.content
  const author =
    raw.author ??
    raw.user_display ??
    raw.user ??
    raw.created_by ??
    raw.createdBy ??
    'Unknown'
  const createdAt = raw.createdAt ?? raw.created_at
  const side = raw.side === 'pro' || raw.side === 'con' ? raw.side : null
  const parent = raw.parent ?? raw.parent_id

  if (id === undefined || id === null || body === undefined || body === null) {
    return null
  }

  return {
    id: String(id),
    author: String(author),
    body: String(body),
    side,
    parent: parent !== undefined && parent !== null ? String(parent) : null,
    createdAt: stringOrUndefined(createdAt),
  }
}

function normalizePreviewStatements(raw: unknown): TopicPreviewStatement[] {
  if (!Array.isArray(raw)) return []

  return raw
    .map((item) => normalizePreviewStatement(item))
    .filter((item): item is TopicPreviewStatement => item !== null)
}

function normalizeTopicPreview(
  raw: unknown,
  fallbackTopic?: EthikosTopicApi,
): TopicPreviewResponse | null {
  if (!isRecord(raw)) return null

  const rawTopic = isRecord(raw.topic) ? raw.topic : undefined

  const id = raw.id ?? rawTopic?.id ?? fallbackTopic?.id
  const title = raw.title ?? rawTopic?.title ?? fallbackTopic?.title
  const description =
    raw.description ??
    raw.full_description ??
    rawTopic?.description ??
    fallbackTopic?.description

  const createdAt =
    raw.createdAt ??
    raw.created_at ??
    rawTopic?.created_at ??
    fallbackTopic?.created_at ??
    new Date().toISOString()

  const lastActivity =
    raw.lastActivity ??
    raw.last_activity ??
    rawTopic?.last_activity ??
    fallbackTopic?.last_activity ??
    rawTopic?.updated_at ??
    fallbackTopic?.updated_at ??
    createdAt

  const category = normalizeCategoryName(
    raw.category ?? rawTopic?.category,
    raw.category_name ?? rawTopic?.category_name,
    fallbackTopic,
  )

  if (id === undefined || id === null || !title) {
    return null
  }

  const latest = normalizePreviewStatements(raw.latest)
  const statements = normalizePreviewStatements(raw.statements)
  const argumentsList = normalizePreviewStatements(raw.arguments)

  const normalizedStatements =
    latest.length > 0
      ? latest
      : statements.length > 0
        ? statements
        : argumentsList

  const stats =
    normalizePreviewStats(raw) ??
    (normalizedStatements.length > 0
      ? buildPreviewStatsFromStatements(normalizedStatements)
      : undefined)

  return {
    id: String(id),
    title: String(title),
    category,
    createdAt: String(createdAt),
    description: stringOrUndefined(description),
    status: normalizeTopicStatus(raw.status ?? rawTopic?.status, fallbackTopic?.status),
    lastActivity: stringOrUndefined(lastActivity),
    stats,
    latest: normalizedStatements,
  }
}

/* ------------------------------------------------------------------ */
/*  Categories                                                         */
/* ------------------------------------------------------------------ */

export async function fetchEthikosCategories(): Promise<EthikosCategoryApi[]> {
  const payload = await get<ApiMaybeList<EthikosCategoryApi>>(
    ETHIKOS_PATHS.categories,
  )

  return normalizeList(payload)
}

export async function resolveEthikosCategoryId(
  category: string | number,
): Promise<number> {
  if (typeof category === 'number') return category

  const normalized = category.trim().toLowerCase()

  if (!normalized) {
    throw new Error('Category is required')
  }

  const categories = await fetchEthikosCategories()

  const exact = categories.find(
    (item) => item.name.trim().toLowerCase() === normalized,
  )
  if (exact) return Number(exact.id)

  const fallback = categories.find((item) =>
    item.name.trim().toLowerCase().includes(normalized),
  )
  if (fallback) return Number(fallback.id)

  throw new Error(`No ethiKos category found for "${category}"`)
}

/* ------------------------------------------------------------------ */
/*  Topics                                                             */
/* ------------------------------------------------------------------ */

export async function fetchEthikosTopics(
  params: FetchEthikosTopicsParams = {},
): Promise<EthikosTopicApi[]> {
  const payload = await get<ApiMaybeList<EthikosTopicApi>>(ETHIKOS_PATHS.topics, {
    params: cleanParams(params),
  })

  return normalizeList(payload)
}

export async function fetchEthikosTopic(
  id: EthikosId,
): Promise<EthikosTopicApi> {
  return get<EthikosTopicApi>(ETHIKOS_PATHS.topicDetail(id))
}

export async function createEthikosTopic(
  payload: CreateEthikosTopicPayload,
): Promise<EthikosTopicApi> {
  const title = payload.title.trim()
  const description = payload.description?.trim() || title

  if (!title) {
    throw new Error('Topic title is required')
  }

  return post<EthikosTopicApi>(ETHIKOS_PATHS.topics, {
    ...payload,
    title,
    description,
  })
}

export async function updateEthikosTopic(
  id: EthikosId,
  payload: UpdateEthikosTopicPayload,
): Promise<EthikosTopicApi> {
  return patch<EthikosTopicApi>(ETHIKOS_PATHS.topicDetail(id), payload)
}

export async function deleteEthikosTopic(id: EthikosId): Promise<void> {
  await del<void>(ETHIKOS_PATHS.topicDetail(id))
}

export async function fetchTopicPreview(
  id: EthikosId,
): Promise<TopicPreviewResponse> {
  const topicId = id

  try {
    const preview = await get<unknown>(
      actionPath(ETHIKOS_PATHS.topics, topicId, 'preview'),
    )
    const normalized = normalizeTopicPreview(preview)
    if (normalized) return normalized
  } catch {
    // Fallback below intentionally keeps the drawer usable.
  }

  const topic = await fetchEthikosTopic(topicId)

  let args: EthikosArgumentApi[] = []

  try {
    args = await fetchTopicArguments(topicId)
  } catch {
    args = []
  }

  return {
    id: String(topic.id),
    title: topic.title,
    category: categoryName(topic),
    createdAt: topic.created_at,
    description: topic.description,
    status: topic.status,
    lastActivity:
      topic.last_activity ??
      topic.updated_at ??
      topic.created_at ??
      new Date().toISOString(),
    stats: buildPreviewStatsFromArguments(args),
    latest: toPreviewStatements(args),
  }
}

export async function fetchTopicDetail(
  id: EthikosId,
): Promise<TopicDetailResponse> {
  const topicId = id

  const [topic, args] = await Promise.all([
    fetchEthikosTopic(topicId),
    fetchTopicArguments(topicId),
  ])

  const statements = byCreatedAsc(args)
    .filter((arg) => !arg.is_hidden)
    .map((arg) => ({
      id: String(arg.id),
      author: String(arg.user_display ?? arg.user ?? 'Unknown'),
      userId: arg.user_id != null ? String(arg.user_id) : undefined,
      body: arg.content,
      side: arg.side ?? null,
      parent: getArgumentParent(arg),
      createdAt: arg.created_at,
    }))

  return {
    id: String(topic.id),
    title: topic.title,
    description: topic.description,
    category: categoryName(topic),
    createdAt: topic.created_at,
    lastActivity:
      topic.last_activity ??
      topic.updated_at ??
      topic.created_at ??
      new Date().toISOString(),
    status: topic.status,
    statements,
  }
}

/* ------------------------------------------------------------------ */
/*  Stances                                                            */
/* ------------------------------------------------------------------ */

export async function fetchTopicStances(
  topicId: EthikosId,
): Promise<EthikosStanceApi[]> {
  const payload = await get<ApiMaybeList<EthikosStanceApi>>(
    ETHIKOS_PATHS.stances,
    {
      params: cleanParams({ topic: topicId }),
    },
  )

  return normalizeList(payload)
}

export async function submitTopicStance(
  topicId: EthikosId,
  value: StanceValue,
): Promise<EthikosStanceApi> {
  if (!STANCE_VALUES.includes(value)) {
    throw new Error('Stance value must be between -3 and 3.')
  }

  return post<EthikosStanceApi>(ETHIKOS_PATHS.stances, {
    topic: topicId,
    value,
  })
}

/* ------------------------------------------------------------------ */
/*  Arguments                                                          */
/* ------------------------------------------------------------------ */

export async function fetchTopicArguments(
  topicId: EthikosId,
): Promise<EthikosArgumentApi[]> {
  const payload = await get<ApiMaybeList<EthikosArgumentApi>>(
    ETHIKOS_PATHS.arguments,
    {
      params: cleanParams({ topic: topicId }),
    },
  )

  return normalizeList(payload)
}

export async function createTopicArgument(
  payload: CreateTopicArgumentPayload,
): Promise<EthikosArgumentApi> {
  const content = payload.content.trim()

  if (!content) {
    throw new Error('Argument content is required')
  }

  return post<EthikosArgumentApi>(ETHIKOS_PATHS.arguments, {
    ...payload,
    content,
  })
}

export async function updateTopicArgument(
  id: EthikosId,
  payload: UpdateTopicArgumentPayload,
): Promise<EthikosArgumentApi> {
  return patch<EthikosArgumentApi>(
    detailPath(ETHIKOS_PATHS.arguments, id),
    payload,
  )
}

export async function deleteTopicArgument(id: EthikosId): Promise<void> {
  await del<void>(detailPath(ETHIKOS_PATHS.arguments, id))
}

/* ------------------------------------------------------------------ */
/*  Korum Wave 1 extension helpers                                     */
/* ------------------------------------------------------------------ */

export async function fetchArgumentSources(
  argumentId?: EthikosId,
): Promise<ArgumentSourceApi[]> {
  const payload = await get<ApiMaybeList<ArgumentSourceApi>>(
    ETHIKOS_PATHS.argumentSources,
    {
      params: cleanParams({ argument: argumentId }),
    },
  )

  return normalizeList(payload)
}

export async function attachArgumentSource(
  argumentId: EthikosId,
  payload: CreateArgumentSourcePayload,
): Promise<ArgumentSourceApi> {
  const cleanedPayload = {
    url: trimOptional(payload.url),
    title: trimOptional(payload.title),
    excerpt: trimOptional(payload.excerpt),
    source_type: trimOptional(payload.source_type),
    citation_text: trimOptional(payload.citation_text),
    quote: trimOptional(payload.quote),
    note: trimOptional(payload.note),
  }

  const hasContent = [
    cleanedPayload.url,
    cleanedPayload.citation_text,
    cleanedPayload.quote,
    cleanedPayload.note,
  ].some(Boolean)

  if (!hasContent) {
    throw new Error('Provide at least one of url, citation_text, quote, or note.')
  }

  return post<ArgumentSourceApi>(ETHIKOS_PATHS.argumentSources, {
    ...cleanedPayload,
    argument: argumentId,
  })
}

export async function fetchArgumentImpactVotes(
  argumentId?: EthikosId,
): Promise<ArgumentImpactVoteApi[]> {
  const payload = await get<ApiMaybeList<ArgumentImpactVoteApi>>(
    ETHIKOS_PATHS.argumentImpactVotes,
    {
      params: cleanParams({ argument: argumentId }),
    },
  )

  return normalizeList(payload)
}

export async function submitArgumentImpactVote(
  argumentId: EthikosId,
  value: ArgumentImpactValue,
): Promise<ArgumentImpactVoteApi> {
  if (!IMPACT_VALUES.includes(value)) {
    throw new Error('Argument impact vote must be between 0 and 4.')
  }

  return post<ArgumentImpactVoteApi>(ETHIKOS_PATHS.argumentImpactVotes, {
    argument: argumentId,
    value,
  })
}

export async function fetchArgumentSuggestions(
  topicId?: EthikosId,
): Promise<ArgumentSuggestionApi[]> {
  const payload = await get<ApiMaybeList<ArgumentSuggestionApi>>(
    ETHIKOS_PATHS.argumentSuggestions,
    {
      params: cleanParams({ topic: topicId }),
    },
  )

  return normalizeList(payload)
}

export async function submitArgumentSuggestion(
  payload: SubmitArgumentSuggestionPayload,
): Promise<ArgumentSuggestionApi> {
  const content = payload.content.trim()

  if (!content) {
    throw new Error('Suggestion content is required')
  }

  return post<ArgumentSuggestionApi>(ETHIKOS_PATHS.argumentSuggestions, {
    ...payload,
    content,
  })
}

export async function fetchDiscussionParticipantRoles(
  topicId?: EthikosId,
): Promise<DiscussionParticipantRoleApi[]> {
  const payload = await get<ApiMaybeList<DiscussionParticipantRoleApi>>(
    ETHIKOS_PATHS.discussionParticipantRoles,
    {
      params: cleanParams({ topic: topicId }),
    },
  )

  return normalizeList(payload)
}

export async function setDiscussionParticipantRole(
  payload: SetDiscussionParticipantRolePayload,
): Promise<DiscussionParticipantRoleApi> {
  const targetUserId = payload.target_user_id ?? payload.user

  if (targetUserId === undefined || targetUserId === null || targetUserId === '') {
    throw new Error('target_user_id is required to set a discussion role')
  }

  return post<DiscussionParticipantRoleApi>(
    ETHIKOS_PATHS.discussionParticipantRoles,
    {
      topic: payload.topic,
      target_user_id: targetUserId,
      role: payload.role,
    },
  )
}

export async function fetchDiscussionVisibilitySettings(
  topicId?: EthikosId,
): Promise<DiscussionVisibilitySettingApi[]> {
  const payload = await get<ApiMaybeList<DiscussionVisibilitySettingApi>>(
    ETHIKOS_PATHS.discussionVisibilitySettings,
    {
      params: cleanParams({ topic: topicId }),
    },
  )

  return normalizeList(payload)
}

export async function setDiscussionVisibilitySetting(
  payload: SetDiscussionVisibilitySettingPayload,
): Promise<DiscussionVisibilitySettingApi> {
  if (payload.topic === undefined || payload.topic === null || payload.topic === '') {
    throw new Error('topic is required to set discussion visibility')
  }

  return post<DiscussionVisibilitySettingApi>(
    ETHIKOS_PATHS.discussionVisibilitySettings,
    payload,
  )
}

export async function updateDiscussionVisibilitySetting(
  id: EthikosId,
  payload: UpdateDiscussionVisibilitySettingPayload,
): Promise<DiscussionVisibilitySettingApi> {
  return patch<DiscussionVisibilitySettingApi>(
    detailPath(ETHIKOS_PATHS.discussionVisibilitySettings, id),
    payload,
  )
}

/**
 * Compatibility helper for panels that need “create if missing, update if present”.
 */
export async function saveDiscussionVisibilitySetting(
  payload: SetDiscussionVisibilitySettingPayload,
): Promise<DiscussionVisibilitySettingApi> {
  const existing = await fetchDiscussionVisibilitySettings(payload.topic)
  const current = existing[0]

  if (current?.id !== undefined && current.id !== null) {
    return updateDiscussionVisibilitySetting(current.id, payload)
  }

  return setDiscussionVisibilitySetting(payload)
}

/**
 * Compatibility alias for earlier branch work.
 *
 * Prefer ETHIKOS_PATHS in new code.
 */
export const ethikosApiPaths = ETHIKOS_PATHS