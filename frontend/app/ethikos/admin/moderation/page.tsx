// FILE: frontend/app/ethikos/admin/moderation/page.tsx
'use client';

import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Alert,
  App as AntdApp,
  Badge,
  Button,
  Drawer,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import type { Key, ReactNode } from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import { actOnReport, fetchModerationQueue } from '@/services/admin';

const { Text, Paragraph } = Typography;

type ModerationStatus = 'Pending' | 'Resolved' | 'Escalated';
type ModerationTargetType = 'topic' | 'post' | 'user';
type ModerationSeverity = 'low' | 'medium' | 'high';
type ModerationAction = 'approve' | 'remove';

interface ModerationQueueItem {
  id: string;
  targetType: ModerationTargetType;
  targetId: string;
  contextTitle?: string;
  contentPreview?: string;
  authorName?: string;
  authorId?: string;
  reporterName?: string;
  reporterId?: string;
  reason?: string;
  reporterMessage?: string;
  reportCount?: number;
  createdAt?: string;
  lastActionAt?: string;
  status: ModerationStatus;
  severity?: ModerationSeverity;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function unwrapPayload(raw: unknown): unknown {
  if (!isRecord(raw)) {
    return raw;
  }

  if ('data' in raw && raw.data !== undefined) {
    return raw.data;
  }

  return raw;
}

function extractItems(raw: unknown): unknown[] {
  const payload = unwrapPayload(raw);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (isRecord(payload.data)) {
    if (Array.isArray(payload.data.items)) {
      return payload.data.items;
    }

    if (Array.isArray(payload.data.results)) {
      return payload.data.results;
    }
  }

  return [];
}

function readString(record: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return undefined;
}

function readNumber(record: UnknownRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function coerceStatus(value: unknown): ModerationStatus {
  if (typeof value !== 'string') {
    return 'Pending';
  }

  const normalized = value.toLowerCase();

  if (normalized === 'resolved' || normalized === 'reviewed') {
    return 'Resolved';
  }

  if (normalized === 'escalated') {
    return 'Escalated';
  }

  return 'Pending';
}

function coerceTargetType(value: unknown): ModerationTargetType {
  if (value === 'topic' || value === 'post' || value === 'user') {
    return value;
  }

  if (
    value === 'argument' ||
    value === 'comment' ||
    value === 'message' ||
    value === 'reply'
  ) {
    return 'post';
  }

  return 'post';
}

function coerceSeverity(value: unknown): ModerationSeverity {
  if (value === 'low' || value === 'medium' || value === 'high') {
    return value;
  }

  if (value === 'critical') {
    return 'high';
  }

  return 'medium';
}

function adaptModerationItems(raw: unknown): ModerationQueueItem[] {
  return extractItems(raw)
    .filter(isRecord)
    .map((item, index): ModerationQueueItem => {
      const id =
        readString(item, ['id', 'reportId', 'report_id']) ??
        `moderation-report-${index}`;

      return {
        id,
        targetType: coerceTargetType(
          item.targetType ??
            item.target_type ??
            item.entityType ??
            item.entity_type ??
            item.type,
        ),
        targetId:
          readString(item, [
            'targetId',
            'target_id',
            'argumentId',
            'argument_id',
            'postId',
            'post_id',
            'topicId',
            'topic_id',
            'userId',
            'user_id',
            'id',
          ]) ?? id,
        contextTitle: readString(item, [
          'contextTitle',
          'context_title',
          'threadTitle',
          'thread_title',
          'topicTitle',
          'topic_title',
          'debateTitle',
          'debate_title',
        ]),
        contentPreview: readString(item, [
          'contentPreview',
          'content_preview',
          'contentSnippet',
          'content_snippet',
          'content',
          'preview',
        ]),
        authorName: readString(item, [
          'authorName',
          'author_name',
          'offenderName',
          'offender_name',
          'user',
          'username',
          'author',
        ]),
        authorId: readString(item, [
          'authorId',
          'author_id',
          'offenderId',
          'offender_id',
          'userId',
          'user_id',
        ]),
        reporterName: readString(item, [
          'reporterName',
          'reporter_name',
          'reporter',
        ]),
        reporterId: readString(item, ['reporterId', 'reporter_id']),
        reason: readString(item, [
          'reason',
          'reportReason',
          'report_reason',
          'category',
          'type',
        ]),
        reporterMessage: readString(item, [
          'reporterMessage',
          'reporter_message',
          'message',
          'notes',
        ]),
        reportCount:
          readNumber(item, ['reportCount', 'report_count', 'count']) ?? 1,
        createdAt: readString(item, [
          'createdAt',
          'created_at',
          'timestamp',
          'reportedAt',
          'reported_at',
        ]),
        lastActionAt: readString(item, [
          'lastActionAt',
          'last_action_at',
          'updatedAt',
          'updated_at',
        ]),
        status: coerceStatus(item.status),
        severity: coerceSeverity(item.severity ?? item.priority),
      };
    });
}

function isUnauthorizedError(error: unknown): boolean {
  if (!isRecord(error)) {
    return false;
  }

  if (error.status === 403) {
    return true;
  }

  const response = error.response;

  return isRecord(response) && response.status === 403;
}

function formatDate(value?: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function EthikosModerationPage(): JSX.Element {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [activeStatusFilter, setActiveStatusFilter] = useState<
    ModerationStatus | 'all'
  >('Pending');
  const [detailDrawerItem, setDetailDrawerItem] =
    useState<ModerationQueueItem | null>(null);
  const [globalActionLoading, setGlobalActionLoading] = useState(false);

  const { message } = AntdApp.useApp();

  const {
    data: rawData,
    loading,
    error,
    refresh,
  } = useRequest(fetchModerationQueue);

  const items = useMemo(() => adaptModerationItems(rawData), [rawData]);

  const filteredItems = useMemo(() => {
    if (activeStatusFilter === 'all') {
      return items;
    }

    return items.filter((item) => item.status === activeStatusFilter);
  }, [activeStatusFilter, items]);

  const unauthorized = isUnauthorizedError(error);
  const selectedCount = selectedRowKeys.length;

  const onSingleAction = async (
    record: ModerationQueueItem,
    action: ModerationAction,
  ): Promise<void> => {
    try {
      setGlobalActionLoading(true);

      const remove = action === 'remove';

      await actOnReport(record.id, remove);

      message.success(
        remove
          ? 'Debate content removed and report resolved.'
          : 'Content approved and report resolved.',
      );

      refresh();
    } catch {
      message.error('Unable to process moderation action. Please try again.');
    } finally {
      setGlobalActionLoading(false);
    }
  };

  const onBulkAction = async (action: ModerationAction): Promise<void> => {
    if (selectedRowKeys.length === 0) {
      message.info('Select at least one report to apply a bulk action.');
      return;
    }

    setGlobalActionLoading(true);

    try {
      const remove = action === 'remove';

      const results = await Promise.allSettled(
        selectedRowKeys.map((id) => actOnReport(String(id), remove)),
      );

      const failures = results.filter((result) => result.status === 'rejected');

      if (failures.length === 0) {
        message.success(
          remove
            ? 'Selected content removed and reports resolved.'
            : 'Selected content approved and reports resolved.',
        );
      } else if (failures.length === selectedRowKeys.length) {
        message.error('Bulk action failed for all selected reports.');
      } else {
        message.warning(
          `${failures.length} report(s) could not be processed. The others were resolved.`,
        );
      }

      setSelectedRowKeys([]);
      refresh();
    } catch {
      message.error('Unable to complete bulk action. Please try again.');
    } finally {
      setGlobalActionLoading(false);
    }
  };

  const severityTag = (severity?: ModerationSeverity): ReactNode => {
    if (!severity) {
      return null;
    }

    const color =
      severity === 'high' ? 'red' : severity === 'medium' ? 'orange' : 'blue';

    const text =
      severity === 'high'
        ? 'High severity'
        : severity === 'medium'
          ? 'Medium'
          : 'Low';

    return (
      <Tag color={color}>
        <ExclamationCircleOutlined /> {text}
      </Tag>
    );
  };

  const targetTag = (record: ModerationQueueItem): ReactNode => {
    const label =
      record.targetType === 'topic'
        ? 'Debate topic'
        : record.targetType === 'user'
          ? 'Participant'
          : 'Argument / post';

    return <Tag>{label}</Tag>;
  };

  const statusBadge = (status: ModerationStatus): ReactNode => {
    if (status === 'Resolved') {
      return (
        <Badge
          status="success"
          text={
            <Space size={4}>
              <CheckCircleOutlined />
              Resolved
            </Space>
          }
        />
      );
    }

    if (status === 'Escalated') {
      return <Badge status="warning" text="Escalated" />;
    }

    return <Badge status="processing" text="Pending review" />;
  };

  const statusFilterButtons = (
    <Space wrap>
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

  const headerActions = (
    <Space wrap>
      {statusFilterButtons}
      <Button
        icon={<ReloadOutlined />}
        onClick={() => refresh()}
        loading={loading || globalActionLoading}
        disabled={unauthorized}
      >
        Refresh queue
      </Button>
    </Space>
  );

  const columns: ProColumns<ModerationQueueItem>[] = [
    {
      title: 'Content',
      dataIndex: 'contentPreview',
      ellipsis: true,
      render: (_dom, record) => (
        <Space direction="vertical" size={2}>
          {record.contextTitle && (
            <Text strong ellipsis>
              {record.contextTitle}
            </Text>
          )}
          <Text type="secondary" ellipsis>
            {record.contentPreview ?? 'No preview available.'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'People',
      dataIndex: 'authorName',
      width: 220,
      render: (_dom, record) => (
        <Space direction="vertical" size={2}>
          {record.authorName && (
            <Text ellipsis>
              Author: <Text strong>{record.authorName}</Text>
            </Text>
          )}
          {record.reporterName && (
            <Text type="secondary" ellipsis>
              Reporter: {record.reporterName}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      width: 210,
      render: (_dom, record) => (
        <Space size={4} wrap>
          {severityTag(record.severity)}
          {record.reason && <Tag>{record.reason}</Tag>}
          {typeof record.reportCount === 'number' && record.reportCount > 1 && (
            <Tag>{record.reportCount} reports</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 170,
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Escalated', value: 'Escalated' },
        { text: 'Resolved', value: 'Resolved' },
      ],
      onFilter: (value, record) => record.status === String(value),
      render: (_dom, record) => statusBadge(record.status),
    },
    {
      title: 'Timeline',
      dataIndex: 'createdAt',
      width: 220,
      render: (_dom, record) => {
        const createdAt = formatDate(record.createdAt);
        const lastActionAt = formatDate(record.lastActionAt);

        return (
          <Text type="secondary">
            {createdAt && (
              <>
                Reported: {createdAt}
                <br />
              </>
            )}
            {lastActionAt && <>Last action: {lastActionAt}</>}
            {!createdAt && !lastActionAt && 'No timestamp'}
          </Text>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 240,
      fixed: 'right',
      render: (_dom, record) => {
        const disabled =
          unauthorized || globalActionLoading || record.status === 'Resolved';

        return (
          <Space size="small" wrap>
            <Tooltip title="View details">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setDetailDrawerItem(record)}
              />
            </Tooltip>

            <Tooltip title="Approve content and resolve report">
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => onSingleAction(record, 'approve')}
                disabled={disabled}
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

  return (
    <EthikosPageShell
      title="Moderation queue"
      sectionLabel="Admin"
      subtitle="Review and act on reports for debate arguments, topics, and participant behaviour."
      secondaryActions={headerActions}
    >
      <PageContainer ghost loading={loading}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {unauthorized && (
            <Alert
              type="error"
              showIcon
              message="You do not have permission to moderate Ethikos debates."
              description="If you believe this is an error, ask an administrator to grant you an Ethikos moderator or admin role."
            />
          )}

          {!unauthorized && (
            <Alert
              type="info"
              showIcon
              message="Ethikos moderation guidelines"
              description="Arguments that receive multiple independent reports may be hidden until review. Approve content that fits the Ethikos charter, remove content that clearly violates it, and escalate borderline or sensitive cases."
            />
          )}

          {error && !unauthorized && (
            <Alert
              type="error"
              showIcon
              message="Unable to load the moderation queue."
              description="Check your connection or try again. If the problem persists, the Ethikos moderation service may be temporarily unavailable."
            />
          )}

          {items.length === 0 && !loading && !error && !unauthorized && (
            <Alert
              type="success"
              showIcon
              message="No open reports."
              description="There are currently no unresolved reports on Ethikos debates."
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
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys([...keys]),
              getCheckboxProps: (record) => ({
                disabled:
                  unauthorized ||
                  globalActionLoading ||
                  record.status === 'Resolved',
              }),
            }}
            tableAlertRender={({ selectedRowKeys: keys }) => (
              <Space size={8}>
                <Text strong>{keys.length}</Text>
                <Text>selected</Text>
              </Space>
            )}
            tableAlertOptionRender={() => (
              <Space wrap>
                <Tooltip title="Content is acceptable; resolve reports and keep the debate visible.">
                  <Button
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => onBulkAction('approve')}
                    disabled={
                      unauthorized || globalActionLoading || selectedCount === 0
                    }
                  >
                    Bulk approve
                  </Button>
                </Tooltip>

                <Popconfirm
                  title="Remove selected content?"
                  description="This will remove content for all selected reports and resolve them."
                  okText="Remove"
                  okType="danger"
                  icon={
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                  }
                  disabled={
                    unauthorized || globalActionLoading || selectedCount === 0
                  }
                  onConfirm={() => onBulkAction('remove')}
                >
                  <Tooltip title="Remove content and resolve selected reports">
                    <Button
                      size="small"
                      danger
                      icon={<StopOutlined />}
                      disabled={
                        unauthorized ||
                        globalActionLoading ||
                        selectedCount === 0
                      }
                    >
                      Bulk remove
                    </Button>
                  </Tooltip>
                </Popconfirm>
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
              <Space
                direction="vertical"
                style={{ width: '100%' }}
                size="middle"
              >
                <Space wrap>
                  {targetTag(detailDrawerItem)}
                  {severityTag(detailDrawerItem.severity)}
                  {statusBadge(detailDrawerItem.status)}
                  {detailDrawerItem.reason && (
                    <Tag>{detailDrawerItem.reason}</Tag>
                  )}
                </Space>

                {detailDrawerItem.contextTitle && (
                  <div>
                    <Text strong>Debate / topic</Text>
                    <Paragraph>{detailDrawerItem.contextTitle}</Paragraph>
                  </div>
                )}

                {detailDrawerItem.contentPreview && (
                  <div>
                    <Text strong>Argument / message</Text>
                    <Paragraph>{detailDrawerItem.contentPreview}</Paragraph>
                  </div>
                )}

                <div>
                  <Text strong>People</Text>
                  <Paragraph>
                    {detailDrawerItem.authorName && (
                      <>
                        Author:{' '}
                        <Text strong>{detailDrawerItem.authorName}</Text>
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
                    {formatDate(detailDrawerItem.createdAt) && (
                      <>
                        Reported: {formatDate(detailDrawerItem.createdAt)}
                        <br />
                      </>
                    )}
                    {formatDate(detailDrawerItem.lastActionAt) && (
                      <>
                        Last action:{' '}
                        {formatDate(detailDrawerItem.lastActionAt)}
                      </>
                    )}
                    {!formatDate(detailDrawerItem.createdAt) &&
                      !formatDate(detailDrawerItem.lastActionAt) &&
                      'No timestamp available.'}
                  </Paragraph>
                </div>

                <Alert
                  type="info"
                  showIcon
                  message="Next steps"
                  description="Use the actions in the table to approve or remove this content. For borderline arguments or repeat offenders, escalate via your internal Ethikos governance process."
                />
              </Space>
            )}
          </Drawer>
        </Space>
      </PageContainer>
    </EthikosPageShell>
  );
}