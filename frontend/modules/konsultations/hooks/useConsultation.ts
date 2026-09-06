// FILE: frontend/modules/konsultations/hooks/useConsultation.ts
﻿// modules/konsultations/hooks/useConsultations.ts

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import {
  fetchPublicBallots,
  type PublicBallot,
  type PublicBallotResponse,
} from '@/services/decide';

export type QuickFilter = 'all' | 'closing-soon' | 'high-turnout';

export interface UseConsultationsParams {
  /** Free‑text search on consultation title */
  search?: string;
  /** Quick filter for the list (default: 'all') */
  quickFilter?: QuickFilter;
}

export interface ConsultationStat {
  label: string;
  value: number;
  suffix?: string;
}

export interface UseConsultationsResult {
  /** Raw list of open public consultations (ballots) */
  ballots: PublicBallot[];
  /** Ballots filtered according to `search` + `quickFilter` */
  filteredBallots: PublicBallot[];
  /** KPI header stats (active count, avg turnout, closing‑soon count) */
  stats: ConsultationStat[];
  /** React‑Query flags */
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  /** Manual refresh helper */
  refresh: () => void;
}

/**
 * High‑level hook for Ethikos public consultations.
 *
 * Wraps `fetchPublicBallots()` and exposes:
 * - raw `ballots`
 * - derived `stats` for KPI cards
 * - `filteredBallots` based on search + quick filter
 */
export default function useConsultations(
  params: UseConsultationsParams = {},
): UseConsultationsResult {
  const { search = '', quickFilter = 'all' } = params;

  const query = useQuery<PublicBallotResponse, Error>({
    queryKey: ['consultations', 'public-ballots'],
    staleTime: 60_000,
    retry: 1,
    queryFn: fetchPublicBallots,
  });

  const ballots = query.data?.ballots ?? [];

  const stats = useMemo<ConsultationStat[]>(() => {
    const total = ballots.length;
    const avgTurnout =
      total > 0
        ? Math.round(
            ballots.reduce((sum, b) => sum + (b.turnout ?? 0), 0) / total,
          )
        : 0;

    const closingSoon = ballots.filter((ballot) => {
      const closes = dayjs(ballot.closesAt);
      if (!closes.isValid()) return false;
      // Mirror the 48h "closing soon" logic from the public Decide page
      return closes.diff(dayjs(), 'hour') <= 48;
    }).length;

    return [
      { label: 'Active consultations', value: total },
      { label: 'Avg participation', value: avgTurnout, suffix: '%' },
      { label: 'Closing ≤ 48h', value: closingSoon },
    ];
  }, [ballots]);

  const filteredBallots = useMemo<PublicBallot[]>(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const now = dayjs();

    return ballots.filter((ballot) => {
      if (
        normalizedSearch &&
        !ballot.title.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      if (quickFilter === 'closing-soon') {
        const closes = dayjs(ballot.closesAt);
        if (!closes.isValid()) return false;
        return closes.diff(now, 'hour') <= 48;
      }

      if (quickFilter === 'high-turnout') {
        return (ballot.turnout ?? 0) >= 50;
      }

      return true;
    });
  }, [ballots, quickFilter, search]);

  return {
    ballots,
    filteredBallots,
    stats,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    refresh: () => {
      void query.refetch();
    },
  };
}
