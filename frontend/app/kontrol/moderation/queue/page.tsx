// FILE: frontend/app/kontrol/moderation/queue/page.tsx
'use client';


import {
  CheckCircleOutlined,
  EyeOutlined,
  FlagOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  StopOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  type ActionType,
  ProCard,
  type ProColumns,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components';
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  List,
  message,
  Popconfirm,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';

import { apiFetch } from '@/api';
import KontrolPageShell from '@/app/kontrol/KontrolPageShell';

const { Paragraph, Text } = Typography;

// --- Types ---
type ModerationItem = {
  id: number;
  contentSnippet: string;
  fullContent: string;
  author: string;
  authorReputation: number;
  reportReason: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'resolved';
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'comment' | 'post' | 'user_profile';
  reportCount: number;
  reporters: string[];
};

type ModerationApiRecord = {
  id?: number;
  content_snippet?: string;
  full_content?: string;
  author_username?: string;
  author_reputation_score?: number;
  report_reason?: string;
  created?: string;
  status?: ModerationItem['status'];
  severity?: ModerationItem['severity'];
  target_type?: ModerationItem['type'];
  report_count?: number;
  reporters?: string[];
};

type ModerationApiResponse = {
  count?: number;
  results?: unknown[];
};

function isModerationApiResponse(data: unknown): data is ModerationApiResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    ('results' in data || 'count' in data)
  );
}

export default function ModerationQueuePage(): JSX.Element {
  const [messageApi, messageContextHolder] = message.useMessage();
  const actionRef = useRef<ActionType>();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<ModerationItem | undefined>(
    undefined,
  );

  const handleOpenDrawer = (record: ModerationItem) => {
    setCurrentRow(record);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setCurrentRow(undefined);
  };

  const handleAction = async (
    action: string,
    id: number,
    newStatus: string = 'resolved',
  ) => {
    try {
      messageApi.loading('Processing action...', 0.5);

      const response = await apiFetch(`/api/admin/moderation/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update ticket');

      messageApi.success(`${action} applied successfully`);
      actionRef.current?.reload();
      if (drawerOpen) handleCloseDrawer();
    } catch (error) {
       
      console.error(error);
      messageApi.error('Failed to apply action.');
    }
  };

  const columns: ProColumns<ModerationItem>[] = [
    {
      title: 'Severity',
      dataIndex: 'severity',
      width: 100,
      valueEnum: {
        critical: { text: 'Critical', status: 'Error' },
        high: { text: 'High', status: 'Warning' },
        medium: { text: 'Medium', status: 'Processing' },
        low: { text: 'Low', status: 'Success' },
      },
      sorter: (a, b) => {
        const weight = { critical: 4, high: 3, medium: 2, low: 1 };
        return weight[a.severity] - weight[b.severity];
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      valueType: 'select',
      valueEnum: {
        comment: { text: 'Comment' },
        post: { text: 'Post' },
        user_profile: { text: 'User Profile' },
      },
      width: 120,
    },
    {
      title: 'Content Snippet',
      dataIndex: 'contentSnippet',
      ellipsis: true,
      render: (dom, entity) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Tag color="volcano" icon={<FlagOutlined />}>
              {entity.reportReason}
            </Tag>
            {entity.reportCount > 1 && (
              <Badge
                count={entity.reportCount}
                style={{ backgroundColor: '#f5222d' }}
              />
            )}
          </Space>
          <span
            style={{
              color: '#666',
              fontSize: '13px',
              marginTop: 4,
              display: 'block',
            }}
          >
            "{dom}"
          </span>
        </Space>
      ),
    },
    {
      title: 'Author',
      dataIndex: 'author',
      width: 140,
      copyable: true,
      render: (text, entity) => (
        <Space>
          <Avatar
            size="small"
            icon={<UserOutlined />}
            style={{
              backgroundColor:
                entity.authorReputation < 0 ? '#ff4d4f' : '#87d068',
            }}
          />
          <a>{text}</a>
        </Space>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      valueType: 'dateTime',
      width: 160,
      sorter: true,
      search: false,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      valueType: 'select',
      width: 100,
      valueEnum: {
        pending: { text: 'Pending', status: 'Processing' },
        reviewed: { text: 'Reviewed', status: 'Default' },
        resolved: { text: 'Resolved', status: 'Success' },
      },
    },
    {
      title: 'Actions',
      valueType: 'option',
      width: 160,
      render: (_, record) => [
        <Tooltip title="View details" key="view">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleOpenDrawer(record)}
          />
        </Tooltip>,
        <Tooltip title="Dismiss (resolve)" key="dismiss">
          <Popconfirm
            title="Dismiss report?"
            description="The content will remain visible and ticket marked resolved."
            onConfirm={() =>
              handleAction('Report dismissed', record.id, 'resolved')
            }
          >
            <Button
              type="text"
              icon={<CheckCircleOutlined style={{ color: 'green' }} />}
            />
          </Popconfirm>
        </Tooltip>,
        <Tooltip title="Remove & ban" key="ban">
          <Popconfirm
            title="Remove content & ban user?"
            description="This is a severe action."
            onConfirm={() =>
              handleAction(
                'User banned & content removed',
                record.id,
                'resolved',
              )
            }
            okText="Ban & remove"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              icon={<StopOutlined style={{ color: 'red' }} />}
            />
          </Popconfirm>
        </Tooltip>,
      ],
    },
  ];

  const title = 'Moderation queue';
  const subtitle = (
    <>
      Central queue for reported content across all modules (EkoH, EthiKos,
      KonnectED, keenKonnect, Kreative, Team Builder).
    </>
  );

  const primaryAction = (
    <Button
      key="refresh"
      onClick={() => actionRef.current?.reload()}
    >
      Refresh queue
    </Button>
  );

  const secondaryActions = (
    <Space>
      <Tooltip
        title="This view aggregates moderation tickets from every module. Use module-specific pages only for content context; governance lives here in Kontrol."
      >
        <Button icon={<InfoCircleOutlined />} />
      </Tooltip>
      <Button type="default">Export logs</Button>
    </Space>
  );

  return (
    <KontrolPageShell
      title={title}
      subtitle={subtitle}
      scope="platform"
      metaTitle="Kontrol · Platform · Moderation queue"
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      maxWidth={1200}
    >
      {messageContextHolder}
      <ProTable<ModerationItem>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params) => {
          try {
            const searchParams = new URLSearchParams();
            if (params.status)
              searchParams.append('status', params.status as string);
            if (params.type)
              searchParams.append('search', params.type as string);

            const res = await apiFetch(
              `/api/admin/moderation/?${searchParams.toString()}`,
            );
            if (!res.ok) throw new Error('Failed to fetch tickets');

            const data: unknown = await res.json();

            let results: unknown[] = [];
            let total = 0;

            if (isModerationApiResponse(data)) {
              results = data.results ?? [];
              total = data.count ?? results.length;
            } else if (Array.isArray(data)) {
              results = data;
              total = data.length;
            }

            const mappedData: ModerationItem[] = results.map((item) => {
              const it = item as ModerationApiRecord;
              return {
                id: it.id ?? 0,
                contentSnippet: it.content_snippet ?? '',
                fullContent: it.full_content || it.content_snippet || '',
                author: it.author_username || 'Unknown',
                authorReputation: it.author_reputation_score || 0,
                reportReason: it.report_reason ?? '',
                timestamp: it.created ?? '',
                status: it.status ?? 'pending',
                severity: it.severity ?? 'low',
                type: it.target_type ?? 'comment',
                reportCount: it.report_count || 1,
                reporters: it.reporters || [],
              } as ModerationItem;
            });

            return {
              data: mappedData,
              success: true,
              total,
            };
          } catch (e) {
             
            console.error(e);
            messageApi.error('Error loading moderation queue');
            return { data: [], success: false };
          }
        }}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          pageSize: 10,
        }}
        headerTitle="Active flags"
        toolBarRender={() => [
          <Button key="bulk-approve" type="primary" disabled title="Bulk moderation is not exposed by the current API.">
            Batch dismiss unavailable
          </Button>,
          <Button key="bulk-ban" danger disabled title="Bulk moderation is not exposed by the current API.">
            Batch remove unavailable
          </Button>,
        ]}
      />

      <Drawer
        width={720}
        open={drawerOpen}
        onClose={handleCloseDrawer}
        title={
          <Space>
            <WarningOutlined style={{ color: '#faad14' }} />
            <span>Moderation ticket #{currentRow?.id}</span>
            {currentRow?.severity && (
              <Tag
                color={
                  currentRow.severity === 'critical' ? 'red' : 'blue'
                }
              >
                {currentRow.severity.toUpperCase()}
              </Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            <Button onClick={handleCloseDrawer}>Cancel</Button>
            <Button
              type="primary"
              danger
              onClick={() =>
                currentRow &&
                handleAction(
                  'Content removed',
                  currentRow.id,
                  'resolved',
                )
              }
            >
              Remove content
            </Button>
          </Space>
        }
      >
        {currentRow && (
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: 'Report details',
                children: (
                  <Space
                    direction="vertical"
                    size="middle"
                    style={{ width: '100%' }}
                  >
                    <ProCard
                      split="vertical"
                      bordered
                      headerBordered
                    >
                      <ProCard title="Reporters" colSpan="50%">
                        <List
                          size="small"
                          dataSource={
                            currentRow.reporters &&
                            currentRow.reporters.length > 0
                              ? currentRow.reporters
                              : ['Anonymous reports']
                          }
                          renderItem={(item) => (
                            <List.Item>
                              <UserOutlined /> {item}
                            </List.Item>
                          )}
                        />
                      </ProCard>
                      <ProCard title="Metadata" colSpan="50%">
                        <ProDescriptions
                          column={1}
                          size="small"
                        >
                          <ProDescriptions.Item
                            label="Reason"
                            valueType="text"
                          >
                            <Text strong>
                              {currentRow.reportReason}
                            </Text>
                          </ProDescriptions.Item>
                          <ProDescriptions.Item
                            label="Timestamp"
                            valueType="dateTime"
                          >
                            {currentRow.timestamp}
                          </ProDescriptions.Item>
                          <ProDescriptions.Item label="Type">
                            {currentRow.type}
                          </ProDescriptions.Item>
                        </ProDescriptions>
                      </ProCard>
                    </ProCard>

                    <ProCard
                      bordered
                      headerBordered
                      type="inner"
                      title={
                        <Space>
                          <InfoCircleOutlined /> Content preview
                        </Space>
                      }
                    >
                      <div
                        style={{
                          padding: '16px',
                          background: '#f9f9f9',
                          borderRadius: '6px',
                          border: '1px solid #eee',
                          minHeight: '100px',
                        }}
                      >
                        <Paragraph style={{ marginBottom: 0 }}>
                          {currentRow.fullContent}
                        </Paragraph>
                      </div>
                    </ProCard>
                  </Space>
                ),
              },
              {
                key: '2',
                label: 'Author context',
                children: (
                  <ProCard
                    title={`Author: ${currentRow.author}`}
                    bordered
                    headerBordered
                  >
                    <ProDescriptions column={2}>
                      <ProDescriptions.Item
                        label="Reputation score"
                        valueType="digit"
                      >
                        {currentRow.authorReputation}
                      </ProDescriptions.Item>
                      <ProDescriptions.Item
                        label="Account age"
                        valueType="text"
                      >
                        2.5 years
                      </ProDescriptions.Item>
                      <ProDescriptions.Item
                        label="Previous violations"
                        valueType="digit"
                      >
                        0
                      </ProDescriptions.Item>
                      <ProDescriptions.Item label="Role">
                        User
                      </ProDescriptions.Item>
                    </ProDescriptions>
                    <Button
                      type="link"
                      icon={<HistoryOutlined />}
                    >
                      View full activity log
                    </Button>
                  </ProCard>
                ),
              },
            ]}
          />
        )}
      </Drawer>
    </KontrolPageShell>
  );
}
