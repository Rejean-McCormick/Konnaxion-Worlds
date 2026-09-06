// FILE: frontend/modules/ethikos/pulse/overview/page.tsx
'use client'

// pages/ethikos/pulse/overview.tsx
import { ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  StatisticCard,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Badge, Button, Empty, Skeleton, Space, Tooltip } from 'antd';
import dayjs from 'dayjs';

import ChartCard from '@/components/charts/ChartCard';
import usePageTitle from '@/hooks/usePageTitle';
import { fetchPulseOverview } from '@/services/pulse';

/* ------------------------------------------------------------------ */
/*  Data-fetching hook                                                 */
/* ------------------------------------------------------------------ */

function usePulseOverview() {
  const req = useRequest(fetchPulseOverview, { refreshDeps: [] });
  return req;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function PulseOverview() {
  usePageTitle('Pulse · Overview');

  const { data, loading, error, refresh } = usePulseOverview();
  const lastUpdated = data ? dayjs(data.refreshedAt).format('HH:mm:ss') : null;

  /* ---------- loading skeleton ---------- */
  if (loading && !data) {
    return (
      <PageContainer ghost>
        <Skeleton active />
      </PageContainer>
    );
  }

  /* ---------- error state ---------- */
  if (error) {
    return (
      <PageContainer ghost>
        <Empty
          description="Failed to load metrics"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button icon={<SyncOutlined />} onClick={refresh}>
            Retry
          </Button>
        </Empty>
      </PageContainer>
    );
  }

  /* ---------- empty state ---------- */
  if (data && data.kpis.length === 0) {
    return (
      <PageContainer ghost>
        <Empty description="No KPI data yet" />
      </PageContainer>
    );
  }

  /* ---------- happy path ---------- */
  return (
    <PageContainer
      ghost
      extra={
        <Space>
          {lastUpdated && (
            <Badge
              count={
                <Tooltip title={`Last refreshed at ${lastUpdated}`}>
                  <ClockCircleOutlined style={{ color: '#52c41a' }} />
                </Tooltip>
              }
            />
          )}
          <Button
            icon={<SyncOutlined />}
            onClick={refresh}
            size="small"
            type="text"
          />
        </Space>
      }
    >
      <ProCard gutter={[16, 16]} wrap>
        {data!.kpis.map((kpi) => (
          <StatisticCard
            key={kpi.label}
            colSpan={{
              xs: 24,
              sm: 12,
              md: 12,
              lg: 6,
            }}
            statistic={{
              title: kpi.label,
              value: kpi.value,
              suffix: kpi.delta !== undefined ? '%' : undefined,
              description:
                kpi.delta !== undefined ? (
                  <span
                    style={{
                      color: kpi.delta >= 0 ? '#3f8600' : '#cf1322',
                    }}
                  >
                    {kpi.delta >= 0 ? '▲' : '▼'} {Math.abs(kpi.delta)}%
                  </span>
                ) : null,
            }}
            chart={
              <ChartCard
                type="area"
                height={60}
                data={kpi.history.map((h) => ({
                  x: h.date,
                  y: h.value,
                }))}
                tooltip={{
                  formatter: (datum: { x: string | number | Date; y: unknown }) =>
                    `${dayjs(datum.x).format('MMM D')}: ${String(datum.y)}`,
                }}
              />
            }
          />
        ))}
      </ProCard>
    </PageContainer>
  );
}
