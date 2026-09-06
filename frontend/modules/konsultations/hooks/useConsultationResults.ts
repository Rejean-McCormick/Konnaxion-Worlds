// FILE: frontend/modules/konsultations/hooks/useConsultationResults.ts
﻿// modules/konsultations/hooks/useConsultationResults.ts

import { useQuery } from '@tanstack/react-query';

import { get } from '@/services/_request';

/**
 * Raw stance row coming from the Ethikos backend.
 * Backend: GET /api/ethikos/stances/?topic=<id>
 */
interface EthikosStancePoint {
  id: number;
  topic: number;
  value: number; // −3 … +3
  timestamp: string;
  user?: string;
}

/**
 * Aggregated statistics on the −3…+3 stance scale.
 */
export interface StanceStats {
  /** Total number of stances recorded for this consultation */
  total: number;
  /** Arithmetic mean of all stance values (−3…+3) */
  average: number;
  /** Count of stances with value > 0 */
  positive: number;
  /** Count of stances with value === 0 */
  neutral: number;
  /** Count of stances with value < 0 */
  negative: number;
  /**
   * Histogram of counts for each discrete value −3…+3.
   * Keys are the stance value (e.g. counts[-3], counts[0], counts[3]).
   */
  counts: Record<number, number>;
}

/**
 * Convenience structure for charting and UIs.
 */
export interface StanceBucket {
  /** Raw stance value (−3…+3) */
  value: number;
  /** Human‑readable label for the value */
  label: string;
  /** Number of participants that selected this value */
  count: number;
  /** Share in [0, 1] of all stances */
  share: number;
}

/**
 * Final shape returned by the hook.
 */
export interface ConsultationResults {
  /** Logical consultation id (backed by Ethikos topic id) */
  consultationId: number;
  /** Aggregated stance statistics */
  stats: StanceStats;
  /** Histogram buckets ready for charts / dashboards */
  buckets: StanceBucket[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function computeStanceStats(stances: EthikosStancePoint[]): StanceStats {
  const counts: Record<number, number> = {
    [-3]: 0,
    [-2]: 0,
    [-1]: 0,
    0: 0,
    1: 0,
    2: 0,
    3: 0,
  };

  let total = 0;
  let sum = 0;
  let positive = 0;
  let neutral = 0;
  let negative = 0;

  for (const s of stances) {
    // Clamp to the expected scale just in case
    const v = Math.max(-3, Math.min(3, s.value));

    counts[v] = (counts[v] ?? 0) + 1;
    total += 1;
    sum += v;

    if (v > 0) positive += 1;
    else if (v < 0) negative += 1;
    else neutral += 1;
  }

  const average = total > 0 ? sum / total : 0;

  return {
    total,
    average,
    positive,
    neutral,
    negative,
    counts,
  };
}

function stanceLabel(value: number): string {
  switch (value) {
    case -3:
      return 'Strongly against';
    case -2:
      return 'Moderately against';
    case -1:
      return 'Somewhat against';
    case 0:
      return 'Neutral / undecided';
    case 1:
      return 'Somewhat for';
    case 2:
      return 'Moderately for';
    case 3:
      return 'Strongly for';
    default:
      return 'Neutral / undecided';
  }
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Aggregated results for a single consultation.
 *
 * Internally this maps a “consultation” to an Ethikos topic and
 * aggregates all stance rows returned by:
 *   GET /api/ethikos/stances/?topic=<consultationId>
 */
export default function useConsultationResults(
  consultationId?: number | string,
) {
  const numericId = Number(consultationId);
  const enabled = Number.isFinite(numericId);

  return useQuery<ConsultationResults>({
    queryKey: ['consultation-results', numericId],
    enabled,
    staleTime: 60_000,
    retry: 1,
    queryFn: async () => {
      if (!Number.isFinite(numericId)) {
        throw new Error('Invalid consultation id');
      }

      const stances = await get<EthikosStancePoint[]>('ethikos/stances/', {
        params: { topic: numericId },
      });

      const stats = computeStanceStats(stances ?? []);

      const buckets: StanceBucket[] = [-3, -2, -1, 0, 1, 2, 3].map((value) => {
        const count = stats.counts[value] ?? 0;
        const share = stats.total > 0 ? count / stats.total : 0;
        return {
          value,
          label: stanceLabel(value),
          count,
          share,
        };
      });

      return {
        consultationId: numericId,
        stats,
        buckets,
      };
    },
  });
}
