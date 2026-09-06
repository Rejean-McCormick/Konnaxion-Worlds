// FILE: frontend/app/ethikos/admin/roles/page.tsx
'use client';

import { ReloadOutlined } from '@ant-design/icons';
import {
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Alert,
  App as AntdApp,
  Button,
  Segmented,
  Space,
  Statistic,
  Switch,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';

import EthikosPageShell from '@/app/ethikos/EthikosPageShell';
import {
  fetchRoles,
  type RolePayload,
  type RoleRow,
  toggleRole,
} from '@/services/admin';

const { Text } = Typography;

type StatusFilter = 'all' | 'enabled' | 'disabled';

const STATUS_FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Enabled', value: 'enabled' },
  { label: 'Disabled', value: 'disabled' },
];

export default function RoleManagement(): JSX.Element {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const { message } = AntdApp.useApp();

  const {
    data,
    loading,
    error,
    refresh,
  } = useRequest<RolePayload, []>(() => fetchRoles());

  const items = useMemo(() => data?.items ?? [], [data]);

  const stats = useMemo(() => {
    const totalRoles = items.length;
    const enabledRoles = items.filter((role) => role.enabled).length;
    const totalUsers = items.reduce(
      (sum, role) => sum + (role.userCount ?? 0),
      0,
    );

    return {
      totalRoles,
      enabledRoles,
      totalUsers,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (statusFilter === 'enabled') {
      return items.filter((role) => role.enabled);
    }

    if (statusFilter === 'disabled') {
      return items.filter((role) => !role.enabled);
    }

    return items;
  }, [items, statusFilter]);

  const onToggleRole = async (
    role: RoleRow,
    checked: boolean,
  ): Promise<void> => {
    try {
      setUpdatingRoleId(role.id);

      await toggleRole(role.id, checked);

      message.success(
        checked ? `${role.name} enabled.` : `${role.name} disabled.`,
      );

      refresh();
    } catch {
      message.error('Unable to update this role. Please try again.');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const columns: ProColumns<RoleRow>[] = [
    {
      title: 'Role',
      dataIndex: 'name',
      width: 260,
      ellipsis: true,
      render: (_dom, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{row.name}</Text>

          {row.role && (
            <Text type="secondary" ellipsis>
              Permission role: {row.role}
            </Text>
          )}

          {row.topicTitle && (
            <Text type="secondary" ellipsis>
              Topic: {row.topicTitle}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      width: 120,
      align: 'right',
      render: (_dom, row) => <Tag>{row.userCount ?? 0}</Tag>,
    },
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      width: 140,
      render: (_dom, row) => (
        <Switch
          checked={Boolean(row.enabled)}
          loading={updatingRoleId === row.id}
          disabled={loading || updatingRoleId !== null}
          onChange={(checked) => {
            void onToggleRole(row, checked);
          }}
        />
      ),
    },
  ];

  return (
    <EthikosPageShell
      title="Role management"
      sectionLabel="Admin"
      subtitle="Configure who can moderate debates, manage consultations, or access sensitive impact dashboards in Ethikos."
    >
      <PageContainer ghost loading={loading}>
        <Space
          direction="vertical"
          size="middle"
          style={{ width: '100%', marginBottom: 16 }}
        >
          <Alert
            type="info"
            showIcon
            message="Role-based access for Ethikos"
            description={
              <Text type="secondary">
                Use roles to control who can moderate debates, manage
                consultations, or access sensitive impact dashboards. Toggling a
                role updates access for all users in that group.
              </Text>
            }
          />

          {error && (
            <Alert
              type="error"
              showIcon
              message="Unable to load Ethikos roles."
              description="Check your connection or try again. If the problem persists, the Ethikos admin service may be temporarily unavailable."
            />
          )}

          <Space
            align="center"
            style={{
              width: '100%',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
            }}
          >
            <Space size="large" wrap>
              <Statistic title="Defined roles" value={stats.totalRoles} />
              <Statistic title="Enabled roles" value={stats.enabledRoles} />
              <Statistic title="Assigned users" value={stats.totalUsers} />
            </Space>

            <Space wrap>
              <Segmented<StatusFilter>
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                options={STATUS_FILTER_OPTIONS}
              />

              <Button
                icon={<ReloadOutlined />}
                onClick={() => refresh()}
                type="default"
                loading={loading}
                disabled={updatingRoleId !== null}
              >
                Refresh
              </Button>
            </Space>
          </Space>
        </Space>

        <ProTable<RoleRow>
          rowKey="id"
          columns={columns}
          dataSource={filteredItems}
          pagination={false}
          search={false}
          loading={loading}
          options={false}
          toolBarRender={() => [
            <Text key="hint" type="secondary">
              Toggle a role to enable or disable its permissions
              platform-wide.
            </Text>,
          ]}
        />
      </PageContainer>
    </EthikosPageShell>
  );
}