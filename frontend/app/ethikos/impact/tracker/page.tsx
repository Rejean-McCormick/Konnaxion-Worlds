// FILE: frontend/app/ethikos/impact/tracker/page.tsx
'use client';

import {
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
  FlagOutlined,
  LinkOutlined,
  ReloadOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProCard,
  type ProColumns,
  ProTable,
  StatisticCard,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Alert,
  App,
  Button,
  Empty,
  Progress,
  Segmented,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useMemo, useState } from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import {
  fetchImpactTracker,
  type ImpactStatus,
  patchImpactStatus,
  type TrackerItem,
} from '@/services/impact';

dayjs.extend(relativeTime);

const { Paragraph, Text } = Typography;

type TrackerPayload = { items: TrackerItem[] };
type StatusFilter = 'all' | 'active' | 'needs-attention' | ImpactStatus;

type TrackerRow = TrackerItem & {
  action?: string | null;
  actionLabel?: string | null;
  nextMilestone?: string | null;
  next_milestone?: string | null;
  dueAt?: string | null;
  due_at?: string | null;
  evidenceUrl?: string | null;
  evidence_url?: string | null;
  feedbackCount?: number | null;
  feedback_count?: number | null;
  blockedReason?: string | null;
  blocked_reason?: string | null;
};

const STATUS_VALUES: ImpactStatus[] = [
  'Planned',
  'In-Progress',
  'Completed',
  'Blocked',
];

const STATUS_LABELS: Record<ImpactStatus, string> = {
  Planned: 'Planned',
  'In-Progress': 'In progress',
  Completed: 'Completed',
  Blocked: 'Blocked',
};

const STATUS_COLORS: Record<ImpactStatus, string> = {
  Planned: 'default',
  'In-Progress': 'processing',
  Completed: 'success',
  Blocked: 'error',
};

const FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Needs attention', value: 'needs-attention' },
  { label: 'All', value: 'all' },
  { label: 'Planned', value: 'Planned' },
  { label: 'In progress', value: 'In-Progress' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Blocked', value: 'Blocked' },
];

function isActive(status: ImpactStatus): boolean {
  return status === 'Planned' || status === 'In-Progress';
}

function isOverdue(item: TrackerRow): boolean {
  const dueAt = item.dueAt ?? item.due_at;

  if (!dueAt || item.status === 'Completed') {
    return false;
  }

  const parsed = dayjs(dueAt);

  return parsed.isValid() && parsed.isBefore(dayjs(), 'day');
}

function optionalString(
  item: TrackerRow,
  keys: Array<keyof TrackerRow>,
): string | undefined {
  for (const key of keys) {
    const value = item[key];

    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function optionalNumber(
  item: TrackerRow,
  keys: Array<keyof TrackerRow>,
): number | undefined {
  for (const key of keys) {
    const value = item[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

function formatRelative(value?: string | null): string {
  if (!value) {
    return 'No activity yet';
  }

  const parsed = dayjs(value);

  return parsed.isValid() ? parsed.fromNow() : 'Unknown';
}

function formatDate(value?: string | null): string {
  if (!value) {
    return 'No date set';
  }

  const parsed = dayjs(value);

  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : 'Unknown';
}

function route(path: string): string {
  return `${path}${path.includes('?') ? '&' : '?'}sidebar=ethikos`;
}

export default function ImpactTracker(): JSX.Element {
  const { message } = App.useApp();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data, loading, error, mutate, refresh } = useRequest<
    TrackerPayload,
    []
  >(fetchImpactTracker);

  const items = useMemo<TrackerRow[]>(
    () => (data?.items ?? []) as TrackerRow[],
    [data],
  );

  const stats = useMemo(() => {
    const total = items.length;
    const planned = items.filter((item) => item.status === 'Planned').length;
    const inProgress = items.filter(
      (item) => item.status === 'In-Progress',
    ).length;
    const completed = items.filter(
      (item) => item.status === 'Completed',
    ).length;
    const blocked = items.filter((item) => item.status === 'Blocked').length;
    const active = planned + inProgress;
    const overdue = items.filter(isOverdue).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      planned,
      inProgress,
      completed,
      blocked,
      active,
      overdue,
      completionRate,
      needsAttention: blocked + overdue,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') {
      return items;
    }

    if (statusFilter === 'active') {
      return items.filter((item) => isActive(item.status));
    }

    if (statusFilter === 'needs-attention') {
      return items.filter((item) => item.status === 'Blocked' || isOverdue(item));
    }

    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const statusOptions = useMemo(
    () =>
      STATUS_VALUES.map((value) => ({
        value,
        label: STATUS_LABELS[value],
      })),
    [],
  );

  const handleStatusChange = async (
    id: string,
    status: ImpactStatus,
  ): Promise<void> => {
    setUpdatingId(id);

    try {
      await patchImpactStatus(id, status);

      if (data) {
        const next: TrackerPayload = {
          items: data.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status,
                  updatedAt: new Date().toISOString(),
                }
              : item,
          ),
        };

        mutate(next);
      } else {
        refresh();
      }

      message.success('Impact status updated.');
    } catch (requestError) {
      console.error('Failed to update impact status', requestError);
      message.error('Could not update impact status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: ProColumns<TrackerRow>[] = [
    {
      title: 'Decision / promise',
      dataIndex: 'title',
      width: 340,
      ellipsis: true,
      render: (_dom, row) => {
        const action =
          optionalString(row, ['action', 'actionLabel']) ??
          'Follow-up action not specified yet';

        return (
          <Space direction="vertical" size={2}>
            <Text strong>{row.title}</Text>
            <Text type="secondary">{action}</Text>

            {row.status === 'Blocked' ? (
              <Tag icon={<ExclamationCircleOutlined />} color="error">
                Needs unblock
              </Tag>
            ) : null}

            {isOverdue(row) ? (
              <Tag icon={<ClockCircleOutlined />} color="volcano">
                Overdue
              </Tag>
            ) : null}
          </Space>
        );
      },
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      width: 180,
      ellipsis: true,
      render: (_dom, row) =>
        row.owner ? (
          <Text>{row.owner}</Text>
        ) : (
          <Text type="secondary">No owner assigned</Text>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 260,
      render: (_dom, row) => {
        const isUpdating = updatingId === row.id;
        const isDisabled = updatingId !== null && !isUpdating;

        return (
          <Space wrap>
            <Tag color={STATUS_COLORS[row.status]}>
              {STATUS_LABELS[row.status]}
            </Tag>

            <Select<ImpactStatus>
              size="small"
              style={{ minWidth: 140 }}
              value={row.status}
              options={statusOptions}
              loading={isUpdating}
              disabled={isDisabled}
              onChange={(value) => {
                void handleStatusChange(row.id, value);
              }}
            />
          </Space>
        );
      },
    },
    {
      title: 'Next milestone',
      key: 'milestone',
      width: 260,
      render: (_dom, row) => {
        const milestone =
          optionalString(row, ['nextMilestone', 'next_milestone']) ??
          'No milestone recorded';
        const dueAt = row.dueAt ?? row.due_at;

        return (
          <Space direction="vertical" size={2}>
            <Text>{milestone}</Text>
            <Text type={isOverdue(row) ? 'danger' : 'secondary'}>
              Due: {formatDate(dueAt)}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Evidence / feedback',
      key: 'evidence',
      width: 220,
      render: (_dom, row) => {
        const evidenceUrl = optionalString(row, ['evidenceUrl', 'evidence_url']);
        const feedbackCount = optionalNumber(row, [
          'feedbackCount',
          'feedback_count',
        ]);

        return (
          <Space direction="vertical" size={4}>
            {evidenceUrl ? (
              <Button
                size="small"
                icon={<LinkOutlined />}
                href={evidenceUrl}
                target="_blank"
              >
                Evidence
              </Button>
            ) : (
              <Text type="secondary">No evidence linked</Text>
            )}

            <Button
              size="small"
              type="link"
              href={route('/ethikos/impact/feedback')}
              style={{ padding: 0 }}
            >
              {feedbackCount ?? 0} feedback items
            </Button>
          </Space>
        );
      },
    },
    {
      title: 'Last activity',
      dataIndex: 'updatedAt',
      width: 180,
      sorter: (a, b) =>
        dayjs(a.updatedAt).valueOf() - dayjs(b.updatedAt).valueOf(),
      render: (_dom, row) => <Text>{formatRelative(row.updatedAt)}</Text>,
    },
  ];

  const secondaryActions = (
    <Space wrap>
      <Button href={route('/ethikos/impact/outcomes')}>Outcomes</Button>
      <Button href={route('/ethikos/impact/feedback')}>Feedback</Button>
      <Button
        icon={<ReloadOutlined />}
        onClick={() => refresh()}
        type="default"
        loading={loading}
        disabled={updatingId !== null}
      >
        Refresh
      </Button>
    </Space>
  );

  return (
    <EthikosPageShell
      title="Impact tracker"
      sectionLabel="Impact"
      metaTitle="Impact · Tracker"
      subtitle="Follow Ethikos decisions from promise to action, evidence, feedback, and closure."
      secondaryActions={secondaryActions}
    >
      <PageContainer ghost loading={loading}>
        {error ? (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            message="Unable to load impact tracker."
            description="Check the Impact service and retry."
          />
        ) : null}

        <ProCard
          title={
            <Space>
              <FlagOutlined />
              <span>Impact workflow</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <ProCard gutter={[16, 16]} wrap ghost>
            <ProCard colSpan={{ xs: 24, md: 6 }} bordered>
              <Space direction="vertical" size={8}>
                <Space>
                  <AuditOutlined />
                  <Text strong>1. Decision</Text>
                </Space>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Start from a decision, consultation, or deliberation outcome.
                </Paragraph>
              </Space>
            </ProCard>

            <ProCard colSpan={{ xs: 24, md: 6 }} bordered>
              <Space direction="vertical" size={8}>
                <Space>
                  <SendOutlined />
                  <Text strong>2. Action</Text>
                </Space>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Track the follow-up action and assign ownership.
                </Paragraph>
              </Space>
            </ProCard>

            <ProCard colSpan={{ xs: 24, md: 6 }} bordered>
              <Space direction="vertical" size={8}>
                <Space>
                  <FileSearchOutlined />
                  <Text strong>3. Evidence</Text>
                </Space>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Link evidence so progress can be verified, not just claimed.
                </Paragraph>
              </Space>
            </ProCard>

            <ProCard colSpan={{ xs: 24, md: 6 }} bordered>
              <Space direction="vertical" size={8}>
                <Space>
                  <CheckCircleOutlined />
                  <Text strong>4. Closure</Text>
                </Space>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  Close, revise, or unblock the commitment based on results.
                </Paragraph>
              </Space>
            </ProCard>
          </ProCard>
        </ProCard>

        {stats.needsAttention > 0 ? (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={`${stats.needsAttention} tracked item${
              stats.needsAttention === 1 ? '' : 's'
            } need attention`}
            description="Blocked or overdue items should be reviewed before new commitments are added."
          />
        ) : null}

        <ProCard gutter={[16, 16]} wrap style={{ marginBottom: 16 }}>
          <StatisticCard
            colSpan={{ xs: 24, sm: 12, xl: 6 }}
            statistic={{
              title: 'Tracked decisions',
              value: stats.total,
              description: 'Decision outcomes being followed',
            }}
          />

          <StatisticCard
            colSpan={{ xs: 24, sm: 12, xl: 6 }}
            statistic={{
              title: 'Active follow-up',
              value: stats.active,
              description: 'Planned or in progress',
            }}
          />

          <StatisticCard
            colSpan={{ xs: 24, sm: 12, xl: 6 }}
            statistic={{
              title: 'Blocked',
              value: stats.blocked,
              description: 'Needs action or clarification',
            }}
          />

          <StatisticCard
            colSpan={{ xs: 24, sm: 12, xl: 6 }}
            statistic={{
              title: 'Completion rate',
              value: stats.completionRate,
              suffix: '%',
              description: (
                <Progress
                  percent={stats.completionRate}
                  size="small"
                  showInfo={false}
                />
              ),
            }}
          />
        </ProCard>

        <ProCard
          title="Tracked commitments"
          extra={
            <Space wrap>
              <Tooltip title="Active hides completed and blocked items unless selected.">
                <Segmented<StatusFilter>
                  value={statusFilter}
                  options={FILTER_OPTIONS}
                  onChange={(value) => setStatusFilter(value)}
                />
              </Tooltip>
            </Space>
          }
        >
          {filteredItems.length === 0 && !loading ? (
            <Empty description="No tracked commitments match the current filter." />
          ) : (
            <ProTable<TrackerRow>
              rowKey="id"
              columns={columns}
              dataSource={filteredItems}
              pagination={{ pageSize: 12 }}
              search={false}
              options={false}
              loading={loading}
              toolBarRender={() => [
                <Text key="hint" type="secondary">
                  Update status when a decision moves from promise to action,
                  evidence, or closure.
                </Text>,
              ]}
            />
          )}
        </ProCard>
      </PageContainer>
    </EthikosPageShell>
  );
}