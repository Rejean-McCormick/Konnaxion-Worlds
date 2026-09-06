// FILE: frontend/components/dashboard-components/LikeCard.tsx
// C:\MyCode\Konnaxionv14\frontend\components\dashboard-components\LikeCard.tsx
'use client';

import type { LineConfig } from '@ant-design/plots';
import { Card, Skeleton, Statistic } from 'antd';
import dynamic from 'next/dynamic';
import React from 'react';

// Use Line instead of TinyLine (works across versions)
const Line = dynamic(() => import('@ant-design/plots').then((m) => m.Line), {
  ssr: false,
});

export interface LikeCardProps {
  title?: string;        // Default: 'Likes'
  total: number;         // Total likes
  trend?: number[];      // Sparkline series
  loading?: boolean;
}

const LikeCard: React.FC<LikeCardProps> = ({
  title = 'Likes',
  total,
  trend = [],
  loading = false,
}) => {
  const series: number[] = Array.isArray(trend) ? trend : [];
  const data = series.map((y, i) => ({ x: i, y: Number(y ?? 0) }));

  const config: LineConfig = {
    data,
    xField: 'x',
    yField: 'y',
    smooth: true,
    autoFit: true,
    height: 56,
    padding: 0,
    xAxis: false,
    yAxis: false,
    tooltip: {},
  };

  return (
    <Card bordered={false} bodyStyle={{ padding: 16 }}>
      <Statistic title={title} value={total} />
      {loading ? (
        <Skeleton active paragraph={false} style={{ marginTop: 8 }} />
      ) : (
        <div style={{ marginTop: 8 }}>
          <Line {...config} />
        </div>
      )}
    </Card>
  );
};

export default LikeCard;
