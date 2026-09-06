'use client'

import { useRequest } from 'ahooks'
import { Descriptions, Drawer, Empty, Skeleton, Space, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'

import { fetchEkohProfile } from '@/services/ekoh'
import type { EkohProfile } from '@/services/ekoh'

import EkohAccessNotice from './EkohAccessNotice'
import EkohDomainRatings from './EkohDomainRatings'

const { Text, Title } = Typography

export default function EkohRatingDrawer({
  open,
  userId,
  fallbackDisplayName,
  onClose,
  children,
  testId = 'ekoh-rating-drawer',
}: {
  open: boolean
  userId: string | number | null | undefined
  fallbackDisplayName?: string
  onClose: () => void
  children?: (profile: EkohProfile) => ReactNode
  testId?: string
}): JSX.Element {
  const { data: profile, loading } = useRequest(
    () => fetchEkohProfile(userId!),
    {
      ready: open && Boolean(userId),
      refreshDeps: [open, userId],
    },
  )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={580}
      title={`EkoH ratings · ${fallbackDisplayName ?? profile?.displayName ?? 'Participant'}`}
      data-testid={testId}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : !profile ? (
        <Empty description="No EkoH profile is available for this participant." />
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4} style={{ marginBottom: 4 }}>{profile.displayName}</Title>
            <Space wrap>
              <Tag>Identity: {profile.confidentialityLevel}</Tag>
              <Tag>Ratings: {profile.ratingVisibility}</Tag>
            </Space>
          </div>

          <EkohAccessNotice profile={profile} />

          {profile.ratingAccess.allowed ? (
            <>
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="EkoH user ID">{profile.userId}</Descriptions.Item>
                <Descriptions.Item label="Ethics / reliability modifier">
                  {profile.ethicsScore == null ? 'Not available' : `${profile.ethicsScore.toFixed(2)}×`}
                </Descriptions.Item>
                <Descriptions.Item label="Access level">
                  {profile.ratingAccess.level ?? 'ratings'}
                </Descriptions.Item>
              </Descriptions>

              <EkohDomainRatings ratings={profile.expertise} />

              {profile.ratingAccess.level === 'history' && profile.scoreHistory?.length ? (
                <div>
                  <Text strong>Recent rating history</Text>
                  <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                    {profile.scoreHistory.slice(0, 8).map((item, index) => (
                      <Text key={`${item.domainCode}-${item.changedAt}-${index}`} type="secondary">
                        {item.domainName}: {Math.round(item.oldValue * 100)}% → {Math.round(item.newValue * 100)}%
                        {item.changeReason ? ` · ${item.changeReason}` : ''}
                      </Text>
                    ))}
                  </Space>
                </div>
              ) : null}
            </>
          ) : null}

          {children ? children(profile) : null}
        </Space>
      )}
    </Drawer>
  )
}
