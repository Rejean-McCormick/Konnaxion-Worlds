import dayjs from 'dayjs'

import type { ArgumentTreeItem } from '@/modules/ethikos/components/ArgumentTree'
import type {
  TopicDetailResponse,
  TopicStance,
  TopicStanceValue,
} from '@/services/deliberate'
import type { ArgumentSide } from '@/services/ethikos'

export interface UserMeApi {
  id?: string | number
  username?: string
  email?: string
  name?: string
  display_name?: string
}

export interface StanceStats {
  total: number
  average: number
  support: number
  oppose: number
  neutral: number
}

export const STANCE_MARKS: Record<number, string> = {
  [-3]: 'Strongly oppose',
  [-2]: 'Oppose',
  [-1]: 'Lean oppose',
  0: 'Neutral',
  1: 'Lean support',
  2: 'Support',
  3: 'Strongly support',
}

export function clampStance(value: number): TopicStanceValue {
  if (value <= -3) return -3
  if (value === -2) return -2
  if (value === -1) return -1
  if (value === 0) return 0
  if (value === 1) return 1
  if (value === 2) return 2
  return 3
}

export function stanceLabel(value: number): string {
  return STANCE_MARKS[clampStance(value)] ?? 'Neutral'
}

export function stanceColor(value: number): string {
  if (value > 0) return 'green'
  if (value < 0) return 'red'
  return 'default'
}

export function sideColor(side?: ArgumentSide | 'neutral' | null): string {
  if (side === 'pro') return 'green'
  if (side === 'con') return 'red'
  return 'default'
}

export function sideLabel(side?: ArgumentSide | 'neutral' | null): string {
  if (side === 'pro') return 'Pro'
  if (side === 'con') return 'Con'
  return 'Argument'
}

export function toSuggestionSide(
  side?: ArgumentSide | 'neutral' | null,
): ArgumentSide | null {
  return side === 'pro' || side === 'con' ? side : null
}

function userCandidates(me?: UserMeApi): string[] {
  return [me?.username, me?.email, me?.name, me?.display_name]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase())
}

export function isMine(stance: TopicStance, me?: UserMeApi): boolean {
  if (!stance.user || !me) return false
  return userCandidates(me).includes(String(stance.user).toLowerCase())
}

export function computeStanceStats(stances: TopicStance[]): StanceStats {
  if (stances.length === 0) {
    return {
      total: 0,
      average: 0,
      support: 0,
      oppose: 0,
      neutral: 0,
    }
  }

  const total = stances.length
  const sum = stances.reduce((acc, stance) => acc + stance.value, 0)
  const support = stances.filter((stance) => stance.value > 0).length
  const oppose = stances.filter((stance) => stance.value < 0).length
  const neutral = total - support - oppose

  return {
    total,
    average: Number((sum / total).toFixed(2)),
    support,
    oppose,
    neutral,
  }
}

export function formatRelativeDate(value?: string): string {
  if (!value) return 'Unknown date'

  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.fromNow() : value
}

export function toTopicParam(raw: string | string[] | undefined): string | undefined {
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw)) return raw[0]
  return undefined
}

export function toArgumentItems(topic?: TopicDetailResponse): ArgumentTreeItem[] {
  return (topic?.statements ?? []).map((statement) => ({
    id: String(statement.id),
    body: statement.body,
    author: statement.author,
    side: statement.side ?? null,
    parent: statement.parent != null ? String(statement.parent) : null,
    createdAt: statement.createdAt,
    raw: statement,
  }))
}
