// FILE: frontend/app/konsensus/admin/AdminClient.tsx
'use client';

import {
  DeploymentUnitOutlined,
  ExperimentOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  StopOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Slider,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import React, { useMemo, useState } from 'react';

const { Title, Paragraph, Text } = Typography;

type WeightFormValues = {
  expertiseWeight: number;
  ethicsMultiplier: number;
  recencyBias: number;
  diversityBoost: number;
  dryRun: boolean;
};

type CategoryRow = {
  id: string;
  name: string;
  modules: string[];
  defaultWeight: number;
  active: boolean;
};

type ModerationStatus = 'pending' | 'escalated' | 'resolved' | 'dismissed';

type ModerationItem = {
  id: string;
  module: string;
  kind: string;
  summary: string;
  reason: string;
  reporter: string;
  status: ModerationStatus;
  createdAt: string;
};

const INITIAL_CATEGORIES: CategoryRow[] = [
  {
    id: 'cat-1',
    name: 'Environment & Climate',
    modules: ['keenKonnect', 'KonnectED', 'ethiKos'],
    defaultWeight: 1.2,
    active: true,
  },
  {
    id: 'cat-2',
    name: 'Health & Medicine',
    modules: ['KonnectED', 'ethiKos'],
    defaultWeight: 1.3,
    active: true,
  },
  {
    id: 'cat-3',
    name: 'Civics & Governance',
    modules: ['ethiKos', 'Ekoh'],
    defaultWeight: 1.1,
    active: true,
  },
  {
    id: 'cat-4',
    name: 'Arts & Culture',
    modules: ['Kreative', 'KonnectED'],
    defaultWeight: 0.9,
    active: false,
  },
];

const INITIAL_MODERATION: ModerationItem[] = [
  {
    id: 'mod-1',
    module: 'ethiKos',
    kind: 'Debate stance',
    summary: 'Stance on climate justice threshold',
    reason: 'Reported as potentially misleading statistics.',
    reporter: 'User #483',
    status: 'pending',
    createdAt: '2025-11-25T10:15:00Z',
  },
  {
    id: 'mod-2',
    module: 'keenKonnect',
    kind: 'Project comment',
    summary: 'Comment on water access project',
    reason: 'Tone flagged as disrespectful by multiple users.',
    reporter: 'User #291',
    status: 'escalated',
    createdAt: '2025-11-26T18:42:00Z',
  },
  {
    id: 'mod-3',
    module: 'KonnectED',
    kind: 'Learning resource',
    summary: 'Uploaded PDF on local agriculture',
    reason: 'Awaiting verification of source and licensing.',
    reporter: 'Auto-check',
    status: 'pending',
    createdAt: '2025-11-27T08:05:00Z',
  },
];

export default function KonsensusAdminClientPage() {
  const [weightsForm] = Form.useForm<WeightFormValues>();
  const [categories, setCategories] = useState<CategoryRow[]>(INITIAL_CATEGORIES);
  const [moderationItems, setModerationItems] =
    useState<ModerationItem[]>(INITIAL_MODERATION);
  const [dryRunEnabled, setDryRunEnabled] = useState<boolean>(false);

  const pendingCount = useMemo(
    () => moderationItems.filter((item) => item.status === 'pending').length,
    [moderationItems],
  );

  const escalatedCount = useMemo(
    () => moderationItems.filter((item) => item.status === 'escalated').length,
    [moderationItems],
  );

  const activeCategories = useMemo(
    () => categories.filter((c) => c.active).length,
    [categories],
  );

  const handleSaveWeights = (values: WeightFormValues) => {
    message.success(
      values.dryRun
        ? 'Dry-run: Konsensus weights would be updated with these parameters.'
        : 'Konsensus weights configuration updated (demo).',
    );
  };

  const toggleCategoryActive = (id: string, active: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, active } : cat)),
    );
  };

  const handleModerationAction = (id: string, newStatus: ModerationStatus) => {
    setModerationItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item)),
    );
    message.success(`Moderation item marked as ${newStatus}.`);
  };

  const categoryColumns = [
    {
      title: 'Domain',
      dataIndex: 'name',
      key: 'name',
      render: (value: string, record: CategoryRow) => (
        <Space>
          <DeploymentUnitOutlined />
          <Text strong>{value}</Text>
          {!record.active && <Tag color="default">Inactive</Tag>}
        </Space>
      ),
    },
    {
      title: 'Used in modules',
      dataIndex: 'modules',
      key: 'modules',
      render: (mods: string[]) => (
        <Space wrap>
          {mods.map((m) => (
            <Tag key={m}>{m}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Default weight',
      dataIndex: 'defaultWeight',
      key: 'defaultWeight',
      render: (value: number) => (
        <Text>
          {value.toFixed(1)}
          <Text type="secondary"> ×</Text>
        </Text>
      ),
    },
    {
      title: 'Active',
      dataIndex: 'active',
      key: 'active',
      render: (_: boolean, record: CategoryRow) => (
        <Switch
          checked={record.active}
          onChange={(checked) => toggleCategoryActive(record.id, checked)}
          checkedChildren="On"
          unCheckedChildren="Off"
        />
      ),
    },
  ];

  const moderationStatusTag = (status: ModerationStatus) => {
    switch (status) {
      case 'pending':
        return <Tag color="warning">Pending</Tag>;
      case 'escalated':
        return (
          <Tag color="red" icon={<WarningOutlined />}>
            Escalated
          </Tag>
        );
      case 'resolved':
        return <Tag color="green">Resolved</Tag>;
      case 'dismissed':
        return <Tag>Dismissed</Tag>;
      default:
        return null;
    }
  };

  const moderationColumns = [
    {
      title: 'Item',
      key: 'summary',
      render: (_: unknown, record: ModerationItem) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.summary}</Text>
          <Text type="secondary">
            {record.module} · {record.kind}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Reporter',
      dataIndex: 'reporter',
      key: 'reporter',
      render: (value: string) => <Text type="secondary">{value}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: ModerationStatus) => moderationStatusTag(value),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: ModerationItem) => {
        const isClosed =
          record.status === 'resolved' || record.status === 'dismissed';
        return (
          <Space>
            <Popconfirm
              title="Mark as resolved"
              description="Confirm this item has been addressed and can be marked resolved?"
              onConfirm={() => handleModerationAction(record.id, 'resolved')}
              okText="Yes"
              cancelText="No"
              disabled={isClosed}
            >
              <Button
                size="small"
                type="primary"
                icon={<SafetyCertificateOutlined />}
                disabled={isClosed}
              >
                Resolve
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Dismiss report"
              description="Dismiss this report without further action?"
              onConfirm={() => handleModerationAction(record.id, 'dismissed')}
              okText="Dismiss"
              cancelText="Cancel"
              disabled={isClosed}
            >
              <Button size="small" danger icon={<StopOutlined />} disabled={isClosed}>
                Dismiss
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const weightsTab = (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={14}>
        <Card
          title={
            <Space>
              <SettingOutlined />
              <span>Weighting parameters</span>
            </Space>
          }
        >
          <Form<WeightFormValues>
            layout="vertical"
            form={weightsForm}
            initialValues={{
              expertiseWeight: 1.0,
              ethicsMultiplier: 1.0,
              recencyBias: 0.5,
              diversityBoost: 0.3,
              dryRun: dryRunEnabled,
            }}
            onFinish={handleSaveWeights}
            onValuesChange={(changed) => {
              if (Object.prototype.hasOwnProperty.call(changed, 'dryRun')) {
                setDryRunEnabled(Boolean(changed.dryRun));
              }
            }}
          >
            <Form.Item
              label="Expertise score weight"
              name="expertiseWeight"
              tooltip="How strongly Ekoh expertise scores influence each vote."
              rules={[{ required: true, message: 'Please set a value.' }]}
            >
              <InputNumber
                min={0}
                max={3}
                step={0.1}
                style={{ width: '100%' }}
                addonAfter="×"
              />
            </Form.Item>

            <Form.Item
              label="Ethical multiplier"
              name="ethicsMultiplier"
              tooltip="Additional multiplier applied based on ethical conduct."
              rules={[{ required: true, message: 'Please set a value.' }]}
            >
              <InputNumber
                min={0}
                max={3}
                step={0.1}
                style={{ width: '100%' }}
                addonAfter="×"
              />
            </Form.Item>

            <Form.Item
              label="Recency bias"
              name="recencyBias"
              tooltip="How much newer votes are weighted compared to older ones."
            >
              <Slider min={0} max={1} step={0.05} />
            </Form.Item>

            <Form.Item
              label="Diversity boost"
              name="diversityBoost"
              tooltip="Boost when a vote includes a broad range of expertise and regions."
            >
              <Slider min={0} max={1} step={0.05} />
            </Form.Item>

            <Divider />

            <Form.Item name="dryRun" valuePropName="checked">
              <Switch checkedChildren="Dry-run only" unCheckedChildren="Apply live" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => {
                    weightsForm.resetFields();
                    setDryRunEnabled(false);
                  }}
                >
                  Reset
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<ExperimentOutlined />}
                >
                  {dryRunEnabled ? 'Simulate update' : 'Update weights'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Card title="Preview – how weights combine">
          <Paragraph type="secondary">
            Example of how a single vote is weighted using the current parameters:
          </Paragraph>
          <Divider />
          <Space direction="vertical" style={{ width: '100%' }}>
            <Row>
              <Col span={14}>
                <Text>Base vote</Text>
              </Col>
              <Col span={10} style={{ textAlign: 'right' }}>
                <Text strong>1.0</Text>
              </Col>
            </Row>
            <Row>
              <Col span={14}>
                <Text>× Expertise score</Text>
              </Col>
              <Col span={10} style={{ textAlign: 'right' }}>
                <Text strong>
                  {weightsForm.getFieldValue('expertiseWeight') ?? 1.0}
                </Text>
              </Col>
            </Row>
            <Row>
              <Col span={14}>
                <Text>× Ethics multiplier</Text>
              </Col>
              <Col span={10} style={{ textAlign: 'right' }}>
                <Text strong>
                  {weightsForm.getFieldValue('ethicsMultiplier') ?? 1.0}
                </Text>
              </Col>
            </Row>
            <Row>
              <Col span={14}>
                <Text>+ Recency + diversity boosts</Text>
              </Col>
              <Col span={10} style={{ textAlign: 'right' }}>
                <Text type="secondary">derived</Text>
              </Col>
            </Row>
            <Divider />
            <Row>
              <Col span={14}>
                <Text strong>Effective vote weight (approx.)</Text>
              </Col>
              <Col span={10} style={{ textAlign: 'right' }}>
                <Text strong>
                  ≈{' '}
                  {(
                    (weightsForm.getFieldValue('expertiseWeight') ?? 1.0) *
                    (weightsForm.getFieldValue('ethicsMultiplier') ?? 1.0)
                  ).toFixed(2)}
                </Text>
              </Col>
            </Row>
          </Space>
        </Card>
      </Col>
    </Row>
  );

  const categoriesTab = (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Paragraph type="secondary">
        Domains are shared across Ekoh and all modules. Adjust which domains are
        active and their default influence in Konsensus.
      </Paragraph>
      <Table<CategoryRow>
        size="middle"
        rowKey="id"
        columns={categoryColumns}
        dataSource={categories}
        pagination={false}
      />
    </Space>
  );

  const moderationTab = (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Paragraph type="secondary">
        Cross-module moderation queue for items that affect consensus quality.
      </Paragraph>
      <Table<ModerationItem>
        size="middle"
        rowKey="id"
        columns={moderationColumns}
        dataSource={moderationItems}
        pagination={{ pageSize: 5 }}
      />
    </Space>
  );

  return (
    <div className="container mx-auto p-5">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>
            Konsensus Admin & Moderation
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Adjust system weights, manage expertise domains, and review the
            cross-module moderation queue.
          </Paragraph>
        </div>
        <Space>
          <Button type="default" icon={<PlayCircleOutlined />}>
            Run recomputation (demo)
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Pending moderation items"
              value={pendingCount}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Escalated items"
              value={escalatedCount}
              prefix={<SafetyCertificateOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Active expertise domains"
              value={activeCategories}
              prefix={<DeploymentUnitOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          defaultActiveKey="weights"
          items={[
            {
              key: 'weights',
              label: 'Weights & parameters',
              children: weightsTab,
            },
            {
              key: 'categories',
              label: 'Domains & categories',
              children: categoriesTab,
            },
            {
              key: 'moderation',
              label: 'Moderation queue',
              children: moderationTab,
            },
          ]}
        />
      </Card>
    </div>
  );
}
