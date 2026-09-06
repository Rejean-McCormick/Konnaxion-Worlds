// FILE: frontend/app/konnected/teams-collaboration/team-builder/page.tsx
// app/konnected/teams-collaboration/team-builder/page.tsx
'use client';


import {
  ExclamationCircleOutlined,
  MailOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  StepsForm,
} from '@ant-design/pro-components';
import {
  message as antdMessage,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { apiFetch } from '@/api';
import KonnectedPageShell from '@/app/konnected/KonnectedPageShell';

const { Paragraph, Text } = Typography;
const { Option } = Select;

/**
 * Domain types
 */
type TeamRole = 'leader' | 'coordinator' | 'member';

interface TeamInfo {
  name: string;
  description?: string;
  isOpenJoin?: boolean;
}

interface TeamMember {
  key: string;
  email: string;
  role: TeamRole;
  responsibilityArea?: string;
}

/**
 * API payloads (front-end representation)
 * You will likely need to align these with your real OpenAPI / backend models.
 */
interface CreateTeamPayload {
  name: string;
  description?: string;
  isOpenJoin?: boolean;
  members: {
    email: string;
    role: TeamRole;
    responsibilityArea?: string;
  }[];
}

interface CreateTeamResponse {
  id: string;
  slug?: string;
}

interface TeamCreationError extends Error {
  details?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function errorCode(details: unknown): string | undefined {
  if (!isRecord(details)) return undefined;
  return typeof details.code === 'string' ? details.code : undefined;
}

/**
 * Helpers
 */
const normalizeEmail = (value: string): string => value.trim().toLowerCase();

const TEAM_ROLE_LABEL: Record<TeamRole, string> = {
  leader: 'Team leader',
  coordinator: 'Coordinator',
  member: 'Member',
};

/**
 * API call (isolate endpoint here to make it easy to wire to your real backend).
 *
 * TODO: adjust URL & shape to your real OpenAPI (schema-endpoints).
 * For example, this might be:
 *   POST /api/konnected/teams
 *   or POST /api/project-teams
 */
async function createTeamApi(payload: CreateTeamPayload): Promise<CreateTeamResponse> {
  const response = await apiFetch('/api/konnected/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.status === 403) {
    throw new Error('PERMISSION_DENIED');
  }

  if (!response.ok) {
    // Try to surface backend validation errors if possible
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      // ignore
    }
    const error = new Error('SERVER_ERROR') as TeamCreationError;
    error.details = details;
    throw error;
  }

  return (await response.json()) as CreateTeamResponse;
}

/**
 * Members table columns
 */
const useMemberColumns = (
  onRemove: (key: string) => void,
): ColumnsType<TeamMember> => [
  {
    title: 'Member',
    dataIndex: 'email',
    key: 'email',
    render: (email: string) => (
      <Space>
        <MailOutlined />
        <span>{email}</span>
      </Space>
    ),
  },
  {
    title: 'Role',
    dataIndex: 'role',
    key: 'role',
    render: (role: TeamRole) => {
      const color =
        role === 'leader' ? 'gold' : role === 'coordinator' ? 'processing' : 'default';
      return <Tag color={color}>{TEAM_ROLE_LABEL[role]}</Tag>;
    },
  },
  {
    title: 'Responsibility area',
    dataIndex: 'responsibilityArea',
    key: 'responsibilityArea',
    ellipsis: true,
    render: (value?: string) => value || <Text type="secondary">Not specified</Text>,
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 120,
    render: (_: unknown, record: TeamMember) => (
      <Button danger size="small" onClick={() => onRemove(record.key)}>
        Remove
      </Button>
    ),
  },
];

export default function TeamBuilderPage(): JSX.Element {
  const router = useRouter();

  /**
   * Step 1 – team info
   */
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);

  /**
   * Step 2 – members
   */
  const [members, setMembers] = useState<TeamMember[]>([]);

  // Draft row for the “add member” mini-form
  const [memberForm] = Form.useForm<{
    email: string;
    role: TeamRole;
    responsibilityArea?: string;
  }>();

  /**
   * Submitting / global loading
   */
  const [submitting, setSubmitting] = useState(false);

  /**
   * Derived data
   */
  const isValidForSubmit = useMemo(() => {
    return Boolean(teamInfo && teamInfo.name && members.length > 0);
  }, [teamInfo, members]);

  const handleAddMember = async () => {
    try {
      const values = await memberForm.validateFields();
      const email = normalizeEmail(values.email);

      if (members.some((m) => m.email === email)) {
        antdMessage.warning('This email is already in the team.');
        return;
      }

      const newMember: TeamMember = {
        key: `${Date.now()}-${email}`,
        email,
        role: values.role,
        responsibilityArea: values.responsibilityArea?.trim() || undefined,
      };

      setMembers((prev) => [...prev, newMember]);
      memberForm.resetFields();
    } catch {
      // Validation error, do nothing (ProForm already shows messages)
    }
  };

  const handleRemoveMember = (key: string) => {
    setMembers((prev) => prev.filter((m) => m.key !== key));
  };

  const memberColumns = useMemberColumns(handleRemoveMember);

  /**
   * Global submit – called when last step is submitted.
   */
  const handleFinish = async (): Promise<boolean> => {
    if (!teamInfo) {
      antdMessage.error('Please complete team information first.');
      return false;
    }
    if (!members.length) {
      antdMessage.error('Please add at least one member to the team.');
      return false;
    }

    const payload: CreateTeamPayload = {
      name: teamInfo.name.trim(),
      description: teamInfo.description?.trim() || undefined,
      isOpenJoin: teamInfo.isOpenJoin ?? false,
      members: members.map((member) => ({
        email: member.email,
        role: member.role,
        responsibilityArea: member.responsibilityArea,
      })),
    };

    try {
      setSubmitting(true);
      const created = await createTeamApi(payload);
      antdMessage.success('Team created successfully.');
      // Redirect to “My teams” or to the created team if you have a slug
      if (created.slug) {
        router.push(`/konnected/teams-collaboration/my-teams/${created.slug}`);
      } else {
        router.push('/konnected/teams-collaboration/my-teams');
      }
      return true;
    } catch (err: unknown) {
      const error: TeamCreationError =
        err instanceof Error ? err : new Error(String(err));
      if (error.message === 'PERMISSION_DENIED') {
        antdMessage.error(
          'You do not have permission to create teams. Please contact an administrator.',
        );
      } else if (errorCode(error.details) === 'TEAM_NAME_ALREADY_EXISTS') {
        antdMessage.error('A team with this name already exists. Please pick another name.');
      } else {
        antdMessage.error('Could not create the team. Please try again or contact support.');
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KonnectedPageShell
      title="Team Builder"
      subtitle={
        <span>
          Configure a collaboration-ready team for KonnectED: define the team, assign roles, and
          confirm membership before you start collaborating.
        </span>
      }
      primaryAction={
        <Button
          type="primary"
          icon={<TeamOutlined />}
          disabled={!isValidForSubmit || submitting}
          onClick={handleFinish}
        >
          Create team
        </Button>
      }
      secondaryActions={
        <Text type="secondary">
          <UserOutlined /> You will be automatically added as a member.
        </Text>
      }
    >
      <Card>
        <StepsForm
          onFinish={handleFinish}
          formProps={{ layout: 'vertical' }}
          submitter={{
            submitButtonProps: {
              loading: submitting,
            },
            searchConfig: {
              submitText: 'Create team',
            },
          }}
        >
          {/* Step 1 – Team information */}
          <StepsForm.StepForm<TeamInfo>
            name="teamInfo"
            title="Team details"
            onFinish={async (values) => {
              const trimmedName = values.name?.trim();
              if (!trimmedName) {
                antdMessage.error('Team name is required.');
                return false;
              }
              setTeamInfo({
                name: trimmedName,
                description: values.description?.trim() || undefined,
                isOpenJoin: values.isOpenJoin ?? false,
              });
              return true;
            }}
          >
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Give your team a clear identity and choose whether new members can request to join.
            </Paragraph>

            <ProFormText
              name="name"
              label="Team name"
              placeholder="e.g. Robotics Innovation Squad"
              rules={[
                { required: true, message: 'Please enter a team name.' },
                { min: 3, message: 'Name should be at least 3 characters long.' },
              ]}
              fieldProps={{
                maxLength: 120,
                showCount: true,
              }}
            />

            <ProFormTextArea
              name="description"
              label="Team description"
              placeholder="Briefly describe the team’s purpose, focus areas, and who should join."
              fieldProps={{
                rows: 4,
                maxLength: 500,
                showCount: true,
              }}
            />

            <ProFormSwitch
              name="isOpenJoin"
              label="Allow join requests"
              tooltip="If enabled, learners can send join requests which team leaders can approve."
            />
          </StepsForm.StepForm>

          {/* Step 2 – Members & roles */}
          <StepsForm.StepForm
            name="members"
            title="Members & roles"
            onFinish={async () => {
              if (!members.length) {
                antdMessage.error('Add at least one member to continue.');
                return false;
              }
              return true;
            }}
          >
            <Paragraph type="secondary" style={{ marginBottom: 16 }}>
              Add core team members now. You can invite more people later from “My teams”.
            </Paragraph>

            {/* Add-member mini-form */}
            <Card
              size="small"
              style={{ marginBottom: 24 }}
              title={
                <Space>
                  <UserAddOutlined />
                  <span>Add member</span>
                </Space>
              }
            >
              <Form
                form={memberForm}
                layout="vertical"
                initialValues={{
                  role: 'member' as TeamRole,
                }}
              >
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter an email address.' },
                    { type: 'email', message: 'Please enter a valid email address.' },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="member@example.org"
                    autoComplete="off"
                  />
                </Form.Item>

                <Form.Item label="Role" name="role" rules={[{ required: true }]}>
                  <Select>
                    <Option value="leader">Team leader</Option>
                    <Option value="coordinator">Coordinator</Option>
                    <Option value="member">Member</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Responsibility area" name="responsibilityArea">
                  <Input placeholder="e.g. Impact tracking, facilitation, content curation" />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button type="primary" onClick={handleAddMember}>
                      Add to team
                    </Button>
                    <Text type="secondary">
                      You can adjust roles later from “My teams”.
                    </Text>
                  </Space>
                </Form.Item>
              </Form>
            </Card>

            {/* Members table */}
            <Table<TeamMember>
              rowKey="key"
              size="middle"
              bordered
              columns={memberColumns}
              dataSource={members}
              pagination={false}
              locale={{
                emptyText: 'No members added yet.',
              }}
            />
          </StepsForm.StepForm>

          {/* Step 3 – Review & confirm */}
          <StepsForm.StepForm name="review" title="Review & confirm">
            <Paragraph style={{ marginBottom: 16 }}>
              Review your team configuration before creating it. You can still adjust details later
              in “My teams”.
            </Paragraph>

            <Card size="small" style={{ marginBottom: 24 }} title="Team summary">
              {teamInfo ? (
                <>
                  <Paragraph>
                    <Text strong>Name:</Text> {teamInfo.name}
                  </Paragraph>
                  <Paragraph>
                    <Text strong>Description:</Text>{' '}
                    {teamInfo.description || <Text type="secondary">Not provided</Text>}
                  </Paragraph>
                  <Paragraph>
                    <Text strong>Join policy:</Text>{' '}
                    {teamInfo.isOpenJoin ? (
                      <Tag color="success">Requests allowed</Tag>
                    ) : (
                      <Tag>Invite-only</Tag>
                    )}
                  </Paragraph>
                </>
              ) : (
                <Paragraph type="secondary">
                  Team information is incomplete. Go back to the first step to fill it in.
                </Paragraph>
              )}
            </Card>

            <Card
              size="small"
              style={{ marginBottom: 24 }}
              title={`Members (${members.length})`}
            >
              {members.length ? (
                <Table<TeamMember>
                  rowKey="key"
                  size="small"
                  bordered
                  columns={memberColumns}
                  dataSource={members}
                  pagination={false}
                />
              ) : (
                <Paragraph type="secondary">No members added yet.</Paragraph>
              )}
            </Card>

            <Card
              size="small"
              type="inner"
              title={
                <Space>
                  <ExclamationCircleOutlined />
                  <span>Before you create the team</span>
                </Space>
              }
            >
              <ul className="list-disc pl-5">
                <li>You will be added as a member of the team automatically.</li>
                <li>
                  Team leaders can manage roles, approve join requests (if enabled), and archive
                  the team.
                </li>
                <li>
                  You can always modify membership later from{' '}
                  <Text strong>Teams Collaboration → My teams</Text>.
                </li>
              </ul>
            </Card>
          </StepsForm.StepForm>
        </StepsForm>
      </Card>
    </KonnectedPageShell>
  );
}
