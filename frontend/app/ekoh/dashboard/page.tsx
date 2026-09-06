// FILE: frontend/app/ekoh/dashboard/page.tsx
'use client';

import { Alert, Card, Col, Empty, List, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import React from 'react';

import EkohPageShell from '@/app/ekoh/EkohPageShell';
import useReputationEvents from '@/hooks/useReputationEvents';
import type { EkohExpertiseScore } from '@/services/trust';

const { Paragraph, Text } = Typography;

function percent(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

export default function EkohDashboard(): JSX.Element {
  const { data, isLoading, isError, error } = useReputationEvents();
  const profile = data?.ekohProfile ?? null;
  const expertise = profile?.expertise ?? [];
  const topDomain = expertise[0];

  return (
    <EkohPageShell
      title="EkoH dashboard"
      subtitle="Domain-specific expertise and trust context used by declared Smart Vote readings."
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
        message="There is no global Smart Vote weight"
        description="Influence is computed only for a specific question or lens by combining the question's declared domain relevance with this profile. EkoH supplies context; Smart Vote publishes the derived reading."
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card loading={isLoading}>
            <Statistic title="Expertise domains" value={expertise.length} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={isLoading}>
            <Statistic
              title="Strongest domain"
              value={topDomain ? percent(topDomain.weightedScore) : 0}
              suffix={topDomain ? '%' : undefined}
            />
            {topDomain && <Tag style={{ marginTop: 8 }}>{topDomain.domainName}</Tag>}
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={isLoading}>
            <Statistic
              title="Ethics / reliability modifier"
              value={profile?.ethicsScore ?? 1}
              precision={2}
              suffix="×"
            />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={isLoading}>
            <Statistic title="Visibility" value={profile?.confidentialityLevel ?? 'N/A'} />
          </Card>
        </Col>
      </Row>

      <Card title="Domain expertise" loading={isLoading} style={{ marginTop: 16 }}>
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
          <Empty description="No canonical EkoH expertise profile available" />
        )}
      </Card>

      <Card title="How this profile is used" style={{ marginTop: 16 }}>
        <Paragraph>
          Each consultation declares which knowledge domains matter and by how much. Smart Vote can then compute an advisory reading from the overlap between those domain weights and each participant's EkoH expertise profile.
        </Paragraph>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Expertise outside the relevant domains does not add contextual influence. The democratic baseline remains visible as a separate reading.
        </Paragraph>
      </Card>
    </EkohPageShell>
  );
}
