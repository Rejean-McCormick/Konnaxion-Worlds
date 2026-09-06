// FILE: frontend/app/ethikos/admin/audit/page.tsx
'use client';

import {
  ClockCircleOutlined,
  EyeOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
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
  Badge,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Segmented,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { ReactNode } from 'react';
import React from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import {
  type AuditPayload,
  type AuditQueryParams,
  fetchAuditLogs,
  type LogRow,
} from '@/services/audit';

dayjs.extend(relativeTime);

const { Text, Paragraph } = Typography;

type Severity = NonNullable<LogRow['severity']>;
type SeverityFilter = 'all' | Severity;
type TimeWindow = '24h' | '7d' | '30d' | 'all';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
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

function formatDate(value?: string): string {
  if (!value) {
    return 'Unknown';
  }

  const parsed = dayjs(value);

  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : value;
}

function isWithinWindow(log: LogRow, timeWindow: TimeWindow): boolean {
  if (timeWindow === 'all') {
    return true;
  }

  if (!log.ts) {
    return false;
  }

  const timestamp = dayjs(log.ts);

  if (!timestamp.isValid()) {
    return false;
  }

  const now = dayjs();

  const threshold =
    timeWindow === '24h'
      ? now.subtract(24, 'hour')
      : timeWindow === '7d'
        ? now.subtract(7, 'day')
        : now.subtract(30, 'day');

  return timestamp.isAfter(threshold);
}

function severityTag(severity?: LogRow['severity']): ReactNode {
  if (severity === 'critical') {
    return <Tag color="red">critical</Tag>;
  }

  if (severity === 'warn') {
    return <Tag color="orange">warn</Tag>;
  }

  if (severity === 'info') {
    return <Tag color="blue">info</Tag>;
  }

  return <Tag>unknown</Tag>;
}

function statusTag(status?: LogRow['status']): ReactNode {
  if (status === 'ok') {
    return <Tag color="green">ok</Tag>;
  }

  if (status === 'warn') {
    return <Tag color="orange">warn</Tag>;
  }

  if (status === 'error') {
    return <Tag color="red">error</Tag>;
  }

  return <Tag>unknown</Tag>;
}

function normalizeSearch(value: string): string {
  return value.trim();
}

function buildQuery(
  previous: AuditQueryParams,
  searchValue: string,
  severityFilter: SeverityFilter,
): AuditQueryParams {
  const next: AuditQueryParams = {
    ...previous,
    page: 1,
    q: normalizeSearch(searchValue) || undefined,
    severity: severityFilter === 'all' ? undefined : severityFilter,
  };

  return next;
}

export default function AuditLogs(): JSX.Element {
  const [query, setQuery] = React.useState<AuditQueryParams>({
    page: 1,
    pageSize: 20,
    sort: '-ts',
  });
  const [searchValue, setSearchValue] = React.useState('');
  const [severityFilter, setSeverityFilter] =
    React.useState<SeverityFilter>('all');
  const [timeWindow, setTimeWindow] = React.useState<TimeWindow>('7d');
  const [detailRow, setDetailRow] = React.useState<LogRow | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = React.useState<string | null>(
    null,
  );

  const {
    data,
    loading,
    error,
    run,
  } = useRequest<AuditPayload, [AuditQueryParams | undefined]>(
    fetchAuditLogs,
    {
      manual: true,
      onSuccess: () => {
        setLastRefreshedAt(new Date().toISOString());
      },
    },
  );

  React.useEffect(() => {
    run(query);
  }, [query, run]);

  const unauthorized = isUnauthorizedError(error);

  const logs: LogRow[] = data?.items ?? [];

  const visibleLogs = React.useMemo(
    () => logs.filter((log) => isWithinWindow(log, timeWindow)),
    [logs, timeWindow],
  );

  const stats = React.useMemo(() => {
    let infoCount = 0;
    let warnCount = 0;
    let criticalCount = 0;
    let okStatus = 0;
    let warnStatus = 0;
    let errorStatus = 0;

    for (const log of visibleLogs) {
      if (log.severity === 'info') {
        infoCount += 1;
      }

      if (log.severity === 'warn') {
        warnCount += 1;
      }

      if (log.severity === 'critical') {
        criticalCount += 1;
      }

      if (log.status === 'ok') {
        okStatus += 1;
      }

      if (log.status === 'warn') {
        warnStatus += 1;
      }

      if (log.status === 'error') {
        errorStatus += 1;
      }
    }

    return {
      infoCount,
      warnCount,
      criticalCount,
      okStatus,
      warnStatus,
      errorStatus,
      totalCount: data?.total ?? logs.length,
      pageCount: visibleLogs.length,
    };
  }, [data?.total, logs.length, visibleLogs]);

  const applyFilters = React.useCallback(
    (nextSearchValue = searchValue, nextSeverityFilter = severityFilter) => {
      const nextQuery = buildQuery(
        query,
        nextSearchValue,
        nextSeverityFilter,
      );

      setQuery(nextQuery);
    },
    [query, searchValue, severityFilter],
  );

  const refreshLogs = React.useCallback(() => {
    run(query);
  }, [query, run]);

  const handleSearch = React.useCallback(
    (value: string) => {
      const nextSearchValue = normalizeSearch(value);

      setSearchValue(nextSearchValue);
      applyFilters(nextSearchValue, severityFilter);
    },
    [applyFilters, severityFilter],
  );

  const handleSeverityChange = React.useCallback(
    (value: SeverityFilter) => {
      setSeverityFilter(value);
      applyFilters(searchValue, value);
    },
    [applyFilters, searchValue],
  );

  const columns = React.useMemo<ProColumns<LogRow>[]>(
    () => [
      {
        title: 'Time',
        dataIndex: 'ts',
        valueType: 'dateTime',
        width: 180,
        sorter: (left, right) =>
          dayjs(left.ts).valueOf() - dayjs(right.ts).valueOf(),
        render: (_dom, row) => (
          <Space direction="vertical" size={0}>
            <Text>{formatDate(row.ts)}</Text>
            <Text type="secondary">{dayjs(row.ts).fromNow()}</Text>
          </Space>
        ),
      },
      {
        title: 'Actor',
        dataIndex: 'actor',
        width: 180,
        ellipsis: true,
        render: (_dom, row) =>
          row.actor ? (
            <Text>{row.actor}</Text>
          ) : (
            <Text type="secondary">System</Text>
          ),
      },
      {
        title: 'Action',
        dataIndex: 'action',
        width: 220,
        ellipsis: true,
        render: (_dom, row) => (
          <Space direction="vertical" size={0}>
            <Text strong>{row.action}</Text>
            {row.entity && (
              <Text type="secondary">
                {row.entity}
                {row.entityId ? ` #${row.entityId}` : ''}
              </Text>
            )}
          </Space>
        ),
      },
      {
        title: 'Target',
        dataIndex: 'target',
        ellipsis: true,
        render: (_dom, row) =>
          row.target ? (
            <Text>{row.target}</Text>
          ) : (
            <Text type="secondary">No target</Text>
          ),
      },
      {
        title: 'Severity',
        dataIndex: 'severity',
        width: 130,
        filters: [
          { text: 'Info', value: 'info' },
          { text: 'Warn', value: 'warn' },
          { text: 'Critical', value: 'critical' },
        ],
        onFilter: (value, row) => row.severity === String(value),
        render: (_dom, row) => severityTag(row.severity),
      },
      {
        title: 'Outcome',
        dataIndex: 'status',
        width: 120,
        filters: [
          { text: 'OK', value: 'ok' },
          { text: 'Warn', value: 'warn' },
          { text: 'Error', value: 'error' },
        ],
        onFilter: (value, row) => row.status === String(value),
        render: (_dom, row) => statusTag(row.status),
      },
      {
        title: 'Details',
        valueType: 'option',
        width: 110,
        render: (_dom, row) => [
          <Tooltip key="view" title="View audit event details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setDetailRow(row)}
            >
              View
            </Button>
          </Tooltip>,
        ],
      },
    ],
    [],
  );

  const primaryAction = (
    <Button
      icon={<ReloadOutlined />}
      type="primary"
      onClick={refreshLogs}
      loading={loading}
    >
      Refresh
    </Button>
  );

  const secondaryActions = (
    <Space wrap>
      <Input.Search
        allowClear
        placeholder="Search actor, action, target…"
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
        onSearch={handleSearch}
        style={{ width: 280 }}
      />

      <Segmented<SeverityFilter>
        value={severityFilter}
        onChange={handleSeverityChange}
        options={[
          { label: 'All severity', value: 'all' },
          { label: 'Info', value: 'info' },
          { label: 'Warn', value: 'warn' },
          { label: 'Critical', value: 'critical' },
        ]}
      />

      <Segmented<TimeWindow>
        value={timeWindow}
        onChange={setTimeWindow}
        options={[
          { label: '24h', value: '24h' },
          { label: '7d', value: '7d' },
          { label: '30d', value: '30d' },
          { label: 'All', value: 'all' },
        ]}
      />
    </Space>
  );

  return (
    <EthikosPageShell
      title="Audit logs"
      sectionLabel="Admin"
      subtitle="Inspect governance, moderation, and system events across Ethikos."
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
    >
      <PageContainer ghost loading={loading}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {unauthorized && (
            <Alert
              type="error"
              showIcon
              message="Access denied for audit logs."
              description="You need an Ethikos admin role to inspect governance and moderation events."
            />
          )}

          {error && !unauthorized && (
            <Alert
              type="error"
              showIcon
              message="Unable to load audit logs."
              description="Check your connection or retry. The audit service may be temporarily unavailable."
              action={
                <Button size="small" onClick={refreshLogs}>
                  Retry
                </Button>
              }
            />
          )}

          <ProCard gutter={16} wrap>
            <StatisticCard
              colSpan={{ xs: 24, sm: 12, lg: 6 }}
              statistic={{
                title: 'Total events',
                value: stats.totalCount,
                description: (
                  <Text type="secondary">
                    {stats.pageCount} visible in current window
                  </Text>
                ),
              }}
            />

            <StatisticCard
              colSpan={{ xs: 24, sm: 12, lg: 6 }}
              statistic={{
                title: 'Warnings',
                value: stats.warnCount,
                description: (
                  <Space size={4}>
                    <Badge status="warning" />
                    <Text type="secondary">Requires review</Text>
                  </Space>
                ),
              }}
            />

            <StatisticCard
              colSpan={{ xs: 24, sm: 12, lg: 6 }}
              statistic={{
                title: 'Critical',
                value: stats.criticalCount,
                description: (
                  <Space size={4}>
                    <Badge status="error" />
                    <Text type="secondary">High-priority events</Text>
                  </Space>
                ),
              }}
            />

            <StatisticCard
              colSpan={{ xs: 24, sm: 12, lg: 6 }}
              statistic={{
                title: 'Errors',
                value: stats.errorStatus,
                description: (
                  <Text type="secondary">
                    {stats.okStatus} ok · {stats.warnStatus} warn ·{' '}
                    {stats.infoCount} info
                  </Text>
                ),
              }}
            />
          </ProCard>

          <Alert
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            message="Ethikos audit stream"
            description={
              <Space direction="vertical" size={4}>
                <Text type="secondary">
                  Use this page to review moderation actions, governance
                  changes, trust updates, and system-level events.
                </Text>
                {lastRefreshedAt && (
                  <Text type="secondary">
                    Last refreshed: {formatDate(lastRefreshedAt)}
                  </Text>
                )}
              </Space>
            }
          />

          <ProTable<LogRow>
            rowKey="id"
            columns={columns}
            dataSource={visibleLogs}
            loading={loading}
            search={false}
            options={false}
            scroll={{ x: 1100 }}
            pagination={{
              current: query.page ?? data?.page ?? 1,
              pageSize: query.pageSize ?? data?.pageSize ?? 20,
              total: data?.total ?? visibleLogs.length,
              showSizeChanger: true,
              showTotal: (total) => `${total} audit events`,
              onChange: (page, pageSize) => {
                setQuery((previous) => ({
                  ...previous,
                  page,
                  pageSize,
                }));
              },
            }}
            toolBarRender={() => [
              <Space key="filters" wrap>
                <Tag icon={<FilterOutlined />}>
                  {severityFilter === 'all'
                    ? 'All severities'
                    : severityFilter}
                </Tag>
                <Tag icon={<ClockCircleOutlined />}>{timeWindow}</Tag>
              </Space>,
            ]}
            locale={{
              emptyText: unauthorized ? (
                <Empty description="Access denied for audit logs." />
              ) : (
                <Empty description="No audit events to display." />
              ),
            }}
          />

          <Drawer
            title="Audit event details"
            width={520}
            open={!!detailRow}
            onClose={() => setDetailRow(null)}
            destroyOnClose
          >
            {detailRow && (
              <Space
                direction="vertical"
                size="middle"
                style={{ width: '100%' }}
              >
                <Space wrap>
                  {severityTag(detailRow.severity)}
                  {statusTag(detailRow.status)}
                  {detailRow.entity && <Tag>{detailRow.entity}</Tag>}
                  {detailRow.entityId && (
                    <Tag color="purple">#{String(detailRow.entityId)}</Tag>
                  )}
                </Space>

                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Time">
                    {formatDate(detailRow.ts)}
                  </Descriptions.Item>

                  <Descriptions.Item label="Actor">
                    {detailRow.actor || <Text type="secondary">System</Text>}
                  </Descriptions.Item>

                  <Descriptions.Item label="Action">
                    {detailRow.action}
                  </Descriptions.Item>

                  {detailRow.target && (
                    <Descriptions.Item label="Target">
                      {detailRow.target}
                    </Descriptions.Item>
                  )}

                  {detailRow.ip && (
                    <Descriptions.Item label="Source IP">
                      {detailRow.ip}
                    </Descriptions.Item>
                  )}

                  {detailRow.status && (
                    <Descriptions.Item label="Outcome">
                      {statusTag(detailRow.status)}
                    </Descriptions.Item>
                  )}
                </Descriptions>

                {detailRow.meta &&
                  Object.keys(detailRow.meta).length > 0 && (
                    <div>
                      <Text strong>Raw metadata</Text>
                      <Paragraph type="secondary">
                        JSON payload supplied by the backend for this event.
                      </Paragraph>
                      <pre
                        style={{
                          maxHeight: 260,
                          overflow: 'auto',
                          background: '#f5f5f5',
                          padding: 12,
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                      >
                        {JSON.stringify(detailRow.meta, null, 2)}
                      </pre>
                    </div>
                  )}
              </Space>
            )}
          </Drawer>
        </Space>
      </PageContainer>
    </EthikosPageShell>
  );
}