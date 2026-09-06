// FILE: frontend/app/ekoh/expertise-areas/view-current-expertise/page.tsx
'use client';

import { Alert, Card, Empty, List, Progress, Space, Tag, Typography } from 'antd';

import EkohPageShell from '@/app/ekoh/EkohPageShell';
import useReputationEvents from '@/hooks/useReputationEvents';
import type { EkohExpertiseScore } from '@/services/trust';

const { Paragraph, Text } = Typography;

function percent(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

export default function ViewCurrentExpertise(): JSX.Element {
  const { data, isLoading, isError, error } = useReputationEvents();
  const profile = data?.ekohProfile ?? null;
  const expertise = profile?.expertise ?? [];

  return (
    <EkohPageShell
      title="Current expertise"
      subtitle="Canonical EkoH expertise by domain. No contribution counts or update dates are fabricated."
    >
      {isError && (
        <Alert
          type="error"
          showIcon
          message="Unable to load EkoH expertise"
          description={(error as Error | undefined)?.message ?? 'Please try again.'}
          style={{ marginBottom: 16 }}
        />
      )}

      <Alert
        type="info"
        showIcon
        message="Expertise is domain-specific"
        description="These scores come from the EkoH profile. Smart Vote may use only the domains declared relevant to a particular question."
        style={{ marginBottom: 16 }}
      />

      <Card loading={isLoading}>
        {expertise.length ? (
          <List<EkohExpertiseScore>
            dataSource={expertise}
            renderItem={(item) => {
              const value = percent(item.weightedScore);
              return (
                <List.Item key={item.domainCode}>
                  <div style={{ width: '100%' }}>
                    <Space
                      style={{ width: '100%', justifyContent: 'space-between' }}
                      wrap
                    >
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

      <Card title="Interpretation" style={{ marginTop: 16 }}>
        <Paragraph style={{ marginBottom: 0 }}>
          A domain score is profile context, not a universal voting rank. Question-specific
          influence is calculated separately by Smart Vote from the declared relevance of
          that question.
        </Paragraph>
      </Card>
    </EkohPageShell>
  );
}
