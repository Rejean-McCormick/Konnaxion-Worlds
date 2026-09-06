'use client'

import {
  BulbOutlined,
  PictureOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  List,
  Row,
  Space,
  Spin,
  Typography,
} from 'antd'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import KreativePageShell from '@/app/kreative/kreativePageShell'
import {
  listKreativeArtworks,
  type KreativeArtwork,
} from '@/services/kreative'

const { Title, Text } = Typography

type QuickLink = {
  title: string
  icon: React.ReactNode
  href: string
}

const quickLinks: QuickLink[] = [
  {
    title: 'Explore Ideas',
    icon: <BulbOutlined style={{ fontSize: 24 }} />,
    href: '/kreative/creative-hub/explore-ideas',
  },
  {
    title: 'Submit Work',
    icon: <UploadOutlined style={{ fontSize: 24 }} />,
    href: '/kreative/creative-hub/submit-creative-work',
  },
  {
    title: 'View Gallery',
    icon: <PictureOutlined style={{ fontSize: 24 }} />,
    href: '/kreative/creative-hub/inspiration-gallery',
  },
]

function artworkImage(artwork: KreativeArtwork): string | null {
  return artwork.media_type === 'image' ? artwork.media_url ?? null : null
}

export default function KreativeDashboardPage(): JSX.Element {
  const router = useRouter()
  const [artworks, setArtworks] = useState<KreativeArtwork[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setArtworks(await listKreativeArtworks())
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Unable to load creative work.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const featured = artworks.find((item) => artworkImage(item)) ?? artworks[0]
  const gallery = artworks.filter((item) => artworkImage(item)).slice(0, 4)

  const topCreator = useMemo(() => {
    const counts = new Map<string, number>()
    for (const artwork of artworks) {
      counts.set(artwork.artist, (counts.get(artwork.artist) ?? 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0] ?? null
  }, [artworks])

  return (
    <KreativePageShell
      title="Kreative Dashboard"
      primaryAction={
        <Button icon={<ReloadOutlined />} onClick={() => void load()}>
          Refresh
        </Button>
      }
    >
      {loadError && (
        <Alert
          type="error"
          showIcon
          message="Kreative data could not be loaded"
          description={loadError}
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loading}>
        <div>
          <Row gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Card title="Featured creative work">
              {!featured ? (
                <Empty description="No creative work has been submitted yet." />
              ) : (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {artworkImage(featured) ? (
                    <img
                      alt={featured.title}
                      src={artworkImage(featured) ?? undefined}
                      style={{
                        display: 'block',
                        width: '100%',
                        maxHeight: 420,
                        objectFit: 'cover',
                        borderRadius: 8,
                      }}
                    />
                  ) : (
                    <Alert
                      type="info"
                      showIcon
                      message="Media unavailable"
                      description="The artwork record exists, but no readable media file is available."
                    />
                  )}
                  <div>
                    <Title level={3} style={{ marginBottom: 4 }}>
                      {featured.title}
                    </Title>
                    <Text type="secondary">
                      {featured.artist} · {featured.media_type}
                    </Text>
                  </div>
                </Space>
              )}
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card title="Top creator">
              {!topCreator ? (
                <Empty description="No creator activity yet." />
              ) : (
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                  <Avatar size={80}>
                    {topCreator[0].charAt(0).toUpperCase()}
                  </Avatar>
                  <Title level={4} style={{ margin: 0 }}>
                    {topCreator[0]}
                  </Title>
                  <Text type="secondary">
                    {topCreator[1]} submitted work{topCreator[1] === 1 ? '' : 's'}
                  </Text>
                </Space>
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} md={16}>
            <Card title="Recent image works">
              {gallery.length === 0 ? (
                <Empty description="No readable image media is available." />
              ) : (
                <Row gutter={[12, 12]}>
                  {gallery.map((item) => (
                    <Col xs={24} sm={12} key={item.id}>
                      <Card size="small" title={item.title}>
                        <img
                          alt={item.title}
                          src={artworkImage(item) ?? undefined}
                          style={{
                            display: 'block',
                            width: '100%',
                            height: 180,
                            objectFit: 'cover',
                            borderRadius: 6,
                          }}
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card title="Quick Links">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {quickLinks.map((link) => (
                  <Button
                    key={link.title}
                    type="primary"
                    block
                    icon={link.icon}
                    onClick={() => router.push(link.href)}
                  >
                    {link.title}
                  </Button>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card title="Recent activity">
              <List
                dataSource={artworks.slice(0, 6)}
                locale={{ emptyText: 'No creative activity recorded yet.' }}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={`${item.artist} submitted “${item.title}”`}
                      description={new Date(item.created_at).toLocaleString()}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
        </div>
      </Spin>
    </KreativePageShell>
  )
}
