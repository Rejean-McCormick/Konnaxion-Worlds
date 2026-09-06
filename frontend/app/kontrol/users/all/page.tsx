// FILE: frontend/app/kontrol/users/all/page.tsx
'use client';

import {
  EllipsisOutlined,
  HistoryOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  type ActionType,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import {
  Avatar,
  Badge,
  Button,
  Descriptions,
  Drawer,
  Dropdown,
  Empty,
  List,
  message,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';

import KontrolPageShell from '@/app/kontrol/KontrolPageShell';

const { Text } = Typography;

// --- Types ---
type UserItem = {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'user';
  status: 'active' | 'banned' | 'pending';
  joinedAt: string;
  lastLogin: string;
  reputationScore: number;
};

type UserApiRecord = {
  id?: number;
  username?: string;
  email?: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  is_active?: boolean;
  joined_at?: string;
  last_login?: string | null;
  reputation_score?: number;
};

type UsersApiResponse = {
  results?: unknown[];
  count?: number;
};

function isUsersApiResponse(data: unknown): data is UsersApiResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    ('results' in data || 'count' in data)
  );
}

export default function AllUsersPage(): JSX.Element {
  const [messageApi, messageContextHolder] = message.useMessage();
  const actionRef = useRef<ActionType>();

  const [currentRow, setCurrentRow] = useState<UserItem | undefined>(
    undefined,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

  const handleAction = (key: string, record: UserItem) => {
    if (key === 'view') {
      setCurrentRow(record);
      setDrawerOpen(true);
    } else if (key === 'ban' || key === 'reset') {
      messageApi.warning(
        'User mutations are unavailable because the current Kontrol user endpoint is read-only.',
      );
    }
  };

  const columns: ProColumns<UserItem>[] = [
    {
      title: 'User',
      dataIndex: 'username',
      copyable: true,
      width: 200,
      render: (dom, entity) => (
        <Space>
          <Avatar
            icon={<UserOutlined />}
            style={{
              backgroundColor:
                entity.role === 'admin'
                  ? '#f56a00'
                  : entity.status === 'banned'
                  ? '#ff4d4f'
                  : '#87d068',
            }}
          />
          <Space direction="vertical" size={0}>
            <Text strong>{entity.username}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              ID: {entity.id}
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      copyable: true,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      valueType: 'select',
      valueEnum: {
        admin: { text: 'Admin', status: 'Error' },
        moderator: { text: 'Moderator', status: 'Warning' },
        user: { text: 'User', status: 'Default' },
      },
      render: (_, entity) => {
        let color: string = 'default';
        if (entity.role === 'admin') color = 'gold';
        if (entity.role === 'moderator') color = 'cyan';
        return <Tag color={color}>{entity.role.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Reputation',
      dataIndex: 'reputationScore',
      sorter: true,
      search: false,
      render: (dom, entity) => (
        <Space>
          <SafetyCertificateOutlined
            style={{
              color:
                entity.reputationScore > 0 ? '#52c41a' : '#ff4d4f',
            }}
          />
          {dom}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      valueEnum: {
        active: { text: 'Active', status: 'Success' },
        banned: { text: 'Banned', status: 'Error' },
        pending: { text: 'Pending', status: 'Processing' },
      },
      render: (_, entity) => {
        const statusMap: Record<
          UserItem['status'],
          { status: 'success' | 'error' | 'warning'; text: string }
        > = {
          active: { status: 'success', text: 'Active' },
          banned: { status: 'error', text: 'Banned' },
          pending: { status: 'warning', text: 'Pending' },
        };
        const s = statusMap[entity.status] ?? statusMap.active;
        return <Badge status={s.status} text={s.text} />;
      },
    },
    {
      title: 'Joined',
      dataIndex: 'joinedAt',
      valueType: 'date',
      search: false,
    },
    {
      title: 'Action',
      valueType: 'option',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                label: 'View details',
                icon: <HistoryOutlined />,
                onClick: () => handleAction('view', record),
              },
              {
                key: 'reset',
                label: 'Reset password',
                disabled: true,
                onClick: () => handleAction('reset', record),
              },
              { type: 'divider' },
              {
                key: 'ban',
                label: 'Ban user',
                disabled: true,
                danger: true,
                icon: <StopOutlined />,
                onClick: () => handleAction('ban', record),
              },
            ],
          }}
        >
          <a key="action">
            <EllipsisOutlined style={{ fontSize: 18 }} />
          </a>
        </Dropdown>
      ),
    },
  ];

  const title = 'User management';
  const subtitle = (
    <>
      Platform-wide view of all users and their access levels across
      Konnaxion modules.
    </>
  );

  const primaryAction = (
    <Button
      type="primary"
      icon={<UserAddOutlined />}
      disabled
      title="User creation is unavailable because the current admin user endpoint is read-only."
    >
      Add user unavailable
    </Button>
  );

  return (
    <KontrolPageShell
      title={title}
      subtitle={subtitle}
      scope="platform"
      moduleKey="kontrol"
      primaryAction={primaryAction}
      maxWidth={1200}
    >
      {messageContextHolder}
      <ProTable<UserItem>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params) => {
          const searchParams = new URLSearchParams();
          if (params.username) {
            searchParams.append(
              'search',
              params.username as string,
            );
          }
          if (params.email) {
            searchParams.append(
              'search',
              params.email as string,
            );
          }

          try {
            const response = await fetch(
              `/api/admin/users/?${searchParams.toString()}`,
            );
            if (!response.ok)
              throw new Error('Failed to fetch users');

            const raw: unknown = await response.json();

            let results: unknown[] = [];

            if (isUsersApiResponse(raw)) {
              results = raw.results ?? [];
            } else if (Array.isArray(raw)) {
              results = raw;
            }

            const mappedData: UserItem[] = results
              .map((u) => {
                const user = u as UserApiRecord;

                let role: UserItem['role'] = 'user';
                if (user.is_superuser) role = 'admin';
                else if (user.is_staff) role = 'moderator';

                let status: UserItem['status'] = 'active';
                if (!user.is_active) status = 'banned';

                if (activeTab === 'banned' && status !== 'banned') {
                  return null;
                }
                if (
                  activeTab === 'admin' &&
                  role === 'user'
                ) {
                  return null;
                }

                return {
                  id: user.id ?? 0,
                  username: user.username ?? 'Unknown',
                  email: user.email ?? '',
                  role,
                  status,
                  joinedAt: user.joined_at ?? '',
                  lastLogin: user.last_login || 'Never',
                  reputationScore: user.reputation_score || 0,
                } as UserItem;
              })
              .filter((u): u is UserItem => u !== null);

            return {
              data: mappedData,
              success: true,
              total: mappedData.length,
            };
          } catch (error) {
             
            console.error(error);
            messageApi.error('Error loading users list');
            return { data: [], success: false };
          }
        }}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        toolbar={{
          menu: {
            type: 'tab',
            activeKey: activeTab,
            items: [
              { key: 'all', label: 'All users' },
              { key: 'banned', label: 'Banned only' },
              { key: 'admin', label: 'Staff (admins)' },
            ],
            onChange: (key) => {
              const k = key ?? 'all';
              setActiveTab(String(k));
              actionRef.current?.reload();
            },
          },
        }}
        pagination={{
          pageSize: 10,
        }}
      />

      {/* Profile Drawer */}
      <Drawer
        width={700}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setCurrentRow(undefined);
        }}
        title={
          <Space>
            <Avatar
              icon={<UserOutlined />}
              src={currentRow?.avatar}
            />
            <span>Profile: {currentRow?.username}</span>
          </Space>
        }
        extra={
          <Button onClick={() => setDrawerOpen(false)}>Close</Button>
        }
      >
        {currentRow && (
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: 'Overview',
                children: (
                  <Space
                    direction="vertical"
                    size="large"
                    style={{ width: '100%' }}
                  >
                    <Descriptions
                      title="Account info"
                      column={2}
                      bordered
                      size="small"
                    >
                      <Descriptions.Item label="User ID">
                        {currentRow.id}
                      </Descriptions.Item>
                      <Descriptions.Item label="Email">
                        {currentRow.email}
                      </Descriptions.Item>
                      <Descriptions.Item label="Role">
                        <Tag color="blue">
                          {currentRow.role.toUpperCase()}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag
                          color={
                            currentRow.status === 'active'
                              ? 'green'
                              : 'red'
                          }
                        >
                          {currentRow.status.toUpperCase()}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Joined date">
                        {currentRow.joinedAt}
                      </Descriptions.Item>
                      <Descriptions.Item label="Last login">
                        {currentRow.lastLogin}
                      </Descriptions.Item>
                    </Descriptions>

                    <Descriptions
                      title="Reputation & trust"
                      column={1}
                      bordered
                      size="small"
                    >
                      <Descriptions.Item label="Reputation score">
                        <Space>
                          <Text
                            strong
                            style={{
                              color:
                                currentRow.reputationScore > 0
                                  ? '#52c41a'
                                  : '#ff4d4f',
                            }}
                          >
                            {currentRow.reputationScore}
                          </Text>
                          <Text type="secondary">
                            (Top 15%)
                          </Text>
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="Trust level">
                        <Badge
                          status="success"
                          text="Verified human"
                        />
                      </Descriptions.Item>
                    </Descriptions>

                    <div
                      style={{
                        background: '#f5f5f5',
                        padding: 16,
                        borderRadius: 8,
                      }}
                    >
                      <Text type="secondary">
                        <SafetyCertificateOutlined /> Admin notes:
                      </Text>
                      <p
                        style={{
                          marginTop: 8,
                          marginBottom: 0,
                        }}
                      >
                        User has been flagged 2 times in the last
                        month for minor spam. Monitoring
                        recommended.
                      </p>
                    </div>
                  </Space>
                ),
              },
              {
                key: '2',
                label: 'Activity log',
                children: (
                  <List
                    dataSource={[
                      {
                        title: 'Posted a comment',
                        time: '2 hours ago',
                      },
                      {
                        title: 'Voted on Proposal #42',
                        time: '1 day ago',
                      },
                      {
                        title: 'Logged in from new IP',
                        time: '3 days ago',
                      },
                      {
                        title: 'Password changed',
                        time: '1 month ago',
                        icon: <LockOutlined />,
                      },
                    ]}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={item.icon || <HistoryOutlined />}
                          title={item.title}
                          description={item.time}
                        />
                      </List.Item>
                    )}
                  />
                ),
              },
              {
                key: '3',
                label: 'Permissions',
                children: (
                  <Empty
                    description="No custom permissions overrides set for this user."
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
              },
            ]}
          />
        )}
      </Drawer>
    </KontrolPageShell>
  );
}
