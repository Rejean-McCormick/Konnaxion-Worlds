// FILE: frontend/app/ethikos/trust/profile/page.tsx
'use client';

import { ClockCircleOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { PageContainer, ProCard, StatisticCard } from '@ant-design/pro-components';
import {
  Alert,
  Avatar,
  Button,
  Descriptions,
  Empty,
  List,
  Progress,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import React from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import useReputationEvents from '@/hooks/useReputationEvents';
import type { Badge, EkohExpertiseScore } from '@/services/trust';

const { Paragraph, Text, Title } = Typography;

function percent(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

function formatDate(value?: string): string {
  if (!value) return 'Unknown date';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('MMM D, YYYY') : value;
}

function avatarInitial(value: string): string {
  const trimmed = value.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

function ExpertiseList({ expertise }: { expertise: EkohExpertiseScore[] }): JSX.Element {
  if (!expertise.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No verified EkoH expertise scores yet" />;
  }

  return (
    <List<EkohExpertiseScore>
      dataSource={expertise}
      renderItem={(item) => {
        const value = percent(item.weightedScore);
        return (
          <List.Item key={item.domainCode}>
            <div style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space wrap>
                  <Text strong>{item.domainName}</Text>
                  <Tag>{item.domainCode}</Tag>
                </Space>
                <Text type="secondary">{value}%</Text>
              </Space>
              <Progress percent={value} showInfo={false} />
            </div>
          </List.Item>
        );
      }}
    />
  );
}

export default function TrustProfilePage(): JSX.Element {
  const { data, isLoading, error, refetch } = useReputationEvents();

  const activityProfile = data?.profile;
  const ekohProfile = data?.ekohProfile ?? null;
  const badges: Badge[] = data?.badges ?? [];
  const timeline = data?.timeline ?? [];

  const displayName =
    ekohProfile?.displayName ??
    activityProfile?.displayName ??
    activityProfile?.username ??
    'Anonymous';

  const expertise = ekohProfile?.expertise ?? [];
  const topExpertise = expertise[0];
  const ethicsScore = ekohProfile?.ethicsScore ?? null;
  const confidentiality = ekohProfile?.confidentialityLevel ?? 'not available';

  const primaryAction = (
    <Link href="/ethikos/insights" prefetch={false}>
      <Button type="primary">Open analytics</Button>
    </Link>
  );

  const secondaryActions = (
    <Space wrap>
      <Link href="/ethikos/trust/credentials" prefetch={false}>
        <Button icon={<SafetyCertificateOutlined />}>Upload credential</Button>
      </Link>
      <Link href="/ethikos/trust/badges" prefetch={false}>
        <Button>View badges</Button>
      </Link>
    </Space>
  );

  if (error) {
    return (
      <EthikosPageShell
        title="My EkoH profile"
        sectionLabel="Trust"
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
      >
        <PageContainer ghost>
          <Empty description="Unable to load trust and expertise profile">
            <Button onClick={() => void refetch()} type="primary">Retry</Button>
          </Empty>
        </PageContainer>
      </EthikosPageShell>
    );
  }

  return (
    <EthikosPageShell
      title="My EkoH profile"
      sectionLabel="Trust"
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
    >
      <PageContainer ghost loading={isLoading}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="Expertise is contextual, not a universal rank"
            description="EkoH records domain-specific expertise signals. Smart Vote may use those signals in a declared advisory reading when the same domains are relevant to a question. The public baseline remains separate."
          />

          <ProCard gutter={16} wrap>
            <StatisticCard
              colSpan={{ xs: 24, sm: 12, lg: 6 }}
              statistic={{
                title: 'Expertise domains',
                value: expertise.length,
                description: <Text type="secondary">Domain-bounded EkoH profile</Text>,
              }}
            />
            <StatisticCard
              colSpan={{ xs: 24, sm: 12, lg: 6 }}
              statistic={{
                title: 'Strongest current domain',
                value: topExpertise ? percent(topExpertise.weightedScore) : 0,
                suffix: topExpertise ? '%' : undefined,
                description: topExpertise ? <Tag>{topExpertise.domainName}</Tag> : <Text type="secondary">No score yet</Text>,
              }}
            />
            <StatisticCard
              colSpan={{ xs: 24, sm: 12, lg: 6 }}
              statistic={{
                title: 'Ethics / reliability modifier',
                value: ethicsScore ?? 'Restricted',
                suffix: ethicsScore == null ? undefined : '×',
                precision: ethicsScore == null ? undefined : 2,
                description: <Text type="secondary">Governed signal; not a moral rank</Text>,
              }}
            />
            <StatisticCard
              colSpan={{ xs: 24, sm: 12, lg: 6 }}
              statistic={{
                title: 'Profile visibility',
                value: confidentiality,
                description: <Text type="secondary">Applied by EkoH privacy rules</Text>,
              }}
            />
          </ProCard>

          <ProCard gutter={16} wrap>
            <ProCard colSpan={{ xs: 24, md: 8 }} bordered>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Space align="center" size="middle">
                  <Avatar size={64} src={activityProfile?.avatarUrl ?? undefined}>
                    {avatarInitial(displayName)}
                  </Avatar>
                  <div>
                    <Title level={4} style={{ marginBottom: 4 }}>{displayName}</Title>
                    <Text type="secondary">EkoH expertise context for Ethikos</Text>
                  </div>
                </Space>

                {ekohProfile ? (
                  <Descriptions size="small" column={1} labelStyle={{ width: 150 }}>
                    <Descriptions.Item label="EkoH user ID">{ekohProfile.userId}</Descriptions.Item>
                    <Descriptions.Item label="Visibility">
                      <Tag>{ekohProfile.confidentialityLevel}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Ethics signal">
                      {ekohProfile.ethicsScore == null
                        ? 'Restricted'
                        : `${ekohProfile.ethicsScore.toFixed(2)}×`}
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Alert
                    type="warning"
                    showIcon
                    message="No EkoH profile available"
                    description="Ethikos activity is available, but no canonical EkoH expertise profile was returned for this account."
                  />
                )}

                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  A domain score does not give permanent extra influence. Its relevance depends on the declared domain mix of the specific consultation or reading.
                </Paragraph>
              </Space>
            </ProCard>

            <ProCard colSpan={{ xs: 24, md: 16 }} title="Domain expertise">
              <ExpertiseList expertise={expertise} />
            </ProCard>
          </ProCard>

          <ProCard gutter={16} wrap>
            <ProCard colSpan={{ xs: 24, lg: 14 }} title="Recent activity context">
              {timeline.length ? (
                <Timeline
                  mode="left"
                  items={timeline.map((event) => ({
                    key: event.id,
                    dot: <ClockCircleOutlined />,
                    label: formatDate(event.when),
                    children: (
                      <Space direction="vertical" size={0}>
                        <Text strong>{event.title}</Text>
                        <Text type="secondary">{event.detail}</Text>
                      </Space>
                    ),
                  }))}
                />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No recent Ethikos activity" />
              )}
            </ProCard>

            <ProCard colSpan={{ xs: 24, lg: 10 }} title="Badges">
              {badges.length ? (
                <List<Badge>
                  size="small"
                  dataSource={badges.slice(0, 5)}
                  renderItem={(badge) => (
                    <List.Item key={badge.id}>
                      <List.Item.Meta
                        title={badge.label}
                        description={`${badge.description} · ${formatDate(badge.earnedAt)}`}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No badges earned yet" />
              )}
            </ProCard>
          </ProCard>
        </Space>
      </PageContainer>
    </EthikosPageShell>
  );
}
