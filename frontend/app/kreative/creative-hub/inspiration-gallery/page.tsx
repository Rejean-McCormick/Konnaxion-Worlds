'use client'

import { ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Empty, Modal, Row, Space, Spin, Tag, Typography } from 'antd'
import React, { useCallback, useEffect, useState } from 'react'

import KreativePageShell from '@/app/kreative/kreativePageShell'
import { listKreativeArtworks, type KreativeArtwork } from '@/services/kreative'

const { Paragraph, Text, Title } = Typography

export default function InspirationGalleryPage(): JSX.Element {
  const [works, setWorks] = useState<KreativeArtwork[]>([])
  const [selected, setSelected] = useState<KreativeArtwork | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setWorks(await listKreativeArtworks())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load artwork gallery.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <KreativePageShell
      title="Inspiration Gallery"
      subtitle="Creative works loaded from the real Kreative artwork API."
      primaryAction={<Button icon={<ReloadOutlined />} onClick={() => void load()}>Refresh</Button>}
    >
      {error ? <Alert type="error" showIcon message="Gallery load failed" description={error} style={{ marginBottom: 16 }} /> : null}
      <Spin spinning={loading}>
        {works.length === 0 ? (
          <Empty description="No creative works have been submitted yet." />
        ) : (
          <Row gutter={[16, 16]}>
            {works.map((work) => (
              <Col key={work.id} xs={24} sm={12} md={8}>
                <Card hoverable title={work.title} onClick={() => setSelected(work)}>
                  {work.media_type === 'image' && work.media_url ? (
                    <img
                      alt={work.title}
                      src={work.media_url}
                      style={{ width: '100%', height: 190, objectFit: 'cover', borderRadius: 6, marginBottom: 12 }}
                    />
                  ) : (
                    <Alert type="info" showIcon message={`${work.media_type} work`} style={{ marginBottom: 12 }} />
                  )}
                  <Space direction="vertical" size="small">
                    <Text>{work.artist}</Text>
                    <Space wrap>
                      <Tag>{work.media_type}</Tag>
                      {work.medium ? <Tag>{work.medium}</Tag> : null}
                    </Space>
                    <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>{work.description}</Paragraph>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>

      <Modal open={Boolean(selected)} footer={null} onCancel={() => setSelected(null)} width={760}>
        {selected ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Title level={3}>{selected.title}</Title>
            <Text type="secondary">By {selected.artist}</Text>
            {selected.media_type === 'image' && selected.media_url ? (
              <img alt={selected.title} src={selected.media_url} style={{ width: '100%', maxHeight: 460, objectFit: 'contain' }} />
            ) : null}
            <Paragraph>{selected.description}</Paragraph>
          </Space>
        ) : null}
      </Modal>
    </KreativePageShell>
  )
}
