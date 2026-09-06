// FILE: frontend/modules/konsensus/components/VoteButtons.tsx
﻿"use client";
import { Button } from "antd";
import React from "react";

// Explicit props: parent passes pollId and option list
export interface VoteButtonsProps {
  pollId: string;
  options: string[];
  onVote: (option: string) => void;
}

export default function VoteButtons({ options, onVote }: VoteButtonsProps) {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <Button key={option} onClick={() => onVote(option)}>
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </Button>
      ))}
    </div>
  );
}
