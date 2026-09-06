// FILE: frontend/app/ethikos/decide/elite/page.tsx
'use client';

import { InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  type ProColumns,
  ProTable,
  StatisticCard,
} from '@ant-design/pro-components';
import { useInterval, useRequest } from 'ahooks';
import {
  Alert,
  Button,
  Drawer,
  Empty,
  Progress,
  Segmented,
  Space,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import React from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import {
  type EliteBallot,
  type EliteBallotResponse,
  fetchEliteBallots,
} from '@/services/decide';
import { fetchTopicPreview } from '@/services/deliberate';
import type { TopicPreviewResponse } from '@/services/ethikos';

type Row = EliteBallot & {
  id: string;
};

type ViewMode = 'all' | 'closingSoon' | 'highTurnout' | 'lowTurnout';
type Preview = TopicPreviewResponse;

const { Paragraph, Title, Text } = Typography;

const VIEW_OPTIONS: { label: string; value: ViewMode }[] = [
  { label: 'All', value: 'all' },
  { label: 'Closing ≤24h', value: 'closingSoon' },
  { label: 'High turnout', value: 'highTurnout' },
  { label: 'Low turnout', value: 'lowTurnout' },
];

function isClosingSoon(closesAt?: string): boolean {
  if (!closesAt) {
    return false;
  }

  const closes = dayjs(closesAt);

  if (!closes.isValid() || closes.isBefore(dayjs())) {
    return false;
  }

  return closes.diff(dayjs(), 'hour') <= 24;
}

function clampPercent(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatDateTime(value?: string): string {
  if (!value) {
    return 'Unknown';
  }

  const date = dayjs(value);

  if (!date.isValid()) {
    return value;
  }

  return date.format('YYYY-MM-DD HH:mm');
}

function getBallotStatus(closesAt?: string): {
  label: string;
  color?: string;
} {
  if (!closesAt) {
    return { label: 'Unknown' };
  }

  const closes = dayjs(closesAt);

  if (!closes.isValid()) {
    return { label: 'Unknown' };
  }

  if (closes.isBefore(dayjs())) {
    return { label: 'Closed' };
  }

  if (isClosingSoon(closesAt)) {
    return { label: 'Closing soon', color: 'red' };
  }

  return { label: 'Open', color: 'green' };
}

export default function EliteBallots(): JSX.Element {
  const [viewMode, setViewMode] = React.useState<ViewMode>('all');
  const [activeBallot, setActiveBallot] = React.useState<Row | null>(null);

  const {
    data,
    loading,
    error,
    refresh,
  } = useRequest<EliteBallotResponse, []>(fetchEliteBallots);

  useInterval(() => {
    refresh();
  }, 60_000);

  const ballots = React.useMemo<Row[]>(
    () =>
      (data?.ballots ?? []).map((ballot) => ({
        ...ballot,
        id: String(ballot.id),
        turnout: clampPercent(ballot.turnout),
      })),
    [data],
  );

  const {
    data: preview,
    loading: previewLoading,
    error: previewError,
    run: loadPreview,
    mutate: setPreview,
  } = useRequest<Preview, [string]>(fetchTopicPreview, {
    manual: true,
  });

  const filteredBallots = React.useMemo(() => {
    switch (viewMode) {
      case 'closingSoon':
        return ballots.filter((ballot) => isClosingSoon(ballot.closesAt));

      case 'highTurnout':
        return ballots.filter((ballot) => clampPercent(ballot.turnout) >= 60);

      case 'lowTurnout':
        return ballots.filter((ballot) => clampPercent(ballot.turnout) < 20);

      case 'all':
      default:
        return ballots;
    }
  }, [ballots, viewMode]);

  const headerStats = React.useMemo(() => {
    const total = ballots.length;

    const avgTurnout =
      total > 0
        ? Math.round(
            ballots.reduce(
              (sum, ballot) => sum + clampPercent(ballot.turnout),
              0,
            ) / total,
          )
        : 0;

    const closingSoon = ballots.filter((ballot) =>
      isClosingSoon(ballot.closesAt),
    ).length;

    return [
      { label: 'Active elite ballots', value: total },
      { label: 'Avg turnout', value: avgTurnout, suffix: '%' },
      { label: 'Closing ≤ 24h', value: closingSoon },
    ];
  }, [ballots]);

  const openPreview = React.useCallback(
    async (row: Row): Promise<void> => {
      setActiveBallot(row);
      setPreview(undefined);
      await loadPreview(row.id);
    },
    [loadPreview, setPreview],
  );

  const closePreview = React.useCallback(() => {
    setActiveBallot(null);
    setPreview(undefined);
  }, [setPreview]);

  const columns: ProColumns<Row>[] = React.useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'title',
        width: 320,
        ellipsis: true,
        render: (_dom, row) => (
          <Button
            type="link"
            onClick={() => {
              void openPreview(row);
            }}
            style={{ padding: 0 }}
          >
            {row.title}
          </Button>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'closesAt',
        width: 140,
        render: (_dom, row) => {
          const status = getBallotStatus(row.closesAt);

          return <Tag color={status.color}>{status.label}</Tag>;
        },
      },
      {
        title: 'Closes In',
        dataIndex: 'closesAt',
        width: 200,
        sorter: (a, b) =>
          dayjs(a.closesAt).valueOf() - dayjs(b.closesAt).valueOf(),
        render: (_dom, row) => {
          const closes = dayjs(row.closesAt);

          if (!closes.isValid() || closes.isBefore(dayjs())) {
            return <Text type="secondary">—</Text>;
          }

          return (
            <Statistic.Countdown
              value={closes.valueOf()}
              format="D[d] HH:mm:ss"
            />
          );
        },
      },
      {
        title: 'Turnout',
        dataIndex: 'turnout',
        width: 220,
        sorter: (a, b) => clampPercent(a.turnout) - clampPercent(b.turnout),
        render: (_dom, row) => {
          const percent = clampPercent(row.turnout);

          return (
            <Space>
              <Progress type="circle" percent={percent} width={52} />
              <Text>{percent}%</Text>
            </Space>
          );
        },
      },
      {
        title: 'Scope',
        dataIndex: 'scope',
        width: 120,
        render: (_dom, row) => <Tag color="purple">{row.scope}</Tag>,
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 240,
        render: (_dom, row) => (
          <Space>
            <Tooltip title="See the structured debate that feeds this vote">
              <Link href={`/ethikos/deliberate/${row.id}`} prefetch={false}>
                <Button size="small">View debate</Button>
              </Link>
            </Tooltip>

            <Tooltip title="View historical decisions">
              <Link href="/ethikos/decide/results" prefetch={false}>
                <Button size="small">Results archive</Button>
              </Link>
            </Tooltip>
          </Space>
        ),
      },
    ],
    [openPreview],
  );

  return (
    <EthikosPageShell
      title="Decide · Elite Ballots"
      sectionLabel="Decide"
      subtitle="Expert advisory ballots built on Ethikos debates and the canonical −3…+3 topic stance scale."
      primaryAction={
        <Link href="/ethikos/decide/methodology" prefetch={false}>
          <Button type="primary" icon={<InfoCircleOutlined />}>
            Voting methodology
          </Button>
        </Link>
      }
      secondaryActions={
        <Space>
          <Link href="/ethikos/decide/public" prefetch={false}>
            <Button>Switch to public ballots</Button>
          </Link>
        </Space>
      }
    >
      <PageContainer ghost loading={loading}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="How elite ballots work"
            description="Each elite ballot aggregates expert stances from its debate thread, maps them onto the canonical −3…+3 Ethikos stance scale, and surfaces an advisory decision signal."
          />

          {error && (
            <Alert
              type="error"
              showIcon
              message="Unable to load elite ballots."
              description="Check the Decide service and the canonical Ethikos topics endpoint."
            />
          )}

          <ProCard gutter={16} wrap>
            {headerStats.map((stat) => (
              <StatisticCard
                key={stat.label}
                colSpan={{ xs: 24, sm: 8 }}
                statistic={{
                  title: stat.label,
                  value: stat.value,
                  suffix: stat.suffix,
                }}
              />
            ))}
          </ProCard>

          {filteredBallots.length === 0 && !loading ? (
            <Empty description="No elite ballots are open right now." />
          ) : (
            <ProTable<Row>
              rowKey="id"
              columns={columns}
              dataSource={filteredBallots}
              pagination={{ pageSize: 8 }}
              search={false}
              options={false}
              toolBarRender={() => [
                <Segmented<ViewMode>
                  key="view"
                  size="small"
                  value={viewMode}
                  onChange={setViewMode}
                  options={VIEW_OPTIONS}
                />,
                <Button
                  key="refresh"
                  icon={<ReloadOutlined />}
                  onClick={() => refresh()}
                  loading={loading}
                >
                  Refresh
                </Button>,
              ]}
            />
          )}

          <Drawer
            width={520}
            open={!!activeBallot}
            onClose={closePreview}
            destroyOnClose
            title={preview?.title || activeBallot?.title || 'Ballot details'}
          >
            {previewLoading ? (
              <Empty description="Loading preview…" />
            ) : previewError ? (
              <Empty description="Unable to load preview." />
            ) : preview ? (
              <Space
                direction="vertical"
                size="middle"
                style={{ width: '100%' }}
              >
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {preview.category ? `${preview.category} · ` : ''}
                  {formatDateTime(preview.createdAt)}
                </Paragraph>

                {preview.description && (
                  <Paragraph style={{ marginBottom: 0 }}>
                    {preview.description}
                  </Paragraph>
                )}

                <div>
                  <Title level={4} style={{ marginTop: 0 }}>
                    Latest statements
                  </Title>

                  {preview.latest.length > 0 ? (
                    <ul style={{ paddingLeft: 16, marginBottom: 0 }}>
                      {preview.latest.map((statement) => (
                        <li key={statement.id} style={{ marginBottom: 8 }}>
                          <Text strong>{statement.author}</Text> —{' '}
                          {statement.body}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No statements yet."
                    />
                  )}
                </div>

                <Link
                  href={`/ethikos/deliberate/${preview.id}`}
                  prefetch={false}
                >
                  <Button type="primary">Go to full thread</Button>
                </Link>
              </Space>
            ) : activeBallot ? (
              <Space
                direction="vertical"
                size="middle"
                style={{ width: '100%' }}
              >
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Preview metadata is unavailable, but the debate can still be
                  opened from the canonical Ethikos route.
                </Paragraph>

                <Link
                  href={`/ethikos/deliberate/${activeBallot.id}`}
                  prefetch={false}
                >
                  <Button type="primary">Go to full thread</Button>
                </Link>
              </Space>
            ) : (
              <Empty description="No preview available." />
            )}
          </Drawer>
        </Space>
      </PageContainer>
    </EthikosPageShell>
  );
}