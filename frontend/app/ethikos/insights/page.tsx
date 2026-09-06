
// FILE: frontend/app/ethikos/insights/page.tsx
// app/ethikos/insights/page.tsx
'use client';

import {
  ArrowRightOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ColumnWidthOutlined,
  DashboardOutlined,
  FilterOutlined,
  LineChartOutlined,
  RadarChartOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  SyncOutlined,
  TrophyOutlined,
  WarningOutlined,
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
  DatePicker,
  Divider,
  Empty,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import React, { useMemo, useState } from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import ChartCard from '@/components/charts/ChartCard';
import {
  type DecisionResult,
  type DecisionScope,
  fetchDecisionResults,
} from '@/services/decide';
import { fetchImpactOutcomes } from '@/services/impact';
import {
  fetchPulseHealth,
  fetchPulseLiveData,
  fetchPulseOverview,
} from '@/services/pulse';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text, Paragraph } = Typography;

type RangeValue = [Dayjs | null, Dayjs | null] | null;

type PulseOverviewData = Awaited<ReturnType<typeof fetchPulseOverview>>;
type PulseHealthData = Awaited<ReturnType<typeof fetchPulseHealth>>;
type PulseLiveData = Awaited<ReturnType<typeof fetchPulseLiveData>>;
type ImpactOutcomesData = Awaited<ReturnType<typeof fetchImpactOutcomes>>;
type DecisionsData = Awaited<ReturnType<typeof fetchDecisionResults>>;

type EthikosOverviewData = {
  overview?: PulseOverviewData;
  health?: PulseHealthData;
  live?: PulseLiveData;
  outcomes?: ImpactOutcomesData;
  decisions?: DecisionsData;
  errors: string[];
};

type SafeLoadResult<T> = {
  data?: T;
  error?: string;
};

type DecisionRow = DecisionResult & { key: string };

type WorkflowCard = {
  title: string;
  description: string;
  href: string;
  action: string;
  icon: React.ReactNode;
};

async function safeLoad<T>(
  label: string,
  loader: () => Promise<T>,
): Promise<SafeLoadResult<T>> {
  try {
    return {
      data: await loader(),
    };
  } catch (error) {
    return {
      error: `${label}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function fetchEthikosOverview(): Promise<EthikosOverviewData> {
  const [overview, health, live, outcomes, decisions] = await Promise.all([
    safeLoad('Pulse overview', fetchPulseOverview),
    safeLoad('Pulse health', fetchPulseHealth),
    safeLoad('Live activity', fetchPulseLiveData),
    safeLoad('Impact outcomes', fetchImpactOutcomes),
    safeLoad('Decision results', fetchDecisionResults),
  ]);

  return {
    overview: overview.data,
    health: health.data,
    live: live.data,
    outcomes: outcomes.data,
    decisions: decisions.data,
    errors: [
      overview.error,
      health.error,
      live.error,
      outcomes.error,
      decisions.error,
    ].filter((message): message is string => Boolean(message)),
  };
}

function formatTrendStatus(trend?: number): 'success' | 'error' | 'default' {
  if (typeof trend !== 'number') {
    return 'default';
  }

  if (trend > 0) {
    return 'success';
  }

  if (trend < 0) {
    return 'error';
  }

  return 'default';
}

function formatDate(value?: string): string {
  if (!value) {
    return 'Unknown';
  }

  const parsed = dayjs(value);

  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : 'Unknown';
}

function route(path: string): string {
  return `${path}${path.includes('?') ? '&' : '?'}sidebar=ethikos`;
}

export default function EthikosOverviewPage(): JSX.Element {
  const [timeRange, setTimeRange] = useState<RangeValue>(() => [
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [scopeFilter, setScopeFilter] = useState<'all' | DecisionScope>('all');
  const [regionFilter, setRegionFilter] = useState<string | 'all'>('all');

  const { data, loading, error, refresh } =
    useRequest<EthikosOverviewData, []>(fetchEthikosOverview);

  const overview = data?.overview;
  const health = data?.health;
  const live = data?.live;
  const outcomes = data?.outcomes;
  const decisions = data?.decisions;

  const decisionItems = decisions?.items ?? [];
  const liveCounters = live?.counters ?? [];
  const outcomeKpis = outcomes?.kpis ?? [];
  const overviewKpis = overview?.kpis ?? [];

  const [start, end] = timeRange ?? [];

  const lastUpdated = data
    ? dayjs(
        overview?.refreshedAt ??
          health?.refreshedAt ??
          new Date().toISOString(),
      ).format('HH:mm:ss')
    : null;

  const agreementKpi = outcomeKpis.find((kpi) => kpi.key === 'agreement');
  const topicsKpi = outcomeKpis.find((kpi) => kpi.key === 'topics');
  const stancesKpi = outcomeKpis.find((kpi) => kpi.key === 'stances');
  const openKpi = outcomeKpis.find((kpi) => kpi.key === 'open');

  const allRegions = useMemo(
    () =>
      Array.from(
        new Set(
          decisionItems
            .map((decision) => decision.region)
            .filter((region): region is string => Boolean(region)),
        ),
      ),
    [decisionItems],
  );

  const filteredDecisions: DecisionRow[] = useMemo(
    () =>
      decisionItems
        .filter((decision) => {
          if (scopeFilter !== 'all' && decision.scope !== scopeFilter) {
            return false;
          }

          if (
            regionFilter !== 'all' &&
            (decision.region ?? 'Unspecified') !== regionFilter
          ) {
            return false;
          }

          if (start && end) {
            const closedTs = dayjs(decision.closesAt).valueOf();
            const startTs = start.startOf('day').valueOf();
            const endTs = end.endOf('day').valueOf();

            if (!Number.isFinite(closedTs)) {
              return false;
            }

            if (closedTs < startTs || closedTs > endTs) {
              return false;
            }
          }

          return true;
        })
        .map((decision) => ({
          ...decision,
          key: decision.id,
        })),
    [decisionItems, end, regionFilter, scopeFilter, start],
  );

  const recentDecisions = filteredDecisions.slice(0, 6);

  const workflowCards: WorkflowCard[] = [
    {
      title: 'Deliberate',
      description: 'Open a topic, inspect the argument thread, and contribute a position.',
      href: route('/ethikos/deliberate/elite'),
      action: 'Open topics',
      icon: <StarOutlined />,
    },
    {
      title: 'Decide',
      description: 'Review public consultations or expert decisions and cast a vote.',
      href: route('/ethikos/decide/public'),
      action: 'Vote now',
      icon: <SafetyCertificateOutlined />,
    },
    {
      title: 'Track impact',
      description: 'Follow outcomes and implementation progress after decisions.',
      href: route('/ethikos/impact/tracker'),
      action: 'Track impact',
      icon: <RadarChartOutlined />,
    },
    {
      title: 'Monitor pulse',
      description: 'Check live participation, debate health, and trend signals.',
      href: route('/ethikos/pulse/live'),
      action: 'View pulse',
      icon: <ColumnWidthOutlined />,
    },
  ];

  const decisionsColumns: ColumnsType<DecisionRow> = [
    {
      title: 'Decision',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Result',
      dataIndex: 'passed',
      key: 'passed',
      width: 110,
      render: (_passed: boolean, row) => (
        <Tag color={row.passed ? 'green' : 'red'}>
          {row.passed ? 'PASSED' : 'REJECTED'}
        </Tag>
      ),
    },
    {
      title: 'Scope',
      dataIndex: 'scope',
      key: 'scope',
      width: 110,
      render: (_scope: DecisionScope, row) => (
        <Tag color={row.scope === 'Elite' ? 'geekblue' : 'default'}>
          {row.scope}
        </Tag>
      ),
    },
    {
      title: 'Closed',
      dataIndex: 'closesAt',
      key: 'closesAt',
      width: 130,
      render: (_value: string, row) => formatDate(row.closesAt),
    },
  ];

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
        icon={<SyncOutlined />}
        onClick={() => refresh()}
        size="small"
        type="text"
        loading={loading}
      />
    </Space>
  );

  const shellProps = {
    title: 'Ethikos overview',
    subtitle:
      'Your current deliberation, decision, trust, pulse, and impact snapshot.',
    sectionLabel: 'Overview',
    secondaryActions,
  } as const;

  if (loading && !data) {
    return (
      <EthikosPageShell {...shellProps}>
        <PageContainer ghost>
          <Skeleton active />
        </PageContainer>
      </EthikosPageShell>
    );
  }

  if (error) {
    return (
      <EthikosPageShell {...shellProps}>
        <PageContainer ghost>
          <Empty
            description="Failed to load Ethikos overview"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              icon={<SyncOutlined />}
              onClick={() => refresh()}
              type="primary"
            >
              Retry
            </Button>
          </Empty>
        </PageContainer>
      </EthikosPageShell>
    );
  }

  const hasAnyData =
    overviewKpis.length > 0 ||
    liveCounters.length > 0 ||
    outcomeKpis.length > 0 ||
    decisionItems.length > 0;

  if (!hasAnyData) {
    return (
      <EthikosPageShell {...shellProps}>
        <PageContainer ghost>
          <Empty description="No Ethikos overview data available yet" />
        </PageContainer>
      </EthikosPageShell>
    );
  }

  return (
    <EthikosPageShell {...shellProps}>
      <PageContainer ghost>
        {data?.errors.length ? (
          <Alert
            showIcon
            type="warning"
            style={{ marginBottom: 16 }}
            message="Some overview sections could not be refreshed"
            description={
              <Space direction="vertical" size={2}>
                {data.errors.map((message) => (
                  <Text key={message} type="secondary">
                    {message}
                  </Text>
                ))}
              </Space>
            }
          />
        ) : null}

        <ProCard
          title={
            <Space>
              <DashboardOutlined />
              <span>Where to start</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <ProCard gutter={[16, 16]} wrap ghost>
            {workflowCards.map((item) => (
              <ProCard
                key={item.title}
                colSpan={{ xs: 24, md: 12, xl: 6 }}
                bordered
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Space>
                    {item.icon}
                    <Text strong>{item.title}</Text>
                  </Space>

                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    {item.description}
                  </Paragraph>

                  <Button href={item.href} type="primary" icon={<ArrowRightOutlined />}>
                    {item.action}
                  </Button>
                </Space>
              </ProCard>
            ))}
          </ProCard>
        </ProCard>

        <ProCard
          title="Current snapshot"
          gutter={[16, 16]}
          wrap
          style={{ marginBottom: 16 }}
        >
          {overviewKpis.length > 0 ? (
            overviewKpis.slice(0, 4).map((kpi) => (
              <StatisticCard
                key={kpi.key ?? kpi.label}
                colSpan={{ xs: 24, sm: 12, lg: 6 }}
                statistic={{
                  title: kpi.label,
                  value: kpi.value,
                  description:
                    typeof kpi.delta === 'number' ? (
                      <span
                        style={{
                          color: kpi.delta >= 0 ? '#3f8600' : '#cf1322',
                        }}
                      >
                        {kpi.delta >= 0 ? '▲' : '▼'} {Math.abs(kpi.delta)}%
                      </span>
                    ) : null,
                }}
              />
            ))
          ) : (
            <ProCard>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No KPI snapshot available yet"
              />
            </ProCard>
          )}
        </ProCard>

        <ProCard gutter={[16, 16]} wrap style={{ marginBottom: 16 }}>
          <ProCard
            colSpan={{ xs: 24, xl: 8 }}
            title={
              <Space>
                <WarningOutlined />
                <span>Needs attention</span>
              </Space>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <StatisticCard
                statistic={{
                  title: 'Open debates',
                  value: openKpi?.value ?? 0,
                  description: 'Topics still available for participation',
                }}
              />

              <StatisticCard
                statistic={{
                  title: 'Total stances',
                  value: stancesKpi?.value ?? 0,
                  description: 'Participation volume across Ethikos',
                }}
              />

              <Button href={route('/ethikos/deliberate/elite')} block>
                Review open topics
              </Button>
            </Space>
          </ProCard>

          <ProCard
            colSpan={{ xs: 24, xl: 8 }}
            title={
              <Space>
                <CheckCircleOutlined />
                <span>Decision health</span>
              </Space>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <StatisticCard
                statistic={{
                  title: 'Tracked topics',
                  value: topicsKpi?.value ?? 0,
                  description: 'Topics included in outcome tracking',
                }}
              />

              <StatisticCard
                statistic={{
                  title: 'Average agreement',
                  value: agreementKpi?.value ?? 0,
                  suffix: '%',
                  description: 'Derived from topic-level Ethikos stances',
                }}
              />

              <Button href={route('/ethikos/decide/results')} block>
                Review results
              </Button>
            </Space>
          </ProCard>

          <ProCard
            colSpan={{ xs: 24, xl: 8 }}
            title={
              <Space>
                <LineChartOutlined />
                <span>Live activity</span>
              </Space>
            }
          >
            {liveCounters.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No live counters available yet"
              />
            ) : (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {liveCounters.slice(0, 3).map((counter) => (
                  <StatisticCard
                    key={counter.label}
                    statistic={{
                      title: (
                        <Space>
                          {counter.label}
                          <Badge status={formatTrendStatus(counter.trend)} />
                        </Space>
                      ),
                      value: counter.value,
                      precision: 0,
                    }}
                    chart={
                      <ChartCard
                        type="line"
                        data={counter.history.map((point) => ({
                          x: point.x,
                          y: point.y,
                        }))}
                        height={44}
                        axis={{ x: false, y: false }}
                        padding={0}
                        legend={false}
                      />
                    }
                  />
                ))}

                <Button href={route('/ethikos/pulse/live')} block>
                  Open live pulse
                </Button>
              </Space>
            )}
          </ProCard>
        </ProCard>

        <ProCard
          title={
            <Space>
              <FilterOutlined />
              <span>Recent decisions</span>
            </Space>
          }
          extra={
            <Text type="secondary">
              Showing {recentDecisions.length} / {decisionItems.length}
            </Text>
          }
          style={{ marginBottom: 16 }}
        >
          <Space wrap align="center" style={{ marginBottom: 16 }}>
            <Space size="small">
              <Text type="secondary">Time window</Text>
              <RangePicker
                allowEmpty={[true, true]}
                value={timeRange ?? undefined}
                onChange={(range) => setTimeRange(range as RangeValue)}
              />
            </Space>

            <Space size="small">
              <Text type="secondary">Scope</Text>
              <Select<'all' | DecisionScope>
                style={{ minWidth: 140 }}
                value={scopeFilter}
                onChange={(value) => setScopeFilter(value)}
              >
                <Option value="all">All</Option>
                <Option value="Elite">Expert</Option>
                <Option value="Public">Public</Option>
              </Select>
            </Space>

            <Space size="small">
              <Text type="secondary">Region</Text>
              <Select<string | 'all'>
                style={{ minWidth: 160 }}
                value={regionFilter}
                onChange={(value) => setRegionFilter(value)}
              >
                <Option value="all">All regions</Option>
                {allRegions.map((region) => (
                  <Option key={region} value={region}>
                    {region}
                  </Option>
                ))}
              </Select>
            </Space>
          </Space>

          {recentDecisions.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No decisions match the current filters"
            />
          ) : (
            <Table<DecisionRow>
              size="small"
              columns={decisionsColumns}
              dataSource={recentDecisions}
              pagination={false}
              rowKey="key"
            />
          )}

          <Divider />

          <Space wrap>
            <Button href={route('/ethikos/decide/results')}>
              Open full results
            </Button>
            <Button href={route('/ethikos/impact/outcomes')}>
              View outcomes
            </Button>
            <Button href={route('/ethikos/impact/tracker')}>
              Track implementation
            </Button>
          </Space>
        </ProCard>

        <ProCard
          title="Deep-dive areas"
          gutter={[16, 16]}
          wrap
        >
          <ProCard
            colSpan={{ xs: 24, md: 12, xl: 6 }}
            bordered
            title={
              <Space>
                <ColumnWidthOutlined />
                <span>Pulse</span>
              </Space>
            }
          >
            <Paragraph type="secondary">
              Live activity, debate health, trends, and participation monitoring.
            </Paragraph>
            <Button href={route('/ethikos/pulse/overview')}>
              Open pulse overview
            </Button>
          </ProCard>

          <ProCard
            colSpan={{ xs: 24, md: 12, xl: 6 }}
            bordered
            title={
              <Space>
                <RadarChartOutlined />
                <span>Impact</span>
              </Space>
            }
          >
            <Paragraph type="secondary">
              Outcomes, feedback, and implementation tracking after decisions.
            </Paragraph>
            <Button href={route('/ethikos/impact/tracker')}>
              Open impact tracker
            </Button>
          </ProCard>

          <ProCard
            colSpan={{ xs: 24, md: 12, xl: 6 }}
            bordered
            title={
              <Space>
                <TrophyOutlined />
                <span>Trust</span>
              </Space>
            }
          >
            <Paragraph type="secondary">
              Profile credibility, badges, and credentials for deliberation trust.
            </Paragraph>
            <Button href={route('/ethikos/trust/profile')}>
              Open trust profile
            </Button>
          </ProCard>

          <ProCard
            colSpan={{ xs: 24, md: 12, xl: 6 }}
            bordered
            title={
              <Space>
                <BranchesOutlined />
                <span>Learn</span>
              </Space>
            }
          >
            <Paragraph type="secondary">
              Guides, glossary, and changelog for using Ethikos responsibly.
            </Paragraph>
            <Button href={route('/ethikos/learn/guides')}>
              Open guides
            </Button>
          </ProCard>
        </ProCard>
      </PageContainer>
    </EthikosPageShell>
  );
}
