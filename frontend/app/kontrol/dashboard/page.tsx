'use client'

import {
  AuditOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { ProCard, type ProColumns, ProTable, StatisticCard } from '@ant-design/pro-components'
import {
  Alert,
  Button,
  Col,
  Empty,
  List,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from 'antd'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import KontrolPageShell from '@/app/kontrol/KontrolPageShell'

const { Text, Paragraph } = Typography

type ApiList<T> = T[] | { results?: T[]; count?: number }

type ModerationRecord = {
  id: number
  target_type?: string
  target_id?: string
  report_reason?: string
  report_count?: number
  severity?: string
  status?: string
  content_snippet?: string
}

type AuditRecord = {
  id: number
  actor_name?: string
  actor_username?: string
  action?: string
  module?: string
  target?: string
  created?: string
}

type UserRecord = {
  id: number
  username: string
  is_active?: boolean
  is_staff?: boolean
  is_superuser?: boolean
  joined_at?: string
  last_login?: string | null
}

function rows<T>(payload: ApiList<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results ?? []
}

function count<T>(payload: ApiList<T>): number {
  return Array.isArray(payload) ? payload.length : payload.count ?? rows(payload).length
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`)
  }
  return response.json() as Promise<T>
}

export default function KontrolDashboard(): JSX.Element {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [moderationPayload, setModerationPayload] = useState<ApiList<ModerationRecord>>([])
  const [auditPayload, setAuditPayload] = useState<ApiList<AuditRecord>>([])
  const [usersPayload, setUsersPayload] = useState<ApiList<UserRecord>>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [moderation, audit, users] = await Promise.all([
        getJson<ApiList<ModerationRecord>>('/api/admin/moderation/'),
        getJson<ApiList<AuditRecord>>('/api/admin/audit-log/'),
        getJson<ApiList<UserRecord>>('/api/admin/users/'),
      ])
      setModerationPayload(moderation)
      setAuditPayload(audit)
      setUsersPayload(users)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load Kontrol data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const moderationRows = rows(moderationPayload)
  const auditRows = rows(auditPayload)
  const userRows = rows(usersPayload)
  const pending = moderationRows.filter((item) => item.status !== 'resolved')
  const critical = pending.filter((item) => item.severity === 'critical').length
  const staff = userRows.filter((user) => user.is_staff || user.is_superuser).length
  const active = userRows.filter((user) => user.is_active !== false).length

  const moderationColumns = useMemo<ProColumns<ModerationRecord>[]>(() => [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Type', dataIndex: 'target_type', width: 120 },
    {
      title: 'Reason',
      dataIndex: 'report_reason',
      ellipsis: true,
    },
    {
      title: 'Reports',
      dataIndex: 'report_count',
      width: 90,
      valueType: 'digit',
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      width: 100,
      render: (_, row) => (
        <Tag color={row.severity === 'critical' ? 'red' : row.severity === 'high' ? 'orange' : 'blue'}>
          {(row.severity ?? 'unknown').toUpperCase()}
        </Tag>
      ),
    },
  ], [])

  const runHealthCheck = async () => {
    const hide = message.loading('Checking governance APIs...', 0)
    try {
      await Promise.all([
        getJson('/api/admin/audit-log/'),
        getJson('/api/admin/moderation/'),
        getJson('/api/admin/users/'),
      ])
      message.success('Governance APIs responded successfully.')
    } catch (healthError) {
      message.error(
        healthError instanceof Error ? healthError.message : 'Governance API check failed.',
      )
    } finally {
      hide()
    }
  }

  return (
    <KontrolPageShell
      title="Platform governance dashboard"
      subtitle="Live governance overview backed by Kontrol administration APIs."
      scope="platform"
      metaTitle="Kontrol · Platform · Dashboard"
      primaryAction={
        <Button icon={<ReloadOutlined />} onClick={() => void load()}>
          Refresh
        </Button>
      }
    >
      {error && (
        <Alert
          type="error"
          showIcon
          message="Kontrol data could not be loaded"
          description={error}
          style={{ marginBottom: 16 }}
        />
      )}

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          Values below are derived from the current admin user, moderation and audit endpoints.
          Infrastructure metrics that are not exposed by those contracts are not fabricated here.
        </Paragraph>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{ title: 'Registered users', value: count(usersPayload), prefix: <UserOutlined /> }}
              onClick={() => router.push('/kontrol/users/all')}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{ title: 'Active users', value: active, prefix: <CheckCircleOutlined /> }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{ title: 'Pending moderation', value: pending.length, prefix: <WarningOutlined /> }}
              extra={critical ? <Tag color="red">{critical} critical</Tag> : <Tag color="green">No critical</Tag>}
              onClick={() => router.push('/kontrol/moderation/queue')}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticCard
              loading={loading}
              statistic={{ title: 'Staff / admins', value: staff, prefix: <TeamOutlined /> }}
              onClick={() => router.push('/kontrol/users/all')}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <ProCard
              title={<Space><AuditOutlined /> Moderation queue</Space>}
              headerBordered
              extra={<Button type="link" onClick={() => router.push('/kontrol/moderation/queue')}>View all</Button>}
            >
              <ProTable<ModerationRecord>
                columns={moderationColumns}
                dataSource={pending.slice(0, 6)}
                rowKey="id"
                search={false}
                options={false}
                pagination={false}
                loading={loading}
                locale={{ emptyText: <Empty description="No pending moderation tickets." /> }}
                toolBarRender={false}
              />
            </ProCard>
          </Col>

          <Col xs={24} lg={8}>
            <ProCard
              title="Recent admin activity"
              headerBordered
              extra={<Button type="link" onClick={() => router.push('/kontrol/audit-log')}>View log</Button>}
            >
              <List
                loading={loading}
                dataSource={auditRows.slice(0, 6)}
                locale={{ emptyText: 'No audit activity recorded.' }}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.action || 'Administrative action'}
                      description={
                        <Space size={4} wrap>
                          <Text type="secondary">
                            by {item.actor_name || item.actor_username || 'System'}
                          </Text>
                          {item.module && <Tag>{item.module}</Tag>}
                          {item.created && <Text type="secondary">{new Date(item.created).toLocaleString()}</Text>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </ProCard>
          </Col>
        </Row>

        <ProCard
          title="Governance API health"
          headerBordered
          extra={
            <Button type="primary" onClick={() => void runHealthCheck()}>
              Run live check
            </Button>
          }
        >
          <Alert
            type={error ? 'error' : 'success'}
            showIcon
            message={error ? 'One or more governance APIs failed.' : 'Governance API surfaces are reachable.'}
            description="This check covers the endpoints used by this dashboard; it does not invent database, cache, queue or infrastructure telemetry."
          />
        </ProCard>
      </Space>
    </KontrolPageShell>
  )
}
