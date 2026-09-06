'use client'

import { ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Empty, Row, Select, Space, Spin, Tag, Typography } from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import KreativePageShell from '@/app/kreative/kreativePageShell'
import { listCollabSessions, type KreativeCollabSession } from '@/services/kreative'

const { Text } = Typography

type SessionFilter = 'all' | KreativeCollabSession['session_type']

export default function FindSpacesPage(): JSX.Element {
  const [sessions, setSessions] = useState<KreativeCollabSession[]>([])
  const [filter, setFilter] = useState<SessionFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSessions(await listCollabSessions())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load collaboration sessions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(
    () => (filter === 'all' ? sessions : sessions.filter((item) => item.session_type === filter)),
    [filter, sessions],
  )

  return (
    <KreativePageShell
      title="Find Collaborative Spaces"
      subtitle="Browse collaboration sessions exposed by the real Kreative CollabSession API."
      primaryAction={<Button icon={<ReloadOutlined />} onClick={() => void load()}>Refresh</Button>}
    >
      {error ? <Alert type="error" showIcon message="Space discovery failed" description={error} style={{ marginBottom: 16 }} /> : null}
      <Space style={{ marginBottom: 16 }}>
        <Text>Session type</Text>
        <Select<SessionFilter>
          value={filter}
          onChange={setFilter}
          style={{ width: 180 }}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Painting', value: 'painting' },
            { label: 'Music', value: 'music' },
            { label: 'Mixed media', value: 'mixed' },
          ]}
        />
      </Space>
      <Spin spinning={loading}>
        {visible.length === 0 ? (
          <Empty description="No collaboration sessions match this filter." />
        ) : (
          <Row gutter={[16, 16]}>
            {visible.map((session) => (
              <Col key={session.id} xs={24} sm={12} lg={8}>
                <Card title={session.name} extra={<Tag>{session.session_type}</Tag>}>
                  <Space direction="vertical" size="small">
                    <Text>Host: {session.host}</Text>
                    <Text type="secondary">Started {new Date(session.started_at).toLocaleString()}</Text>
                    <Tag color={session.ended_at ? 'default' : 'green'}>{session.ended_at ? 'Ended' : 'Active'}</Tag>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </KreativePageShell>
  )
}
