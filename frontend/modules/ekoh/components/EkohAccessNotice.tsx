'use client'

import { Alert, Space, Tag, Typography } from 'antd'

import type { EkohProfile } from '@/services/ekoh'

const { Text } = Typography

function reasonLabel(reason: string): string {
  switch (reason) {
    case 'self': return 'Self access'
    case 'staff': return 'Staff access'
    case 'public_policy': return 'Public rating policy'
    case 'scope_grant': return 'Scoped access grant'
    case 'private_policy': return 'Private rating policy'
    case 'outside_authorized_scope': return 'Outside authorized scope'
    default: return reason || 'Access policy'
  }
}

export default function EkohAccessNotice({ profile }: { profile: EkohProfile }): JSX.Element {
  const access = profile.ratingAccess

  if (!access.allowed) {
    return (
      <Alert
        type="warning"
        showIcon
        message="EkoH ratings are not visible in your current scope"
        description={
          <Space direction="vertical" size={4}>
            <Text>{reasonLabel(access.reason)}</Text>
            <Text type="secondary">
              Identity visibility and EkoH rating visibility are separate policies.
            </Text>
          </Space>
        }
      />
    )
  }

  return (
    <Alert
      type="info"
      showIcon
      message={
        <Space wrap>
          <span>EkoH rating access</span>
          <Tag>{profile.ratingVisibility}</Tag>
          <Tag>{access.level ?? 'ratings'}</Tag>
          {access.scope?.name ? <Tag>{access.scope.name}</Tag> : null}
        </Space>
      }
      description={
        <Space direction="vertical" size={4}>
          <Text>{reasonLabel(access.reason)}</Text>
          {profile.ratingPublicationBasis ? (
            <Text type="secondary">{profile.ratingPublicationBasis}</Text>
          ) : null}
        </Space>
      }
    />
  )
}
