'use client';

import {
  AreaChartOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  HeatMapOutlined,
  BarChartOutlined as InsightsIcon,
  SyncOutlined,
} from '@ant-design/icons';
import { Area, Heatmap, Line } from '@ant-design/plots';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  App,
  Badge,
  Button,
  Empty,
  Segmented,
  Skeleton,
  Space,
  Switch,
  Tabs,
  Tooltip,
  Typography,
} from 'antd';
import type { TabsProps } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import { fetchPulseTrends } from '@/services/pulse';

type TimeRangeKey = '7d' | '30d' | '60d';

type TrendDatum = {
  date?: string;
  x?: string | number | Date;
  ts?: string | number | Date;
  value?: number;
  period?: string;
  [key: string]: unknown;
};

type TrendChartConfig = {
  data?: TrendDatum[];
  xField?: string;
  yField?: string;
  xAxis?: Record<string, unknown>;
  tooltip?: Record<string, unknown>;
  [key: string]: unknown;
};

type PulseChart = {
  key: string;
  type: 'line' | 'area' | 'heatmap' | string;
  title: string;
  config?: TrendChartConfig;
};

const { Text } = Typography;

const RANGE_OPTIONS: { label: string; value: TimeRangeKey }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '60d', value: '60d' },
];

function getDaysForRange(range: TimeRangeKey): number {
  switch (range) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '60d':
    default:
      return 60;
  }
}

function getDatumDate(row: TrendDatum): string | number | Date | undefined {
  return row.date ?? row.x ?? row.ts;
}

function toDayTimestamp(value: string | number | Date | undefined): number | null {
  if (!value) return null;
  const d = dayjs(value);
  if (!d.isValid()) return null;
  return d.startOf('day').valueOf();
}

function formatDay(value: string | number | Date | undefined, fallback = '—'): string {
  if (!value) return fallback;
  const d = dayjs(value);
  return d.isValid() ? d.format('MMM D') : fallback;
}

function formatIsoDay(value: string | number | Date | undefined, fallback = ''): string {
  if (!value) return fallback;
  const d = dayjs(value);
  return d.isValid() ? d.format('YYYY-MM-DD') : fallback;
}

function filterSeriesByDays(data: TrendDatum[], days: number): TrendDatum[] {
  if (!Array.isArray(data) || data.length === 0) return data;

  const now = dayjs();
  const startTs = now.startOf('day').subtract(days - 1, 'day').valueOf();
  const endTs = now.endOf('day').valueOf();

  return data.filter((row) => {
    const ts = toDayTimestamp(getDatumDate(row));
    if (ts === null) return true;
    return ts >= startTs && ts <= endTs;
  });
}

function buildComparisonDataset(baseData: TrendDatum[], days: number): TrendDatum[] {
  const now = dayjs().endOf('day');
  const startCurrent = now.startOf('day').subtract(days - 1, 'day');
  const startPrev = startCurrent.subtract(days, 'day');
  const endPrev = startCurrent.subtract(1, 'day').endOf('day');

  const current = baseData
    .filter((row) => {
      const ts = toDayTimestamp(getDatumDate(row));
      return ts !== null && ts >= startCurrent.valueOf() && ts <= now.valueOf();
    })
    .map((row) => ({
      ...row,
      date: formatIsoDay(getDatumDate(row)),
      period: 'This period',
    }));

  const prev = baseData
    .filter((row) => {
      const ts = toDayTimestamp(getDatumDate(row));
      return ts !== null && ts >= startPrev.valueOf() && ts <= endPrev.valueOf();
    })
    .map((row) => {
      const raw = getDatumDate(row);
      const d = dayjs(raw).startOf('day');
      const dayIndex = d.diff(startPrev, 'day');
      const alignedDate = startCurrent.add(dayIndex, 'day').format('YYYY-MM-DD');

      return {
        ...row,
        date: alignedDate,
        period: 'Previous period',
      };
    });

  return [...prev, ...current];
}

function csvEncodeCell(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function getChartIcon(type: PulseChart['type']): React.ReactNode {
  if (type === 'heatmap') return <HeatMapOutlined />;
  if (type === 'area') return <BarChartOutlined />;
  return <AreaChartOutlined />;
}

export default function PulseTrends(): JSX.Element {
  const { message } = App.useApp();

  const [range, setRange] = useState<TimeRangeKey>('30d');
  const [smoothLines, setSmoothLines] = useState(true);
  const [comparePrev, setComparePrev] = useState(false);
  const [activeKey, setActiveKey] = useState<string>();

  const { data, loading, error, refresh } = useRequest<
    Awaited<ReturnType<typeof fetchPulseTrends>>,
    []
  >(fetchPulseTrends);

  const charts = useMemo<PulseChart[]>(
    () => ((data?.charts ?? []) as PulseChart[]),
    [data],
  );

  useEffect(() => {
    if (!charts.length) {
      setActiveKey(undefined);
      return;
    }

    setActiveKey((current) => {
      if (current && charts.some((chart) => chart.key === current)) {
        return current;
      }
      return charts[0]?.key;
    });
  }, [charts]);

  const enhancedConfigs = useMemo(() => {
    return charts.map((chart) => {
      if (chart.type === 'heatmap') {
        return {
          ...(chart.config ?? {}),
        };
      }

      const baseData = Array.isArray(chart.config?.data) ? chart.config.data : [];
      const days = getDaysForRange(range);
      const seriesData = comparePrev
        ? buildComparisonDataset(baseData, days)
        : filterSeriesByDays(baseData, days);

      const cfg: TrendChartConfig = {
        ...(chart.config ?? {}),
        data: seriesData,
        smooth: smoothLines,
        xField: chart.config?.xField ?? 'date',
        yField: chart.config?.yField ?? 'value',
        appendPadding: [8, 8, 8, 8],
        tooltip: {
          ...(chart.config?.tooltip ?? {}),
          formatter: (datum: TrendDatum) => ({
            name: datum.period ?? 'value',
            value: datum.value,
            title: formatDay(getDatumDate(datum)),
          }),
        },
        xAxis: {
          ...(chart.config?.xAxis ?? {}),
          label: {
            ...((chart.config?.xAxis as Record<string, unknown>)?.label as Record<
              string,
              unknown
            >),
            autoHide: true,
          },
        },
      };

      if (comparePrev) {
        cfg.seriesField = 'period';
        if (chart.type === 'area') {
          cfg.isStack = false;
        }
      }

      return cfg;
    });
  }, [charts, range, smoothLines, comparePrev]);

  const lastUpdatedLabel = useMemo(() => {
    for (let i = charts.length - 1; i >= 0; i -= 1) {
      const chart = charts[i];
      if (!chart || chart.type === 'heatmap') continue;

      const series = Array.isArray(chart.config?.data) ? chart.config.data : [];
      const last = series.at(-1);
      const lastDate = last ? getDatumDate(last) : undefined;

      if (lastDate) {
        return formatDay(lastDate);
      }
    }

    return null;
  }, [charts]);

  const exportCurrentChartCsv = useCallback(() => {
    if (!charts.length || !activeKey) {
      message.info('Nothing to export.');
      return;
    }

    const idx = charts.findIndex((chart) => chart.key === activeKey);
    if (idx < 0) {
      message.info('Nothing to export.');
      return;
    }

    const chart = charts[idx];
    const cfg = enhancedConfigs[idx];

    if (!chart || !cfg) {
      message.info('Nothing to export.');
      return;
    }

    if (chart.type === 'heatmap') {
      message.warning('Heatmap export is not supported.');
      return;
    }

    const rows = (Array.isArray(cfg.data) ? cfg.data : []) as TrendDatum[];

    const header = comparePrev ? ['date', 'value', 'period'] : ['date', 'value'];

    const csv = [
      header,
      ...rows.map((row) =>
        comparePrev
          ? [
              formatIsoDay(getDatumDate(row)),
              row.value ?? '',
              row.period ?? 'This period',
            ]
          : [formatIsoDay(getDatumDate(row)), row.value ?? ''],
      ),
    ]
      .map((row) => row.map(csvEncodeCell).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    link.href = url;
    link.download = `${chart.key}-${range}-${comparePrev ? 'compare' : 'single'}-${timestamp}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success('Exported current chart as CSV.');
  }, [activeKey, charts, comparePrev, enhancedConfigs, message, range]);

  const shellProps = useMemo(
    () => ({
      title: 'Pulse · Trends',
      sectionLabel: 'Pulse',
      subtitle:
        'Topic creation, stances, and deliberation activity over time. Filter by range, smooth lines, and optionally overlay the previous period.',
      primaryAction: (
        <Button type="primary" href="/ethikos/insights" icon={<InsightsIcon />}>
          Open opinion analytics
        </Button>
      ),
    }),
    [],
  );

  const secondaryActions = useMemo(
    () => (
      <Space wrap>
        <Segmented
          size="small"
          value={range}
          onChange={(value) => setRange(value as TimeRangeKey)}
          options={RANGE_OPTIONS}
        />
        <Tooltip title="Smooth lines">
          <Switch size="small" checked={smoothLines} onChange={setSmoothLines} />
        </Tooltip>
        <Tooltip title="Compare with previous period">
          <Switch size="small" checked={comparePrev} onChange={setComparePrev} />
        </Tooltip>
        <Tooltip title="Last data point in the underlying series">
          <Badge
            count={
              <Space size={4}>
                <ClockCircleOutlined style={{ color: '#52c41a' }} />
                <Text type="secondary">{lastUpdatedLabel ?? '—'}</Text>
              </Space>
            }
            style={{ backgroundColor: '#f0f0f0' }}
          />
        </Tooltip>
        <Button icon={<DownloadOutlined />} size="small" onClick={exportCurrentChartCsv}>
          Export CSV
        </Button>
        <Button icon={<SyncOutlined />} size="small" onClick={refresh} />
      </Space>
    ),
    [comparePrev, exportCurrentChartCsv, lastUpdatedLabel, range, refresh, smoothLines],
  );

  const tabItems = useMemo<TabsProps['items']>(
    () =>
      charts.map((chart, idx) => {
        const cfg = enhancedConfigs[idx] ?? {};

        return {
          key: chart.key,
          label: (
            <Space size="small">
              {getChartIcon(chart.type)}
              <span>{chart.title}</span>
            </Space>
          ),
          children: (
            <ProCard ghost>
              {chart.type === 'line' && <Line {...cfg} />}
              {chart.type === 'area' && <Area {...cfg} />}
              {chart.type === 'heatmap' && <Heatmap {...cfg} />}
            </ProCard>
          ),
        };
      }),
    [charts, enhancedConfigs],
  );

  let body: React.ReactNode;

  if (loading && !data) {
    body = (
      <PageContainer ghost>
        <Skeleton active />
      </PageContainer>
    );
  } else if (error) {
    body = (
      <PageContainer ghost>
        <Empty description="Failed to load trend data">
          <Button icon={<SyncOutlined />} onClick={refresh} type="primary">
            Retry
          </Button>
        </Empty>
      </PageContainer>
    );
  } else if (!charts.length) {
    body = (
      <PageContainer ghost>
        <Empty description="No trend data available yet" />
      </PageContainer>
    );
  } else {
    body = (
      <PageContainer ghost>
        <Tabs items={tabItems} activeKey={activeKey} onChange={setActiveKey} />
      </PageContainer>
    );
  }

  return (
    <EthikosPageShell {...shellProps} secondaryActions={secondaryActions}>
      {body}
    </EthikosPageShell>
  );
}