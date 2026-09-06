// FILE: frontend/modules/konsensus/hooks/usePoll.ts
﻿// modules/konsensus/hooks/usePoll.ts
import { useQuery } from "@tanstack/react-query";

import { api } from "@/shared/api";

/**
 * Shape of a single vote row returned by the Smart‑Vote API.
 * Note: weighted_value may come back as a string (DecimalField).
 */
export interface VoteRecord {
  id: number;
  user: string;
  target_type: string;
  target_id: number;
  raw_value: number | string;
  weighted_value: number | string;
  voted_at: string;
}

type VoteListPayload =
  | VoteRecord[]
  | {
      results?: VoteRecord[];
    };

/**
 * Mapping between a logical poll id used in the UI and
 * the backend Smart‑Vote target (type + id).
 *
 * You can add more polls here later (e.g. "consultation-2025-01"…).
 */
const POLL_CONFIG = {
  current: {
    targetType: "konsensus.poll",
    targetId: 1,
    question: "Do you support rolling out the Konsensus pilot to all users?",
  },
} as const;

export type PollId = keyof typeof POLL_CONFIG;

export interface PollData {
  id: PollId;
  question: string;
  yes: number;
  no: number;
  total: number;
  /** 0–100, rounded integer */
  supportPercent: number;
}

export const DEFAULT_POLL_ID: PollId = "current";
/** Exported so pages/components can reuse the same mapping. */
export const pollConfig = POLL_CONFIG;

/**
 * Aggregate raw vote rows into a simple yes/no poll.
 * Convention: raw_value > 0 => "yes", raw_value <= 0 => "no".
 */
function aggregateVotes(votes: VoteRecord[]): {
  yes: number;
  no: number;
  total: number;
  supportPercent: number;
} {
  let yes = 0;
  let no = 0;

  for (const v of votes) {
    const val = Number(v.raw_value ?? 0);
    if (val > 0) yes += 1;
    else no += 1;
  }

  const total = yes + no;
  const supportPercent = total > 0 ? Math.round((yes / total) * 100) : 0;

  return { yes, no, total, supportPercent };
}

/**
 * Fetches a poll snapshot from the Smart‑Vote backend.
 *
 * - Hits kollective/votes/ (real DRF endpoint, via baseURL /api).
 * - Filters by target_type + target_id for the selected poll.
 * - Aggregates into a simple yes/no PollData structure.
 */
export function usePoll(id: PollId = DEFAULT_POLL_ID) {
  const cfg = POLL_CONFIG[id];

  return useQuery<PollData>({
    queryKey: ["poll", id],
    staleTime: 30_000,
    retry: 1,
    queryFn: async () => {
      const { data: payload } = await api.get<VoteListPayload>("kollective/votes/", {
        params: {
          target_type: cfg.targetType,
          target_id: cfg.targetId,
        },
      });

      // Handle both "bare list" and "paginated { results: [...] }" shapes
      let rows: VoteRecord[] = [];
      if (Array.isArray(payload)) {
        rows = payload as VoteRecord[];
      } else if (payload && Array.isArray(payload.results)) {
        rows = payload.results;
      }

      // Extra client‑side filter in case backend ignores query params for now
      const filtered = rows.filter(
        (v) =>
          v.target_type === cfg.targetType &&
          String(v.target_id) === String(cfg.targetId),
      );

      const { yes, no, total, supportPercent } = aggregateVotes(filtered);

      return {
        id,
        question: cfg.question,
        yes,
        no,
        total,
        supportPercent,
      };
    },
  });
}
