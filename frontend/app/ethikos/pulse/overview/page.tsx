// FILE: frontend/app/ethikos/pulse/overview/page.tsx
'use client';

import {
  BarChartOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  StatisticCard,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Alert,
  Badge,
  Button,
  Empty,
  List,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import ChartCard from '@/components/charts/ChartCard';
import { fetchPulseOverview } from '@/services/pulse';

const { Text } = Typography;

type OverviewData = Awaited<ReturnType<typeof fetchPulseOverview>>;

type KpiMeta = {
  description: string;
  color: string;
};

const KPI_DEFINITIONS: Record<string, KpiMeta> = {
  topics: {
    description: 'New debate topics created across Ethikos over the last 30 days.',
    color: 'blue',
  },
  stances: {
    description:
      'Individual stance submissions linked to debates in the last 30 days.',
    color: 'green',
  },
  arguments: {
    description:
      'Arguments, comments, and replies added to debates over the last 30 days.',
    color: 'purple',
  },
  votes: {
    description:
      'Weighted votes cast across topics and outcomes in the last 30 days.',
    color: 'volcano',
  },
};

function usePulseOverview() {
  return useRequest<OverviewData, []>(fetchPulseOverview, {
    refreshDeps: [],
  });
}

function renderDelta(delta?: number): ReactNode {
  if (typeof delta !== 'number') {
    return null;
  }

  const positive = delta >= 0;

  return (
    <span
      style={{
        color: positive ? '#3f8600' : '#cf1322',
      }}
    >
      {positive ? '▲' : '▼'} {Math.abs(delta)}%
    </span>
  );
}

export default function PulseOverview() {
  const { data, loading, error, refresh } = usePulseOverview();
  const lastUpdated = data?.refreshedAt
    ? dayjs(data.refreshedAt).format('HH:mm:ss')
    : null;

  const secondaryActions = (
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
        aria-label="Refresh pulse overview"
        disabled={loading}
        icon={<SyncOutlined spin={loading} />}
        onClick={() => void refresh()}
        size="small"
        type="text"
      />
    </Space>
  );

  let body: ReactNode;

  if (loading && !data) {
    body = (
      <PageContainer ghost>
        <Skeleton active />
      </PageContainer>
    );
  } else if (error) {
    body = (
      <PageContainer ghost>
        <Empty
          description="Failed to load metrics"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button icon={<SyncOutlined />} onClick={() => void refresh()}>
            Retry
          </Button>
        </Empty>
      </PageContainer>
    );
  } else if (data && data.kpis.length === 0) {
    body = (
      <PageContainer ghost>
        <Empty description="No KPI data yet" />
      </PageContainer>
    );
  } else if (data) {
    body = (
      <PageContainer ghost>
        <Alert
          description="Debates, stances, arguments, and votes aggregated daily across all Ethikos topics. Use this view as a quick pulse before drilling into trends or live participation."
          message="Aggregated participation metrics (last 30 days)"
          showIcon
          style={{ marginBottom: 16 }}
          type="info"
        />

        <ProCard gutter={16} wrap>
          <ProCard colSpan={{ xs: 24, xl: 16 }} ghost>
            <ProCard gutter={[16, 16]} wrap>
              {data.kpis.map((kpi) => (
                <StatisticCard
                  key={kpi.key ?? kpi.label}
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
                    description: renderDelta(kpi.delta),
                  }}
                  chart={
                    <ChartCard
                      type="area"
                      height={60}
                      data={kpi.history.map((point) => ({
                        x: point.date,
                        y: point.value,
                      }))}
                      tooltip={{
                        formatter: (datum: { x: string; y: number }) =>
                          `${dayjs(datum.x).format('MMM D')}: ${datum.y}`,
                      }}
                    />
                  }
                />
              ))}
            </ProCard>
          </ProCard>

          <ProCard
            colSpan={{ xs: 24, xl: 8 }}
            title={
              <Space>
                <InfoCircleOutlined />
                <span>How to read these KPIs</span>
              </Space>
            }
          >
            <List
              dataSource={data.kpis}
              renderItem={(kpi) => {
                const meta = KPI_DEFINITIONS[kpi.key] ?? {
                  description: 'Activity metric in the Ethikos opinion layer.',
                  color: 'default',
                };

                return (
                  <List.Item key={kpi.key}>
                    <List.Item.Meta
                      title={
                        <Space size="small">
                          <Tag color={meta.color}>{kpi.label}</Tag>
                          {typeof kpi.delta === 'number' && (
                            <Text type={kpi.delta >= 0 ? 'success' : 'danger'}>
                              {kpi.delta >= 0 ? `+${kpi.delta}%` : `${kpi.delta}%`}
                            </Text>
                          )}
                        </Space>
                      }
                      description={<Text type="secondary">{meta.description}</Text>}
                    />
                  </List.Item>
                );
              }}
              size="small"
            />
          </ProCard>
        </ProCard>

        <ProCard
          ghost
          style={{ marginTop: 16 }}
          title={
            <Space>
              <LineChartOutlined />
              <span>Where to go next</span>
            </Space>
          }
        >
          <Space wrap>
            <Button href="/ethikos/pulse/live">Live participation</Button>
            <Button href="/ethikos/pulse/trends">Opinion trends</Button>
            <Button href="/ethikos/pulse/health">Participation health</Button>
            <Button href="/ethikos/insights" icon={<BarChartOutlined />}>
              Full analytics
            </Button>
          </Space>
        </ProCard>
      </PageContainer>
    );
  } else {
    body = (
      <PageContainer ghost>
        <Empty description="No data available" />
      </PageContainer>
    );
  }

  return (
    <EthikosPageShell
      title="Pulse · Overview"
      subtitle="30-day snapshot of debates, stances, arguments, and votes across Ethikos."
      primaryAction={
        <Button
          type="primary"
          href="/ethikos/insights"
          icon={<BarChartOutlined />}
        >
          Open opinion analytics
        </Button>
      }
      secondaryActions={secondaryActions}
    >
      {body}
    </EthikosPageShell>
  );
}
