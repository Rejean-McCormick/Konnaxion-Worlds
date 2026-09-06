'use client';

import {
  ArrowRightOutlined,
  BarChartOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  ProCard,
  StatisticCard,
} from '@ant-design/pro-components';
import {
  Button,
  Card,
  DatePicker,
  List,
  Segmented,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import React from 'react';

import ReportsPageShell from './ReportsPageShell';

const { RangePicker } = DatePicker;
const { Paragraph, Text } = Typography;

type QuickRange = '7d' | '30d' | '90d';

type Shortcut = {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  tags: string[];
};

const QUICK_RANGES: { label: string; value: QuickRange }[] = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
];

const shortcuts: Shortcut[] = [
  {
    key: 'smart-vote',
    title: 'Smart Vote · Impact overview',
    description:
      'See weighted participation, consensus patterns, and expert vs public deltas.',
    href: '/reports/smart-vote',
    icon: <LineChartOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
    tags: ['Ekoh', 'Ethikos', 'Smart Vote'],
  },
  {
    key: 'usage',
    title: 'Usage · Adoption & activity',
    description:
      'Track monthly active users, active projects, and document growth across the platform.',
    href: '/reports/usage',
    icon: <BarChartOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
    tags: ['Usage', 'MAU', 'Projects'],
  },
  {
    key: 'perf',
    title: 'API performance · Reliability',
    description:
      'Monitor API latency, error rates, and SLO compliance for the core services.',
    href: '/reports/perf',
    icon: <ThunderboltOutlined style={{ fontSize: 24, color: '#faad14' }} />,
    tags: ['API', 'SLO', 'Reliability'],
  },
];

const MiniChartSkeleton = ({ color = '#eee' }: { color?: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-end',
      height: '100%',
      gap: 4,
      paddingBottom: 8,
    }}
  >
    {[40, 60, 45, 70, 50, 80, 65, 85, 55, 75, 90, 60].map((h, i) => (
      <div
        key={i}
        style={{
          width: '6%',
          height: `${h}%`,
          background: color,
          borderRadius: '2px 2px 0 0',
          opacity: 0.6,
        }}
      />
    ))}
  </div>
);

export default function ReportsHomePage(): JSX.Element {
  const [quickRange, setQuickRange] = React.useState<QuickRange>('30d');
  const router = useRouter();

  return (
    <ReportsPageShell
      title="Insights"
      subtitle="Cross-module analytics for Smart Vote, usage, and performance."
      metaTitle="Insights · Reports"
    >
      <Space
        direction="vertical"
        size="large"
        style={{ width: '100%' }}
      >
        <Card>
          <Space
            direction="vertical"
            size="middle"
            style={{ width: '100%' }}
          >
            <Space
              align="start"
              style={{
                width: '100%',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <Space direction="vertical" size={4}>
                <Space>
                  <CalendarOutlined />
                  <Text strong>Time range</Text>
                </Space>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Choose a time window. Detailed dashboards can override this
                  range.
                </Paragraph>
              </Space>

              <Space direction="vertical" size={4}>
                <Text strong>Quick ranges</Text>
                <Segmented
                  options={QUICK_RANGES.map((r) => ({
                    label: r.label,
                    value: r.value,
                  }))}
                  value={quickRange}
                  onChange={(value) => setQuickRange(value as QuickRange)}
                />
              </Space>

              <Space direction="vertical" size={4}>
                <Text strong>Custom range</Text>
                <RangePicker allowClear />
              </Space>
            </Space>

            <Space>
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                This overview is read-only. Detailed dashboards on each report
                page will use the same time range where possible.
              </Paragraph>
            </Space>
          </Space>
        </Card>

        <ProCard
          ghost
          gutter={[16, 16]}
          wrap
        >
          <StatisticCard
            colSpan={{ xs: 24, sm: 24, md: 8 }}
            statistic={{
              title: 'Smart Vote',
              value: 1245,
              suffix: 'votes',
              description: 'Weighted decisions in the selected range.',
            }}
            chart={
              <div style={{ height: 80, width: '100%' }}>
                <MiniChartSkeleton color="#1890ff" />
              </div>
            }
            footer={
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text type="secondary">Last {quickRange}</Text>
                <Button
                  type="link"
                  size="small"
                  onClick={() => router.push('/reports/smart-vote')}
                >
                  View Report <ArrowRightOutlined />
                </Button>
              </Space>
            }
          />

          <StatisticCard
            colSpan={{ xs: 24, sm: 24, md: 8 }}
            statistic={{
              title: 'Usage',
              value: 567,
              suffix: 'MAU',
              description: 'Approximate monthly active users.',
            }}
            chart={
              <div style={{ height: 80, width: '100%' }}>
                <MiniChartSkeleton color="#52c41a" />
              </div>
            }
            footer={
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text type="secondary">Includes projects & docs</Text>
                <Button
                  type="link"
                  size="small"
                  onClick={() => router.push('/reports/usage')}
                >
                  View Usage <ArrowRightOutlined />
                </Button>
              </Space>
            }
          />

          <StatisticCard
            colSpan={{ xs: 24, sm: 24, md: 8 }}
            statistic={{
              title: 'API Performance',
              value: 240,
              suffix: 'ms p95',
              description: 'Aggregated latency for public endpoints.',
            }}
            chart={
              <div style={{ height: 80, width: '100%' }}>
                <MiniChartSkeleton color="#faad14" />
              </div>
            }
            footer={
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text type="secondary">Target p95 &lt; 300 ms</Text>
                <Button
                  type="link"
                  size="small"
                  onClick={() => router.push('/reports/perf')}
                >
                  Check Reliability <ArrowRightOutlined />
                </Button>
              </Space>
            }
          />
        </ProCard>

        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Space direction="vertical" size={4}>
              <Typography.Title level={4} style={{ marginBottom: 0 }}>
                Dashboards
              </Typography.Title>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                Jump directly to a dedicated Insights dashboard. These pages
                provide charts, tables, and export options.
              </Paragraph>
            </Space>

            <List<Shortcut>
              itemLayout="horizontal"
              dataSource={shortcuts}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      key="open"
                      type="default"
                      onClick={() => router.push(item.href)}
                    >
                      Open
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={item.icon}
                    title={
                      <a
                        onClick={() => router.push(item.href)}
                        style={{ cursor: 'pointer' }}
                      >
                        {item.title}
                      </a>
                    }
                    description={
                      <Space
                        direction="vertical"
                        size={4}
                        style={{ width: '100%' }}
                      >
                        <Paragraph style={{ marginBottom: 0 }}>
                          {item.description}
                        </Paragraph>
                        <Space size={[4, 0]} wrap>
                          {item.tags.map((tag: string) => (
                            <Tag key={tag} color="blue">
                              {tag}
                            </Tag>
                          ))}
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Space>
        </Card>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space>
              <InfoCircleOutlined />
              <Text strong>How to use Insights</Text>
            </Space>
            <Paragraph style={{ marginBottom: 0 }}>
              Start from this overview to pick the dashboard that matches your
              question: Smart Vote for collective decisions, Usage for adoption,
              and API performance for reliability. Each dashboard lets you
              refine the time range, inspect detailed metrics, and export data
              where permitted.
            </Paragraph>
            <Tooltip title="Exports are limited to aggregated datasets; raw personal data never leaves the analytics service.">
              <Button type="default" icon={<InfoCircleOutlined />}>
                Learn more about data safeguards
              </Button>
            </Tooltip>
          </Space>
        </Card>
      </Space>
    </ReportsPageShell>
  );
}