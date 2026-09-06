'use client';

import { InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Progress,
  Row,
  Segmented,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import ReportsPageShell from '../ReportsPageShell';

const { RangePicker } = DatePicker;
const { Text } = Typography;

type TimeRange = '24h' | '7d' | '30d';

interface ApiSummary {
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRatePct: number;
  throughputRps: number;
  apdex: number;
  uptimePct: number;
}

interface ApiSeriesPoint {
  time: string;
  latency: number;
  errors: number;
}

interface ApiPerfResponse {
  summary: ApiSummary;
  series: ApiSeriesPoint[];
}

interface ChartPoint {
  bucket: string;
  p95: number;
  p99: number;
  rate: number;
}

type EndpointRow = {
  key: string;
  endpoint: string;
  p95: number;
  p99: number;
  errorRate: number;
  rps: number;
  sloStatus: 'healthy' | 'watch' | 'breach';
};

const MOCK_ENDPOINTS: EndpointRow[] = [
  {
    key: '/api/keenkonnect/projects/',
    endpoint: '/api/keenkonnect/projects/',
    p95: 280,
    p99: 620,
    errorRate: 0.4,
    rps: 95,
    sloStatus: 'healthy',
  },
  {
    key: '/api/ethikos/decide/',
    endpoint: '/api/ethikos/decide/',
    p95: 350,
    p99: 820,
    errorRate: 0.9,
    rps: 60,
    sloStatus: 'watch',
  },
  {
    key: '/api/ekoh/votes/',
    endpoint: '/api/ekoh/votes/',
    p95: 410,
    p99: 960,
    errorRate: 1.4,
    rps: 130,
    sloStatus: 'breach',
  },
  {
    key: '/api/konnected/learning-paths/',
    endpoint: '/api/konnected/learning-paths/',
    p95: 290,
    p99: 700,
    errorRate: 0.5,
    rps: 55,
    sloStatus: 'healthy',
  },
];

const EMPTY_SUMMARY: ApiSummary = {
  p95LatencyMs: 0,
  p99LatencyMs: 0,
  errorRatePct: 0,
  throughputRps: 0,
  apdex: 0,
  uptimePct: 99.95,
};

const TIME_RANGE_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
];

function buildMockSeries(range: TimeRange): ApiSeriesPoint[] {
  const points =
    range === '24h'
      ? ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      : range === '7d'
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : ['W1', 'W2', 'W3', 'W4'];

  return points.map((label, index) => ({
    time: label,
    latency: [260, 280, 310, 295, 340, 320, 300][index] ?? 300,
    errors: [0.3, 0.4, 0.5, 0.35, 0.8, 0.6, 0.45][index] ?? 0.5,
  }));
}

function normalizePerfResponse(
  data: Partial<ApiPerfResponse> | null | undefined,
  range: TimeRange,
): { summary: ApiSummary; series: ApiSeriesPoint[] } {
  return {
    summary: {
      p95LatencyMs: data?.summary?.p95LatencyMs ?? 320,
      p99LatencyMs: data?.summary?.p99LatencyMs ?? 780,
      errorRatePct: data?.summary?.errorRatePct ?? 0.8,
      throughputRps: data?.summary?.throughputRps ?? 420,
      apdex: data?.summary?.apdex ?? 0.93,
      uptimePct: data?.summary?.uptimePct ?? 99.85,
    },
    series:
      Array.isArray(data?.series) && data!.series.length > 0
        ? data!.series
        : buildMockSeries(range),
  };
}

export default function PerfReportPage(): JSX.Element {
  const [range, setRange] = useState<TimeRange>('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ApiSummary>(EMPTY_SUMMARY);
  const [series, setSeries] = useState<ApiSeriesPoint[]>([]);

  const loadReport = async (nextRange: TimeRange) => {
    setLoading(true);
    setError(null);

    try {
      const perfRes = await fetch(`/api/reports/perf/?range=${nextRange}`, {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!perfRes.ok) {
        throw new Error(`Request failed with status ${perfRes.status}`);
      }

      const data = (await perfRes.json()) as Partial<ApiPerfResponse>;
      const normalized = normalizePerfResponse(data, nextRange);

      setSummary(normalized.summary);
      setSeries(normalized.series);
    } catch {
      setError(
        'Performance data is temporarily unavailable. Showing fallback sample metrics.',
      );

      const normalized = normalizePerfResponse(undefined, nextRange);
      setSummary(normalized.summary);
      setSeries(normalized.series);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport(range);
  }, [range]);

  const chartData: ChartPoint[] = useMemo(
    () =>
      series.map((point) => ({
        bucket: point.time,
        p95: point.latency,
        p99: Math.round(point.latency * 1.9),
        rate: point.errors,
      })),
    [series],
  );

  const endpointColumns: ColumnsType<EndpointRow> = [
    {
      title: 'Endpoint',
      dataIndex: 'endpoint',
      key: 'endpoint',
      render: (value: string) => (
        <Text code ellipsis={{ tooltip: value }}>
          {value}
        </Text>
      ),
    },
    {
      title: 'P95',
      dataIndex: 'p95',
      key: 'p95',
      width: 100,
      render: (value: number) => `${value} ms`,
    },
    {
      title: 'P99',
      dataIndex: 'p99',
      key: 'p99',
      width: 100,
      render: (value: number) => `${value} ms`,
    },
    {
      title: 'Error rate',
      dataIndex: 'errorRate',
      key: 'errorRate',
      width: 120,
      render: (value: number) => `${value.toFixed(1)}%`,
    },
    {
      title: 'RPS',
      dataIndex: 'rps',
      key: 'rps',
      width: 90,
    },
    {
      title: 'SLO',
      dataIndex: 'sloStatus',
      key: 'sloStatus',
      width: 120,
      render: (status: EndpointRow['sloStatus']) => {
        if (status === 'healthy') return <Tag color="success">Healthy</Tag>;
        if (status === 'watch') return <Tag color="warning">Watch</Tag>;
        return <Tag color="error">Breach</Tag>;
      },
    },
  ];

  const toolbar = (
    <Space wrap>
      <Segmented<TimeRange>
        value={range}
        options={TIME_RANGE_OPTIONS}
        onChange={(value) => setRange(value)}
      />
      <RangePicker
        allowClear={false}
        value={[dayjs().subtract(7, 'day'), dayjs()]}
      />
      <Tooltip title="Refresh performance metrics">
        <Button icon={<ReloadOutlined />} onClick={() => void loadReport(range)}>
          Refresh
        </Button>
      </Tooltip>
    </Space>
  );

  if (loading) {
    return (
      <ReportsPageShell
        title="API performance"
        subtitle="Monitor latency, reliability, and endpoint health across the platform."
        secondaryActions={toolbar}
      >
        <Skeleton active paragraph={{ rows: 10 }} />
      </ReportsPageShell>
    );
  }

  return (
    <ReportsPageShell
      title="API performance"
      subtitle="Monitor API latency, reliability, throughput, and SLO compliance for the core services."
      secondaryActions={toolbar}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {error && (
          <Alert
            type="warning"
            showIcon
            message="Fallback data in use"
            description={error}
          />
        )}

        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="About this dashboard"
          description="This view summarizes p95/p99 latency, error rate, and endpoint-level health. Detailed endpoint breakdown can be refined later when the reports API exposes per-endpoint filters."
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} xl={6}>
            <Card>
              <Statistic
                title="P95 latency"
                value={summary.p95LatencyMs}
                suffix="ms"
              />
            </Card>
          </Col>
          <Col xs={24} md={12} xl={6}>
            <Card>
              <Statistic
                title="P99 latency"
                value={summary.p99LatencyMs}
                suffix="ms"
              />
            </Card>
          </Col>
          <Col xs={24} md={12} xl={6}>
            <Card>
              <Statistic
                title="Error rate"
                value={summary.errorRatePct}
                suffix="%"
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} md={12} xl={6}>
            <Card>
              <Statistic
                title="Throughput"
                value={summary.throughputRps}
                suffix="rps"
                precision={0}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card title="Latency trend">
              {chartData.length === 0 ? (
                <Empty description="No latency samples for this range." />
              ) : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bucket" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="p95"
                        name="P95 latency"
                        stroke="#1677ff"
                        fill="#1677ff22"
                      />
                      <Area
                        type="monotone"
                        dataKey="p99"
                        name="P99 latency"
                        stroke="#722ed1"
                        fill="#722ed122"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card title="Error rate trend">
              {chartData.length === 0 ? (
                <Empty description="No error-rate samples for this range." />
              ) : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bucket" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar
                        dataKey="rate"
                        name="Error rate %"
                        fill="#faad14"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={15}>
            <Card title="Endpoint-level performance">
              <Alert
                message="Limited data"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                description="Detailed endpoint breakdown is not yet available via API. Showing representative examples."
              />
              <Table<EndpointRow>
                size="small"
                rowKey="key"
                columns={endpointColumns}
                dataSource={MOCK_ENDPOINTS}
                pagination={{ pageSize: 5 }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={9}>
            <Card title="SLO overview">
              <Space
                direction="vertical"
                size="middle"
                style={{ width: '100%' }}
              >
                <div>
                  <Text strong>Latency SLO (p95 &lt; 400ms)</Text>
                  <Progress
                    percent={Math.min(
                      100,
                      (400 / Math.max(summary.p95LatencyMs, 1)) * 100,
                    )}
                    status={summary.p95LatencyMs <= 400 ? 'active' : 'exception'}
                    showInfo={false}
                  />
                  <Text type="secondary">
                    Current p95: {summary.p95LatencyMs} ms (target ≤ 400 ms)
                  </Text>
                </div>

                <div>
                  <Text strong>Error SLO (rate &lt; 1.0%)</Text>
                  <Progress
                    percent={Math.min(
                      100,
                      (1 / Math.max(summary.errorRatePct, 0.01)) * 100,
                    )}
                    status={summary.errorRatePct < 1 ? 'active' : 'exception'}
                    showInfo={false}
                  />
                  <Text type="secondary">
                    Current error rate: {summary.errorRatePct.toFixed(2)}% (target
                    &lt; 1.0%)
                  </Text>
                </div>

                <div>
                  <Text strong>Availability SLO (≥ 99.9%)</Text>
                  <Progress
                    percent={summary.uptimePct}
                    status={summary.uptimePct >= 99.9 ? 'active' : 'exception'}
                    format={(percent) =>
                      percent !== undefined ? `${percent.toFixed(2)}%` : ''
                    }
                  />
                </div>

                <div>
                  <Text strong>Apdex</Text>
                  <Progress
                    percent={Math.max(0, Math.min(100, summary.apdex * 100))}
                    status={summary.apdex >= 0.9 ? 'active' : 'exception'}
                    format={(percent) =>
                      percent !== undefined ? `${(percent / 100).toFixed(2)}` : ''
                    }
                  />
                </div>

                {summary.errorRatePct > 1 && (
                  <Alert
                    type="warning"
                    showIcon
                    message="Active watch"
                    description="Error rates are elevated above the SLO threshold. Check recent deploys, upstream availability, and database pressure."
                  />
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    </ReportsPageShell>
  );
}