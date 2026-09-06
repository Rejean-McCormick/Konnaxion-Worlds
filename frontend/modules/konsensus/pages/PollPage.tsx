"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Alert, Card, message, Spin } from "antd";
import React from "react";

import { apiPost } from "@/api";

import PollBarChart from "../components/PollBarChart";
import VoteButtons from "../components/VoteButtons";
import useLivePoll from "../hooks/useLivePoll";
import { DEFAULT_POLL_ID, pollConfig, usePoll } from "../hooks/usePoll";

const LIVE_POLL_INTERVAL_MS = 15_000;

/**
 * Konsensus Center – Smart-Vote yes/no poll.
 *
 * Reads aggregated results from the Smart-Vote API
 * (kollective/votes/) via usePoll, and posts new votes
 * back to the same endpoint.
 */
export default function PollPage() {
  const pollId = DEFAULT_POLL_ID;
  const cfg = pollConfig[pollId];
  const queryClient = useQueryClient();

  const {
    data: poll,
    isLoading,
    isError,
    error,
  } = usePoll(pollId);

  // Lower-frequency live refresh. The hook also pauses while hidden.
  useLivePoll(pollId, LIVE_POLL_INTERVAL_MS);

  const handleVote = async (option: string) => {
    if (!cfg) return;

    const normalized = option.toLowerCase();
    const rawValue = normalized === "yes" ? 1 : -1;

    try {
      await apiPost("kollective/votes/", {
        target_type: cfg.targetType,
        target_id: cfg.targetId,
        raw_value: rawValue,
        weighted_value: rawValue,
      });

      queryClient.invalidateQueries({ queryKey: ["poll", pollId] });
      message.success("Your vote has been recorded.");
    } catch (e) {
       
      console.error("Vote submission failed", e);
      message.error("Unable to record your vote. Please try again.");
    }
  };

  if (isLoading) return <Spin />;
  if (isError)
    return (
      <Alert
        message={
          (error as Error)?.message || "Failed to load the current poll."
        }
        type="error"
      />
    );
  if (!poll) return null;

  return (
    <div className="container mx-auto py-8">
      <Card title="Current Konsensus Poll">
        <h1 className="mb-4 text-xl font-semibold">{poll.question}</h1>

        <div className="mb-4 flex flex-wrap items-baseline gap-4">
          <span>Yes: {poll.yes}</span>
          <span>No: {poll.no}</span>
          <span>Total: {poll.total}</span>
          <span>Support: {poll.supportPercent}%</span>
        </div>

        <div className="mb-6 max-w-md">
          <PollBarChart
            labels={["Yes", "No"]}
            votes={[poll.yes, poll.no]}
          />
        </div>

        <VoteButtons
          pollId={pollId}
          options={["yes", "no"]}
          onVote={handleVote}
        />
      </Card>
    </div>
  );
}