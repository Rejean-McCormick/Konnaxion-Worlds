// FILE: frontend/app/konnected/community-discussions/moderation/page.tsx
﻿'use client';

import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Alert,
  App as AntdApp,
  Badge,
  Button,
  Drawer,
  Modal,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import KonnectedPageShell from '@/app/konnected/KonnectedPageShell';
import { actOnReport, fetchModerationQueue } from '@/services/admin';

const { Text, Paragraph } = Typography;

type ModerationStatus = 'Pending' | 'Resolved' | 'Escalated';

type ModerationTargetType = 'topic' | 'post' | 'user';

type Severity = 'low' | 'medium' | 'high';

interface ModerationQueueItem {
  id: string;
  /** Post / Topic / User */
  targetType: ModerationTargetType;
  /** ID of the target (postId, topicId, userId, etc.) */
  targetId: string;
  /** Human-readable context, e.g. thread title */
  contextTitle?: string;
  /** Short preview of offending content */
  contentPreview?: string;
  /** Who authored the offending content */
  authorName?: string;
  authorId?: string;
  /** Who reported */
  reporterName?: string;
  reporterId?: string;
  /** Primary reason label */
  reason?: string;
  /** Free-text notes / message from reporter */
  reporterMessage?: string;
  /** Number of merged reports for same target */
  reportCount?: number;
  /** When the first report was created (ISO string) */
  createdAt?: string;
  /** When last action occurred (ISO string) */
  lastActionAt?: string;
  /** Current status in queue */
  status: ModerationStatus;
  /** Rough severity bucket */
  severity?: Severity;
}


type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function optionalString(value: unknown): string | undefined {
  return value == null ? undefined : String(value);
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function normalizeTargetType(value: unknown): ModerationTargetType {
  return value === 'topic' || value === 'user' || value === 'post' ? value : 'post';
}

function normalizeSeverity(value: unknown): Severity {
  return value === 'low' || value === 'high' || value === 'medium' ? value : 'medium';
}

function isUnauthorizedError(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.status === 403) return true;
  return isRecord(value.response) && value.response.status === 403;
}

/**
 * Adapt the existing admin moderation payload into the richer
 * ModerationQueueItem shape expected by the KonnectED UI.
 *
 * This is defensive: it works with the current minimal shape
 * (id, content, reporter, type, status) and can absorb future
 * backend fields with zero changes on the frontend.
 */
function adaptModerationItems(raw: unknown): ModerationQueueItem[] {
  const items: unknown[] = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.items)
      ? raw.items
      : [];

  return items.filter(isRecord).map((item): ModerationQueueItem => {
    const status: ModerationStatus =
      item.status === 'Resolved' || item.status === 'Escalated'
        ? item.status
        : 'Pending';

    return {
      id: String(item.id ?? ''),
      targetType: normalizeTargetType(item.targetType ?? item.entityType),
      targetId: String(item.targetId ?? item.postId ?? item.topicId ?? item.userId ?? item.id ?? ''),
      contextTitle: optionalString(item.contextTitle ?? item.threadTitle ?? item.topicTitle),
      contentPreview: optionalString(item.content ?? item.contentSnippet ?? item.preview),
      authorName: optionalString(item.authorName ?? item.offenderName ?? item.user),
      authorId: optionalString(item.authorId ?? item.offenderId),
      reporterName: optionalString(item.reporterName ?? item.reporter),
      reporterId: optionalString(item.reporterId),
      reason: optionalString(item.type ?? item.reason),
      reporterMessage: optionalString(item.message ?? item.notes),
      reportCount: optionalNumber(item.reportCount ?? item.count) ?? 1,
      createdAt: optionalString(item.createdAt ?? item.created_at ?? item.timestamp),
      lastActionAt: optionalString(item.lastActionAt ?? item.updated_at),
      status,
      severity: normalizeSeverity(item.severity ?? item.priority),
    };
  });
}

export default function CommunityModerationPage(): JSX.Element {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [activeStatusFilter, setActiveStatusFilter] = useState<ModerationStatus | 'all'>('Pending');
  const [detailDrawerItem, setDetailDrawerItem] = useState<ModerationQueueItem | null>(null);
  const [globalActionLoading, setGlobalActionLoading] = useState(false);

  const { message } = AntdApp.useApp();

  const {
    data: rawData,
    loading,
    error,
    refresh,
  } = useRequest(fetchModerationQueue);

  const items: ModerationQueueItem[] = useMemo(
    () => adaptModerationItems(rawData),
    [rawData],
  );

  const filteredItems = useMemo(() => {
    if (activeStatusFilter === 'all') return items;
    return items.filter((item) => item.status === activeStatusFilter);
  }, [items, activeStatusFilter]);

  const unauthorized = isUnauthorizedError(error);

  const onSingleAction = async (
    record: ModerationQueueItem,
    action: 'approve' | 'remove',
  ) => {
    try {
      setGlobalActionLoading(true);
      // actOnReport: remove = true => delete, false => keep
      const remove = action === 'remove';
      await actOnReport(record.id, remove);
      message.success(
        remove
          ? 'Content removed and report resolved.'
          : 'Content approved and report resolved.',
      );
      await refresh();
    } catch {
      message.error('Unable to process moderation action. Please try again.');
    } finally {
      setGlobalActionLoading(false);
    }
  };

  const onBulkAction = async (action: 'approve' | 'remove') => {
    if (!selectedRowKeys.length) {
      message.info('Select at least one item to apply a bulk action.');
      return;
    }

    setGlobalActionLoading(true);
    try {
      const remove = action === 'remove';

      const promises = selectedRowKeys.map((id) =>
        actOnReport(String(id), remove).catch((err) => err),
      );

      const results = await Promise.all(promises);
      const failures = results.filter((r) => r instanceof Error);

      if (failures.length === 0) {
        message.success(
          remove
            ? 'Selected content removed and reports resolved.'
            : 'Selected content approved and reports resolved.',
        );
      } else if (failures.length === selectedRowKeys.length) {
        message.error('Bulk action failed for all selected items.');
      } else {
        message.warning(
          'Bulk action completed with some failures. Check the queue and retry if needed.',
        );
      }

      setSelectedRowKeys([]);
      await refresh();
    } catch {
      message.error('Unexpected error while processing bulk action.');
    } finally {
      setGlobalActionLoading(false);
    }
  };

  const severityTag = (severity?: Severity): ReactNode => {
    switch (severity) {
      case 'high':
        return (
          <Tag color="red" icon={<ExclamationCircleOutlined />}>
            High
          </Tag>
        );
      case 'low':
        return <Tag color="green">Low</Tag>;
      case 'medium':
      default:
        return <Tag color="gold">Medium</Tag>;
    }
  };

  const statusBadge = (status: ModerationStatus): ReactNode => {
    switch (status) {
      case 'Resolved':
        return <Badge status="success" text="Resolved" />;
      case 'Escalated':
        return <Badge status="warning" text="Escalated" />;
      case 'Pending':
      default:
        return <Badge status="processing" text="Pending" />;
    }
  };

  const targetTag = (record: ModerationQueueItem): ReactNode => {
    const label =
      record.targetType === 'topic'
        ? 'Topic'
        : record.targetType === 'user'
        ? 'User'
        : 'Post';

    return <Tag>{label}</Tag>;
  };

  const columns: ProColumns<ModerationQueueItem>[] = [
    {
      title: 'Content',
      dataIndex: 'contentPreview',
      width: 320,
      ellipsis: true,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space size={6}>
            {targetTag(record)}
            {record.reason && <Tag>{record.reason}</Tag>}
          </Space>
          {record.contextTitle && (
            <Text strong ellipsis={{ tooltip: record.contextTitle }}>
              {record.contextTitle}
            </Text>
          )}
          {record.contentPreview && (
            <Text type="secondary" ellipsis={{ tooltip: record.contentPreview }}>
              {record.contentPreview}
            </Text>
          )}
          {record.reporterMessage && (
            <Text type="secondary" italic ellipsis={{ tooltip: record.reporterMessage }}>
              Reporter note: {record.reporterMessage}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'People',
      dataIndex: 'authorName',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          {record.authorName && (
            <Text>
              Author: <Text strong>{record.authorName}</Text>
            </Text>
          )}
          {record.reporterName && (
            <Text type="secondary">
              Reported by {record.reporterName}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Reports',
      dataIndex: 'reportCount',
      width: 120,
      align: 'center',
      render: (value, record) => (
        <Space direction="vertical" size={2}>
          <Badge
            count={value ?? 1}
            style={{ backgroundColor: '#722ed1' }}
            overflowCount={99}
          />
          {severityTag(record.severity)}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 140,
      render: (_, record) => statusBadge(record.status),
      filters: true,
      valueEnum: {
        Pending: { text: 'Pending' },
        Escalated: { text: 'Escalated' },
        Resolved: { text: 'Resolved' },
      },
    },
    {
      title: 'Timeline',
      dataIndex: 'createdAt',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          {record.createdAt && (
            <Text type="secondary">
              Reported{' '}
              {new Date(record.createdAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </Text>
          )}
          {record.lastActionAt && (
            <Text type="secondary">
              Last action{' '}
              {new Date(record.lastActionAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => {
        const disabled = unauthorized || globalActionLoading || record.status === 'Resolved';

        return (
          <Space>
            <Tooltip title="Review full report details">
              <Button
                icon={<EyeOutlined />}
                size="small"
                onClick={() => setDetailDrawerItem(record)}
              />
            </Tooltip>

            <Tooltip title="Content is acceptable, resolve report">
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                type="default"
                disabled={disabled}
                onClick={() => onSingleAction(record, 'approve')}
              >
                Approve
              </Button>
            </Tooltip>

            <Popconfirm
              title="Remove content?"
              description="This will remove the content for everyone and resolve all associated reports."
              okText="Remove"
              okType="danger"
              icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              disabled={disabled}
              onConfirm={() => onSingleAction(record, 'remove')}
            >
              <Tooltip title="Remove content and resolve report">
                <Button
                  size="small"
                  icon={<StopOutlined />}
                  danger
                  disabled={disabled}
                >
                  Remove
                </Button>
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const bulkActions = (
    <Space>
      <Button
        size="small"
        onClick={() => setActiveStatusFilter('Pending')}
        type={activeStatusFilter === 'Pending' ? 'primary' : 'default'}
      >
        Pending
      </Button>
      <Button
        size="small"
        onClick={() => setActiveStatusFilter('Escalated')}
        type={activeStatusFilter === 'Escalated' ? 'primary' : 'default'}
      >
        Escalated
      </Button>
      <Button
        size="small"
        onClick={() => setActiveStatusFilter('Resolved')}
        type={activeStatusFilter === 'Resolved' ? 'primary' : 'default'}
      >
        Resolved
      </Button>
      <Button
        size="small"
        onClick={() => setActiveStatusFilter('all')}
        type={activeStatusFilter === 'all' ? 'primary' : 'default'}
      >
        All
      </Button>
    </Space>
  );

  return (
    <KonnectedPageShell
      title="Community Moderation"
      subtitle="Review and act on reports for forum topics, posts, and users across KonnectED."
      primaryAction={
        <Button
          icon={<ReloadOutlined />}
          onClick={() => refresh()}
          loading={loading || globalActionLoading}
        >
          Refresh Queue
        </Button>
      }
      secondaryActions={bulkActions}
    >
      {unauthorized && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="You do not have permission to moderate community discussions."
          description="If you believe this is an error, contact your KonnectED administrator to be granted a moderator role."
        />
      )}

      {!unauthorized && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Moderation guidelines"
          description={
            <>
              Approve content that aligns with your community guidelines, remove
              content that is harmful or off-topic, and escalate edge cases to
              your administrator. Bulk actions are available for high-volume
              periods.
            </>
          }
        />
      )}

      {error && !unauthorized && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Unable to load moderation queue."
          description="Check your connection or try again. If the problem persists, the moderation service may be unavailable."
        />
      )}

      {items.length === 0 && !loading && !error && (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
          message="No open reports."
          description="Your community is all clear. New reports will show up here as they are created."
        />
      )}

      <ProTable<ModerationQueueItem>
        rowKey="id"
        search={false}
        options={false}
        loading={loading || globalActionLoading}
        columns={columns}
        dataSource={filteredItems}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `${total} reports`,
        }}
        sticky
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        tableAlertRender={({ selectedRowKeys: keys }) => (
          <Space size={8}>
            <Text strong>{keys.length}</Text>
            <Text>selected</Text>
          </Space>
        )}
        tableAlertOptionRender={() => (
          <Space>
            <Tooltip title="Resolve and keep content">
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                disabled={!selectedRowKeys.length || unauthorized}
                onClick={() => onBulkAction('approve')}
              >
                Bulk approve
              </Button>
            </Tooltip>
            <Tooltip title="Remove content and resolve reports">
              <Popconfirm
                title="Remove selected content?"
                description="This will remove content for all selected reports and resolve them."
                okText="Remove"
                okType="danger"
                icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                disabled={!selectedRowKeys.length || unauthorized}
                onConfirm={() => onBulkAction('remove')}
              >
                <Button
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  disabled={!selectedRowKeys.length || unauthorized}
                >
                  Bulk remove
                </Button>
              </Popconfirm>
            </Tooltip>
          </Space>
        )}
        scroll={{ x: 1100 }}
      />

      <Drawer
        title="Report details"
        width={480}
        open={!!detailDrawerItem}
        onClose={() => setDetailDrawerItem(null)}
      >
        {detailDrawerItem && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space>
              {targetTag(detailDrawerItem)}
              {severityTag(detailDrawerItem.severity)}
              {statusBadge(detailDrawerItem.status)}
              {detailDrawerItem.reason && <Tag>{detailDrawerItem.reason}</Tag>}
            </Space>

            {detailDrawerItem.contextTitle && (
              <div>
                <Text strong>Thread / context</Text>
                <Paragraph>{detailDrawerItem.contextTitle}</Paragraph>
              </div>
            )}

            {detailDrawerItem.contentPreview && (
              <div>
                <Text strong>Content preview</Text>
                <Paragraph>{detailDrawerItem.contentPreview}</Paragraph>
              </div>
            )}

            <div>
              <Text strong>People</Text>
              <Paragraph>
                {detailDrawerItem.authorName && (
                  <>
                    Author: <Text strong>{detailDrawerItem.authorName}</Text>
                    <br />
                  </>
                )}
                {detailDrawerItem.reporterName && (
                  <>
                    Reporter: <Text>{detailDrawerItem.reporterName}</Text>
                    <br />
                  </>
                )}
                {detailDrawerItem.reportCount && (
                  <>Reports merged: {detailDrawerItem.reportCount}</>
                )}
              </Paragraph>
            </div>

            {detailDrawerItem.reporterMessage && (
              <div>
                <Text strong>Reporter note</Text>
                <Paragraph>{detailDrawerItem.reporterMessage}</Paragraph>
              </div>
            )}

            <div>
              <Text strong>Timeline</Text>
              <Paragraph type="secondary">
                {detailDrawerItem.createdAt && (
                  <>
                    Reported:{' '}
                    {new Date(detailDrawerItem.createdAt).toLocaleString(
                      undefined,
                      { dateStyle: 'medium', timeStyle: 'short' },
                    )}
                    <br />
                  </>
                )}
                {detailDrawerItem.lastActionAt && (
                  <>
                    Last action:{' '}
                    {new Date(detailDrawerItem.lastActionAt).toLocaleString(
                      undefined,
                      { dateStyle: 'medium', timeStyle: 'short' },
                    )}
                  </>
                )}
              </Paragraph>
            </div>

            <Alert
              type="info"
              showIcon
              message="Next steps"
              description="Use the actions in the table to approve or remove this content. For complex cases, escalate through your admin tools or document decisions in your internal playbook."
            />
          </Space>
        )}
      </Drawer>

      <Modal
        open={false}
        footer={null}
        closable={false}
        destroyOnHidden
        // Reserved for future: escalation / mute / ban workflows
      />
    </KonnectedPageShell>
  );
}

// app/konnected/community-discussions/moderation/page.tsx
