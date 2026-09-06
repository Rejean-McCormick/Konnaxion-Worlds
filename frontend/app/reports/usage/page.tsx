'use client';

import {
  BarChartOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  ProjectOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  StatisticCard,
} from '@ant-design/pro-components';
import {
  Badge,
  Button,
  Divider,
  Empty,
  Progress,
  Segmented,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import api from '@/api';

import ReportsPageShell from '../ReportsPageShell';

const { Text, Title } = Typography;

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type TimeRangeKey = '7d' | '30d' | '90d';

type UsagePoint = {
  label: string;
  activeUsers: number;
  newUsers: number;
  sessions: number;
};

type ModuleUsageRow = {
  key: string;
  module: string;
  activeUsers: number;
  avgSessionMinutes: number;
  retentionRate: number;
  lastActive: string;
};

type UsageReport = {
  generatedAt: string;
  points: UsagePoint[];
  modules: ModuleUsageRow[];
};

type UsageAggregates = {
  totalUniqueUsers: number;
  activeToday: number;
  newInPeriod: number;
  modulesTouched: number;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function getAggregates(report: UsageReport | undefined): UsageAggregates {
  if (!report || report.points.length === 0) {
    return {
      totalUniqueUsers: 0,
      activeToday: 0,
      newInPeriod: 0,
      modulesTouched: 0,
    };
  }

  const points = report.points;
  const modules = report.modules;
  const lastPoint = points[points.length - 1];

  const totalUniqueUsers = Math.max(...points.map((p) => p.activeUsers));
  const newInPeriod = points.reduce((sum, p) => sum + p.newUsers, 0);
  const modulesTouched = modules.filter((m) => m.activeUsers > 0).length;

  return {
    totalUniqueUsers,
    activeToday: lastPoint?.activeUsers ?? 0,
    newInPeriod,
    modulesTouched,
  };
}

type ModuleRow = ModuleUsageRow;

const moduleColumns: ColumnsType<ModuleRow> = [
  {
    title: 'Module',
    dataIndex: 'module',
    key: 'module',
    render: (value: string) => (
      <Space size="small">
        <ProjectOutlined />
        <span>{value}</span>
      </Space>
    ),
  },
  {
    title: 'Active users',
    dataIndex: 'activeUsers',
    key: 'activeUsers',
    sorter: (a, b) => a.activeUsers - b.activeUsers,
    render: (value: number) => (
      <Space size="small">
        <UserOutlined />
        <span>{value.toLocaleString('en-US')}</span>
      </Space>
    ),
  },
  {
    title: 'Avg. session',
    dataIndex: 'avgSessionMinutes',
    key: 'avgSessionMinutes',
    sorter: (a, b) => a.avgSessionMinutes - b.avgSessionMinutes,
    render: (value: number) => `${value.toFixed(1)} min`,
  },
  {
    title: '30-day retention',
    dataIndex: 'retentionRate',
    key: 'retentionRate',
    sorter: (a, b) => a.retentionRate - b.retentionRate,
    render: (value: number) => (
      <Space size="small">
        <Progress
          type="circle"
          width={40}
          percent={value}
          size="small"
          format={(p) => `${p}%`}
        />
        <Tag color={value >= 80 ? 'green' : value >= 70 ? 'blue' : 'gold'}>
          {value >= 80 ? 'Strong' : value >= 70 ? 'Healthy' : 'Watch'}
        </Tag>
      </Space>
    ),
  },
  {
    title: 'Last active',
    dataIndex: 'lastActive',
    key: 'lastActive',
    render: (value: string) => (
      <Space size="small">
        <CalendarOutlined />
        <span>{value}</span>
      </Space>
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Main page                                                          */
/* ------------------------------------------------------------------ */

export default function ReportsUsagePage(): JSX.Element {
  const [range, setRange] = useState<TimeRangeKey>('30d');
  const [data, setData] = useState<UsageReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (nextRange: TimeRangeKey) => {
    setLoading(true);
    setError(null);

    try {
      const report = await api.get<UsageReport>(`reports/usage/?range=${nextRange}`);
      setData(report);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load usage analytics.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(range);
  }, [fetchData, range]);

  const aggregates = useMemo(
    () => getAggregates(data ?? undefined),
    [data],
  );

  const lastUpdatedLabel = data
    ? new Date(data.generatedAt).toLocaleTimeString()
    : null;

  const shellDescription =
    'Track adoption, active usage, and module-level activity across the platform.';

  const headerExtra = (
    <Space wrap>
      {lastUpdatedLabel && (
        <Tooltip title={`Last generated at ${lastUpdatedLabel}`}>
          <Badge
            status="processing"
            text={<Text type="secondary">Updated {lastUpdatedLabel}</Text>}
          />
        </Tooltip>
      )}

      <Segmented<TimeRangeKey>
        value={range}
        onChange={(val) => setRange(val as TimeRangeKey)}
        options={[
          { label: '7 days', value: '7d' },
          { label: '30 days', value: '30d' },
          { label: '90 days', value: '90d' },
        ]}
      />

      <Tooltip title="Reload usage snapshot">
        <Button
          icon={<ReloadOutlined />}
          onClick={() => void fetchData(range)}
          type="default"
          size="small"
        >
          Refresh
        </Button>
      </Tooltip>
    </Space>
  );

  if (loading && !data) {
    return (
      <ReportsPageShell
        title="Usage Analytics"
        subtitle={shellDescription}
        secondaryActions={headerExtra}
      >
        <PageContainer ghost>
          <Skeleton active />
        </PageContainer>
      </ReportsPageShell>
    );
  }

  if (error && !data) {
    return (
      <ReportsPageShell
        title="Usage Analytics"
        subtitle={shellDescription}
        secondaryActions={headerExtra}
      >
        <PageContainer ghost>
          <ProCard>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Space size="small">
                <InfoCircleOutlined />
                <Text type="danger">Unable to load usage data right now.</Text>
              </Space>

              <Text type="secondary">{error}</Text>

              <Button
                icon={<ReloadOutlined />}
                onClick={() => void fetchData(range)}
                type="primary"
              >
                Retry
              </Button>
            </Space>
          </ProCard>
        </PageContainer>
      </ReportsPageShell>
    );
  }

  if (!data) {
    return (
      <ReportsPageShell
        title="Usage Analytics"
        subtitle={shellDescription}
        secondaryActions={headerExtra}
      >
        <PageContainer ghost>
          <Empty description="No usage data available yet" />
        </PageContainer>
      </ReportsPageShell>
    );
  }

  const { totalUniqueUsers, activeToday, newInPeriod, modulesTouched } =
    aggregates;

  return (
    <ReportsPageShell
      title="Usage Analytics"
      subtitle={shellDescription}
      secondaryActions={headerExtra}
    >
      <PageContainer ghost>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {!!error && (
            <ProCard ghost>
              <Text type="warning">
                Using the last available payload. Latest refresh failed: {error}
              </Text>
            </ProCard>
          )}

          <ProCard ghost>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Title level={5} style={{ marginBottom: 0 }}>
                Overview
              </Title>
              <Text type="secondary">
                Snapshot of how many people are actively using Konnaxion, which
                modules they touch, and how this evolves over time. Data is
                aggregated from sign-ins, page views, and workspace events.
              </Text>
            </Space>
          </ProCard>

          <ProCard ghost gutter={16} wrap>
            <StatisticCard
              statistic={{
                title: (
                  <Space size={4}>
                    <TeamOutlined />
                    <span>Total unique users</span>
                  </Space>
                ),
                value: totalUniqueUsers,
                suffix: 'users',
              }}
            />
            <StatisticCard
              statistic={{
                title: (
                  <Space size={4}>
                    <UserOutlined />
                    <span>Active today</span>
                  </Space>
                ),
                value: activeToday,
                suffix: 'users',
              }}
            />
            <StatisticCard
              statistic={{
                title: (
                  <Space size={4}>
                    <UserAddOutlined />
                    <span>New in period</span>
                  </Space>
                ),
                value: newInPeriod,
                suffix: 'signups',
              }}
            />
            <StatisticCard
              statistic={{
                title: (
                  <Space size={4}>
                    <ProjectOutlined />
                    <span>Modules touched</span>
                  </Space>
                ),
                value: modulesTouched,
                suffix: '/ 5',
              }}
            />
          </ProCard>

          <ProCard gutter={16} wrap>
            <ProCard colSpan={{ xs: 24, lg: 16 }} title="Active vs New Users">
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer>
                  <LineChart data={data.points}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="activeUsers"
                      name="Active Users"
                      stroke="#1890ff"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="newUsers"
                      name="New Signups"
                      stroke="#52c41a"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ProCard>

            <ProCard colSpan={{ xs: 24, lg: 8 }} title="Highlights">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space align="start">
                  <Tag icon={<BarChartOutlined />} color="blue">
                    Concentration
                  </Tag>
                  <Text type="secondary">
                    Most activity is concentrated in the last few days of the
                    selected range. Use shorter windows (7 days) to monitor
                    spikes after launches.
                  </Text>
                </Space>

                <Space align="start">
                  <Tag icon={<UserOutlined />} color="green">
                    Engagement
                  </Tag>
                  <Text type="secondary">
                    Combine active users with retention per module to identify
                    where people stay engaged vs. where they churn quickly.
                  </Text>
                </Space>

                <Space align="start">
                  <Tag icon={<CalendarOutlined />} color="gold">
                    Seasonality
                  </Tag>
                  <Text type="secondary">
                    Expand to 90 days to detect weekly patterns, such as higher
                    usage around events or recurring workshops.
                  </Text>
                </Space>
              </Space>
            </ProCard>
          </ProCard>

          <Divider />

          <ProCard
            title={
              <Space>
                <ProjectOutlined />
                <span>Usage by module</span>
              </Space>
            }
            extra={
              <Tooltip title="Per-module usage is aggregated from backend logs.">
                <InfoCircleOutlined />
              </Tooltip>
            }
          >
            <Table<ModuleRow>
              size="middle"
              rowKey="key"
              columns={moduleColumns}
              dataSource={data.modules}
              pagination={{ pageSize: 8 }}
            />
          </ProCard>
        </Space>
      </PageContainer>
    </ReportsPageShell>
  );
}