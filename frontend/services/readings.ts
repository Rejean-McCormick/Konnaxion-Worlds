// FILE: frontend/services/readings.ts
import { get } from './_request'

export interface SmartVoteReadingDomain {
  domain_code: string
  domain_name: string
  weight: number
  criteria?: Record<string, unknown> | null
}

export interface SmartVoteReadingParticipant {
  user_id: number
  display_name: string
  stance_value: number
  expertise_alignment: number
  advisory_weight: number
  included_in_advisory: boolean
  exclusion_reason?: string | null
  rating_access?: {
    allowed: boolean
    level: 'ratings' | 'history' | null
    reason: string
    scope?: { key?: string | null; name?: string | null } | null
  }
}

export interface SmartVoteBaselinePayload {
  score: number
  participant_count: number
  support_count?: number
  neutral_count?: number
  oppose_count?: number
  support_share?: number
  neutral_share?: number
  oppose_share?: number
}

export interface SmartVoteAdvisoryPayload {
  score: number
  participant_count: number
  advisory_participant_count?: number
  excluded_participant_count?: number
  participant_detail_visible_count?: number
  total_advisory_weight?: number
  average_expertise_alignment?: number
  expertise_coverage?: number
  support_share?: number
  neutral_share?: number
  oppose_share?: number
  domains?: SmartVoteReadingDomain[]
  participants?: SmartVoteReadingParticipant[]
}

export interface SmartVoteReadingEnvelope<TPayload> {
  reading_key: string
  lens_hash: string | null
  snapshot_ref: string | null
  computed_at: string
  results_payload: TPayload
}

export interface EthikosTopicReading {
  target_type: 'ethikos_topic' | string
  target_id: string
  smart_vote_consultation_id: string
  baseline: SmartVoteReadingEnvelope<SmartVoteBaselinePayload>
  readings: SmartVoteReadingEnvelope<SmartVoteAdvisoryPayload>[]
}

export async function fetchEthikosTopicReading(
  topicId: string | number,
): Promise<EthikosTopicReading | null> {
  const id = String(topicId).trim()
  if (!id) return null

  try {
    return await get<EthikosTopicReading>(
      `v1/smart-vote/readings/ethikos-topic/${encodeURIComponent(id)}/`,
    )
  } catch {
    return null
  }
}

export function primaryAdvisoryReading(
  payload: EthikosTopicReading | null | undefined,
): SmartVoteReadingEnvelope<SmartVoteAdvisoryPayload> | null {
  return payload?.readings?.[0] ?? null
}
