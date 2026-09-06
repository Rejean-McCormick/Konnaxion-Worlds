// FILE: frontend/components/dashboard-components/UserCard.tsx
// C:\MyCode\Konnaxionv14\frontend\components\dashboard-components\UserCard.tsx
'use client';

import type { ColumnConfig } from '@ant-design/plots';
import { Card, Skeleton, Statistic } from 'antd';
import dynamic from 'next/dynamic';
import React from 'react';

// SSR-safe dynamic import of Column
const Column = dynamic(
  () => import('@ant-design/plots').then((m) => m.Column),
  { ssr: false }
);

export interface UserCardProps {
  title?: string;   // Default: 'New Users'
  total: number;    // Total users (or new users)
  trend?: number[]; // Time series values
  loading?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({
  title = 'New Users',
  total,
  trend = [],
  loading = false,
}) => {
  const series: number[] = Array.isArray(trend) ? trend : [];
  const data = series.map((y, i) => ({
    idx: String(i + 1),
    value: Number(y ?? 0),
  }));

  const config: ColumnConfig = {
    data,
    xField: 'idx',
    yField: 'value',
    height: 56,
    autoFit: true,
    padding: 0,
    legend: false,
    xAxis: false,
    yAxis: false,
    label: false,
    tooltip: false,
    columnWidthRatio: 1,
  };

  return (
    <Card bordered={false} bodyStyle={{ padding: 16 }}>
      <Statistic title={title} value={total} />
      {loading ? (
        <Skeleton active paragraph={false} style={{ marginTop: 8 }} />
      ) : (
        <div style={{ marginTop: 8 }}>
          <Column {...config} />
        </div>
      )}
    </Card>
  );
};

export default UserCard;
