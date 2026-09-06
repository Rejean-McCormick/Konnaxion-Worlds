// FILE: frontend/app/kontrol/roles/page.tsx
'use client';

import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  LockOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  type ActionType,
  ProCard,
  type ProColumns,
  ProForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Drawer,
  Dropdown,
  message,
  Space,
  Tag,
  Tree,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';

import KontrolPageShell from '@/app/kontrol/KontrolPageShell';

const { Text } = Typography;

// --- Types ---
type RoleItem = {
  id: string;
  name: string;
  description: string;
  type: 'system' | 'custom';
  userCount: number;
  permissionsCount: number;
  updatedAt: string;
  baseRole: 'admin' | 'moderator' | 'user' | 'guest';
};

// --- Declared role preview data ---
const ROLE_PREVIEW_DATA: RoleItem[] = [
  {
    id: 'ROLE_ADMIN',
    name: 'Super Admin',
    description: 'Full system access. Cannot be deleted.',
    type: 'system',
    userCount: 3,
    permissionsCount: 142,
    updatedAt: '2024-01-01',
    baseRole: 'admin',
  },
  {
    id: 'ROLE_MODERATOR',
    name: 'Global Moderator',
    description: 'Can manage content and users across all modules.',
    type: 'system',
    userCount: 8,
    permissionsCount: 45,
    updatedAt: '2024-03-15',
    baseRole: 'moderator',
  },
  {
    id: 'ROLE_CUST_1',
    name: 'Ethikos Expert',
    description: 'Can moderate Ethikos debates but no user management.',
    type: 'custom',
    userCount: 12,
    permissionsCount: 18,
    updatedAt: '2025-11-20',
    baseRole: 'user',
  },
  {
    id: 'ROLE_CUST_2',
    name: 'Content Creator',
    description: 'Can publish directly to Kreative without approval.',
    type: 'custom',
    userCount: 156,
    permissionsCount: 12,
    updatedAt: '2025-10-05',
    baseRole: 'user',
  },
];

// Declared permission preview tree
const PERMISSION_TREE = [
  {
    title: 'Platform Core',
    key: 'core',
    children: [
      { title: 'View Dashboard', key: 'core.view_dashboard' },
      { title: 'Manage Users', key: 'core.manage_users' },
      { title: 'System Settings', key: 'core.settings' },
    ],
  },
  {
    title: 'Moderation',
    key: 'mod',
    children: [
      { title: 'View Queue', key: 'mod.view_queue' },
      { title: 'Delete Content', key: 'mod.delete_content' },
      { title: 'Ban Users', key: 'mod.ban_users' },
    ],
  },
  {
    title: 'Ethikos (Debates)',
    key: 'ethikos',
    children: [
      { title: 'Create Topic', key: 'ethikos.create_topic' },
      { title: 'Lock Topic', key: 'ethikos.lock_topic' },
      { title: 'Pin Argument', key: 'ethikos.pin_argument' },
    ],
  },
];

export default function RolesPermissionsPage(): JSX.Element {
  const [messageApi, messageContextHolder] = message.useMessage();
  const actionRef = useRef<ActionType>();

  // Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleItem | undefined>(
    undefined,
  );
  const [isEditing, setIsEditing] = useState(false);

  const handleOpenDrawer = (record?: RoleItem) => {
    setCurrentRole(record);
    setIsEditing(!!record);
    setDrawerOpen(true);
  };

  const handleDelete = (role: RoleItem) => {
    messageApi.warning(
      `Role mutation is unavailable for ${role.name}; Kontrol exposes no role-write contract in this build.`,
    );
  };

  const columns: ProColumns<RoleItem>[] = [
    {
      title: 'Role name',
      dataIndex: 'name',
      copyable: true,
      render: (dom, entity) => (
        <Space>
          <SafetyCertificateOutlined
            style={{
              color: entity.type === 'system' ? '#faad14' : '#1890ff',
            }}
          />
          <Space direction="vertical" size={0}>
            <Text strong>{dom}</Text>
            {entity.type === 'system' && (
              <Tag
                bordered={false}
                color="orange"
                style={{
                  fontSize: 10,
                  lineHeight: '14px',
                  padding: '0 4px',
                }}
              >
                SYSTEM
              </Tag>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      ellipsis: true,
      search: false,
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      sorter: (a, b) => a.userCount - b.userCount,
      render: val => (
        <Tag icon={<TeamOutlined />}>
          {val}
        </Tag>
      ),
    },
    {
      title: 'Permissions',
      dataIndex: 'permissionsCount',
      render: val => (
        <Tag color="blue">
          {val} capabilities
        </Tag>
      ),
    },
    {
      title: 'Last updated',
      dataIndex: 'updatedAt',
      valueType: 'date',
      sorter: true,
      search: false,
    },
    {
      title: 'Actions',
      valueType: 'option',
      width: 120,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                label: 'View permissions',
                icon: <EditOutlined />,
                onClick: () => handleOpenDrawer(record),
              },
              {
                key: 'clone',
                label: 'Clone role',
                icon: <CopyOutlined />,
                disabled: true,
              },
              { type: 'divider' },
              {
                key: 'delete',
                label: 'Delete role',
                icon: <DeleteOutlined />,
                danger: true,
                disabled: true,
                onClick: () => handleDelete(record),
              },
            ],
          }}
        >
          <Button
            type="text"
            icon={<EllipsisOutlined style={{ fontSize: 18 }} />}
          />
        </Dropdown>
      ),
    },
  ];

  const title = 'Roles & permissions';
  const subtitle = (
    <>
      Define platform-wide access levels and capabilities across all
      Konnaxion modules.
    </>
  );

  const primaryAction = (
    <Button
      key="create"
      type="primary"
      icon={<PlusOutlined />}
      disabled
      title="Role creation is unavailable until a backend role-write contract exists."
    >
      Create role unavailable
    </Button>
  );

  return (
    <KontrolPageShell
      title={title}
      subtitle={subtitle}
      scope="platform"
      metaTitle="Kontrol · Platform · Roles & permissions"
      primaryAction={primaryAction}
      maxWidth={1200}
    >
      {messageContextHolder}
      <Space
        direction="vertical"
        size="large"
        style={{ width: '100%' }}
      >
        <Alert
          type="warning"
          showIcon
          message="Read-only role preview"
          description="Kontrol does not currently expose a backend role-write contract. The entries below document intended access patterns and cannot be mutated from this screen."
        />
        {/* Scope / impact info for clarity inside Kontrol */}
        <Alert
          type="info"
          showIcon
          message="Platform-level roles"
          description={
            <>
              <Text>
                Changes here apply to the entire Konnaxion platform
                (EkoH, EthiKos, KonnectED, keenKonnect, Kreative, Team
                Builder, etc.).
              </Text>
              <br />
              <Text type="secondary">
                Use module-specific controls in other sections of Kontrol
                (e.g. Moderation by module) when you need to scope access
                to a single module.
              </Text>
            </>
          }
        />

        <ProTable<RoleItem>
          columns={columns}
          actionRef={actionRef}
          cardBordered
          request={async () => ({ data: ROLE_PREVIEW_DATA, success: true })}
          rowKey="id"
          search={{ labelWidth: 'auto' }}
          pagination={{ pageSize: 10 }}
          headerTitle="Active roles"
        />
      </Space>

      {/* --- Role Editor Drawer --- */}
      <Drawer
        width={720}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setCurrentRole(undefined);
        }}
        title={
          isEditing
            ? `Edit role: ${currentRole?.name}`
            : 'Create new role'
        }
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              disabled
              title="Role persistence is not exposed by the backend."
            >
              Save unavailable
            </Button>
          </Space>
        }
      >
        <Space
          direction="vertical"
          size="large"
          style={{ width: '100%' }}
        >
          {/* Warning for System Roles */}
          {currentRole?.type === 'system' && (
            <Alert
              message="System role"
              description="This is a core system role. Some permissions cannot be removed to prevent system lockout."
              type="warning"
              showIcon
              icon={<LockOutlined />}
            />
          )}

          {/* Basic Info Form */}
          <ProCard
            title="Role details"
            bordered
            headerBordered
          >
            <ProForm
              submitter={false}
              initialValues={currentRole}
              disabled
            >
              <ProForm.Group>
                <ProFormText
                  width="md"
                  name="name"
                  label="Role name"
                  placeholder="e.g. Content moderator"
                  rules={[{ required: true }]}
                  disabled={currentRole?.type === 'system'}
                />
                <ProFormSelect
                  width="sm"
                  name="baseRole"
                  label="Base access level"
                  options={[
                    { label: 'Administrator', value: 'admin' },
                    { label: 'Moderator', value: 'moderator' },
                    { label: 'Standard user', value: 'user' },
                  ]}
                  rules={[{ required: true }]}
                  tooltip="Determines the baseline access level before granular permissions are applied."
                />
              </ProForm.Group>
              <ProFormTextArea
                name="description"
                label="Description"
                placeholder="Describe what this role is used for..."
              />
            </ProForm>
          </ProCard>

          {/* Permission Matrix */}
          <ProCard
            title="Capabilities matrix"
            bordered
            headerBordered
            extra={<Button size="small">Select all</Button>}
          >
            <div
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
              }}
            >
              <Tree
                checkable
                defaultExpandAll
                treeData={PERMISSION_TREE}
                defaultCheckedKeys={
                  isEditing
                    ? ['core.view_dashboard', 'ethikos.create_topic']
                    : []
                }
              />
            </div>
          </ProCard>

          {/* Danger Zone (only for custom roles) */}
          {currentRole?.type !== 'system' && isEditing && (
            <ProCard
              title="Danger zone"
              bordered
              headerBordered
              style={{ borderColor: '#ffa39e' }}
              headStyle={{ backgroundColor: '#fff1f0' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Space direction="vertical" size={2}>
                  <Text strong>Delete this role</Text>
                  <Text type="secondary">
                    Once deleted, users with this role will revert to
                    the default &apos;User&apos; role.
                  </Text>
                </Space>
                <Button danger>Delete role</Button>
              </div>
            </ProCard>
          )}
        </Space>
      </Drawer>
    </KontrolPageShell>
  );
}
