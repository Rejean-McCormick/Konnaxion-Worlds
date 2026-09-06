'use client'

import { ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Empty, Row, Space, Spin, Tag, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import KreativePageShell from '@/app/kreative/kreativePageShell'
import { listTraditionEntries, type TraditionEntry } from '@/services/kreative'

const { Paragraph, Text } = Typography

export default function TraditionsArchivePage(): JSX.Element {
  const router = useRouter()
  const [entries, setEntries] = useState<TraditionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setEntries(await listTraditionEntries())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load traditions archive.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <KreativePageShell
      title="Traditions Archive"
      subtitle="Cultural heritage entries persisted through the Kreative traditions API."
      primaryAction={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void load()}>Refresh</Button>
          <Button type="primary" onClick={() => router.push('/kreative/mentorship')}>
            Contribute archive entry
          </Button>
        </Space>
      }
    >
      {error ? <Alert type="error" showIcon message="Archive load failed" description={error} style={{ marginBottom: 16 }} /> : null}
      <Spin spinning={loading}>
        {entries.length === 0 ? (
          <Empty description="No tradition entries are available yet." />
        ) : (
          <Row gutter={[16, 16]}>
            {entries.map((entry) => (
              <Col key={entry.id} xs={24} md={12} lg={8}>
                <Card title={entry.title} extra={<Tag color={entry.approved ? 'green' : 'gold'}>{entry.approved ? 'Approved' : 'Pending'}</Tag>}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text type="secondary">Region: {entry.region || 'Not specified'}</Text>
                    <Paragraph ellipsis={{ rows: 4 }}>{entry.description}</Paragraph>
                    <Text type="secondary">
                      Submitted {new Date(entry.submitted_at).toLocaleString()}
                    </Text>
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
