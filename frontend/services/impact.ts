// FILE: frontend/services/impact.ts
import dayjs from 'dayjs'

import { get, patch, post } from './_request'
import type { ApiMaybeList, EthikosId, TopicStatus } from './ethikos'
import { normalizeList } from './ethikos'

/* ------------------------------------------------------------------ */
/*  Impact service contract                                            */
/* ------------------------------------------------------------------ */

export type ImpactStatus = 'Planned' | 'In-Progress' | 'Completed' | 'Blocked'

export interface TrackerItem {
  id: string
  title: string
  owner: string
  status: ImpactStatus
  updatedAt: string
}

export interface OutcomeKPI {
  key: string
  label: string
  value: number
  delta?: number
}

export interface ChartPoint {
  date?: string
  category?: string
  value: number
}

export interface ChartConfig {
  data: ChartPoint[]
  xField: string
  yField: string
  seriesField?: string
  smooth?: boolean
}

export interface OutcomeChart {
  key: string
  title: string
  type: 'line' | 'bar'
  config: ChartConfig
}

export interface FeedbackItem {
  id: string
  author: string
  body: string
  rating?: number
  createdAt: string
}

export interface ImpactTrackerPayload {
  items: TrackerItem[]
}

export interface ImpactOutcomesPayload {
  kpis: OutcomeKPI[]
  charts: OutcomeChart[]
}

export interface ImpactFeedbackPayload {
  items: FeedbackItem[]
}

export interface SubmitFeedbackPayload {
  body: string
  rating?: number
}

/* ------------------------------------------------------------------ */
/*  Backend DTOs                                                       */
/* ------------------------------------------------------------------ */

interface EthikosCategoryApi {
  id: EthikosId
  name: string
  description?: string | null
}

interface EthikosTopicApi {
  id: EthikosId
  title: string
  description?: string | null
  status: TopicStatus
  created_by?: string | EthikosId | null
  created_by_id?: EthikosId | null
  last_activity?: string | null
  created_at: string
  updated_at?: string | null
  category?: EthikosCategoryApi | null
  category_name?: string | null
  total_votes?: number | null
}

interface EthikosStanceApi {
  id: EthikosId
  topic: EthikosId
  value: number
  timestamp: string
}

interface EthikosArgumentApi {
  id: EthikosId
  topic: EthikosId
  user?: string | EthikosId | null
  user_id?: EthikosId | null
  user_display?: string | null
  content: string
  created_at: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type DailyPoint = {
  date: string
  value: number
}

function topicStatusToImpactStatus(status: TopicStatus): ImpactStatus {
  switch (status) {
    case 'closed':
      return 'Completed'
    case 'archived':
      return 'Blocked'
    case 'open':
    default:
      return 'In-Progress'
  }
}

function impactStatusToTopicStatus(status: ImpactStatus): TopicStatus {
  switch (status) {
    case 'Completed':
      return 'closed'
    case 'Blocked':
      return 'archived'
    case 'Planned':
    case 'In-Progress':
    default:
      return 'open'
  }
}

function compareDescByDate(a: string, b: string): number {
  return dayjs(b).valueOf() - dayjs(a).valueOf()
}

function topicActivityDate(topic: EthikosTopicApi): string {
  return (
    topic.updated_at ??
    topic.last_activity ??
    topic.created_at ??
    new Date(0).toISOString()
  )
}

function displayOwner(topic: EthikosTopicApi): string {
  if (
    typeof topic.created_by === 'string' &&
    topic.created_by.trim().length > 0
  ) {
    return topic.created_by
  }

  if (
    typeof topic.created_by === 'number' ||
    typeof topic.created_by === 'string'
  ) {
    return String(topic.created_by)
  }

  if (topic.created_by_id !== undefined && topic.created_by_id !== null) {
    return String(topic.created_by_id)
  }

  return 'Unknown'
}

function displayAuthor(argument: EthikosArgumentApi): string {
  if (
    typeof argument.user_display === 'string' &&
    argument.user_display.trim().length > 0
  ) {
    return argument.user_display
  }

  if (typeof argument.user === 'string' && argument.user.trim().length > 0) {
    return argument.user
  }

  if (typeof argument.user === 'number' || typeof argument.user === 'string') {
    return String(argument.user)
  }

  if (argument.user_id !== undefined && argument.user_id !== null) {
    return String(argument.user_id)
  }

  return 'Anonymous'
}

function buildDailySeries<T>(
  items: T[],
  getDate: (item: T) => string | null | undefined,
  days = 30,
): DailyPoint[] {
  const now = dayjs()
  const start = now.startOf('day').subtract(days - 1, 'day')
  const counts = new Array<number>(days).fill(0)

  for (const item of items) {
    const rawDate = getDate(item)

    if (!rawDate) {
      continue
    }

    const date = dayjs(rawDate)

    if (!date.isValid() || date.isBefore(start) || date.isAfter(now)) {
      continue
    }

    const offset = date.startOf('day').diff(start, 'day')

    if (offset >= 0 && offset < days) {
      counts[offset] = (counts[offset] ?? 0) + 1
    }
  }

  return counts.map((value, index) => ({
    date: start.add(index, 'day').toISOString(),
    value,
  }))
}

function percentDelta(series: DailyPoint[]): number | undefined {
  if (series.length < 2) {
    return undefined
  }

  const latest = series[series.length - 1]?.value
  const previous = series[series.length - 2]?.value

  if (
    latest === undefined ||
    previous === undefined ||
    previous === 0
  ) {
    return undefined
  }

  return Math.round(((latest - previous) / previous) * 100)
}

// Feedback rating is persisted inside EthikosArgument.content because the
// current backend contract exposes `content` but no dedicated `rating` field.
const FEEDBACK_RATING_PREFIX = /^\[rating:([1-5])\]\s*/i

function encodeFeedbackBody(body: string, rating?: number): string {
  const normalized = body.trim()

  if (!normalized) {
    return normalized
  }

  if (typeof rating === 'number' && Number.isFinite(rating)) {
    const safeRating = Math.max(1, Math.min(5, Math.round(rating)))
    return `[rating:${safeRating}] ${normalized}`
  }

  return normalized
}

function decodeFeedbackContent(content: string): {
  body: string
  rating?: number
} {
  const raw = content ?? ''
  const match = raw.match(FEEDBACK_RATING_PREFIX)
  const ratingRaw = match?.[1]
  const rating = ratingRaw ? Number(ratingRaw) : undefined
  const body = raw.replace(FEEDBACK_RATING_PREFIX, '').trim()

  return {
    body,
    rating:
      typeof rating === 'number' && Number.isFinite(rating)
        ? rating
        : undefined,
  }
}

function feedbackTopicId(): EthikosId | null {
  const raw = process.env.NEXT_PUBLIC_ETHIKOS_FEEDBACK_TOPIC_ID

  if (!raw || raw.trim().length === 0) {
    return null
  }

  const numeric = Number(raw)

  if (Number.isFinite(numeric)) {
    return numeric
  }

  return raw
}

/* ------------------------------------------------------------------ */
/*  Tracker: maps Ethikos topics → impact items                        */
/* ------------------------------------------------------------------ */

export async function fetchImpactTracker(): Promise<ImpactTrackerPayload> {
  const payload = await get<ApiMaybeList<EthikosTopicApi>>('ethikos/topics/')
  const topics = normalizeList(payload)

  const items: TrackerItem[] = [...topics]
    .sort((a, b) =>
      compareDescByDate(topicActivityDate(a), topicActivityDate(b)),
    )
    .map((topic) => ({
      id: String(topic.id),
      title: topic.title,
      owner: displayOwner(topic),
      status: topicStatusToImpactStatus(topic.status),
      updatedAt: topicActivityDate(topic),
    }))

  return { items }
}

export async function patchImpactStatus(
  id: string,
  status: ImpactStatus,
): Promise<void> {
  const topicStatus = impactStatusToTopicStatus(status)

  await patch(`ethikos/topics/${encodeURIComponent(id)}/`, {
    status: topicStatus,
  })
}

/* ------------------------------------------------------------------ */
/*  Outcomes: KPIs + charts from Ethikos topics + stances              */
/* ------------------------------------------------------------------ */

export async function fetchImpactOutcomes(): Promise<ImpactOutcomesPayload> {
  const [topicsPayload, stancesPayload] = await Promise.all([
    get<ApiMaybeList<EthikosTopicApi>>('ethikos/topics/'),
    get<ApiMaybeList<EthikosStanceApi>>('ethikos/stances/'),
  ])

  const topics = normalizeList(topicsPayload)
  const stances = normalizeList(stancesPayload)

  const closedTopics = topics.filter((topic) => topic.status === 'closed')
  const openTopics = topics.filter((topic) => topic.status === 'open')

  const votesByTopic = new Map<string, { sum: number; count: number }>()

  for (const stance of stances) {
    const topicKey = String(stance.topic)
    const bucket = votesByTopic.get(topicKey) ?? { sum: 0, count: 0 }

    bucket.sum += stance.value
    bucket.count += 1

    votesByTopic.set(topicKey, bucket)
  }

  let agreementSum = 0
  let agreementCount = 0

  for (const topic of closedTopics) {
    const stats = votesByTopic.get(String(topic.id))

    if (!stats || stats.count === 0) {
      continue
    }

    // EthikosStance values are topic-level values in [-3, 3].
    agreementSum += stats.sum / (stats.count * 3)
    agreementCount += 1
  }

  const averageAgreement =
    agreementCount > 0 ? agreementSum / agreementCount : 0

  const topicsSeries = buildDailySeries(topics, (topic) => topic.created_at)
  const stancesSeries = buildDailySeries(stances, (stance) => stance.timestamp)

  const kpis: OutcomeKPI[] = [
    {
      key: 'topics',
      label: 'Total topics',
      value: topics.length,
      delta: percentDelta(topicsSeries),
    },
    {
      key: 'stances',
      label: 'Total stances',
      value: stances.length,
      delta: percentDelta(stancesSeries),
    },
    {
      key: 'agreement',
      label: 'Average agreement',
      // averageAgreement ∈ [-1, 1] → [0, 100]
      value: Math.round((averageAgreement + 1) * 50),
    },
    {
      key: 'open',
      label: 'Open debates',
      value: openTopics.length,
    },
  ]

  const bucketByCategory = new Map<string, number>()

  for (const topic of topics) {
    const categoryName =
      topic.category?.name?.trim() ||
      topic.category_name?.trim() ||
      'Uncategorised'

    bucketByCategory.set(
      categoryName,
      (bucketByCategory.get(categoryName) ?? 0) + 1,
    )
  }

  const topicsByCategory: ChartPoint[] = Array.from(bucketByCategory.entries())
    .map(([category, value]) => ({ category, value }))
    .sort(
      (a, b) =>
        b.value - a.value ||
        String(a.category).localeCompare(String(b.category)),
    )

  const charts: OutcomeChart[] = [
    {
      key: 'participation-timeline',
      title: 'Participation over time',
      type: 'line',
      config: {
        data: stancesSeries,
        xField: 'date',
        yField: 'value',
        smooth: true,
      },
    },
    {
      key: 'topics-by-category',
      title: 'Topics by category',
      type: 'bar',
      config: {
        data: topicsByCategory,
        xField: 'category',
        yField: 'value',
        seriesField: 'category',
      },
    },
  ]

  return { kpis, charts }
}

/* ------------------------------------------------------------------ */
/*  Feedback loop = arguments on a dedicated Ethikos topic             */
/* ------------------------------------------------------------------ */

export async function fetchFeedback(): Promise<ImpactFeedbackPayload> {
  const topicId = feedbackTopicId()

  if (!topicId) {
    return { items: [] }
  }

  const payload = await get<ApiMaybeList<EthikosArgumentApi>>(
    'ethikos/arguments/',
    {
      params: { topic: topicId },
    },
  )

  const argumentsForTopic = normalizeList(payload)

  const items: FeedbackItem[] = argumentsForTopic
    .map((argument) => {
      const parsed = decodeFeedbackContent(argument.content)

      return {
        id: String(argument.id),
        author: displayAuthor(argument),
        body: parsed.body,
        rating: parsed.rating,
        createdAt: argument.created_at,
      }
    })
    .sort((a, b) => compareDescByDate(a.createdAt, b.createdAt))

  return { items }
}

export async function submitFeedback(
  payload: SubmitFeedbackPayload,
): Promise<void> {
  const topicId = feedbackTopicId()

  if (!topicId) {
    throw new Error(
      'NEXT_PUBLIC_ETHIKOS_FEEDBACK_TOPIC_ID is not set; cannot store feedback.',
    )
  }

  const content = encodeFeedbackBody(payload.body, payload.rating)

  if (!content) {
    throw new Error('Feedback body cannot be empty.')
  }

  await post('ethikos/arguments/', {
    topic: topicId,
    content,
  })
}