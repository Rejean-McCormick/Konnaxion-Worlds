// FILE: frontend/app/konsensus/activity-feed/ActivityFeedClient.tsx
'use client';

import {
  ApartmentOutlined,
  BellOutlined,
  FilterOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  List,
  Row,
  Segmented,
  Space,
  Statistic,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

type ModuleKey = 'all' | 'ekoh' | 'ethikos' | 'keenkonnect' | 'konnected' | 'kreative';
type FeedKind = 'consensus' | 'debate' | 'project' | 'learning' | 'system';

interface FeedItem {
  id: string;
  module: Exclude<ModuleKey, 'all'>;
  kind: FeedKind;
  title: string;
  description: string;
  timestamp: string; // ISO
  isUnread: boolean;
  isImportant: boolean;
  actor: string;
  relatedPath?: string;
}

// Demo data – unified cross-module activity stream
const SAMPLE_FEED: FeedItem[] = [
  {
    id: '1',
    module: 'ethikos',
    kind: 'debate',
    title: 'New stance consensus reached on “Climate justice & taxation”',
    description:
      'A strong Konsensus emerged: “Progressive carbon dividend” now has 72% weighted support among validated experts.',
    timestamp: '2025-11-29T18:15:00Z',
    isUnread: true,
    isImportant: true,
    actor: 'Ethikos · Konsensus engine',
    relatedPath: '/ethikos/decide/results',
  },
  {
    id: '2',
    module: 'keenkonnect',
    kind: 'project',
    title: 'Project “Solar micro-grid pilot” moved to Validated',
    description:
      'The project team recorded measurable impact and passed expert review. Marked as a Konsensus highlight.',
    timestamp: '2025-11-28T14:30:00Z',
    isUnread: true,
    isImportant: true,
    actor: 'KeenKonnect · Impact review',
    relatedPath: '/keenkonnect/projects/project-workspace',
  },
  {
    id: '3',
    module: 'konnected',
    kind: 'learning',
    title: 'New KonnectED cohort completed “Community energy basics” path',
    description:
      '47 learners completed the path, with 89% reporting improved understanding of local energy options.',
    timestamp: '2025-11-27T09:10:00Z',
    isUnread: false,
    isImportant: false,
    actor: 'KonnectED · Cohort tracker',
    relatedPath: '/konnected/learning-paths/my-learning-path',
  },
  {
    id: '4',
    module: 'ekoh',
    kind: 'consensus',
    title: 'Ekoh scores updated for “Sustainable finance” domain',
    description:
      '21 contributors gained expertise weight after positive peer review of their recent arguments and resources.',
    timestamp: '2025-11-26T20:45:00Z',
    isUnread: false,
    isImportant: true,
    actor: 'Ekoh · Reputation engine',
    relatedPath: '/ekoh/overview-analytics/current-ekoh-score',
  },
  {
    id: '5',
    module: 'kreative',
    kind: 'project',
    title: 'New community showcase: “Youth climate storytelling”',
    description:
      'A cross-module initiative surfaced in Kreative, flagged as a Konsensus-relevant narrative resource.',
    timestamp: '2025-11-25T16:00:00Z',
    isUnread: true,
    isImportant: false,
    actor: 'Kreative · Community showcases',
    relatedPath: '/kreative/community-showcases/featured-projects',
  },
  {
    id: '6',
    module: 'ethikos',
    kind: 'system',
    title: 'Moderation queue cleared for high-risk debates',
    description:
      'All pending reports on three sensitive topics were reviewed and resolved by the moderation team.',
    timestamp: '2025-11-24T11:20:00Z',
    isUnread: false,
    isImportant: false,
    actor: 'Platform moderation',
    relatedPath: '/ethikos/admin/moderation',
  },
  {
    id: '7',
    module: 'keenkonnect',
    kind: 'project',
    title: 'New call for collaborators: “Water access mapping”',
    description:
      'A keenKonnect project requests contributors with mapping or data-science expertise.',
    timestamp: '2025-11-23T08:40:00Z',
    isUnread: true,
    isImportant: false,
    actor: 'KeenKonnect · Project lead',
    relatedPath: '/keenkonnect/projects/browse-projects',
  },
  {
    id: '8',
    module: 'konnected',
    kind: 'learning',
    title: 'Offline bundle shipped for rural learning hub',
    description:
      'Latest KonnectED content package prepared for an offline deployment in a low-connectivity region.',
    timestamp: '2025-11-22T19:05:00Z',
    isUnread: false,
    isImportant: true,
    actor: 'KonnectED · Offline distribution',
  },
];

type TabKey = 'all' | 'unread' | 'high-signal';
type TimeWindow = '24h' | '7d' | '30d' | 'all';

function isWithinWindow(iso: string, window: TimeWindow): boolean {
  if (window === 'all') return true;
  const msPerDay = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return true;
  const diffDays = (now - ts) / msPerDay;

  switch (window) {
    case '24h':
      return diffDays <= 1;
    case '7d':
      return diffDays <= 7;
    case '30d':
      return diffDays <= 30;
    default:
      return true;
  }
}

export default function KonsensusActivityFeedClient() {
  const router = useRouter();

  const [moduleFilter, setModuleFilter] = useState<ModuleKey>('all');
  const [tabKey, setTabKey] = useState<TabKey>('all');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('7d');

  const unreadCount = useMemo(
    () => SAMPLE_FEED.filter((item) => item.isUnread).length,
    [],
  );

  const importantCount = useMemo(
    () => SAMPLE_FEED.filter((item) => item.isImportant).length,
    [],
  );

  const filteredItems = useMemo(() => {
    return SAMPLE_FEED.filter((item) => {
      if (moduleFilter !== 'all' && item.module !== moduleFilter) return false;
      if (!isWithinWindow(item.timestamp, timeWindow)) return false;

      if (tabKey === 'unread' && !item.isUnread) return false;
      if (tabKey === 'high-signal' && !item.isImportant) return false;

      return true;
    });
  }, [moduleFilter, tabKey, timeWindow]);

  const totalEvents = SAMPLE_FEED.length;
  const consensusEvents = SAMPLE_FEED.filter(
    (item) => item.kind === 'consensus',
  ).length;

  const renderModuleTag = (module: FeedItem['module']) => {
    switch (module) {
      case 'ekoh':
        return <Tag>Ekoh</Tag>;
      case 'ethikos':
        return <Tag>ethiKos</Tag>;
      case 'keenkonnect':
        return <Tag>keenKonnect</Tag>;
      case 'konnected':
        return <Tag>KonnectED</Tag>;
      case 'kreative':
        return <Tag>Kreative</Tag>;
      default:
        return null;
    }
  };

  const renderKindTag = (kind: FeedKind) => {
    switch (kind) {
      case 'consensus':
        return (
          <Tag icon={<ApartmentOutlined />}>
            Konsensus
          </Tag>
        );
      case 'debate':
        return <Tag>Debate</Tag>;
      case 'project':
        return <Tag>Project</Tag>;
      case 'learning':
        return <Tag>Learning</Tag>;
      case 'system':
        return <Tag>System</Tag>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-5" style={{ maxWidth: 1200 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Konsensus Activity Feed
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Unified cross-module timeline of debates, projects, learning signals
              and Konsensus highlights across Ekoh, ethiKos, keenKonnect,
              KonnectED and Kreative.
            </Paragraph>
          </div>

          <Space>
            <Tooltip title="Refresh feed (stubbed – ready for API integration)">
              <Button icon={<ReloadOutlined />} />
            </Tooltip>
            <Tooltip title="Configure what appears in your feed (future feature)">
              <Button icon={<FilterOutlined />}>Feed settings</Button>
            </Tooltip>
          </Space>
        </div>

        {/* Summary KPIs */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Total recent events"
                value={totalEvents}
                prefix={<BellOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Konsensus signals"
                value={consensusEvents}
                prefix={<ThunderboltOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Unread items"
                value={unreadCount}
                prefix={<Badge status="processing" />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card>
          <Space
            direction="horizontal"
            size="large"
            wrap
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <Space direction="vertical" size={8}>
              <Text strong>Module focus</Text>
              <Segmented<ModuleKey>
                value={moduleFilter}
                onChange={(val) => setModuleFilter(val as ModuleKey)}
                options={[
                  { label: 'All modules', value: 'all' },
                  { label: 'Ekoh', value: 'ekoh' },
                  { label: 'ethiKos', value: 'ethikos' },
                  { label: 'keenKonnect', value: 'keenkonnect' },
                  { label: 'KonnectED', value: 'konnected' },
                  { label: 'Kreative', value: 'kreative' },
                ]}
              />
            </Space>

            <Space direction="vertical" size={8}>
              <Text strong>Time window</Text>
              <Segmented<TimeWindow>
                value={timeWindow}
                onChange={(val) => setTimeWindow(val as TimeWindow)}
                options={[
                  { label: '24h', value: '24h' },
                  { label: '7 days', value: '7d' },
                  { label: '30 days', value: '30d' },
                  { label: 'All', value: 'all' },
                ]}
              />
            </Space>

            <Space direction="vertical" size={8}>
              <Text strong>Custom range (placeholder)</Text>
              <RangePicker
                size="small"
                style={{ minWidth: 230 }}
                disabled
              />
              <Text type="secondary">
                Hook up to backend filters later.
              </Text>
            </Space>
          </Space>
        </Card>

        {/* Feed list */}
        <Card>
          <Tabs
            activeKey={tabKey}
            onChange={(key) => setTabKey(key as TabKey)}
            items={[
              {
                key: 'all',
                label: 'All signals',
              },
              {
                key: 'unread',
                label: (
                  <Badge count={unreadCount} size="small">
                    <span>Unread</span>
                  </Badge>
                ),
              },
              {
                key: 'high-signal',
                label: (
                  <Space size={4}>
                    <ThunderboltOutlined />
                    <span>High-signal</span>
                    <Badge
                      count={importantCount}
                      size="small"
                      style={{ backgroundColor: '#faad14' }}
                    />
                  </Space>
                ),
              },
            ]}
          />

          {filteredItems.length === 0 ? (
            <div className="py-10 flex justify-center">
              <Empty description="No activity matches your filters yet." />
            </div>
          ) : (
            <List
              itemLayout="vertical"
              dataSource={filteredItems}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  extra={
                    item.isUnread ? (
                      <Badge status="processing" text="Unread" />
                    ) : null
                  }
                  actions={[
                    item.relatedPath ? (
                      <Button
                        key="open"
                        type="link"
                        onClick={() => router.push(item.relatedPath!)}
                      >
                        Open in context
                      </Button>
                    ) : null,
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar>
                        {item.module.charAt(0).toUpperCase()}
                      </Avatar>
                    }
                    title={
                      <Space size={8} wrap>
                        <Text strong>{item.title}</Text>
                        {item.isImportant && (
                          <Tag icon={<ThunderboltOutlined />}>
                            Highlight
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        <Space size={8} wrap>
                          {renderModuleTag(item.module)}
                          {renderKindTag(item.kind)}
                          <Text type="secondary">
                            {new Date(item.timestamp).toLocaleString()}
                          </Text>
                        </Space>
                        <Text>{item.description}</Text>
                        <Text type="secondary">{item.actor}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </Space>
    </div>
  );
}
