// FILE: frontend/services/decide.ts
import dayjs from 'dayjs'

import type { Ballot } from '@/types'

import { get } from './_request'
import {
  ETHIKOS_PATHS,
  fetchEthikosTopics,
  normalizeList,
  submitTopicStance,
} from './ethikos'
import type {
  ApiMaybeList,
  EthikosId,
  EthikosStanceApi,
  EthikosTopicApi,
  StanceValue,
} from './ethikos'

export type DecisionScope = 'Elite' | 'Public'

export type EliteBallot = Ballot & {
  scope: 'Elite'
  turnout: number
}

export type PublicBallot = Ballot & {
  scope: 'Public'
  options: string[]
  turnout: number
}

export interface EliteBallotResponse {
  ballots: EliteBallot[]
}

export interface PublicBallotResponse {
  ballots: PublicBallot[]
}

export interface DecisionResult {
  id: string
  title: string
  scope: DecisionScope
  passed: boolean
  closesAt: string
  region?: string
  baselineScore: number
  participationCount: number
  /**
   * Declared Smart Vote reading. Undefined until a real reading endpoint
   * publishes one; never copy the baseline into this field.
   */
  readingScore?: number
  readingKey?: string
  readingComputedAt?: string
}

export interface DecisionResultsResponse {
  items: DecisionResult[]
}

interface SmartVoteReadingItem {
  reading_key: string
  lens_hash?: string | null
  snapshot_ref?: string | null
  computed_at?: string
  results_payload?: {
    score?: number
    participant_count?: number
    total_advisory_weight?: number
    average_expertise_alignment?: number
  }
}

interface SmartVoteTopicReadingResponse {
  target_type: string
  target_id: string
  baseline?: SmartVoteReadingItem
  readings?: SmartVoteReadingItem[]
}


export type DecisionStatus = 'draft' | 'open' | 'closed' | 'published'

export interface DecisionProtocolRow {
  id: string
  title: string
  category?: string
  status: DecisionStatus
  createdAt?: string
  closesAt?: string
  participationCount?: number
}

export interface DecisionResultRow {
  id: string
  topicId: string
  title: string
  baselineScore?: number
  readingScore?: number
  readingKey?: string
  publishedAt?: string
  status: DecisionStatus
}

const PUBLIC_SCALE_OPTIONS = [
  'Strongly disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly agree',
] as const

const STANCE_VALUES: readonly StanceValue[] = [-3, -2, -1, 0, 1, 2, 3]

function toId(value: EthikosId): string {
  return String(value)
}

function sameId(left: EthikosId, right: EthikosId): boolean {
  return String(left) === String(right)
}

function coerceStanceValue(value: number): StanceValue {
  return STANCE_VALUES.includes(value as StanceValue) ? (value as StanceValue) : 0
}

function computeClosesAt(topic: EthikosTopicApi): string {
  const createdAt = topic.created_at
  const lastActivity = topic.last_activity ?? topic.updated_at ?? createdAt

  if (topic.status === 'open') {
    const created = dayjs(createdAt)
    if (created.isValid()) return created.add(7, 'day').toISOString()
  }

  const closedAt = dayjs(lastActivity)
  return closedAt.isValid() ? closedAt.toISOString() : new Date().toISOString()
}

function normalizeTurnout(totalVotes?: number | null): number {
  const count = typeof totalVotes === 'number' ? totalVotes : 0
  return Math.max(0, count)
}

function hasExpertContext(topic: EthikosTopicApi): boolean {
  return topic.expertise_category !== undefined && topic.expertise_category !== null
}

function topicScope(topic: EthikosTopicApi): DecisionScope {
  return hasExpertContext(topic) ? 'Elite' : 'Public'
}

function categoryName(topic: EthikosTopicApi): string | undefined {
  return topic.category_name ?? topic.category?.name ?? undefined
}

function toEliteBallot(topic: EthikosTopicApi): EliteBallot {
  return {
    id: toId(topic.id),
    title: topic.title,
    closesAt: computeClosesAt(topic),
    scope: 'Elite',
    turnout: normalizeTurnout(topic.total_votes),
  }
}

function toPublicBallot(topic: EthikosTopicApi): PublicBallot {
  return {
    id: toId(topic.id),
    title: topic.title,
    closesAt: computeClosesAt(topic),
    scope: 'Public',
    options: [...PUBLIC_SCALE_OPTIONS],
    turnout: normalizeTurnout(topic.total_votes),
  }
}

function mapOptionToValue(option: string): StanceValue {
  const normalized = option.trim().toLowerCase()
  if (normalized.startsWith('strongly disagree')) return -3
  if (normalized.startsWith('disagree')) return -1
  if (normalized.startsWith('neutral')) return 0
  if (normalized.startsWith('strongly agree')) return 3
  if (normalized.startsWith('agree')) return 1

  const numeric = Number(option)
  return Number.isFinite(numeric) ? coerceStanceValue(numeric) : 0
}

function statusToDecisionStatus(status: EthikosTopicApi['status']): DecisionStatus {
  if (status === 'open') return 'open'
  if (status === 'closed') return 'closed'
  return 'published'
}

export async function fetchTopicAdvisoryReading(
  topicId: EthikosId,
): Promise<SmartVoteReadingItem | undefined> {
  try {
    const payload = await get<SmartVoteTopicReadingResponse>(
      `v1/smart-vote/readings/ethikos-topic/${toId(topicId)}/`,
    )
    return payload.readings?.find(
      (reading) => reading.reading_key === 'ekoh_weighted_v1',
    ) ?? payload.readings?.[0]
  } catch {
    // No binding/reading yet is a valid state. Never fabricate it from baseline.
    return undefined
  }
}

async function fetchAllStances(): Promise<EthikosStanceApi[]> {
  const payload = await get<ApiMaybeList<EthikosStanceApi>>(ETHIKOS_PATHS.stances)
  return normalizeList(payload)
}

function buildStanceStatsByTopic(
  stances: EthikosStanceApi[],
): Map<string, { sum: number; count: number }> {
  const byTopic = new Map<string, { sum: number; count: number }>()

  for (const stance of stances) {
    const topicId = toId(stance.topic)
    const bucket = byTopic.get(topicId) ?? { sum: 0, count: 0 }
    bucket.sum += Number(stance.value)
    bucket.count += 1
    byTopic.set(topicId, bucket)
  }

  return byTopic
}

function byClosesAtAsc<T extends { closesAt: string }>(items: T[]): T[] {
  return [...items].sort(
    (left, right) =>
      dayjs(left.closesAt).valueOf() - dayjs(right.closesAt).valueOf(),
  )
}

export async function fetchEliteBallots(): Promise<EliteBallotResponse> {
  const topics = await fetchEthikosTopics({ status: 'open' })
  return { ballots: byClosesAtAsc(topics.filter(hasExpertContext).map(toEliteBallot)) }
}

export async function fetchPublicBallots(): Promise<PublicBallotResponse> {
  const topics = await fetchEthikosTopics({ status: 'open' })
  return {
    ballots: byClosesAtAsc(
      topics.filter((topic) => !hasExpertContext(topic)).map(toPublicBallot),
    ),
  }
}

/**
 * Records only the canonical Ethikos stance. Smart Vote readings are derived
 * later and must never rewrite this source event.
 */
export async function submitPublicVote(
  id: string,
  option: string,
): Promise<{ ok: true }> {
  await submitTopicStance(id, mapOptionToValue(option))
  return { ok: true }
}

/**
 * Current backend state exposes canonical Ethikos topics/stances but no
 * published Smart Vote reading endpoint. Return the baseline truthfully and
 * leave readingScore undefined until such a reading is actually published.
 */
export async function fetchDecisionResults(): Promise<DecisionResultsResponse> {
  const [topics, stances] = await Promise.all([
    fetchEthikosTopics(),
    fetchAllStances(),
  ])

  const stanceStatsByTopic = buildStanceStatsByTopic(stances)
  const resultTopics = topics.filter(
    (topic) => topic.status === 'closed' || topic.status === 'archived',
  )

  const items: DecisionResult[] = await Promise.all(
    resultTopics.map(async (topic) => {
      const topicId = toId(topic.id)
      const stats = stanceStatsByTopic.get(topicId)
      const average = stats && stats.count > 0 ? stats.sum / stats.count : 0
      const reading = await fetchTopicAdvisoryReading(topic.id)
      const readingScore = reading?.results_payload?.score

      return {
        id: topicId,
        title: topic.title,
        scope: topicScope(topic),
        passed: average >= 0,
        closesAt: computeClosesAt(topic),
        region: categoryName(topic),
        baselineScore: average,
        participationCount: stats?.count ?? 0,
        readingScore:
          typeof readingScore === 'number' ? readingScore : undefined,
        readingKey: reading?.reading_key,
        readingComputedAt: reading?.computed_at,
      }
    }),
  )

  return { items }
}

export async function fetchDecisionProtocols(): Promise<DecisionProtocolRow[]> {
  const [topics, stances] = await Promise.all([
    fetchEthikosTopics(),
    fetchAllStances(),
  ])

  return topics.map((topic) => ({
    id: toId(topic.id),
    title: topic.title,
    category: categoryName(topic),
    status: statusToDecisionStatus(topic.status),
    createdAt: topic.created_at,
    closesAt: computeClosesAt(topic),
    participationCount: stances.filter((stance) => sameId(stance.topic, topic.id))
      .length,
  }))
}

export async function fetchDecisionResultRows(): Promise<DecisionResultRow[]> {
  const results = await fetchDecisionResults()
  return results.items.map((item) => ({
    id: item.id,
    topicId: item.id,
    title: item.title,
    baselineScore: item.baselineScore,
    readingScore: item.readingScore,
    readingKey: item.readingKey,
    publishedAt: item.closesAt,
    status: 'published',
  }))
}
