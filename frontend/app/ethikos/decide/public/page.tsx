// FILE: frontend/app/ethikos/decide/public/page.tsx
'use client';

import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  ProTable,
  StatisticCard,
} from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useInterval, useRequest } from 'ahooks';
import {
  Alert,
  App,
  Button,
  Empty,
  Input,
  Progress,
  Radio,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { RadioChangeEvent } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import React, { useCallback, useMemo, useState } from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import {
  fetchPublicBallots,
  type PublicBallot,
  type PublicBallotResponse,
  submitPublicVote,
} from '@/services/decide';

const { Paragraph, Text } = Typography;

type BallotRow = PublicBallot;
type QuickFilter = 'all' | 'closing-soon' | 'high-turnout';
type SelectionMap = Record<string, string | undefined>;

const DEFAULT_SCALE_OPTIONS = [
  'Strongly disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly agree',
] as const;

const PAGE_SIZE = 8;
const CLOSING_SOON_HOURS = 48;
const HIGH_TURNOUT_THRESHOLD = 50;

function resolveOptions(ballot: BallotRow): string[] {
  if (Array.isArray(ballot.options) && ballot.options.length > 0) {
    const cleaned = ballot.options
      .map((option) => option.trim())
      .filter((option) => option.length > 0);

    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  return [...DEFAULT_SCALE_OPTIONS];
}

function isClosingSoon(closesAt?: string | null): boolean {
  if (!closesAt) {
    return false;
  }

  const closes = dayjs(closesAt);

  if (!closes.isValid() || closes.isBefore(dayjs())) {
    return false;
  }

  return closes.diff(dayjs(), 'hour') <= CLOSING_SOON_HOURS;
}

function formatCloseDate(closesAt?: string | null): string {
  if (!closesAt) {
    return 'Date unavailable';
  }

  const closes = dayjs(closesAt);

  return closes.isValid() ? closes.format('YYYY-MM-DD HH:mm') : 'Date unavailable';
}

function turnoutPercent(turnout?: number | null): number {
  if (typeof turnout !== 'number' || Number.isNaN(turnout)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(turnout)));
}

function ballotStatus(ballot: BallotRow): {
  label: string;
  color?: string;
  icon?: React.ReactNode;
} {
  if (isClosingSoon(ballot.closesAt)) {
    return {
      label: 'Closing soon',
      color: 'volcano',
      icon: <ClockCircleOutlined />,
    };
  }

  return {
    label: 'Open',
    color: 'green',
    icon: <CheckCircleOutlined />,
  };
}

export default function PublicVotingPage(): JSX.Element {
  const { message } = App.useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [selectedOptions, setSelectedOptions] = useState<SelectionMap>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const { data, loading, refresh } = useRequest<PublicBallotResponse, []>(
    fetchPublicBallots,
  );

  useInterval(refresh, 60_000);

  const ballots = useMemo<BallotRow[]>(() => data?.ballots ?? [], [data]);

  const headerStats = useMemo(() => {
    const total = ballots.length;

    const avgTurnout =
      total > 0
        ? Math.round(
            ballots.reduce(
              (sum, ballot) => sum + turnoutPercent(ballot.turnout),
              0,
            ) / total,
          )
        : 0;

    const closingSoon = ballots.filter((ballot) =>
      isClosingSoon(ballot.closesAt),
    ).length;

    const highParticipation = ballots.filter(
      (ballot) => turnoutPercent(ballot.turnout) >= HIGH_TURNOUT_THRESHOLD,
    ).length;

    return [
      { label: 'Open consultations', value: total },
      { label: 'Average participation', value: avgTurnout, suffix: '%' },
      { label: 'Closing soon', value: closingSoon },
      { label: 'High participation', value: highParticipation },
    ];
  }, [ballots]);

  const filteredBallots = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return ballots.filter((ballot) => {
      const title = ballot.title ?? '';

      if (
        normalizedSearch &&
        !title.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      if (quickFilter === 'closing-soon') {
        return isClosingSoon(ballot.closesAt);
      }

      if (quickFilter === 'high-turnout') {
        return turnoutPercent(ballot.turnout) >= HIGH_TURNOUT_THRESHOLD;
      }

      return true;
    });
  }, [ballots, quickFilter, searchTerm]);

  const handleRadioChange = useCallback((id: string, event: RadioChangeEvent) => {
    const value = String(event.target.value);

    setSelectedOptions((previous) => ({
      ...previous,
      [id]: value,
    }));
  }, []);

  const handleSubmitVote = useCallback(
    async (id: string) => {
      const option = selectedOptions[id];

      if (!option) {
        message.warning('Choose your stance before casting your vote.');
        return;
      }

      try {
        setSubmittingId(id);

        await submitPublicVote(id, option);

        message.success('Your vote has been recorded.');
        refresh();
      } catch {
        message.error('Failed to submit your vote. Please try again.');
      } finally {
        setSubmittingId(null);
      }
    },
    [message, refresh, selectedOptions],
  );

  const columns = useMemo<ProColumns<BallotRow>[]>(
    () => [
      {
        title: 'Consultation',
        dataIndex: 'title',
        width: 340,
        ellipsis: true,
        render: (_dom, row) => {
          const status = ballotStatus(row);

          return (
            <Space direction="vertical" size={4}>
              <Text strong>{row.title}</Text>
              <Space size="small" wrap>
                <Tag color={status.color} icon={status.icon}>
                  {status.label}
                </Tag>
                <Tag icon={<ClockCircleOutlined />}>
                  Closes {formatCloseDate(row.closesAt)}
                </Tag>
              </Space>
            </Space>
          );
        },
      },
      {
        title: 'Your vote',
        dataIndex: 'id',
        width: 480,
        render: (_dom, row) => {
          const id = String(row.id);
          const options = resolveOptions(row);
          const selected = selectedOptions[id];

          if (options.length === 0) {
            return <Tag color="default">No voting options configured</Tag>;
          }

          return (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Radio.Group
                size="small"
                value={selected}
                onChange={(event) => handleRadioChange(id, event)}
              >
                {options.map((option) => (
                  <Radio.Button key={option} value={option}>
                    {option}
                  </Radio.Button>
                ))}
              </Radio.Group>

              <Space size="small" wrap>
                <Tag color={selected ? 'geekblue' : 'default'}>
                  {selected ? `Selected: ${selected}` : 'No vote yet'}
                </Tag>

                <Button
                  type="primary"
                  size="small"
                  icon={<ThunderboltOutlined />}
                  loading={submittingId === id}
                  disabled={!selected || submittingId === id}
                  onClick={() => handleSubmitVote(id)}
                >
                  Cast vote
                </Button>
              </Space>
            </Space>
          );
        },
      },
      {
        title: 'Participation',
        dataIndex: 'turnout',
        width: 180,
        render: (_dom, row) => {
          const percent = turnoutPercent(row.turnout);

          return (
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Progress
                percent={percent}
                size="small"
                status={
                  percent >= HIGH_TURNOUT_THRESHOLD ? 'success' : 'normal'
                }
              />
              <Text type="secondary">{percent}% turnout</Text>
            </Space>
          );
        },
      },
      {
        title: 'Next',
        key: 'actions',
        width: 180,
        render: (_dom, row) => (
          <Space direction="vertical" size={4}>
            <Link href={`/ethikos/deliberate/${row.id}?sidebar=ethikos`} prefetch={false}>
              <Button size="small" icon={<FileTextOutlined />}>
                View debate
              </Button>
            </Link>

            <Link href="/ethikos/decide/results?sidebar=ethikos" prefetch={false}>
              <Button size="small" type="link">
                Results
              </Button>
            </Link>
          </Space>
        ),
      },
    ],
    [
      handleRadioChange,
      handleSubmitVote,
      selectedOptions,
      submittingId,
    ],
  );

  return (
    <EthikosPageShell
      sectionLabel="Decide"
      title="Public consultations"
      subtitle={
        <span>
          Review active public decisions, choose your stance, and cast a vote.
          The raw result remains visible, and any enriched reading must be
          explained separately.
        </span>
      }
      primaryAction={
        <Link href="/ethikos/decide/results?sidebar=ethikos" prefetch={false}>
          <Button type="primary" icon={<BarChartOutlined />}>
            Open results
          </Button>
        </Link>
      }
      secondaryActions={
        <Space>
          <Link href="/ethikos/decide/methodology?sidebar=ethikos" prefetch={false}>
            <Button icon={<InfoCircleOutlined />}>Methodology</Button>
          </Link>
          <Link href="/ethikos/decide/elite?sidebar=ethikos" prefetch={false}>
            <Button>Expert decisions</Button>
          </Link>
        </Space>
      }
    >
      <PageContainer ghost loading={loading}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Vote first, interpret later"
            description={
              <span>
                This page records your vote on open public consultations.
                Results are reviewed in Decide · Results, where baseline results
                and declared Smart Vote readings should remain clearly separated.
              </span>
            }
          />

          <ProCard gutter={[16, 16]} wrap>
            {headerStats.map((stat) => (
              <StatisticCard
                key={stat.label}
                colSpan={{ xs: 24, sm: 12, lg: 6 }}
                statistic={{
                  title: stat.label,
                  value: stat.value,
                  suffix: stat.suffix,
                }}
              />
            ))}
          </ProCard>

          <ProCard
            title="Choose a consultation"
            extra={
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Find an open consultation, review the question, then cast your
                stance.
              </Paragraph>
            }
          >
            <Space wrap>
              <Input.Search
                placeholder="Search consultations…"
                allowClear
                style={{ width: 280 }}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              <Radio.Group
                size="small"
                value={quickFilter}
                onChange={(event) =>
                  setQuickFilter(event.target.value as QuickFilter)
                }
              >
                <Radio.Button value="all">All</Radio.Button>
                <Radio.Button value="closing-soon">Closing soon</Radio.Button>
                <Radio.Button value="high-turnout">
                  High participation
                </Radio.Button>
              </Radio.Group>

              <Tooltip title="Refresh open consultations">
                <Button
                  size="small"
                  icon={<SyncOutlined />}
                  onClick={() => refresh()}
                  loading={loading}
                >
                  Refresh
                </Button>
              </Tooltip>
            </Space>
          </ProCard>

          {filteredBallots.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                ballots.length === 0
                  ? 'No open public consultations right now.'
                  : 'No consultations match your search or filters.'
              }
            />
          ) : (
            <ProTable<BallotRow>
              rowKey="id"
              columns={columns}
              dataSource={filteredBallots}
              pagination={{ pageSize: PAGE_SIZE }}
              search={false}
              options={false}
              toolBarRender={false}
            />
          )}

          <ProCard title="After voting">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                After a consultation closes, the result should stay traceable:
                raw vote first, then any declared reading, then impact tracking.
              </Paragraph>

              <Space wrap>
                <Link href="/ethikos/decide/results?sidebar=ethikos" prefetch={false}>
                  <Button icon={<BarChartOutlined />}>Read results</Button>
                </Link>
                <Link href="/ethikos/impact/tracker?sidebar=ethikos" prefetch={false}>
                  <Button>Track impact</Button>
                </Link>
                <Link href="/ethikos/learn/guides?sidebar=ethikos" prefetch={false}>
                  <Button>How decisions work</Button>
                </Link>
              </Space>
            </Space>
          </ProCard>
        </Space>
      </PageContainer>
    </EthikosPageShell>
  );
}