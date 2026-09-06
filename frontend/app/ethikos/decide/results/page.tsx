// FILE: frontend/app/ethikos/decide/results/page.tsx
'use client';

import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
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
  Button,
  DatePicker,
  Empty,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import {
  type DecisionResult,
  type DecisionScope,
  fetchDecisionResults,
} from '@/services/decide';

const { RangePicker } = DatePicker;
const { Text, Paragraph } = Typography;

type ScopeFilter = 'all' | DecisionScope;
type ResultFilter = 'all' | 'passed' | 'rejected';
type RangeValue = [Dayjs | null, Dayjs | null] | null;

function formatDate(value: string): string {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : value;
}

function route(path: string): string {
  return `${path}${path.includes('?') ? '&' : '?'}sidebar=ethikos`;
}

function ResultTag({ passed }: { passed: boolean }): JSX.Element {
  return (
    <Tag
      color={passed ? 'green' : 'red'}
      icon={passed ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
    >
      {passed ? 'POSITIVE' : 'NEGATIVE'}
    </Tag>
  );
}

function ScopeTag({ scope }: { scope: DecisionScope }): JSX.Element {
  return (
    <Tag color={scope === 'Elite' ? 'geekblue' : 'default'}>
      {scope === 'Elite' ? 'EXPERT CONTEXT' : 'PUBLIC'}
    </Tag>
  );
}

function formatStanceScore(value: number): string {
  const normalized = Math.max(-3, Math.min(3, value));
  return `${normalized >= 0 ? '+' : ''}${normalized.toFixed(2)} / 3`;
}

export default function ResultsArchive(): JSX.Element {
  const { data, loading, error, refresh } = useRequest(fetchDecisionResults);
  const items = data?.items ?? [];

  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all');
  const [regionFilter, setRegionFilter] = useState<string | 'all'>('all');
  const [range, setRange] = useState<RangeValue>(null);

  const allRegions = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((item) => item.region)
            .filter((region): region is string => Boolean(region)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [items],
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (scopeFilter !== 'all' && item.scope !== scopeFilter) return false;
        if (resultFilter === 'passed' && !item.passed) return false;
        if (resultFilter === 'rejected' && item.passed) return false;
        if (regionFilter !== 'all' && item.region !== regionFilter) return false;

        if (range?.[0] && range?.[1]) {
          const closed = dayjs(item.closesAt);
          if (
            !closed.isValid() ||
            closed.isBefore(range[0].startOf('day')) ||
            closed.isAfter(range[1].endOf('day'))
          ) {
            return false;
          }
        }
        return true;
      }),
    [items, range, regionFilter, resultFilter, scopeFilter],
  );

  const availableReadings = items.filter(
    (item) => typeof item.readingScore === 'number',
  ).length;
  const passedCount = items.filter((item) => item.passed).length;

  const columns: ProColumns<DecisionResult>[] = [
    {
      title: 'Decision',
      dataIndex: 'title',
      width: 330,
      render: (_dom, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{row.title}</Text>
          <Text type="secondary">
            {row.region ?? 'No category'} · {row.participationCount} stances
          </Text>
        </Space>
      ),
    },
    {
      title: 'Public baseline',
      key: 'baseline',
      width: 190,
      render: (_dom, row) => (
        <Space direction="vertical" size={0}>
          <ResultTag passed={row.passed} />
          <Text type="secondary">{formatStanceScore(row.baselineScore)}</Text>
        </Space>
      ),
    },
    {
      title: 'EkoH advisory reading',
      key: 'reading',
      width: 210,
      render: (_dom, row) =>
        typeof row.readingScore === 'number' ? (
          <Space direction="vertical" size={0}>
            <Tag color="blue">ADVISORY</Tag>
            <Text>{formatStanceScore(row.readingScore)}</Text>
            {row.readingKey && <Text type="secondary">{row.readingKey}</Text>}
          </Space>
        ) : (
          <Text type="secondary">No declared reading</Text>
        ),
    },
    {
      title: 'Context',
      dataIndex: 'scope',
      width: 170,
      render: (_dom, row) => <ScopeTag scope={row.scope} />,
    },
    {
      title: 'Closed',
      dataIndex: 'closesAt',
      width: 180,
      render: (_dom, row) => (
        <Space>
          <ClockCircleOutlined />
          <Text type="secondary">{formatDate(row.closesAt)}</Text>
        </Space>
      ),
    },
    {
      title: 'Next',
      key: 'next',
      width: 150,
      render: () => (
        <Link href={route('/ethikos/impact/tracker')} prefetch={false}>
          <Button size="small" icon={<ArrowRightOutlined />}>
            Follow impact
          </Button>
        </Link>
      ),
    },
  ];

  const hasFilters =
    scopeFilter !== 'all' ||
    resultFilter !== 'all' ||
    regionFilter !== 'all' ||
    Boolean(range?.[0] && range?.[1]);

  return (
    <EthikosPageShell
      title="Decision results"
      sectionLabel="Decide"
      subtitle="Compare the public baseline with declared advisory readings without collapsing them into one score."
      primaryAction={
        <Link href={route('/ethikos/decide/methodology')} prefetch={false}>
          <Button type="primary" icon={<InfoCircleOutlined />}>
            Voting methodology
          </Button>
        </Link>
      }
      secondaryActions={
        <Space wrap>
          <Link href={route('/ethikos/decide/public')} prefetch={false}>
            <Button>Public consultations</Button>
          </Link>
          <Link href={route('/ethikos/decide/elite')} prefetch={false}>
            <Button>Expert context</Button>
          </Link>
          <Button icon={<ReloadOutlined />} onClick={() => refresh()} loading={loading}>
            Refresh
          </Button>
        </Space>
      }
    >
      <PageContainer ghost loading={loading}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Single source facts, multiple readings"
            description="The public baseline remains visible. EkoH supplies contextual expertise; Smart Vote may compute or publish a separate advisory reading. A missing reading is shown as missing, never fabricated from the baseline."
          />

          {error && (
            <Alert
              type="error"
              showIcon
              message="Unable to load decision results"
              description="Check the Decide service or refresh this page."
            />
          )}

          <ProCard gutter={16} wrap>
            <StatisticCard
              colSpan={{ xs: 24, sm: 12, lg: 6 }}
              statistic={{ title: 'Closed decisions', value: items.length }}
            />
            <StatisticCard
              colSpan={{ xs: 24, sm: 12, lg: 6 }}
              statistic={{ title: 'Positive baseline', value: passedCount }}
            />
            <StatisticCard
              colSpan={{ xs: 24, sm: 12, lg: 6 }}
              statistic={{ title: 'Available advisory readings', value: availableReadings }}
            />
            <StatisticCard
              colSpan={{ xs: 24, sm: 12, lg: 6 }}
              statistic={{ title: 'Categories represented', value: allRegions.length }}
            />
          </ProCard>

          <ProCard gutter={16} wrap>
            <ProCard
              colSpan={{ xs: 24, lg: 8 }}
              bordered
              title={<Space><CheckCircleOutlined /><span>1. Public baseline</span></Space>}
            >
              <Paragraph type="secondary">
                One source result from the canonical Ethikos stances.
              </Paragraph>
            </ProCard>
            <ProCard
              colSpan={{ xs: 24, lg: 8 }}
              bordered
              title={<Space><SafetyCertificateOutlined /><span>2. Advisory lens</span></Space>}
            >
              <Paragraph type="secondary">
                Relevant expertise may produce a separate Smart Vote reading. It does not replace the baseline.
              </Paragraph>
            </ProCard>
            <ProCard
              colSpan={{ xs: 24, lg: 8 }}
              bordered
              title={<Space><ArrowRightOutlined /><span>3. Decision context</span></Space>}
            >
              <Paragraph type="secondary">
                Divergence is information for judgment, not an automatic instruction.
              </Paragraph>
            </ProCard>
          </ProCard>

          <ProCard title="Filter results">
            <Space wrap>
              <Segmented
                value={scopeFilter}
                onChange={(value) => setScopeFilter(value as ScopeFilter)}
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Public', value: 'Public' },
                  { label: 'Expert context', value: 'Elite' },
                ]}
              />
              <Segmented
                value={resultFilter}
                onChange={(value) => setResultFilter(value as ResultFilter)}
                options={[
                  { label: 'All results', value: 'all' },
                  { label: 'Positive', value: 'passed' },
                  { label: 'Negative', value: 'rejected' },
                ]}
              />
              <Select
                placeholder="Category"
                style={{ minWidth: 200 }}
                allowClear
                value={regionFilter === 'all' ? undefined : regionFilter}
                onChange={(value) => setRegionFilter(value ?? 'all')}
                options={allRegions.map((region) => ({ label: region, value: region }))}
              />
              <RangePicker value={range} onChange={(value) => setRange(value as RangeValue)} />
              {hasFilters && (
                <Button
                  onClick={() => {
                    setScopeFilter('all');
                    setResultFilter('all');
                    setRegionFilter('all');
                    setRange(null);
                  }}
                >
                  Clear
                </Button>
              )}
            </Space>
          </ProCard>

          {filteredItems.length === 0 && !loading ? (
            <ProCard>
              <Empty description="No archived decisions match the current filters." />
            </ProCard>
          ) : (
            <ProTable<DecisionResult>
              rowKey="id"
              columns={columns}
              dataSource={filteredItems}
              pagination={{ pageSize: 12, showSizeChanger: true }}
              search={false}
              options={false}
              toolBarRender={false}
              headerTitle="Archived decisions"
            />
          )}
        </Space>
      </PageContainer>
    </EthikosPageShell>
  );
}
