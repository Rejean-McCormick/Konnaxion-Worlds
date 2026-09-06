// FILE: frontend/services/pulse.ts
import dayjs from 'dayjs'

import type { KPI } from '@/types'

import { get } from './_request'
import { ETHIKOS_PATHS, normalizeList } from './ethikos'
import type {
  ApiMaybeList,
  EthikosArgumentApi,
  EthikosStanceApi,
  EthikosTopicApi,
} from './ethikos'

/* ------------------------------------------------------------------ */
/*  Shared Pulse types                                                */
/* ------------------------------------------------------------------ */

export type PulseChartPoint = {
  x: string | number
  y: number
}

export type PulseKpiHistoryPoint = PulseChartPoint & {
  /**
   * Compatibility with older overview pages that map h.date/h.value.
   * Prefer x/y for new chart code.
   */
  date: string
  value: number
}

export interface KPIWithHistory extends Omit<KPI, 'history'> {
  history: PulseKpiHistoryPoint[]
}

export interface LiveCounter {
  label: string
  value: number
  trend?: number
  history: PulseChartPoint[]
}

export interface TrendChart {
  key: string
  title: string
  type: 'line' | 'area' | 'heatmap'
  config: Record<string, unknown>
}

export interface HealthSummary {
  refreshedAt: string
  radarConfig: Record<string, unknown>
  pieConfig: Record<string, unknown>
}

export interface PulseOverviewPayload {
  refreshedAt: string
  kpis: KPIWithHistory[]
}

export interface PulseLivePayload {
  counters: LiveCounter[]
}

export interface PulseTrendsPayload {
  charts: TrendChart[]
}

/* ------------------------------------------------------------------ */
/*  Backend DTOs outside ethiKos                                      */
/* ------------------------------------------------------------------ */

interface VoteApi {
  id: string | number
  user?: string | number | null
  target_type?: string | null
  target_id?: string | number | null
  raw_value?: string | number | null
  weighted_value?: string | number | null
  voted_at?: string | null
}

type ListResponse<T> =
  | T[]
  | {
      results?: T[]
      items?: T[]
      data?: T[] | { results?: T[]; items?: T[] }
    }

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

interface DailyPoint {
  date: string
  value: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function unwrapList<T>(
  payload: ListResponse<T> | ApiMaybeList<T> | null | undefined,
): T[] {
  if (Array.isArray(payload)) {
    return payload
  }

  if (!payload || !isRecord(payload)) {
    return []
  }

  if (Array.isArray(payload.results)) {
    return payload.results as T[]
  }

  if (Array.isArray(payload.items)) {
    return payload.items as T[]
  }

  if (Array.isArray(payload.data)) {
    return payload.data as T[]
  }

  if (isRecord(payload.data) && Array.isArray(payload.data.results)) {
    return payload.data.results as T[]
  }

  if (isRecord(payload.data) && Array.isArray(payload.data.items)) {
    return payload.data.items as T[]
  }

  return []
}

async function getList<T>(url: string): Promise<T[]> {
  const payload = await get<ListResponse<T> | ApiMaybeList<T>>(url)
  return unwrapList<T>(payload)
}

async function getEthikosList<T>(url: string): Promise<T[]> {
  const payload = await get<ApiMaybeList<T>>(url)
  return normalizeList(payload)
}

async function getOptionalList<T>(url: string): Promise<T[]> {
  try {
    return await getList<T>(url)
  } catch {
    return []
  }
}

function toFiniteNumber(value: string | number | null | undefined): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function validDateOrNull(value?: string | null): dayjs.Dayjs | null {
  if (!value) {
    return null
  }

  const parsed = dayjs(value)
  return parsed.isValid() ? parsed : null
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
    const parsed = validDateOrNull(getDate(item))

    if (!parsed) {
      continue
    }

    if (parsed.isBefore(start) || parsed.isAfter(now)) {
      continue
    }

    const offset = parsed.startOf('day').diff(start, 'day')

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

  const latest = series[series.length - 1]?.value ?? 0
  const previous = series[series.length - 2]?.value ?? 0

  if (previous === 0) {
    return latest === 0 ? 0 : undefined
  }

  return Math.round(((latest - previous) / previous) * 100)
}

function withOptionalTrend<T extends Omit<LiveCounter, 'trend'>>(
  counter: T,
  trend: number | undefined,
): LiveCounter {
  return trend === undefined
    ? counter
    : {
        ...counter,
        trend,
      }
}

function withOptionalDelta<T extends Omit<KPIWithHistory, 'delta'>>(
  kpi: T,
  delta: number | undefined,
): KPIWithHistory {
  return delta === undefined
    ? kpi
    : {
        ...kpi,
        delta,
      }
}

function toPulseChartHistory(series: DailyPoint[]): PulseChartPoint[] {
  return series.map((point) => ({
    x: new Date(point.date).getTime(),
    y: point.value,
  }))
}

function toPulseKpiHistory(series: DailyPoint[]): PulseKpiHistoryPoint[] {
  return series.map((point) => ({
    date: point.date,
    value: point.value,
    x: point.date,
    y: point.value,
  }))
}

function buildStanceHeatmap(
  stances: EthikosStanceApi[],
): { day: string; hour: number; value: number }[] {
  const bucket = new Map<string, number>()

  for (const stance of stances) {
    const parsed = validDateOrNull(stance.timestamp)

    if (!parsed) {
      continue
    }

    const key = `${parsed.format('ddd')}-${parsed.hour()}`
    bucket.set(key, (bucket.get(key) ?? 0) + 1)
  }

  const result: { day: string; hour: number; value: number }[] = []

  bucket.forEach((value, key) => {
    const [day, hourStr] = key.split('-')
    const hour = Number(hourStr)

    if (!day || !Number.isFinite(hour)) {
      return
    }

    result.push({
      day,
      hour,
      value,
    })
  })

  return result
}

function sumSeries(series: DailyPoint[]): number {
  return series.reduce((acc, point) => acc + point.value, 0)
}

function averageAbsoluteStance(stances: EthikosStanceApi[]): number {
  if (stances.length === 0) {
    return 0
  }

  const total = stances.reduce(
    (acc, stance) => acc + Math.abs(Number(stance.value)),
    0,
  )

  return total / stances.length
}

function topicActivityDate(topic: EthikosTopicApi): string | null | undefined {
  return topic.last_activity ?? topic.updated_at ?? topic.created_at
}

function argumentCreatedDate(
  argument: EthikosArgumentApi,
): string | null | undefined {
  return argument.created_at
}

function stanceCreatedDate(
  stance: EthikosStanceApi,
): string | null | undefined {
  return stance.timestamp
}

function voteCreatedDate(vote: VoteApi): string | null | undefined {
  return vote.voted_at
}

async function fetchPulseBaseData(): Promise<{
  topics: EthikosTopicApi[]
  stances: EthikosStanceApi[]
  args: EthikosArgumentApi[]
}> {
  const [topics, stances, args] = await Promise.all([
    getEthikosList<EthikosTopicApi>(ETHIKOS_PATHS.topics),
    getEthikosList<EthikosStanceApi>(ETHIKOS_PATHS.stances),
    getEthikosList<EthikosArgumentApi>(ETHIKOS_PATHS.arguments),
  ])

  return {
    topics,
    stances,
    args,
  }
}

/* ------------------------------------------------------------------ */
/*  Overview                                                          */
/* ------------------------------------------------------------------ */

export async function fetchPulseOverview(): Promise<PulseOverviewPayload> {
  const [{ topics, stances, args }, votes] = await Promise.all([
    fetchPulseBaseData(),
    getOptionalList<VoteApi>('kollective/votes/'),
  ])

  const topicsSeries = buildDailySeries(topics, (topic) => topic.created_at, 30)
  const stancesSeries = buildDailySeries(stances, stanceCreatedDate, 30)
  const argsSeries = buildDailySeries(args, argumentCreatedDate, 30)
  const votesSeries = buildDailySeries(votes, voteCreatedDate, 30)

  const kpis: KPIWithHistory[] = [
    withOptionalDelta(
      {
        key: 'topics',
        label: 'Debates created (30d)',
        value: sumSeries(topicsSeries),
        history: toPulseKpiHistory(topicsSeries),
      },
      percentDelta(topicsSeries),
    ),
    withOptionalDelta(
      {
        key: 'stances',
        label: 'Stances recorded (30d)',
        value: sumSeries(stancesSeries),
        history: toPulseKpiHistory(stancesSeries),
      },
      percentDelta(stancesSeries),
    ),
    withOptionalDelta(
      {
        key: 'arguments',
        label: 'Arguments posted (30d)',
        value: sumSeries(argsSeries),
        history: toPulseKpiHistory(argsSeries),
      },
      percentDelta(argsSeries),
    ),
    withOptionalDelta(
      {
        key: 'votes',
        label: 'Weighted votes (30d)',
        value: sumSeries(votesSeries),
        history: toPulseKpiHistory(votesSeries),
      },
      percentDelta(votesSeries),
    ),
  ]

  return {
    refreshedAt: new Date().toISOString(),
    kpis,
  }
}

/* ------------------------------------------------------------------ */
/*  Live view                                                         */
/* ------------------------------------------------------------------ */

export async function fetchPulseLiveData(): Promise<PulseLivePayload> {
  const { topics, stances, args } = await fetchPulseBaseData()

  const openTopics = topics.filter((topic) => topic.status === 'open')

  const topicsSeries = buildDailySeries(openTopics, topicActivityDate, 7)
  const stancesSeries = buildDailySeries(stances, stanceCreatedDate, 7)
  const argsSeries = buildDailySeries(args, argumentCreatedDate, 7)

  const counters: LiveCounter[] = [
    withOptionalTrend(
      {
        label: 'Open debates',
        value: openTopics.length,
        history: toPulseChartHistory(topicsSeries),
      },
      percentDelta(topicsSeries),
    ),
    withOptionalTrend(
      {
        label: 'New stances (7d)',
        value: sumSeries(stancesSeries),
        history: toPulseChartHistory(stancesSeries),
      },
      percentDelta(stancesSeries),
    ),
    withOptionalTrend(
      {
        label: 'New arguments (7d)',
        value: sumSeries(argsSeries),
        history: toPulseChartHistory(argsSeries),
      },
      percentDelta(argsSeries),
    ),
  ]

  return { counters }
}

/* ------------------------------------------------------------------ */
/*  Trends                                                            */
/* ------------------------------------------------------------------ */

export async function fetchPulseTrends(): Promise<PulseTrendsPayload> {
  const { topics, stances, args } = await fetchPulseBaseData()

  const topicsSeries = buildDailySeries(topics, (topic) => topic.created_at, 60)
  const stancesSeries = buildDailySeries(stances, stanceCreatedDate, 60)
  const argsSeries = buildDailySeries(args, argumentCreatedDate, 60)
  const heatmapData = buildStanceHeatmap(stances)

  const charts: TrendChart[] = [
    {
      key: 'topics-timeline',
      title: 'Debates over time',
      type: 'line',
      config: {
        data: topicsSeries,
        xField: 'date',
        yField: 'value',
        smooth: true,
      },
    },
    {
      key: 'stances-timeline',
      title: 'Stances over time',
      type: 'area',
      config: {
        data: stancesSeries,
        xField: 'date',
        yField: 'value',
      },
    },
    {
      key: 'arguments-timeline',
      title: 'Arguments over time',
      type: 'line',
      config: {
        data: argsSeries,
        xField: 'date',
        yField: 'value',
        smooth: true,
      },
    },
    {
      key: 'activity-heatmap',
      title: 'Deliberation activity heatmap',
      type: 'heatmap',
      config: {
        data: heatmapData,
        xField: 'hour',
        yField: 'day',
        colorField: 'value',
      },
    },
  ]

  return { charts }
}

/* ------------------------------------------------------------------ */
/*  Health                                                            */
/* ------------------------------------------------------------------ */

export async function fetchPulseHealth(): Promise<HealthSummary> {
  const [{ topics, stances, args }, votes] = await Promise.all([
    fetchPulseBaseData(),
    getOptionalList<VoteApi>('kollective/votes/'),
  ])

  let positive = 0
  let neutral = 0
  let negative = 0

  for (const stance of stances) {
    if (stance.value > 0) {
      positive += 1
    } else if (stance.value < 0) {
      negative += 1
    } else {
      neutral += 1
    }
  }

  const participation = clamp(stances.length, 0, 100)
  const engagement = clamp(votes.length, 0, 100)

  const balance =
    stances.length > 0
      ? Math.round((1 - Math.abs(positive - negative) / stances.length) * 100)
      : 100

  const argumentDensity =
    topics.length > 0 ? Math.round((args.length / topics.length) * 10) : 0

  const constructiveness = clamp(
    Math.round(
      (participation + balance + clamp(argumentDensity, 0, 100)) / 3,
    ),
    0,
    100,
  )

  const conviction = clamp(
    Math.round((averageAbsoluteStance(stances) / 3) * 100),
    0,
    100,
  )

  const radarData = [
    { metric: 'Participation', score: participation },
    { metric: 'Engagement', score: engagement },
    { metric: 'Balance', score: balance },
    { metric: 'Constructiveness', score: constructiveness },
    { metric: 'Conviction', score: conviction },
  ]

  const pieData = [
    { type: 'Positive', value: positive },
    { type: 'Neutral', value: neutral },
    { type: 'Negative', value: negative },
  ]

  const totalWeightedVotes = votes.reduce(
    (acc, vote) => acc + Math.abs(toFiniteNumber(vote.weighted_value)),
    0,
  )

  return {
    refreshedAt: new Date().toISOString(),
    radarConfig: {
      data: radarData,
      xField: 'metric',
      yField: 'score',
      meta: {
        score: { min: 0, max: 100 },
      },
    },
    pieConfig: {
      data: pieData,
      angleField: 'value',
      colorField: 'type',
      meta: {
        totalWeightedVotes,
      },
    },
  }
}