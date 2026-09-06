// FILE: frontend/app/ekoh/achievements-badges/earned-badges-display/page.tsx
'use client';

import { Alert, Card, Empty, List, Space, Tag, Typography } from 'antd';

import EkohPageShell from '@/app/ekoh/EkohPageShell';
import useReputationEvents from '@/hooks/useReputationEvents';
import type { Badge } from '@/services/trust';

const { Paragraph, Text } = Typography;

function earnedDate(value?: string): string {
  if (!value) return 'Date not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export default function EarnedBadgesDisplay(): JSX.Element {
  const { data, isLoading, isError, error } = useReputationEvents();
  const badges = data?.badges ?? [];

  return (
    <EkohPageShell
      title="Achievements & badges"
      subtitle="Activity-backed achievements derived from your current Ethikos participation."
    >
      {isError && (
        <Alert
          type="error"
          showIcon
          message="Unable to load achievements"
          description={(error as Error | undefined)?.message ?? 'Please try again.'}
          style={{ marginBottom: 16 }}
        />
      )}

      <Alert
        type="info"
        showIcon
        message="Badges are evidence-backed"
        description="This page only shows achievements derived from observed Ethikos activity. It does not invent badge levels, dates, or awards."
        style={{ marginBottom: 16 }}
      />

      <Card loading={isLoading}>
        {badges.length ? (
          <List<Badge>
            dataSource={badges}
            renderItem={(badge) => (
              <List.Item key={badge.id}>
                <List.Item.Meta
                  title={
                    <Space wrap>
                      <Text strong>{badge.label}</Text>
                      <Tag color="green">Earned</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={2}>
                      <Paragraph style={{ marginBottom: 0 }}>
                        {badge.description}
                      </Paragraph>
                      <Text type="secondary">
                        Earned: {earnedDate(badge.earnedAt ?? badge.createdAt)}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No earned activity-backed badges yet" />
        )}
      </Card>
    </EkohPageShell>
  );
}
