// FILE: frontend/components/charts/ChartCard.tsx
// components/charts/ChartCard.tsx
'use client';

import { Area, Line } from '@ant-design/plots';
import React from 'react';

type ChartType = 'line' | 'area' | 'tinyLine';
type Datum = Record<string, unknown>;

export interface ChartCardProps {
  /** choose a compact chart variant */
  type: ChartType;
  /** accepts any record array; map fields with xField/yField or let it auto-detect */
  data: Datum[];
  height?: number;
  /** optional explicit field names (e.g. xField="ts", yField="value") */
  xField?: string;
  yField?: string;
  /** forward any extra Ant Design Plot options */
  [key: string]: unknown;
}

function pickField(data: Datum[], candidates: string[], fallback: string) {
  if (!data?.length) return fallback;
  const sample = data[0] as Record<string, unknown>;
  for (const k of candidates) if (k in sample) return k;
  return fallback;
}

export default function ChartCard({
  type,
  data,
  height = 60,
  xField,
  yField,
  ...rest
}: ChartCardProps) {
  // Auto-map common shapes: {x,y}, {ts,value}, {date,count}, etc.
  const xf = xField ?? pickField(data, ['x', 'ts', 'date', 'label'], 'x');
  const yf = yField ?? pickField(data, ['y', 'value', 'count'], 'y');

  const common = {
    data,
    xField: xf,
    yField: yf,
    height,
    autoFit: true,
    ...rest, // allow overrides
  };

  if (type === 'area') {
    return <Area {...(common as React.ComponentProps<typeof Area>)} />;
  }

  // "tinyLine" = line with compact defaults; still uses <Line/>
  const tinyOverrides = type === 'tinyLine' ? { legend: false } : undefined;

  return (
    <Line
      {...({ ...common, ...tinyOverrides } as React.ComponentProps<typeof Line>)}
    />
  );
}
