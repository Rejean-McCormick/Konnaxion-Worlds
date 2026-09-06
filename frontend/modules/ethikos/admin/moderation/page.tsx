// FILE: frontend/modules/ethikos/admin/moderation/page.tsx
'use client'

import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useRequest } from 'ahooks'
import { Button, Popconfirm, Space, Tag, Typography } from 'antd'

import usePageTitle from '@/hooks/usePageTitle'
import {
  actOnReport,
  fetchModerationQueue,
  type ModerationPayload,
  type ModerationQueueItem,
  type ModerationSeverity,
  type ModerationStatus,
} from '@/services/admin'

const { Text } = Typography

type Report = ModerationQueueItem

function severityColor(severity?: ModerationSeverity): string {
  if (severity === 'high') {
    return 'red'
  }

  if (severity === 'medium') {
    return 'orange'
  }

  return 'blue'
}

function statusColor(status: ModerationStatus): string {
  if (status === 'Resolved') {
    return 'green'
  }

  if (status === 'Escalated') {
    return 'orange'
  }

  return 'gold'
}

export default function Moderation(): JSX.Element {
  usePageTitle('Admin · Moderation')

  const { data, loading, refresh } = useRequest<ModerationPayload, []>(
    fetchModerationQueue,
  )

  const handleModeration = async (
    id: string,
    remove: boolean,
  ): Promise<void> => {
    await actOnReport(id, remove)
    refresh()
  }

  const columns: ProColumns<Report>[] = [
    {
      title: 'Content',
      dataIndex: 'contentPreview',
      ellipsis: true,
      render: (_dom, row) => (
        <Space direction="vertical" size={2}>
          {row.contextTitle && <Text strong>{row.contextTitle}</Text>}
          <Text type="secondary">
            {row.contentPreview ?? 'No preview available.'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Reporter',
      dataIndex: 'reporterName',
      width: 160,
      render: (_dom, row) => row.reporterName ?? 'Unknown',
    },
    {
      title: 'Type',
      dataIndex: 'reason',
      width: 180,
      render: (_dom, row) => (
        <Space size={4} wrap>
          <Tag color={severityColor(row.severity)}>
            {row.reason ?? 'Report'}
          </Tag>
          {typeof row.reportCount === 'number' && row.reportCount > 1 && (
            <Tag>{row.reportCount} reports</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 140,
      render: (_dom, row) => (
        <Tag color={statusColor(row.status)}>{row.status}</Tag>
      ),
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Resolved', value: 'Resolved' },
        { text: 'Escalated', value: 'Escalated' },
      ],
      onFilter: (value, row) => row.status === String(value),
    },
    {
      title: 'Actions',
      width: 210,
      render: (_dom, row) =>
        row.status === 'Pending' ? (
          <Space size="small">
            <Popconfirm
              title="Remove content?"
              onConfirm={() => {
                void handleModeration(row.id, true)
              }}
            >
              <Button size="small" danger>
                Remove
              </Button>
            </Popconfirm>

            <Popconfirm
              title="Dismiss report?"
              onConfirm={() => {
                void handleModeration(row.id, false)
              }}
            >
              <Button size="small">Dismiss</Button>
            </Popconfirm>
          </Space>
        ) : null,
    },
  ]

  return (
    <PageContainer ghost loading={loading}>
      <ProTable<Report>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        pagination={{ pageSize: 10 }}
        search={false}
        options={false}
      />
    </PageContainer>
  )
}