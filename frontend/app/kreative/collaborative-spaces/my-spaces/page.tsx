'use client'

import { ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Empty, List, Space, Spin, Tag, Typography } from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import KreativePageShell from '@/app/kreative/kreativePageShell'
import { listCollabSessions, type KreativeCollabSession } from '@/services/kreative'
import { fetchCurrentUser, type CurrentUser } from '@/services/user'

const { Text } = Typography

export default function MySpacesPage(): JSX.Element {
  const [sessions, setSessions] = useState<KreativeCollabSession[]>([])
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [currentUser, allSessions] = await Promise.all([
        fetchCurrentUser(),
        listCollabSessions(),
      ])
      setUser(currentUser)
      setSessions(allSessions)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load hosted collaboration sessions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const mine = useMemo(() => {
    if (!user) return []
    return sessions.filter(
      (session) => session.host === user.username || session.host === user.name,
    )
  }, [sessions, user])

  return (
    <KreativePageShell
      title="My Collaborative Spaces"
      subtitle="Sessions hosted by the authenticated user, derived from the real CollabSession API."
      primaryAction={<Button icon={<ReloadOutlined />} onClick={() => void load()}>Refresh</Button>}
    >
      {error ? <Alert type="error" showIcon message="My spaces could not be loaded" description={error} style={{ marginBottom: 16 }} /> : null}
      <Spin spinning={loading}>
        <Card>
          <List
            dataSource={mine}
            locale={{ emptyText: <Empty description="You do not currently host a collaboration session." /> }}
            renderItem={(session) => (
              <List.Item>
                <List.Item.Meta
                  title={session.name}
                  description={
                    <Space wrap>
                      <Tag>{session.session_type}</Tag>
                      <Text type="secondary">Started {new Date(session.started_at).toLocaleString()}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      </Spin>
    </KreativePageShell>
  )
}
