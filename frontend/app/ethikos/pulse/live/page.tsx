// FILE: frontend/app/ethikos/pulse/live/page.tsx
'use client';

import {
  ClockCircleOutlined,
  FireOutlined,
  MessageOutlined,
  ProfileOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  type ProColumns,
  ProTable,
  StatisticCard,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Alert,
  Badge,
  Button,
  Empty,
  List,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import ChartCard from '@/components/charts/ChartCard';
import { get } from '@/services/_request';
import type { EthikosId, StanceValue, TopicStatus } from '@/services/ethikos';
import {
  fetchPulseLiveData,
  type LiveCounter,
  type PulseChartPoint,
} from '@/services/pulse';

dayjs.extend(relativeTime);

const { Text } = Typography;

/* ------------------------------------------------------------------ */
/*  Minimal API DTOs                                                   */
/* ------------------------------------------------------------------ */

type UnknownRecord = Record<string, unknown>;

type ApiListResponse<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
  items?: T[];
  data?: T[] | ApiListResponse<T>;
};

type ApiMaybeList<T> = T[] | ApiListResponse<T>;

type EthikosTopicApi = {
  id: EthikosId;
  title: string;
  status: TopicStatus;
  created_at: string;
  last_activity?: string | null;
};

type EthikosStanceApi = {
  id: EthikosId;
  topic: EthikosId;
  value: StanceValue;
  timestamp: string;
};

type EthikosArgumentApi = {
  id: EthikosId;
  topic: EthikosId;
  user?: string | EthikosId | null;
  user_display?: string | null;
  content: string;
  created_at: string;
};

type PulseLivePayload = {
  counters: LiveCounter[];
};

type LoosePulseChartPoint = PulseChartPoint & {
  ts?: string | number | Date;
  date?: string | number | Date;
  value?: string | number;
  count?: string | number;
};

/* ------------------------------------------------------------------ */
/*  Feed types                                                         */
/* ------------------------------------------------------------------ */

type FeedItem =
  | {
      id: string;
      ts: string;
      kind: 'topic';
      topicId: EthikosId;
      title: string;
      summary: string;
    }
  | {
      id: string;
      ts: string;
      kind: 'stance';
      topicId: EthikosId;
      title: string;
      summary: string;
      extra: { value: StanceValue };
    }
  | {
      id: string;
      ts: string;
      kind: 'argument';
      topicId: EthikosId;
      title: string;
      summary: string;
    };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function truncate(value: string, max = 100): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function normalizeList<T>(raw: ApiMaybeList<T> | undefined | null): T[] {
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw;
  }

  if (Array.isArray(raw.results)) {
    return raw.results;
  }

  if (Array.isArray(raw.items)) {
    return raw.items;
  }

  if (Array.isArray(raw.data)) {
    return raw.data;
  }

  if (raw.data && !Array.isArray(raw.data)) {
    return normalizeList(raw.data);
  }

  return [];
}

function toMapKey(value: EthikosId): string {
  return String(value);
}

function toDateValue(value?: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = dayjs(value);

  return parsed.isValid() ? parsed.valueOf() : 0;
}

function formatAuthor(argument: EthikosArgumentApi): string {
  if (argument.user_display) {
    return argument.user_display;
  }

  if (typeof argument.user === 'string' && argument.user.trim().length > 0) {
    return argument.user;
  }

  if (typeof argument.user === 'number') {
    return `User #${argument.user}`;
  }

  return 'Someone';
}

function normalizeChartX(
  value: string | number | Date | undefined,
  fallback: number,
): string | number {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return fallback;
}

function normalizeChartY(value: string | number | undefined): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function normalizeCounterHistory(counter: LiveCounter): PulseChartPoint[] {
  return (counter.history ?? []).map((point, index) => {
    if (!isRecord(point)) {
      return {
        x: index,
        y: 0,
      };
    }

    const loosePoint = point as LoosePulseChartPoint;

    return {
      x: normalizeChartX(
        loosePoint.x ?? loosePoint.ts ?? loosePoint.date,
        index,
      ),
      y: normalizeChartY(loosePoint.y ?? loosePoint.value ?? loosePoint.count),
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Local data loaders                                                 */
/* ------------------------------------------------------------------ */

async function fetchRecentActivity(): Promise<FeedItem[]> {
  const [topicsRaw, stancesRaw, argsRaw] = await Promise.all([
    get<ApiMaybeList<EthikosTopicApi>>('ethikos/topics/'),
    get<ApiMaybeList<EthikosStanceApi>>('ethikos/stances/'),
    get<ApiMaybeList<EthikosArgumentApi>>('ethikos/arguments/'),
  ]);

  const topics = normalizeList(topicsRaw);
  const stances = normalizeList(stancesRaw);
  const args = normalizeList(argsRaw);

  const topicById = new Map<string, EthikosTopicApi>(
    topics.map((topic) => [toMapKey(topic.id), topic]),
  );

  const topicItems: FeedItem[] = topics.map((topic) => ({
    id: `topic-${topic.id}-${topic.created_at}`,
    ts: topic.created_at,
    kind: 'topic',
    topicId: topic.id,
    title: topic.title,
    summary:
      topic.status === 'open'
        ? 'New debate created'
        : `Debate status changed to ${topic.status}`,
  }));

  const stanceItems: FeedItem[] = stances.map((stance) => ({
    id: `stance-${stance.id}`,
    ts: stance.timestamp,
    kind: 'stance',
    topicId: stance.topic,
    title:
      topicById.get(toMapKey(stance.topic))?.title ??
      `Topic #${String(stance.topic)}`,
    summary: `New stance submitted: ${stance.value >= 0 ? '+' : ''}${
      stance.value
    }`,
    extra: { value: stance.value },
  }));

  const argumentItems: FeedItem[] = args.map((argument) => ({
    id: `arg-${argument.id}`,
    ts: argument.created_at,
    kind: 'argument',
    topicId: argument.topic,
    title:
      topicById.get(toMapKey(argument.topic))?.title ??
      `Topic #${String(argument.topic)}`,
    summary: `${formatAuthor(argument)} commented: ${truncate(
      argument.content,
      120,
    )}`,
  }));

  return [...topicItems, ...stanceItems, ...argumentItems]
    .sort((a, b) => toDateValue(b.ts) - toDateValue(a.ts))
    .slice(0, 20);
}

async function fetchOpenTopics(): Promise<EthikosTopicApi[]> {
  const topicsRaw = await get<ApiMaybeList<EthikosTopicApi>>('ethikos/topics/');
  const topics = normalizeList(topicsRaw);

  return topics
    .filter((topic) => topic.status === 'open')
    .sort(
      (a, b) =>
        toDateValue(b.last_activity ?? b.created_at) -
        toDateValue(a.last_activity ?? a.created_at),
    );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function PulseLive(): JSX.Element {
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);

  const liveReq = useRequest<PulseLivePayload, []>(fetchPulseLiveData, {
    pollingInterval: autoRefresh ? 20_000 : undefined,
    onSuccess: () => setLastUpdated(dayjs().format('HH:mm:ss')),
  });

  const feedReq = useRequest<FeedItem[], []>(fetchRecentActivity, {
    pollingInterval: autoRefresh ? 20_000 : undefined,
  });

  const openReq = useRequest<EthikosTopicApi[], []>(fetchOpenTopics, {
    pollingInterval: autoRefresh ? 30_000 : undefined,
  });

  const refreshAll = React.useCallback(() => {
    void liveReq.refresh();
    void feedReq.refresh();
    void openReq.refresh();
  }, [feedReq, liveReq, openReq]);

  const counters = liveReq.data?.counters ?? [];

  const openColumns = React.useMemo<ProColumns<EthikosTopicApi>[]>(() => {
    return [
      {
        title: 'Debate',
        dataIndex: 'title',
        ellipsis: true,
        render: (_dom, row) => (
          <Space size="small">
            <FireOutlined />
            <a href={`/ethikos/deliberate/${row.id}`}>{row.title}</a>
          </Space>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 120,
        render: (_dom, row) =>
          row.status === 'open' ? (
            <Tag color="green">Open</Tag>
          ) : (
            <Tag>{row.status}</Tag>
          ),
      },
      {
        title: 'Last activity',
        dataIndex: 'last_activity',
        width: 180,
        render: (_dom, row) => {
          const value = row.last_activity ?? row.created_at;

          return (
            <Tooltip title={dayjs(value).format('YYYY-MM-DD HH:mm')}>
              {dayjs(value).fromNow()}
            </Tooltip>
          );
        },
      },
      {
        title: 'Created',
        dataIndex: 'created_at',
        width: 160,
        render: (_dom, row) => (
          <Tooltip title={dayjs(row.created_at).format('YYYY-MM-DD HH:mm')}>
            {dayjs(row.created_at).fromNow()}
          </Tooltip>
        ),
      },
    ];
  }, []);

  const secondaryActions = (
    <Space wrap>
      {lastUpdated && (
        <Badge
          count={
            <Tooltip title={`Last refreshed at ${lastUpdated}`}>
              <ClockCircleOutlined style={{ color: '#52c41a' }} />
            </Tooltip>
          }
        />
      )}

      <Space size="small" align="center">
        <ThunderboltOutlined />
        <Text>Auto-refresh</Text>
        <Switch
          checked={autoRefresh}
          onChange={(checked) => setAutoRefresh(checked)}
          size="small"
        />
      </Space>

      <Button
        icon={<SyncOutlined />}
        onClick={refreshAll}
        size="small"
        loading={liveReq.loading || feedReq.loading || openReq.loading}
      >
        Refresh
      </Button>
    </Space>
  );

  const primaryAction = (
    <Button href="/ethikos/pulse/trends" type="primary">
      View opinion trends
    </Button>
  );

  return (
    <EthikosPageShell
      title="Pulse · Live participation"
      sectionLabel="Pulse"
      subtitle="Real-time counters, latest activity, and currently open debates."
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
    >
      <PageContainer ghost loading={liveReq.loading && counters.length === 0}>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Live view"
          description="This page auto-refreshes every 20 seconds while enabled. Use manual Refresh if needed."
        />

        {liveReq.error && (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            message="Unable to load live Pulse counters."
            description="The live Pulse service may be temporarily unavailable. Try refreshing the page."
          />
        )}

        <ProCard gutter={16} wrap>
          {counters.length === 0 && !liveReq.loading ? (
            <ProCard>
              <Empty description="No live counters available yet" />
            </ProCard>
          ) : (
            counters.map((counter) => {
              const trend = counter.trend ?? 0;
              const chartData = normalizeCounterHistory(counter);

              return (
                <StatisticCard
                  key={counter.label}
                  colSpan={{ xs: 24, sm: 12, md: 12, lg: 6 }}
                  statistic={{
                    title: (
                      <Space>
                        {counter.label}
                        <Badge
                          status={
                            trend > 0
                              ? 'success'
                              : trend < 0
                                ? 'error'
                                : 'default'
                          }
                        />
                      </Space>
                    ),
                    value: counter.value,
                    precision: 0,
                  }}
                  chart={
                    <ChartCard type="line" height={50} data={chartData} />
                  }
                />
              );
            })
          )}
        </ProCard>

        <ProCard gutter={[16, 16]} wrap style={{ marginTop: 16 }}>
          <ProCard
            colSpan={{ xs: 24, xl: 16 }}
            title={
              <Space>
                <MessageOutlined />
                <span>Live activity</span>
              </Space>
            }
            extra={
              <Text type="secondary">
                Latest 20 items across debates, stances, and comments
              </Text>
            }
            loading={feedReq.loading && !feedReq.data}
          >
            {feedReq.error && (
              <Alert
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
                message="Unable to load recent activity."
              />
            )}

            {feedReq.data && feedReq.data.length === 0 ? (
              <Empty description="No recent activity yet" />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={feedReq.data ?? []}
                renderItem={(item) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      avatar={
                        item.kind === 'topic' ? (
                          <ProfileOutlined />
                        ) : item.kind === 'stance' ? (
                          <Tag color={item.extra.value >= 0 ? 'green' : 'red'}>
                            {item.extra.value >= 0 ? '+' : ''}
                            {item.extra.value}
                          </Tag>
                        ) : (
                          <MessageOutlined />
                        )
                      }
                      title={
                        <Space size="small" wrap>
                          <a href={`/ethikos/deliberate/${item.topicId}`}>
                            {item.title}
                          </a>
                          <Tag
                            color={
                              item.kind === 'topic'
                                ? 'blue'
                                : item.kind === 'stance'
                                  ? 'purple'
                                  : 'cyan'
                            }
                          >
                            {item.kind}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space size="small" wrap>
                          <span>{item.summary}</span>
                          <Text type="secondary">
                            · {dayjs(item.ts).fromNow()}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </ProCard>

          <ProCard
            colSpan={{ xs: 24, xl: 8 }}
            title={
              <Space>
                <FireOutlined />
                <span>Open debates</span>
              </Space>
            }
            loading={openReq.loading && !openReq.data}
          >
            {openReq.error && (
              <Alert
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
                message="Unable to load open debates."
              />
            )}

            {openReq.data && openReq.data.length === 0 ? (
              <Empty description="No open debates at the moment" />
            ) : (
              <ProTable<EthikosTopicApi>
                rowKey={(row) => String(row.id)}
                columns={openColumns}
                dataSource={openReq.data ?? []}
                pagination={{ pageSize: 6 }}
                search={false}
                size="small"
                toolBarRender={false}
              />
            )}
          </ProCard>
        </ProCard>
      </PageContainer>
    </EthikosPageShell>
  );
}