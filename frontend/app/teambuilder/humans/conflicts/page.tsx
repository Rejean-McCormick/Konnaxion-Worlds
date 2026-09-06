// FILE: frontend/app/teambuilder/humans/conflicts/page.tsx
'use client';

import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  ImportOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  PlusOutlined,
  StopOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Popover,
  Row,
  Select,
  Slider,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useMemo, useState } from 'react';

import TeamBuilderPageShell from '@/components/teambuilder/TeamBuilderPageShell';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

type Severity = 'SOFT' | 'MEDIUM' | 'HARD';

type ConflictRule = {
  id: string;
  userA: string;
  userB: string;
  severity: Severity;
  weight: number;
  reason?: string;
  active: boolean;
};

type PreferredPairRule = {
  id: string;
  userA: string;
  userB: string;
  weight: number;
  reason?: string;
  active: boolean;
};

type UserFlag = {
  id: string;
  user: string;
  type: 'RISK' | 'ANCHOR' | 'MENTOR';
  severity: Severity;
  notes?: string;
  active: boolean;
};

const SEVERITY_OPTIONS: { label: string; value: Severity }[] = [
  { label: 'Soft', value: 'SOFT' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Hard', value: 'HARD' },
];

const SEVERITY_COLORS: Record<Severity, string> = {
  SOFT: 'gold',
  MEDIUM: 'orange',
  HARD: 'red',
};

const SEVERITY_LABEL: Record<Severity, string> = {
  SOFT: 'Soft',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

const MOCK_USERS = [
  'Alice Martin',
  'Bob Dupont',
  'Carlos Silva',
  'Daria Novak',
  'Elliot Chen',
  'Fatima Khan',
];

export default function HumansConflictsPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'conflicts' | 'preferred' | 'flags'>(
    'conflicts',
  );

  const [conflictRules, setConflictRules] = useState<ConflictRule[]>([
    {
      id: 'c-1',
      userA: 'Alice Martin',
      userB: 'Bob Dupont',
      severity: 'HARD',
      weight: 100,
      reason:
        'Repeated unresolved conflict in last project; mutual request not to be paired.',
      active: true,
    },
    {
      id: 'c-2',
      userA: 'Carlos Silva',
      userB: 'Daria Novak',
      severity: 'MEDIUM',
      weight: 70,
      reason: 'Tension on deadlines; still functional with strong leader present.',
      active: true,
    },
    {
      id: 'c-3',
      userA: 'Elliot Chen',
      userB: 'Fatima Khan',
      severity: 'SOFT',
      weight: 40,
      reason: 'Different working rhythms; treat as “avoid if possible”.',
      active: false,
    },
  ]);

  const [preferredPairs, setPreferredPairs] = useState<PreferredPairRule[]>([
    {
      id: 'p-1',
      userA: 'Alice Martin',
      userB: 'Carlos Silva',
      weight: 80,
      reason: 'High trust and very complementary skills in previous hackathon.',
      active: true,
    },
    {
      id: 'p-2',
      userA: 'Daria Novak',
      userB: 'Fatima Khan',
      weight: 55,
      reason: 'Requested to collaborate again on exploration-oriented projects.',
      active: true,
    },
  ]);

  const [userFlags, setUserFlags] = useState<UserFlag[]>([
    {
      id: 'f-1',
      user: 'Bob Dupont',
      type: 'RISK',
      severity: 'MEDIUM',
      notes:
        'Needs strong structure and clear expectations; avoid multiple other “risk” profiles on same team.',
      active: true,
    },
    {
      id: 'f-2',
      user: 'Carlos Silva',
      type: 'ANCHOR',
      severity: 'SOFT',
      notes: 'Good stabilizer in teams with at most one “risk” profile.',
      active: true,
    },
    {
      id: 'f-3',
      user: 'Daria Novak',
      type: 'MENTOR',
      severity: 'SOFT',
      notes: 'Willing to mentor juniors in learning-heavy configurations.',
      active: true,
    },
  ]);

  const [conflictForm] = Form.useForm();
  const [preferredForm] = Form.useForm();
  const [flagForm] = Form.useForm();

  const hardRulesCount = useMemo(
    () => conflictRules.filter(r => r.active && r.severity === 'HARD').length,
    [conflictRules],
  );
  const softRulesCount = useMemo(
    () => conflictRules.filter(r => r.active && r.severity !== 'HARD').length,
    [conflictRules],
  );
  const inactiveRulesCount = useMemo(
    () => conflictRules.filter(r => !r.active).length,
    [conflictRules],
  );

  const overConstrained = useMemo(
    () =>
      hardRulesCount > 0 &&
      conflictRules.length > 0 &&
      hardRulesCount / conflictRules.length > 0.6,
    [hardRulesCount, conflictRules.length],
  );

  const handleAddConflict = (values: {
    userA: string;
    userB: string;
    severity: Severity;
    weight?: number;
    reason?: string;
    active?: boolean;
  }) => {
    const next: ConflictRule = {
      id: `c-${Date.now()}`,
      userA: values.userA,
      userB: values.userB,
      severity: values.severity,
      weight: values.weight ?? 80,
      reason: values.reason,
      active: values.active ?? true,
    };
    setConflictRules(prev => [next, ...prev]);
    conflictForm.resetFields();
  };

  const handleToggleConflictActive = (id: string, active: boolean) => {
    setConflictRules(prev =>
      prev.map(rule => (rule.id === id ? { ...rule, active } : rule)),
    );
  };

  const handleAddPreferredPair = (values: {
    userA: string;
    userB: string;
    weight?: number;
    reason?: string;
    active?: boolean;
  }) => {
    const next: PreferredPairRule = {
      id: `p-${Date.now()}`,
      userA: values.userA,
      userB: values.userB,
      weight: values.weight ?? 60,
      reason: values.reason,
      active: values.active ?? true,
    };
    setPreferredPairs(prev => [next, ...prev]);
    preferredForm.resetFields();
  };

  const handleTogglePreferredActive = (id: string, active: boolean) => {
    setPreferredPairs(prev =>
      prev.map(rule => (rule.id === id ? { ...rule, active } : rule)),
    );
  };

  const handleAddFlag = (values: {
    user: string;
    type: 'RISK' | 'ANCHOR' | 'MENTOR';
    severity: Severity;
    notes?: string;
    active?: boolean;
  }) => {
    const next: UserFlag = {
      id: `f-${Date.now()}`,
      user: values.user,
      type: values.type,
      severity: values.severity,
      notes: values.notes,
      active: values.active ?? true,
    };
    setUserFlags(prev => [next, ...prev]);
    flagForm.resetFields();
  };

  const handleToggleFlagActive = (id: string, active: boolean) => {
    setUserFlags(prev =>
      prev.map(flag => (flag.id === id ? { ...flag, active } : flag)),
    );
  };

  const conflictColumns = [
    {
      title: 'Pair',
      dataIndex: 'pair',
      key: 'pair',
      render: (_: unknown, record: ConflictRule) => (
        <Space>
          <Tag>{record.userA}</Tag>
          <span>×</span>
          <Tag>{record.userB}</Tag>
        </Space>
      ),
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: Severity) => (
        <Tag color={SEVERITY_COLORS[severity]} icon={<StopOutlined />}>
          {SEVERITY_LABEL[severity]}
        </Tag>
      ),
    },
    {
      title: (
        <Space size={4}>
          Weight
          <Tooltip title="Relative strength of this constraint in the solver.">
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'weight',
      key: 'weight',
      width: 140,
      render: (weight: number) => (
        <Badge
          status={weight >= 80 ? 'error' : weight >= 60 ? 'warning' : 'default'}
          text={`${weight}%`}
        />
      ),
    },
    {
      title: 'Reason / notes',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason?: string) =>
        reason ? <Text type="secondary">{reason}</Text> : <Text type="secondary">–</Text>,
    },
    {
      title: 'Active',
      dataIndex: 'active',
      key: 'active',
      width: 120,
      render: (active: boolean, record: ConflictRule) => (
        <Space>
          <Switch
            size="small"
            checked={active}
            onChange={checked => handleToggleConflictActive(record.id, checked)}
          />
          <Badge
            status={active ? 'processing' : 'default'}
            text={active ? 'In use' : 'Disabled'}
          />
        </Space>
      ),
    },
  ];

  const preferredColumns = [
    {
      title: 'Pair',
      dataIndex: 'pair',
      key: 'pair',
      render: (_: unknown, record: PreferredPairRule) => (
        <Space>
          <Tag icon={<LinkOutlined />}>{record.userA}</Tag>
          <span>+</span>
          <Tag icon={<LinkOutlined />}>{record.userB}</Tag>
        </Space>
      ),
    },
    {
      title: (
        <Space size={4}>
          Weight
          <Tooltip title="Higher weight = stronger preference to put them together.">
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'weight',
      key: 'weight',
      width: 150,
      render: (weight: number) => (
        <Badge
          status={weight >= 80 ? 'success' : weight >= 60 ? 'processing' : 'default'}
          text={`${weight}%`}
        />
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason?: string) =>
        reason ? <Text type="secondary">{reason}</Text> : <Text type="secondary">–</Text>,
    },
    {
      title: 'Active',
      dataIndex: 'active',
      key: 'active',
      width: 120,
      render: (active: boolean, record: PreferredPairRule) => (
        <Space>
          <Switch
            size="small"
            checked={active}
            onChange={checked => handleTogglePreferredActive(record.id, checked)}
          />
          <Badge
            status={active ? 'processing' : 'default'}
            text={active ? 'In use' : 'Disabled'}
          />
        </Space>
      ),
    },
  ];

  const flagColumns = [
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (user: string) => <Tag>{user}</Tag>,
    },
    {
      title: 'Flag type',
      dataIndex: 'type',
      key: 'type',
      render: (type: UserFlag['type']) => {
        switch (type) {
          case 'RISK':
            return (
              <Tag color="red" icon={<ExclamationCircleOutlined />}>
                Risk profile
              </Tag>
            );
          case 'ANCHOR':
            return (
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Anchor
              </Tag>
            );
          case 'MENTOR':
            return (
              <Tag color="blue" icon={<UserSwitchOutlined />}>
                Mentor
              </Tag>
            );
          default:
            return <Tag>{type}</Tag>;
        }
      },
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: Severity) => (
        <Tag color={SEVERITY_COLORS[severity]}>{SEVERITY_LABEL[severity]}</Tag>
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes?: string) =>
        notes ? <Text type="secondary">{notes}</Text> : <Text type="secondary">–</Text>,
    },
    {
      title: 'Active',
      dataIndex: 'active',
      key: 'active',
      width: 120,
      render: (active: boolean, record: UserFlag) => (
        <Space>
          <Switch
            size="small"
            checked={active}
            onChange={checked => handleToggleFlagActive(record.id, checked)}
          />
          <Badge
            status={active ? 'processing' : 'default'}
            text={active ? 'In use' : 'Disabled'}
          />
        </Space>
      ),
    },
  ];

  const conflictsTabContent = (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card
            title={
              <Space>
                <Text strong>Conflict pairs</Text>
                <Tooltip title="Pairs that should be avoided when building teams.">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            extra={
              <Space>
                <Button icon={<ImportOutlined />}>Import</Button>
                <Button icon={<ExportOutlined />}>Export</Button>
              </Space>
            }
          >
            <Table
              size="small"
              rowKey="id"
              columns={conflictColumns}
              dataSource={conflictRules}
              pagination={{ pageSize: 5, size: 'small' }}
            />
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card
            title={
              <Space>
                <Text strong>Add / edit conflict</Text>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Form
                layout="vertical"
                form={conflictForm}
                onFinish={handleAddConflict}
                initialValues={{
                  severity: 'HARD' as Severity,
                  weight: 90,
                  active: true,
                }}
              >
                <Form.Item
                  label="User A"
                  name="userA"
                  rules={[{ required: true, message: 'Please select the first person.' }]}
                >
                  <Select
                    showSearch
                    placeholder="Pick first person"
                    options={MOCK_USERS.map(u => ({ label: u, value: u }))}
                  />
                </Form.Item>

                <Form.Item
                  label="User B"
                  name="userB"
                  rules={[{ required: true, message: 'Please select the second person.' }]}
                >
                  <Select
                    showSearch
                    placeholder="Pick second person"
                    options={MOCK_USERS.map(u => ({ label: u, value: u }))}
                  />
                </Form.Item>

                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      label={
                        <Space size={4}>
                          Severity
                          <Tooltip title="Hard = never pair; Soft/Medium = avoid when possible.">
                            <InfoCircleOutlined />
                          </Tooltip>
                        </Space>
                      }
                      name="severity"
                      rules={[{ required: true }]}
                    >
                      <Select
                        options={SEVERITY_OPTIONS.map(opt => ({
                          label: opt.label,
                          value: opt.value,
                        }))}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item
                      label={
                        <Space size={4}>
                          Weight
                          <Tooltip title="How strongly the solver should respect this rule.">
                            <InfoCircleOutlined />
                          </Tooltip>
                        </Space>
                      }
                      name="weight"
                    >
                      <Slider min={10} max={100} step={5} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Reason (optional)" name="reason">
                  <TextArea
                    rows={3}
                    placeholder="Short explanation for future reference…"
                  />
                </Form.Item>

                <Form.Item
                  label="Rule active"
                  name="active"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>

                <Form.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Button onClick={() => conflictForm.resetFields()}>Reset</Button>
                    <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                      Add conflict pair
                    </Button>
                  </Space>
                </Form.Item>
              </Form>

              <Divider />

              <Popover
                placement="bottomLeft"
                content={
                  <div style={{ maxWidth: 320 }}>
                    <Paragraph strong style={{ marginBottom: 8 }}>
                      How conflicts are used
                    </Paragraph>
                    <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                      Hard conflicts behave like “do not pair” constraints. Soft/medium
                      conflicts are treated as penalties: the solver will still pair
                      them only when necessary.
                    </Paragraph>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      You can tune the global strategy in the session configuration
                      (e.g. elite vs learning vs rehab teams).
                    </Paragraph>
                  </div>
                }
              >
                <Space>
                  <InfoCircleOutlined />
                  <Text type="secondary">Learn how conflict rules affect teams</Text>
                </Space>
              </Popover>
            </Space>
          </Card>
        </Col>
      </Row>

      {overConstrained && (
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="Your conflicts may be over-constraining the system"
          description={
            <Space direction="vertical">
              <Text>
                More than 60% of your active rules are marked as{' '}
                <Text strong>Hard</Text>. The solver might struggle to find feasible
                teams, especially with small pools.
              </Text>
              <Text type="secondary">
                Consider downgrading some rules to <strong>Soft</strong> or{' '}
                <strong>Medium</strong>, or switching to a learning-oriented context
                where more risk is acceptable.
              </Text>
            </Space>
          }
        />
      )}
    </Space>
  );

  const preferredPairsTabContent = (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card
            title={
              <Space>
                <Text strong>Preferred pairs</Text>
                <Tooltip title="Pairs that are rewarded when they appear in the same team.">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            extra={
              <Space>
                <Button icon={<ImportOutlined />}>Import</Button>
                <Button icon={<ExportOutlined />}>Export</Button>
              </Space>
            }
          >
            <Table
              size="small"
              rowKey="id"
              columns={preferredColumns}
              dataSource={preferredPairs}
              pagination={{ pageSize: 5, size: 'small' }}
            />
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title="Add preferred pair">
            <Form
              layout="vertical"
              form={preferredForm}
              onFinish={handleAddPreferredPair}
              initialValues={{
                weight: 70,
                active: true,
              }}
            >
              <Form.Item
                label="User A"
                name="userA"
                rules={[{ required: true, message: 'Please select the first person.' }]}
              >
                <Select
                  showSearch
                  placeholder="Pick first person"
                  options={MOCK_USERS.map(u => ({ label: u, value: u }))}
                />
              </Form.Item>

              <Form.Item
                label="User B"
                name="userB"
                rules={[{ required: true, message: 'Please select the second person.' }]}
              >
                <Select
                  showSearch
                  placeholder="Pick second person"
                  options={MOCK_USERS.map(u => ({ label: u, value: u }))}
                />
              </Form.Item>

              <Form.Item
                label={
                  <Space size={4}>
                    Weight
                    <Tooltip title="Higher weight = stronger incentive to keep them together.">
                      <InfoCircleOutlined />
                    </Tooltip>
                  </Space>
                }
                name="weight"
              >
                <Slider min={10} max={100} step={5} />
              </Form.Item>

              <Form.Item label="Reason (optional)" name="reason">
                <TextArea
                  rows={3}
                  placeholder="Why should this pair be encouraged?"
                />
              </Form.Item>

              <Form.Item
                label="Rule active"
                name="active"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Button onClick={() => preferredForm.resetFields()}>Reset</Button>
                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                    Add preferred pair
                  </Button>
                </Space>
              </Form.Item>
            </Form>

            <Divider />

            <Text type="secondary">
              Preferred pairs are particularly useful in{' '}
              <strong>learning</strong> or <strong>balanced</strong> contexts, where
              you want to protect mentoring relationships or proven collaborations.
            </Text>
          </Card>
        </Col>
      </Row>
    </Space>
  );

  const flagsTabContent = (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card
            title={
              <Space>
                <Text strong>User flags</Text>
                <Tooltip title="Profiles that require special attention when composing teams.">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
          >
            <Table
              size="small"
              rowKey="id"
              columns={flagColumns}
              dataSource={userFlags}
              pagination={{ pageSize: 5, size: 'small' }}
            />
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title="Add user flag">
            <Form
              layout="vertical"
              form={flagForm}
              onFinish={handleAddFlag}
              initialValues={{
                type: 'RISK',
                severity: 'MEDIUM' as Severity,
                active: true,
              }}
            >
              <Form.Item
                label="User"
                name="user"
                rules={[{ required: true, message: 'Please select a person.' }]}
              >
                <Select
                  showSearch
                  placeholder="Pick user"
                  options={MOCK_USERS.map(u => ({ label: u, value: u }))}
                />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    label="Flag type"
                    name="type"
                    rules={[{ required: true }]}
                  >
                    <Select
                      options={[
                        { label: 'Risk profile', value: 'RISK' },
                        { label: 'Anchor', value: 'ANCHOR' },
                        { label: 'Mentor', value: 'MENTOR' },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="Severity"
                    name="severity"
                    rules={[{ required: true }]}
                  >
                    <Select
                      options={SEVERITY_OPTIONS.map(opt => ({
                        label: opt.label,
                        value: opt.value,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Notes (optional)" name="notes">
                <TextArea
                  rows={3}
                  placeholder="Context on how to use this flag in team composition…"
                />
              </Form.Item>

              <Form.Item
                label="Flag active"
                name="active"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Button onClick={() => flagForm.resetFields()}>Reset</Button>
                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                    Add flag
                  </Button>
                </Space>
              </Form.Item>
            </Form>

            <Divider />

            <Text type="secondary">
              Flags are not conflicts by themselves. They inform how many “risk profiles”
              can share a team, and which anchors/mentors should be added to stabilize
              high-risk or learning-heavy configurations.
            </Text>
          </Card>
        </Col>
      </Row>
    </Space>
  );

  const tabItems = [
    {
      key: 'conflicts',
      label: 'Conflicts',
      children: conflictsTabContent,
    },
    {
      key: 'preferred',
      label: 'Preferred pairs',
      children: preferredPairsTabContent,
    },
    {
      key: 'flags',
      label: 'Flags',
      children: flagsTabContent,
    },
  ];

  const headerSummary = (
    <Space size="large" wrap>
      <Space direction="vertical" size={4}>
        <Text type="secondary">Hard conflict rules</Text>
        <Space>
          <Badge status="error" />
          <Text strong>{hardRulesCount}</Text>
        </Space>
      </Space>

      <Space direction="vertical" size={4}>
        <Text type="secondary">Soft / medium rules</Text>
        <Space>
          <Badge status="warning" />
          <Text strong>{softRulesCount}</Text>
        </Space>
      </Space>

      <Space direction="vertical" size={4}>
        <Text type="secondary">Inactive rules</Text>
        <Space>
          <Badge status="default" />
          <Text strong>{inactiveRulesCount}</Text>
        </Space>
      </Space>
    </Space>
  );

  return (
    <TeamBuilderPageShell
      title="Conflicts & pairing rules"
      subtitle={
        <Space direction="vertical" size={8}>
          <Text type="secondary">
            Manage who should or should not be paired together, and mark people who
            require special handling when building teams.
          </Text>
          {headerSummary}
        </Space>
      }
      sectionLabel="Humans"
      maxWidth={1200}
      secondaryActions={
        <Space>
          <Button>Reset all rules</Button>
          <Button type="primary" icon={<ExportOutlined />}>
            Export configuration
          </Button>
        </Space>
      }
    >
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={key => setActiveTab(key as typeof activeTab)}
          items={tabItems}
        />
      </Card>

      <Divider />

      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="How this interacts with contexts"
        description={
          <Space direction="vertical">
            <Text>
              In <strong>elite / critical</strong> mode, hard conflicts are treated as
              strict constraints. In <strong>learning</strong> or{' '}
              <strong>rehab</strong> modes, the engine may allow some softer conflicts
              when paired with strong anchors and mentors.
            </Text>
            <Text type="secondary">
              You can tune these behaviours in the session configuration screens; this
              page only manages the underlying human relationships.
            </Text>
          </Space>
        }
      />
    </TeamBuilderPageShell>
  );
}
