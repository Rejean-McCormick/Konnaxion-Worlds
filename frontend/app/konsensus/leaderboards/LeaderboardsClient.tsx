// FILE: frontend/app/konsensus/leaderboards/LeaderboardsClient.tsx
'use client';

import {
  CrownOutlined,
  FireOutlined,
  GlobalOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  ProTable,
} from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import {
  Avatar,
  Badge,
  Card,
  Col,
  Divider,
  Layout,
  List,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useMemo, useState } from 'react';

const { Content } = Layout;
const { Text, Paragraph } = Typography;
const { Option } = Select;

type Timeframe = '7d' | '30d' | '90d';

type TrustLevel = 'Gold' | 'Silver' | 'Bronze';

interface LeaderboardRow {
  id: string;
  rank: number;
  user: string;
  handle: string;
  domain: string;
  region: string;
  ekohScore: number;
  votesWeighted: number;
  trustLevel: TrustLevel;
  trend: 'up' | 'down' | 'steady';
}

interface DomainHighlight {
  domain: string;
  topUser: string;
  topScore: number;
  change: string;
}

const MOCK_LEADERBOARD: LeaderboardRow[] = [
  {
    id: '1',
    rank: 1,
    user: 'Dr. Amina K.',
    handle: '@amina-k',
    domain: 'Public Health',
    region: 'Global',
    ekohScore: 97.3,
    votesWeighted: 15432,
    trustLevel: 'Gold',
    trend: 'up',
  },
  {
    id: '2',
    rank: 2,
    user: 'Luis Fernandez',
    handle: '@luis-f',
    domain: 'Climate Policy',
    region: 'Latin America',
    ekohScore: 95.1,
    votesWeighted: 14201,
    trustLevel: 'Gold',
    trend: 'steady',
  },
  {
    id: '3',
    rank: 3,
    user: 'Sarah Chen',
    handle: '@s-chen',
    domain: 'AI Governance',
    region: 'North America',
    ekohScore: 93.4,
    votesWeighted: 13680,
    trustLevel: 'Gold',
    trend: 'up',
  },
  {
    id: '4',
    rank: 4,
    user: 'Rahul Verma',
    handle: '@rahul-v',
    domain: 'Economic Justice',
    region: 'Asia',
    ekohScore: 91.8,
    votesWeighted: 12940,
    trustLevel: 'Silver',
    trend: 'up',
  },
  {
    id: '5',
    rank: 5,
    user: 'Elena Petrova',
    handle: '@elena-p',
    domain: 'Education',
    region: 'Europe',
    ekohScore: 90.5,
    votesWeighted: 11832,
    trustLevel: 'Silver',
    trend: 'steady',
  },
  {
    id: '6',
    rank: 6,
    user: 'David Kim',
    handle: '@d-kim',
    domain: 'Urban Planning',
    region: 'North America',
    ekohScore: 88.9,
    votesWeighted: 11200,
    trustLevel: 'Silver',
    trend: 'down',
  },
  {
    id: '7',
    rank: 7,
    user: 'Maria Silva',
    handle: '@maria-s',
    domain: 'Public Health',
    region: 'Latin America',
    ekohScore: 87.2,
    votesWeighted: 10321,
    trustLevel: 'Bronze',
    trend: 'up',
  },
  {
    id: '8',
    rank: 8,
    user: 'Omar Hassan',
    handle: '@omar-h',
    domain: 'Climate Policy',
    region: 'Middle East & Africa',
    ekohScore: 85.7,
    votesWeighted: 9876,
    trustLevel: 'Bronze',
    trend: 'steady',
  },
];

const MOCK_DOMAIN_HIGHLIGHTS: DomainHighlight[] = [
  {
    domain: 'Public Health',
    topUser: 'Dr. Amina K.',
    topScore: 97.3,
    change: '+2 places this week',
  },
  {
    domain: 'Climate Policy',
    topUser: 'Luis Fernandez',
    topScore: 95.1,
    change: 'Stable at #1 for 3 weeks',
  },
  {
    domain: 'AI Governance',
    topUser: 'Sarah Chen',
    topScore: 93.4,
    change: '+4.7 Ekoh score (90 days)',
  },
  {
    domain: 'Economic Justice',
    topUser: 'Rahul Verma',
    topScore: 91.8,
    change: 'New entrant in top 10',
  },
];

function trustLevelTag(level: TrustLevel) {
  const color =
    level === 'Gold' ? 'gold' : level === 'Silver' ? 'geekblue' : 'green';

  return (
    <Tag color={color} bordered={false}>
      {level} tier
    </Tag>
  );
}

function trendBadge(trend: LeaderboardRow['trend']) {
  if (trend === 'up') {
    return <Tag color="success">▲ Rising</Tag>;
  }
  if (trend === 'down') {
    return <Tag color="error">▼ Dropping</Tag>;
  }
  return <Tag>• Stable</Tag>;
}

/**
 * Defensive initials helper – avoids indexing possibly undefined elements.
 */
function getInitials(name: string) {
  const parts = name.split(' ').filter(Boolean);
  if (!parts.length) return '?';

  if (parts.length === 1) {
    const first = parts[0];
    const initial = first?.charAt(0);
    return initial && initial.trim() ? initial : '?';
  }

  const first = parts[0];
  const last = parts[parts.length - 1];

  const firstInitial = first?.charAt(0) ?? '';
  const lastInitial = last?.charAt(0) ?? '';

  const combined = `${firstInitial}${lastInitial}`.trim();

  return combined || '?';
}

export default function LeaderboardsClient(): JSX.Element {
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('global');

  const filteredRows = useMemo(() => {
    return MOCK_LEADERBOARD.filter((row) => {
      if (domainFilter !== 'all' && row.domain !== domainFilter) return false;
      if (regionFilter !== 'global' && row.region !== regionFilter) return false;
      return true;
    });
  }, [domainFilter, regionFilter]);

  const totalContributors = 1342;
  const trackedDomains = 28;
  const lastRefresh = '2 min ago';

  const columns: ProColumns<LeaderboardRow>[] = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      width: 70,
      align: 'center',
      render: (_, row) => (
        <Space>
          {row.rank <= 3 ? (
            <CrownOutlined
              style={{
                fontSize: 16,
                color: row.rank === 1 ? '#faad14' : '#d9d9d9',
              }}
            />
          ) : null}
          <span>{row.rank}</span>
        </Space>
      ),
    },
    {
      title: 'Contributor',
      dataIndex: 'user',
      render: (_, row) => (
        <Space>
          <Avatar
            size="small"
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1677ff' }}
          >
            {getInitials(row.user)}
          </Avatar>
          <div>
            <div>{row.user}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.handle}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Domain',
      dataIndex: 'domain',
      responsive: ['md'],
      render: (value) => <Tag>{value}</Tag>,
    },
    {
      title: 'Region',
      dataIndex: 'region',
      responsive: ['lg'],
      render: (value) => (
        <Space size={4}>
          <GlobalOutlined />
          <span>{value}</span>
        </Space>
      ),
    },
    {
      title: 'Ekoh score',
      dataIndex: 'ekohScore',
      sorter: (a, b) => a.ekohScore - b.ekohScore,
      defaultSortOrder: 'descend',
      align: 'right',
      render: (_, row) => <Text strong>{row.ekohScore.toFixed(1)}</Text>,
    },
    {
      title: 'Weighted votes',
      dataIndex: 'votesWeighted',
      sorter: (a, b) => a.votesWeighted - b.votesWeighted,
      align: 'right',
      render: (_, row) => row.votesWeighted.toLocaleString('en-US'),
    },
    {
      title: 'Trust',
      dataIndex: 'trustLevel',
      render: (_, row) => (
        <Space size={4}>
          {trustLevelTag(row.trustLevel)}
          {trendBadge(row.trend)}
        </Space>
      ),
    },
  ];

  const regions = Array.from(new Set(MOCK_LEADERBOARD.map((row) => row.region)));

  const domains = Array.from(new Set(MOCK_LEADERBOARD.map((row) => row.domain)));

  return (
    <Content
      style={{
        margin: '20px 16px 15px 16px',
        background: 'var(--ant-color-bg-container)',
        borderRadius: 8,
      }}
    >
      <PageContainer
        header={{
          title: (
            <Space>
              <TrophyOutlined />
              <span>Konsensus leaderboards</span>
            </Space>
          ),
          subTitle:
            'Krowd highlights – top Ekoh contributors by domain and region.',
          ghost: false,
          extra: [
            <Segmented<Timeframe>
              key="timeframe"
              size="middle"
              options={[
                { label: '7 days', value: '7d' },
                { label: '30 days', value: '30d' },
                { label: '90 days', value: '90d' },
              ]}
              value={timeframe}
              onChange={(value) => setTimeframe(value as Timeframe)}
            />,
          ],
        }}
      >
        {/* KPI strip */}
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic
                title="Active contributors in this period"
                value={totalContributors}
                prefix={<TeamOutlined />}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Based on Ekoh-weighted activity across modules.
              </Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic
                title="Domains tracked"
                value={trackedDomains}
                prefix={<FireOutlined />}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Science, ethics, governance, environment, and more.
              </Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic
                title="Last refresh"
                value={lastRefresh}
                prefix={<GlobalOutlined />}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Mock data – wire up to Konsensus API later.
              </Text>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Filters + main leaderboard */}
        <ProCard gutter={16} wrap>
          <ProCard
            colSpan={{ xs: 24, xl: 16 }}
            title="Global leaderboard"
            extra={
              <Space size="middle" wrap>
                <Space size={4}>
                  <Text type="secondary">Domain</Text>
                  <Select
                    size="small"
                    style={{ minWidth: 180 }}
                    value={domainFilter}
                    onChange={setDomainFilter}
                  >
                    <Option value="all">All domains</Option>
                    {domains.map((domain) => (
                      <Option key={domain} value={domain}>
                        {domain}
                      </Option>
                    ))}
                  </Select>
                </Space>
                <Space size={4}>
                  <Text type="secondary">Region</Text>
                  <Select
                    size="small"
                    style={{ minWidth: 220 }}
                    value={regionFilter}
                    onChange={setRegionFilter}
                  >
                    <Option value="global">Global</Option>
                    {regions.map((region) => (
                      <Option key={region} value={region}>
                        {region}
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Space>
            }
          >
            <ProTable<LeaderboardRow>
              rowKey="id"
              columns={columns}
              dataSource={filteredRows}
              search={false}
              pagination={{
                pageSize: 8,
                showSizeChanger: false,
              }}
              size="small"
              toolBarRender={false}
            />
          </ProCard>

          {/* Side panel – domain highlights */}
          <ProCard
            colSpan={{ xs: 24, xl: 8 }}
            title={
              <Space>
                <CrownOutlined />
                <span>Domain highlights</span>
              </Space>
            }
            extra={
              <Tooltip title="Snapshot of top Ekoh leaders by domain.">
                <Badge status="processing" text="Live preview" />
              </Tooltip>
            }
          >
            <List
              itemLayout="vertical"
              dataSource={MOCK_DOMAIN_HIGHLIGHTS}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag bordered={false}>{item.domain}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={2}>
                        <Text strong>{item.topUser}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Ekoh score {item.topScore.toFixed(1)} · {item.change}
                        </Text>
                      </Space>
                    }
                    avatar={
                      <Avatar
                        style={{ backgroundColor: '#722ed1' }}
                        icon={<TrophyOutlined />}
                      />
                    }
                  />
                </List.Item>
              )}
            />
          </ProCard>
        </ProCard>

        {/* Explanation / how this works */}
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24} md={16}>
            <Card title="How Konsensus leaderboards work" size="small">
              <Paragraph>
                Leaderboards are driven by Ekoh-weighted contributions across
                the platform. Votes, arguments, validated projects, and other
                actions are aggregated and normalized so that:
              </Paragraph>
              <ul className="list-disc pl-5">
                <li>
                  High-quality, ethically aligned contributions are rewarded
                  more than sheer volume.
                </li>
                <li>
                  Domain tags (e.g. “Public Health”, “AI Governance”) determine
                  which expertise scores influence a given leaderboard.
                </li>
                <li>
                  Regional filters let you surface local leaders while keeping a
                  global baseline for comparison.
                </li>
              </ul>
              <Paragraph style={{ marginTop: 12 }}>
                This page currently uses mock data. When wired to the backend,
                filters above should call the Konsensus analytics API and update
                the tables and tiles in real time.
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Next steps" size="small">
              <ul className="list-disc pl-5">
                <li>Connect to Konsensus leaderboard endpoint.</li>
                <li>
                  Add “My position” indicator for the logged-in user (e.g.
                  highlight their row and show rank offset).
                </li>
                <li>
                  Support export as CSV / image for reporting and research.
                </li>
              </ul>
            </Card>
          </Col>
        </Row>
      </PageContainer>
    </Content>
  );
}
