// FILE: frontend/modules/ethikos/trust/profile/page.tsx
'use client';

import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { Avatar, Descriptions, Tag, Timeline, Typography } from 'antd';

import usePageTitle from '@/hooks/usePageTitle';
import { fetchUserProfile, type ReputationProfile } from '@/services/trust';

const { Text } = Typography;

export default function MyProfile() {
  usePageTitle('Trust · My Profile');

  // ahooks generics: <Data, Params>
  const { data, loading } = useRequest<ReputationProfile, []>(fetchUserProfile);

  const level = data?.level ?? 'Visitor';
  const score = data?.score ?? 0;
  const dimensions = data?.dimensions ?? [];
  const recent = data?.recent ?? [];

  const initial = level.charAt(0);

  return (
    <PageContainer ghost loading={loading}>
      <ProCard split="vertical">
        {/* Left column: compact summary */}
        <ProCard colSpan="25%">
          <Avatar size={120}>{initial}</Avatar>

          <Descriptions size="small" column={1} style={{ marginTop: 16 }}>
            <Descriptions.Item label="Level">
              <Tag color="blue">{level}</Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Reputation score">
              <Text>{score}</Text>
            </Descriptions.Item>

            <Descriptions.Item label="Dimensions">
              {dimensions.length ? (
                dimensions.map((d) => (
                  <Tag key={d.key} style={{ marginBottom: 4 }}>
                    {d.label}: {d.score}
                  </Tag>
                ))
              ) : (
                <Text type="secondary">No reputation data yet</Text>
              )}
            </Descriptions.Item>
          </Descriptions>
        </ProCard>

        {/* Right column: recent activity derived from `recent` */}
        <ProCard title="Recent Activity" ghost>
          {recent.length ? (
            <Timeline
              items={recent.map((item) => ({
                color: item.change >= 0 ? 'green' : 'red',
                children: (
                  <>
                    {item.label} · {item.change >= 0 ? '+' : ''}
                    {item.change}
                  </>
                ),
              }))}
            />
          ) : (
            <Text type="secondary">No recent activity</Text>
          )}
        </ProCard>
      </ProCard>
    </PageContainer>
  );
}
