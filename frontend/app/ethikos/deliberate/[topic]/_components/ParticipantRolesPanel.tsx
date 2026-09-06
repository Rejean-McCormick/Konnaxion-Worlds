'use client'

import { Button, Card, Empty, List, Space, Spin, Typography } from 'antd'

import ParticipantRoleBadge from '@/modules/ethikos/components/ParticipantRoleBadge'
import type { DiscussionParticipantRoleApi } from '@/services/ethikos'

const { Text } = Typography

export default function ParticipantRolesPanel({
  roles,
  loading,
  onRefresh,
}: {
  roles: DiscussionParticipantRoleApi[]
  loading: boolean
  onRefresh: () => void
}): JSX.Element {
  return (
    <Card
      size="small"
      title="Participant roles"
      extra={
        <Button size="small" loading={loading} onClick={onRefresh}>
          Refresh
        </Button>
      }
    >
      <Spin spinning={loading}>
        {roles.length > 0 ? (
          <List
            size="small"
            dataSource={roles}
            renderItem={(role) => (
              <List.Item key={role.id}>
                <Space direction="vertical" size={4}>
                  <ParticipantRoleBadge
                    participant={role}
                    showUser
                    showDescription
                    compact={false}
                  />
                  {role.assigned_by != null && (
                    <Text type="secondary">
                      Assigned by {String(role.assigned_by)}
                    </Text>
                  )}
                </Space>
              </List.Item>
            )}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No participant roles yet"
          />
        )}
      </Spin>
    </Card>
  )
}
