"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import type { PollId } from "./usePoll";

/**
 * Lightweight "live" layer for Konsensus polls.
 *
 * Uses a self-scheduling timeout instead of a permanent interval so cleanup
 * is simpler and background work can be paused when the tab is hidden.
 */
export default function useLivePoll(
  id: PollId,
  intervalMs = 15_000,
): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id || intervalMs <= 0) return;

    let timeoutId: number | undefined;
    let cancelled = false;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["poll", id] });
    };

    const scheduleNext = () => {
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;

        if (document.visibilityState === "visible") {
          invalidate();
        }

        scheduleNext();
      }, intervalMs);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        invalidate();
      }
    };

    scheduleNext();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [id, intervalMs, queryClient]);
}