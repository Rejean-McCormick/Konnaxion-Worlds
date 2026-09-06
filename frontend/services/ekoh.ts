// FILE: frontend/services/ekoh.ts
// Canonical frontend service for EkoH-owned profile/rating disclosure.

import { get } from './_request';

type UnknownRecord = Record<string, unknown>;

export type EkohIdentityVisibility = 'public' | 'pseudonym' | 'anonymous' | string;
export type EkohRatingVisibility = 'public' | 'scoped' | 'private' | string;
export type EkohRatingAccessLevel = 'ratings' | 'history' | null;

export interface EkohExpertiseScore {
  domainCode: string;
  domainName: string;
  weightedScore: number;
}

export interface EkohScoreHistoryEntry {
  domainCode: string;
  domainName: string;
  oldValue: number;
  newValue: number;
  changeReason: string;
  changedAt: string;
}

export interface EkohRatingAccess {
  allowed: boolean;
  level: EkohRatingAccessLevel;
  reason: string;
  scope: { key: string | null; name: string | null } | null;
}

export interface EkohProfile {
  userId: string;
  displayName: string;
  confidentialityLevel: EkohIdentityVisibility;
  ratingVisibility: EkohRatingVisibility;
  ratingPublicationBasis: string;
  ratingAccess: EkohRatingAccess;
  ethicsScore: number | null;
  expertise: EkohExpertiseScore[] | null;
  scoreHistory: EkohScoreHistoryEntry[] | null;
}

interface EkohProfileApi {
  user_id?: string | number | null;
  display_name?: string | null;
  confidentiality_level?: string | null;
  rating_visibility?: string | null;
  rating_publication_basis?: string | null;
  rating_access?: {
    allowed?: boolean;
    level?: string | null;
    reason?: string | null;
    scope?: { key?: string | null; name?: string | null } | null;
  } | null;
  ethics_score?: string | number | null;
  expertise?: Array<{
    domain_code?: string | null;
    domain_name?: string | null;
    weighted_score?: string | number | null;
  }> | null;
  score_history?: Array<{
    domain_code?: string | null;
    domain_name?: string | null;
    old_value?: string | number | null;
    new_value?: string | number | null;
    change_reason?: string | null;
    changed_at?: string | null;
  }> | null;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function unwrapPayload(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  return raw.data ?? raw;
}

function readNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizedUnitScore(value: unknown): number {
  let score = readNumber(value);
  if (score > 1 && score <= 100) score /= 100;
  return Math.max(0, Math.min(1, score));
}

export function normalizeEkohProfile(raw: unknown): EkohProfile | null {
  const payload = unwrapPayload(raw);
  if (!isRecord(payload)) return null;

  const api = payload as EkohProfileApi;
  const userId = api.user_id != null ? String(api.user_id) : '';
  if (!userId) return null;

  const expertise = Array.isArray(api.expertise)
    ? api.expertise
        .map((item): EkohExpertiseScore | null => {
          const domainCode = item.domain_code?.trim() ?? '';
          if (!domainCode) return null;
          return {
            domainCode,
            domainName: item.domain_name?.trim() || domainCode,
            weightedScore: normalizedUnitScore(item.weighted_score),
          };
        })
        .filter((item): item is EkohExpertiseScore => item !== null)
        .sort((a, b) => b.weightedScore - a.weightedScore)
    : api.expertise === null
      ? null
      : [];

  const scoreHistory = Array.isArray(api.score_history)
    ? api.score_history
        .map((item): EkohScoreHistoryEntry | null => {
          const domainCode = item.domain_code?.trim() ?? '';
          const changedAt = item.changed_at?.trim() ?? '';
          if (!domainCode || !changedAt) return null;
          return {
            domainCode,
            domainName: item.domain_name?.trim() || domainCode,
            oldValue: normalizedUnitScore(item.old_value),
            newValue: normalizedUnitScore(item.new_value),
            changeReason: item.change_reason?.trim() ?? '',
            changedAt,
          };
        })
        .filter((item): item is EkohScoreHistoryEntry => item !== null)
    : null;

  const access = api.rating_access;
  const allowed = access?.allowed === true;
  const level = access?.level === 'history' || access?.level === 'ratings'
    ? access.level
    : null;

  return {
    userId,
    displayName: api.display_name?.trim() || `User ${userId}`,
    confidentialityLevel: api.confidentiality_level ?? 'public',
    ratingVisibility: api.rating_visibility ?? 'public',
    ratingPublicationBasis: api.rating_publication_basis?.trim() ?? '',
    ratingAccess: {
      allowed,
      level,
      reason: access?.reason?.trim() || (allowed ? 'allowed' : 'not_authorized'),
      scope: access?.scope
        ? {
            key: access.scope.key ?? null,
            name: access.scope.name ?? null,
          }
        : null,
    },
    ethicsScore: api.ethics_score == null ? null : readNumber(api.ethics_score),
    expertise,
    scoreHistory,
  };
}

export async function fetchEkohProfile(
  userId: string | number,
): Promise<EkohProfile | null> {
  try {
    const raw = await get<unknown>(`v1/ekoh/profile/${userId}/`);
    return normalizeEkohProfile(raw);
  } catch {
    return null;
  }
}
