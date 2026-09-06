// FILE: frontend/modules/konsultations/components/ResultsChart.tsx
﻿'use client';

import { Bar } from '@ant-design/plots';
import { Empty } from 'antd';
import React, { useMemo } from 'react';
import type { ReactNode } from 'react';

export type ConsultationResultMode = 'raw' | 'weighted';

export interface ConsultationResultDatum {
  /**
   * Option label displayed on the X axis, e.g. "Strongly agree".
   */
  option: string;
  /**
   * Raw number of votes for this option.
   */
  votes: number;
  /**
   * Optional weighted score (e.g. reputation‑weighted, 0–100).
   * If not provided and mode="weighted", we fall back to `votes`.
   */
  weightedScore?: number | null;
  /**
   * Optional cohort label (e.g. "Public", "Experts").
   * When provided, the chart renders grouped bars per option.
   */
  cohort?: string;
}

export interface ResultsChartProps {
  /**
   * Aggregated results to display. Can be single-series (no cohort)
   * or multi-series (cohort provided).
   */
  data: ConsultationResultDatum[];
  /**
   * Metric to chart: raw vote counts or weighted scores.
   */
  mode?: ConsultationResultMode;
  /**
   * Chart height in pixels.
   */
  height?: number;
  /**
   * Show legend (only relevant when cohorts are used).
   */
  showLegend?: boolean;
  /**
   * Optional custom empty-state message.
   */
  emptyMessage?: ReactNode;
}

/**
 * Generic bar chart for consultation results.
 * - X axis: options
 * - Y axis: votes or weighted score
 * - Optional grouping by cohort
 */
export default function ResultsChart({
  data,
  mode = 'raw',
  height = 260,
  showLegend = true,
  emptyMessage = 'No consultation results available yet.',
}: ResultsChartProps) {
  const hasData = Array.isArray(data) && data.length > 0;

  const multiCohort = useMemo(
    () => hasData && data.some((d) => d.cohort),
    [data, hasData],
  );

  const chartData = useMemo(() => {
    if (!hasData) return [];

    const getValue = (d: ConsultationResultDatum): number => {
      if (mode === 'weighted') {
        if (typeof d.weightedScore === 'number') return d.weightedScore;
        // Fallback to raw votes if weighted score is missing
        return d.votes ?? 0;
      }
      return d.votes ?? 0;
    };

    if (multiCohort) {
      return data.map((d) => ({
        option: d.option,
        cohort: d.cohort ?? 'All',
        value: getValue(d),
      }));
    }

    return data.map((d) => ({
      option: d.option,
      value: getValue(d),
    }));
  }, [data, hasData, mode, multiCohort]);

  if (!hasData) {
    return <Empty description={emptyMessage} />;
  }

  const config = (multiCohort
    ? {
        data: chartData,
        isGroup: true,
        xField: 'option',
        yField: 'value',
        seriesField: 'cohort',
        autoFit: true,
        height,
        legend: showLegend ? undefined : false,
        columnStyle: {
          radius: [4, 4, 0, 0],
        },
        tooltip: {
          shared: true,
        },
      }
    : {
        data: chartData,
        xField: 'option',
        yField: 'value',
        autoFit: true,
        height,
        legend: false,
        columnStyle: {
          radius: [4, 4, 0, 0],
        },
        tooltip: {
          shared: true,
        },
      }) as React.ComponentProps<typeof Bar>;

  return <Bar {...config} />;
}
