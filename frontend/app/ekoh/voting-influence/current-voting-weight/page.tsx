// FILE: frontend/app/ekoh/voting-influence/current-voting-weight/page.tsx
'use client';

import { Alert, Card, Empty, List, Progress, Space, Tag, Typography } from 'antd';

import EkohPageShell from '@/app/ekoh/EkohPageShell';
import useReputationEvents from '@/hooks/useReputationEvents';
import type { EkohExpertiseScore } from '@/services/trust';

const { Paragraph, Text } = Typography;

function percent(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

export default function CurrentVotingWeightPage(): JSX.Element {
  const { data, isLoading, isError, error } = useReputationEvents();
  const expertise = data?.ekohProfile?.expertise ?? [];

  return (
    <EkohPageShell
      title="Contextual Smart Vote influence"
      subtitle="Smart Vote influence exists only inside a declared question-specific lens."
    >
      {isError && (
        <Alert
          type="error"
          showIcon
          message="Unable to load EkoH context"
          description={(error as Error | undefined)?.message ?? 'Please try again.'}
          style={{ marginBottom: 16 }}
        />
      )}

      <Alert
        type="info"
        showIcon
        message="There is no global Smart Vote weight"
        description="Every participant remains part of the public baseline. An advisory reading may apply a bounded contextual weight only when a question declares relevant domains and a reproducible Smart Vote lens is computed."
        style={{ marginBottom: 16 }}
      />

      <Card title="EkoH context available to question-specific lenses" loading={isLoading}>
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
                      <Text type="secondary">{value}% profile expertise</Text>
                    </Space>
                    <Progress percent={value} showInfo={false} />
                  </div>
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty description="No EkoH expertise context available" />
        )}
      </Card>

      <Card title="How influence is determined" style={{ marginTop: 16 }}>
        <Paragraph>
          A Smart Vote reading combines the question&apos;s declared domain relevance
          with the participant&apos;s disclosed EkoH expertise and the configured
          ethics/reliability modifier.
        </Paragraph>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          A weight such as 70%, an “average user” comparison, or a “top experts”
          benchmark is not displayed here because no such global measurement exists.
          The actual advisory weight belongs to a specific reading and is shown with
          that question.
        </Paragraph>
      </Card>
    </EkohPageShell>
  );
}
