// FILE: frontend/modules/ethikos/trust/badges/page.tsx
'use client';

import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Badge as AntBadge, Card, Empty } from 'antd';
import dayjs from 'dayjs';

import usePageTitle from '@/hooks/usePageTitle';
import {
  fetchUserBadges,
  type TrustBadgePayload,
  type Badge as UserBadge,
} from '@/services/trust';

function formatEarnedDate(value?: string): string {
  if (!value) {
    return 'Unknown date';
  }

  const parsed = dayjs(value);

  return parsed.isValid() ? parsed.format('MMM D, YYYY') : value;
}

export default function Badges(): JSX.Element {
  usePageTitle('Trust · Badges');

  const { data, loading } = useRequest<TrustBadgePayload, []>(fetchUserBadges);

  const badges: UserBadge[] = data?.earned ?? [];

  return (
    <PageContainer ghost loading={loading}>
      <ProCard gutter={16} wrap>
        {!loading && badges.length === 0 && (
          <Empty description="No badges earned yet" />
        )}

        {badges.map((badge) => {
          const earnedDate = formatEarnedDate(badge.earnedAt);

          return (
            <AntBadge.Ribbon
              text={earnedDate}
              color="green"
              key={badge.id}
            >
              <Card
                title={badge.label}
                style={{ width: 260, marginBottom: 16 }}
              >
                <p>{badge.description}</p>
                <p style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                  Earned on {earnedDate}
                </p>
              </Card>
            </AntBadge.Ribbon>
          );
        })}
      </ProCard>
    </PageContainer>
  );
}