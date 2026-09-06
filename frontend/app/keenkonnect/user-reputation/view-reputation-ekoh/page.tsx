// FILE: frontend/app/keenkonnect/user-reputation/view-reputation-ekoh/page.tsx
'use client';

import { Alert, Avatar, Card, Col, Empty, List, Progress, Row, Space, Tag, Timeline, Typography } from 'antd';
import React from 'react';

import KeenPageShell from '@/app/keenkonnect/KeenPageShell';
import useReputationEvents from '@/hooks/useReputationEvents';
import type { EkohExpertiseScore } from '@/services/trust';

const { Paragraph, Text, Title } = Typography;

function percent(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

function initial(value: string): string {
  const trimmed = value.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

export default function ViewReputationEkohPage(): JSX.Element {
  const { data, isLoading, isError, error } = useReputationEvents();
  const ekohProfile = data?.ekohProfile ?? null;
  const activityProfile = data?.profile;
  const timeline = data?.timeline ?? [];
  const badges = data?.badges ?? [];
  const expertise = ekohProfile?.expertise ?? [];
  const displayName =
    ekohProfile?.displayName ??
    activityProfile?.displayName ??
    activityProfile?.username ??
    'Anonymous';

  return (
    <KeenPageShell
      title="EkoH expertise"
      description="Domain-specific expertise context available to KeenKonnect and declared Smart Vote readings."
      metaTitle="KeenKonnect · EkoH expertise"
    >
      {isError && (
        <Alert
          type="error"
          showIcon
          message="Unable to load EkoH profile"
          description={(error as Error | undefined)?.message ?? 'Please try again.'}
          style={{ marginBottom: 16 }}
        />
      )}

      <Alert
        type="info"
        showIcon
        message="Contextual expertise, not a global influence score"
        description="KeenKonnect can use EkoH expertise to discover relevant collaborators. A Smart Vote weight only exists inside a declared decision context; it is not a permanent property of a person."
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card loading={isLoading}>
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
              <Avatar size={80} src={activityProfile?.avatarUrl ?? undefined}>
                {initial(displayName)}
              </Avatar>
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ marginBottom: 4 }}>{displayName}</Title>
                <Text type="secondary">EkoH domain profile</Text>
              </div>
              {ekohProfile ? (
                <Space wrap style={{ justifyContent: 'center' }}>
                  <Tag>{ekohProfile.confidentialityLevel}</Tag>
                  <Tag>{expertise.length} domains</Tag>
                  <Tag>
                    Reliability {ekohProfile.ethicsScore == null
                      ? 'restricted'
                      : `${ekohProfile.ethicsScore.toFixed(2)}×`}
                  </Tag>
                </Space>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No EkoH profile" />
              )}
            </Space>
          </Card>

          <Card title="Profile use" style={{ marginTop: 16 }}>
            <Paragraph style={{ marginBottom: 0 }}>
              Expertise scores help identify contributors whose demonstrated competence matches a project's or consultation's declared domains. They do not create authority outside those domains.
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Expertise by domain" loading={isLoading}>
            {expertise.length ? (
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
            ) : (
              <Empty description="No canonical EkoH expertise scores available" />
            )}
          </Card>

          <Card title="Recent evidence and activity context" style={{ marginTop: 16 }}>
            {timeline.length ? (
              <Timeline
                items={timeline.map((item) => ({
                  key: item.id,
                  children: (
                    <div>
                      <Text strong>{item.title}</Text>
                      <div><Text type="secondary">{item.detail}</Text></div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No recent activity" />
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Badges and discovery signals" style={{ marginTop: 24 }}>
        {badges.length ? (
          <List
            size="small"
            dataSource={badges}
            renderItem={(badge) => (
              <List.Item key={badge.id}>
                <List.Item.Meta title={badge.label} description={badge.description} />
              </List.Item>
            )}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No badges earned yet" />
        )}
        <Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>
          Badges and activity may support discovery, but they are not substitutes for a domain-specific EkoH expertise score or for a declared Smart Vote lens.
        </Paragraph>
      </Card>
    </KeenPageShell>
  );
}
