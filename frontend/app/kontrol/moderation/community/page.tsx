// FILE: frontend/app/kontrol/moderation/community/page.tsx
'use client';

import {
  ClockCircleOutlined,
  EllipsisOutlined,
  FireOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  type ActionType,
  ProCard,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import {
  Alert,
  Avatar,
  Button,
  Descriptions,
  Drawer,
  Dropdown,
  List,
  Progress,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';

import KontrolPageShell from '@/app/kontrol/KontrolPageShell';

const { Text } = Typography;

// --- Types ---
type CommunityContext = {
  id: string;
  name: string;
  module: 'Ethikos' | 'Ekoh' | 'Konnected' | 'Kreative';
  type: 'Debate' | 'Group' | 'Course' | 'Project';
  activeUsers: number;
  openFlags: number;
  toxicityScore: number; // 0-100
  status: 'active' | 'locked' | 'archived';
  lastActivity: string;
  moderators: string[];
};

// --- Declared preview data: no cross-module community-moderation contract yet ---
const PREVIEW_COMMUNITIES: CommunityContext[] = [
  {
    id: 'ETH-404',
    name: 'Debate: AI Rights & Ethics',
    module: 'Ethikos',
    type: 'Debate',
    activeUsers: 142,
    openFlags: 15,
    toxicityScore: 85,
    status: 'active',
    lastActivity: '2 mins ago',
    moderators: ['@mod_tom'],
  },
  {
    id: 'KON-102',
    name: 'React Learners Group',
    module: 'Konnected',
    type: 'Group',
    activeUsers: 560,
    openFlags: 2,
    toxicityScore: 12,
    status: 'active',
    lastActivity: '1 hour ago',
    moderators: ['@teacher_ann', '@helper_bob'],
  },
  {
    id: 'EKO-991',
    name: 'Proposal #22: Carbon Tax',
    module: 'Ekoh',
    type: 'Debate',
    activeUsers: 89,
    openFlags: 8,
    toxicityScore: 65,
    status: 'locked',
    lastActivity: '1 day ago',
    moderators: [],
  },
  {
    id: 'KRE-005',
    name: 'NFT Showcase: Space Cats',
    module: 'Kreative',
    type: 'Project',
    activeUsers: 1200,
    openFlags: 45,
    toxicityScore: 40,
    status: 'active',
    lastActivity: '5 mins ago',
    moderators: ['@artist_zoe'],
  },
];

export default function CommunityModerationPage(): JSX.Element {
  const actionRef = useRef<ActionType>();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState<
    CommunityContext | undefined
  >(undefined);

  const handleOpenDrawer = (record: CommunityContext) => {
    setCurrentContext(record);
    setDrawerOpen(true);
  };

  const columns: ProColumns<CommunityContext>[] = [
    {
      title: 'Context name',
      dataIndex: 'name',
      copyable: true,
      render: (dom, entity) => (
        <Space>
          <Avatar
            shape="square"
            style={{
              backgroundColor:
                entity.module === 'Ethikos' ? '#722ed1' : '#1890ff',
            }}
          >
            {entity.module[0]}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong>{dom}</Text>
            <Tag
              style={{
                fontSize: 12,
                paddingInline: 8,
                lineHeight: '18px',
                height: 'auto',
              }}
            >
              {entity.type}
            </Tag>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Module',
      dataIndex: 'module',
      valueType: 'select',
      valueEnum: {
        Ethikos: { text: 'Ethikos' },
        Ekoh: { text: 'Ekoh' },
        Konnected: { text: 'Konnected' },
        Kreative: { text: 'Kreative' },
      },
      width: 140,
    },
    {
      title: 'Health (toxicity)',
      dataIndex: 'toxicityScore',
      sorter: (a, b) => a.toxicityScore - b.toxicityScore,
      width: 200,
      render: (_, entity) => (
        <Space>
          <Progress
            type="circle"
            percent={entity.toxicityScore}
            width={32}
            strokeColor={
              entity.toxicityScore > 80
                ? '#ff4d4f'
                : entity.toxicityScore > 50
                ? '#faad14'
                : '#52c41a'
            }
            format={() => ''}
          />
          <Space direction="vertical" size={0}>
            <Text
              type={
                entity.toxicityScore > 80 ? 'danger' : 'secondary'
              }
            >
              {entity.toxicityScore > 80
                ? 'Critical'
                : entity.toxicityScore > 50
                ? 'Heated'
                : 'Healthy'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Higher score = more reported toxicity
            </Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Active flags',
      dataIndex: 'openFlags',
      sorter: (a, b) => a.openFlags - b.openFlags,
      render: (val) => (
        <Tag
          color={Number(val) > 10 ? 'red' : 'default'}
          icon={<WarningOutlined />}
        >
          {val} open
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      valueEnum: {
        active: { text: 'Active', status: 'Success' },
        locked: { text: 'Locked', status: 'Error' },
        archived: { text: 'Archived', status: 'Default' },
      },
    },
    {
      title: 'Actions',
      valueType: 'option',
      width: 80,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'manage',
                label: 'Manage context',
                icon: <SafetyCertificateOutlined />,
                onClick: () => handleOpenDrawer(record),
              },
              {
                key: 'history',
                label: 'View logs',
                icon: <ClockCircleOutlined />,
              },
              { type: 'divider' as const },
              {
                key: 'lock',
                label:
                  record.status === 'locked'
                    ? 'Unlock'
                    : 'Lock thread',
                icon: <LockOutlined />,
                danger: record.status !== 'locked',
              },
            ],
            onClick: () => undefined,
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

  const title = 'Community moderation';
  const subtitle = (
    <>
      Cross-module view of communities (Ethikos, Ekoh, Konnected,
      Kreative) managed from Kontrol.
    </>
  );

  const primaryAction = (
    <Button key="create" type="primary" disabled title="No community-moderation write contract is exposed.">
      New report unavailable
    </Button>
  );

  const secondaryActions = (
    <Space wrap>
      <Tag key="scope-platform" color="blue">
        Moderation · cross-module
      </Tag>
      <Tag key="scope-impact" color="geekblue">
        Actions apply per context
      </Tag>
      <Button
        key="refresh"
        onClick={() => actionRef.current?.reload()}
      >
        Refresh metrics
      </Button>
    </Space>
  );

  return (
    <KontrolPageShell
      title={title}
      subtitle={subtitle}
      scope="platform"
      metaTitle="Kontrol · Platform · Community moderation"
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      maxWidth={1200}
    >
      <>
        <Alert
          type="info"
          showIcon
          message="Community moderation preview"
          description="This cross-module moderation view uses declared preview data. No community-level moderation mutation contract is exposed, so lock, flag-clear, moderator assignment and freeze controls are read-only."
          style={{ marginBottom: 16 }}
        />
        <ProTable<CommunityContext>
          columns={columns}
          actionRef={actionRef}
          cardBordered
          request={async () => ({
            data: PREVIEW_COMMUNITIES,
            success: true,
          })}
          rowKey="id"
          search={{
            labelWidth: 'auto',
            span: {
              xs: 24,
              sm: 12,
              md: 8,
              lg: 6,
              xl: 6,
              xxl: 6, // added to satisfy SpanConfig
            },
          }}
          pagination={{ pageSize: 10 }}
          headerTitle="Context health monitor"
          toolBarRender={() => [
            <Button key="filter" icon={<FireOutlined />}>
              High toxicity only
            </Button>,
          ]}
        />

        {/* --- Context Management Drawer --- */}
        <Drawer
          width={600}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setCurrentContext(undefined);
          }}
          title={
            currentContext
              ? `Manage: ${currentContext.name}`
              : 'Context manager'
          }
        >
          {currentContext && (
            <Space
              direction="vertical"
              size="large"
              style={{ width: '100%' }}
            >
              {/* Scope / module context */}
              <Space>
                <Tag color="blue">
                  Module: {currentContext.module}
                </Tag>
                <Tag>{currentContext.type}</Tag>
                <Tag color="geekblue">
                  Scope: this community only
                </Tag>
              </Space>

              {/* Health Banner */}
              {currentContext.toxicityScore > 70 && (
                <Alert
                  message="High toxicity detected"
                  description="This context has an unusually high rate of reported content. Consider enabling Slow Mode or assigning temporary moderators."
                  type="error"
                  showIcon
                />
              )}

              {/* Quick Controls */}
              <ProCard
                title="Governance controls"
                bordered
                headerBordered
              >
                <Space
                  direction="vertical"
                  style={{ width: '100%' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text>
                      <LockOutlined /> Lock context (read-only)
                    </Text>
                    <Switch
                      checked={currentContext.status === 'locked'}
                      disabled
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text>
                      <ClockCircleOutlined /> Slow mode (1
                      post/10m)
                    </Text>
                    <Switch disabled />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text>
                      <StopOutlined /> Require approval for new
                      users
                    </Text>
                    <Switch defaultChecked disabled />
                  </div>
                </Space>
              </ProCard>

              {/* Metrics */}
              <Descriptions
                title="Live metrics"
                bordered
                size="small"
                column={2}
              >
                <Descriptions.Item label="Active users">
                  {currentContext.activeUsers}
                </Descriptions.Item>
                <Descriptions.Item label="Open flags">
                  {currentContext.openFlags}
                </Descriptions.Item>
                <Descriptions.Item label="Last activity">
                  {currentContext.lastActivity}
                </Descriptions.Item>
                <Descriptions.Item label="Total comments">
                  8,921
                </Descriptions.Item>
              </Descriptions>

              {/* Moderators List */}
              <List
                header={<Text strong>Assigned moderators</Text>}
                bordered
                dataSource={currentContext.moderators}
                renderItem={(item) => (
                  <List.Item
                    actions={[<Text key="remove" type="secondary">Read-only</Text>]}
                  >
                    <Space>
                      <Avatar
                        size="small"
                        icon={<TeamOutlined />}
                      />
                      {item}
                    </Space>
                  </List.Item>
                )}
                footer={
                  <Button
                    type="dashed"
                    block
                    icon={<TeamOutlined />}
                    disabled
                  >
                    Assign moderator unavailable
                  </Button>
                }
              />

              <Button
                type="primary"
                danger
                block
                size="large"
                icon={<StopOutlined />}
                disabled
              >
                Emergency freeze unavailable
              </Button>
            </Space>
          )}
        </Drawer>
      </>
    </KontrolPageShell>
  );
}
