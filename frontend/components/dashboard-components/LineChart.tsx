// FILE: frontend/components/dashboard-components/LineChart.tsx
// C:\MyCode\Konnaxionv14\frontend\components\dashboard-components\LineChart.tsx
'use client';

import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type LineChartPoint = {
  /** X-axis label (time, date, category). */
  time: string | number;
  /** Primary series value. */
  value: number;
};

export interface LineChartProps {
  /** Data series to display. Use { time, value } shape. */
  data: LineChartPoint[] | null | undefined;
  /** Chart height in pixels (inside the responsive container). Defaults to 300. */
  height?: number;
  /** Label used for the value in the tooltip. Defaults to "Value". */
  valueLabel?: string;
  /** Stroke color for the line. */
  stroke?: string;
  /** Show background grid. Defaults to true. */
  showGrid?: boolean;
  /** Render a simple placeholder instead of the chart. */
  loading?: boolean;
  /** Message shown when there is no data. */
  emptyMessage?: string;
  /** Optional explicit Y-axis domain, e.g. [0, 100]. */
  yDomain?: [number | 'auto', number | 'auto'];
}

const DEFAULT_EMPTY_MESSAGE = 'No data available';

const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 300,
  valueLabel,
  stroke = '#8884d8',
  showGrid = true,
  loading = false,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  yDomain,
}) => {
  const safeData = Array.isArray(data) ? data : [];
  const hasData = safeData.length > 0;

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height,
          borderRadius: 4,
          backgroundColor: '#f5f5f5',
        }}
      />
    );
  }

  if (!hasData) {
    return (
      <div
        style={{
          width: '100%',
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          color: 'var(--ant-color-text-secondary, #999)',
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart
          data={safeData}
          margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
        >
          {showGrid && <CartesianGrid stroke="#ccc" />}
          <XAxis dataKey="time" />
          <YAxis domain={yDomain ?? ['auto', 'auto']} />
          <Tooltip
            formatter={(value: number | string) => [
              value,
              valueLabel ?? 'Value',
            ]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2}
            dot={false}
            isAnimationActive
          />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
