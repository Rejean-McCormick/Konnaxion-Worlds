// FILE: frontend/app/teambuilder/[sessionId]/page.tsx
'use client';

import {
  AlertOutlined,
  ArrowLeftOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  ReloadOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Empty,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import type { TableColumnsType, TabsProps } from 'antd';
import { format } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import TeamBuilderPageShell from '@/components/teambuilder/TeamBuilderPageShell';
import { teambuilderService } from '@/services/teambuilder';
import type { IBuilderSession } from '@/services/teambuilder/types';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

// ---------------------------------------------------------------------------
// Types for local rendering
// ---------------------------------------------------------------------------

type MemberRow = {
  id: string | number;
  name: string;
  role?: string;
  isLeader?: boolean;
  hasConflict?: boolean;
  status?: string;
};

type TeamRow = {
  id: string | number;
  name: string;
  size: number;
  score?: number;
  status?: string;
  members: MemberRow[];
};

type BuilderMemberLike = {
  id?: string | number;
  user_id?: string | number;
  name?: string;
  displayName?: string;
  role?: string;
  function?: string;
  is_leader?: boolean;
  leader?: boolean;
  has_conflict?: boolean;
  status?: string;
};

type BuilderTeamLike = {
  id?: string | number;
  team_id?: string | number;
  name?: string;
  score?: number;
  quality_score?: number;
  status?: string;
  members?: BuilderMemberLike[];
};

type SessionExtensions = {
  algorithm_config?: IBuilderSession['algorithm_config'] & {
    mode?: string;
    max_teams?: string | number;
    fairness?: string;
  };
  mode?: string;
  warnings?: string[];
  issues?: string[];
  last_run_at?: string;
  updated_at?: string;
  problem_name?: string;
  owner_name?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SessionDetailPage(): JSX.Element {
  const { sessionId } = useParams();

  const [session, setSession] = useState<IBuilderSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Some backend deployments expose additional session metadata.
  const sessionExtended = session as (IBuilderSession & SessionExtensions) | null;

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      const data = await teambuilderService.getSessionById(
        sessionId as string,
      );
      setSession(data);
      setError(null);
    } catch (err) {
       
      console.error(err);
      setError('Failed to load session details.');
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleGenerateTeams = async () => {
    if (!sessionId) return;

    setGenerating(true);
    setError(null);

    try {
      const updatedSession = await teambuilderService.generateTeams(
        sessionId as string,
      );
      setSession(updatedSession);
    } catch (err) {
       
      console.error(err);
      setError('Failed to generate teams. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const isProcessing = session?.status === 'PROCESSING';
  const hasTeams = !!(session && session.teams && session.teams.length > 0);

  const modeTag = useMemo(() => {
    const mode: string | undefined =
      sessionExtended?.algorithm_config?.mode ||
      sessionExtended?.mode ||
      undefined;

    if (!mode) {
      return (
        <Tag color="default">
          Mode: <Text type="secondary">Not specified</Text>
        </Tag>
      );
    }

    const normalized = String(mode).toUpperCase();

    if (normalized.includes('ELITE') || normalized.includes('CRITICAL')) {
      return (
        <Tag color="red">
          Mode:{' '}
          <Text strong style={{ marginLeft: 4 }}>
            Elite / Critical
          </Text>
        </Tag>
      );
    }

    if (normalized.includes('LEARNING')) {
      return (
        <Tag color="blue">
          Mode:{' '}
          <Text strong style={{ marginLeft: 4 }}>
            Learning
          </Text>
        </Tag>
      );
    }

    if (normalized.includes('REHAB') || normalized.includes('RISK')) {
      return (
        <Tag color="orange">
          Mode:{' '}
          <Text strong style={{ marginLeft: 4 }}>
            Rehab / High risk
          </Text>
        </Tag>
      );
    }

    return (
      <Tag color="green">
        Mode:{' '}
        <Text strong style={{ marginLeft: 4 }}>
          {mode}
        </Text>
      </Tag>
    );
  }, [sessionExtended]);

  const unresolvedWarnings: string[] =
    sessionExtended?.warnings ?? sessionExtended?.issues ?? [];

  const progressValue = useMemo(() => {
    if (!session) return 0;
    if (!hasTeams) return 25;
    if (isProcessing) return 60;
    if (session.status === 'COMPLETED') return 100;
    return 50;
  }, [session, hasTeams, isProcessing]);

  const renderStatusTag = () => {
    if (!session) return null;

    switch (session.status) {
      case 'COMPLETED':
        return (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            Completed
          </Tag>
        );
      case 'PROCESSING':
        return (
          <Tag color="processing" icon={<ClockCircleOutlined />}>
            Processing
          </Tag>
        );
      case 'DRAFT':
        return <Tag>Draft</Tag>;
      case 'ARCHIVED':
        return <Tag color="default">Archived</Tag>;
      default:
        return <Tag>{session.status}</Tag>;
    }
  };

  // ---------------------------------------------------------------------------
  // Shell props
  // ---------------------------------------------------------------------------

  const shellTitle = session?.name ?? 'Team Builder session';
  const shellSubtitle =
    session?.description != null && session.description.trim().length > 0 ? (
      <Text type="secondary">{session.description}</Text>
    ) : (
      <Text type="secondary">
        Review configuration, history and generated teams for this Team Builder
        session.
      </Text>
    );

  const primaryAction =
    session && !isProcessing ? (
      <Button
        type="primary"
        icon={generating ? <ReloadOutlined spin /> : <BranchesOutlined />}
        onClick={handleGenerateTeams}
        loading={generating}
      >
        {hasTeams ? 'Regenerate teams' : 'Generate teams'}
      </Button>
    ) : undefined;

  const secondaryActions = (
    <Space>
      <Button icon={<ArrowLeftOutlined />} href="/teambuilder">
        Back to sessions
      </Button>
    </Space>
  );

  const metaTitle = session
    ? `Team Builder · Session · ${session.name}`
    : 'Team Builder · Session';

  // ---------------------------------------------------------------------------
  // Teams table
  // ---------------------------------------------------------------------------

  const teamRows: TeamRow[] = useMemo(() => {
    if (!session || !Array.isArray(session.teams)) return [];

    const teams = session.teams as unknown as BuilderTeamLike[];

    return teams.map((team) => {
      const members: MemberRow[] = (team.members ?? []).map((m) => ({
        id: m.id ?? m.user_id ?? String(m.name ?? 'member'),
        name: m.name ?? m.displayName ?? 'Unknown',
        role: m.role ?? m.function ?? undefined,
        isLeader: !!m.is_leader || !!m.leader,
        hasConflict: !!m.has_conflict,
        status: m.status ?? 'active',
      }));

      return {
        id: team.id ?? team.team_id ?? String(team.name ?? 'team'),
        name: team.name ?? `Team ${team.id ?? ''}`,
        size: members.length,
        score: team.score ?? team.quality_score,
        status: team.status ?? session.status,
        members,
      };
    });
  }, [session]);

  const teamColumns: TableColumnsType<TeamRow> = [
    {
      title: 'Team',
      dataIndex: 'name',
      key: 'name',
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{value}</Text>
          {record.status && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Status: {record.status}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      align: 'right',
      width: 80,
      render: value => (
        <Space>
          <TeamOutlined />
          <span>{value}</span>
        </Space>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      align: 'right',
      width: 120,
      render: value =>
        value != null ? (
          <Text>{Number(value).toFixed(2)}</Text>
        ) : (
          <Text type="secondary">–</Text>
        ),
    },
  ];

  const expandedRowRender = (team: TeamRow) => (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Text type="secondary">Members</Text>
      {team.members.length === 0 ? (
        <Text type="secondary">No members assigned yet.</Text>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }}>
          {team.members.map(member => (
            <Space
              key={member.id}
              align="center"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <Space size="small">
                <Badge
                  status={
                    member.status === 'inactive'
                      ? 'default'
                      : member.status === 'pending'
                      ? 'processing'
                      : 'success'
                  }
                />
                <Text>{member.name}</Text>
                {member.role && (
                  <Tag color="blue" style={{ marginLeft: 4 }}>
                    {member.role}
                  </Tag>
                )}
                {member.isLeader && (
                  <Tag color="gold" icon={<TeamOutlined />}>
                    Leader
                  </Tag>
                )}
                {member.hasConflict && (
                  <Tag
                    color="red"
                    icon={<AlertOutlined />}
                    style={{ marginLeft: 4 }}
                  >
                    Conflict risk
                  </Tag>
                )}
              </Space>
              {member.status && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {member.status}
                </Text>
              )}
            </Space>
          ))}
        </Space>
      )}
    </Space>
  );

  // ---------------------------------------------------------------------------
  // Timeline / history
  // ---------------------------------------------------------------------------

  const historyItems = useMemo(() => {
    const items: { label: string; description?: string }[] = [];

    if (session?.created_at) {
      items.push({
        label: `Session created – ${format(
          new Date(session.created_at),
          'PPP p',
        )}`,
        description: 'Initial configuration saved.',
      });
    }

    if (sessionExtended?.last_run_at) {
      items.push({
        label: `Teams generated – ${format(
          new Date(sessionExtended.last_run_at),
          'PPP p',
        )}`,
        description: 'Team Builder algorithm executed.',
      });
    }

    if (sessionExtended?.updated_at && sessionExtended.updated_at !== session?.created_at) {
      items.push({
        label: `Last updated – ${format(
          new Date(sessionExtended.updated_at),
          'PPP p',
        )}`,
        description: 'Configuration or teams updated.',
      });
    }

    if (items.length === 0) {
      items.push({
        label: 'No history recorded yet',
        description: 'This session has not been modified since its creation.',
      });
    }

    return items;
  }, [session, sessionExtended]);

  // ---------------------------------------------------------------------------
  // Page content
  // ---------------------------------------------------------------------------

  let content: React.ReactNode;

  if (loading && !session) {
    content = (
      <div
        style={{
          padding: '48px 0',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
  } else if (error || !session) {
    content = (
      <Alert
        type="error"
        showIcon
        message="Unable to load this session"
        description={error ?? 'Session not found.'}
        action={
          <Button
            type="primary"
            href="/teambuilder"
            icon={<ArrowLeftOutlined />}
          >
            Back to sessions
          </Button>
        }
      />
    );
  } else {
    const tabItems: TabsProps['items'] = [
      {
        key: 'overview',
        label: (
          <span>
            <CheckCircleOutlined /> Overview
          </span>
        ),
        children: (
          <Space
            direction="vertical"
            size="large"
            style={{ width: '100%' }}
          >
            {/* Status + meta card */}
            <Card>
              <Space
                direction="vertical"
                size="small"
                style={{ width: '100%' }}
              >
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} md={16}>
                    <Space size="middle" wrap>
                      <Text strong>Status:</Text>
                      {renderStatusTag()}
                      {modeTag}
                      {session.created_at && (
                        <Text type="secondary">
                          Created{' '}
                          {format(
                            new Date(session.created_at),
                            'PPP p',
                          )}
                        </Text>
                      )}
                    </Space>
                  </Col>
                  <Col
                    xs={24}
                    md={8}
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <Space direction="vertical" align="end">
                      <Text type="secondary">
                        Overall progress / lifecycle
                      </Text>
                      <Progress
                        percent={progressValue}
                        size="small"
                        status={
                          session.status === 'COMPLETED'
                            ? 'success'
                            : 'active'
                        }
                        style={{ minWidth: 160 }}
                      />
                    </Space>
                  </Col>
                </Row>

                {session.description && (
                  <Paragraph
                    type="secondary"
                    style={{ marginTop: 8, maxWidth: 720 }}
                  >
                    {session.description}
                  </Paragraph>
                )}
              </Space>
            </Card>

            {/* Config & stats card */}
            <Card title="Configuration & metrics">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Statistic
                    title="Candidates in pool"
                    value={session.candidates_count}
                    prefix={<TeamOutlined />}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Statistic
                    title="Target team size"
                    value={session.algorithm_config?.target_team_size ?? '-'}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Statistic
                    title="Teams generated"
                    value={session.teams?.length ?? 0}
                  />
                </Col>
              </Row>

              <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} md={12}>
                  <Descriptions
                    column={1}
                    size="small"
                    title="Algorithm settings"
                  >
                    <Descriptions.Item label="Strategy">
                      {session.algorithm_config?.strategy
                        ?.replace('_', ' ') ?? '–'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Max team count">
                      {sessionExtended?.algorithm_config?.max_teams ?? '–'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Fairness / rotation">
                      {sessionExtended?.algorithm_config?.fairness ?? '–'}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={24} md={12}>
                  <Descriptions
                    column={1}
                    size="small"
                    title="Context"
                  >
                    <Descriptions.Item label="Project / problem">
                      {sessionExtended?.problem_name ?? 'Not linked'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Owner">
                      {sessionExtended?.owner_name ?? '–'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mode">
                      {modeTag}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Warnings / alerts */}
            {unresolvedWarnings && unresolvedWarnings.length > 0 && (
              <Alert
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
                message="Warnings for this session"
                description={
                  <Space
                    direction="vertical"
                    size="small"
                    style={{ width: '100%' }}
                  >
                    {unresolvedWarnings.map((w: string, idx: number) => (
                      <Text key={idx} type="secondary">
                        • {w}
                      </Text>
                    ))}
                  </Space>
                }
              />
            )}

            {/* Advanced configuration */}
            <Collapse>
              <Panel
                header={
                  <Space>
                    <AlertOutlined />
                    <span>Advanced configuration details</span>
                  </Space>
                }
                key="advanced"
              >
                <Paragraph type="secondary">
                  This section can expose raw JSON or extended configuration
                  details for debugging and fine-tuning. You can keep it hidden
                  by default for non-technical users.
                </Paragraph>
                <Card size="small">
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: 12,
                    }}
                  >
                    {JSON.stringify(session.algorithm_config ?? {}, null, 2)}
                  </pre>
                </Card>
              </Panel>
            </Collapse>
          </Space>
        ),
      },
      {
        key: 'teams',
        label: (
          <span>
            <TeamOutlined /> Teams
          </span>
        ),
        children: !hasTeams ? (
          <Card>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical" size={4}>
                  <Text strong>No teams yet</Text>
                  <Text type="secondary">
                    Use the Generate teams action above to run the engine and
                    create groups.
                  </Text>
                </Space>
              }
            >
              {!isProcessing && (
                <Button
                  type="primary"
                  icon={<BranchesOutlined />}
                  onClick={handleGenerateTeams}
                  loading={generating}
                >
                  Generate teams
                </Button>
              )}
            </Empty>
          </Card>
        ) : (
          <Card>
            <Table<TeamRow>
              rowKey="id"
              columns={teamColumns}
              dataSource={teamRows}
              expandable={{
                expandedRowRender,
              }}
              pagination={false}
            />
          </Card>
        ),
      },
      {
        key: 'history',
        label: (
          <span>
            <HistoryOutlined /> History
          </span>
        ),
        children: (
          <Space
            direction="vertical"
            size="large"
            style={{ width: '100%' }}
          >
            <Card title="Timeline">
              <Timeline
                items={historyItems.map((item) => ({
                  children: (
                    <Space direction="vertical" size={2}>
                      <Text>{item.label}</Text>
                      {item.description && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.description}
                        </Text>
                      )}
                    </Space>
                  ),
                }))}
              />
            </Card>

            <Card title="Raw activity (placeholder)">
              <Paragraph type="secondary">
                Here you could show a more detailed log of changes: who adjusted
                which settings, when teams were regenerated, conflicts added or
                removed, etc.
              </Paragraph>
            </Card>
          </Space>
        ),
      },
    ];

    content = (
      <Space
        direction="vertical"
        size="large"
        style={{ width: '100%' }}
      >
        {/* Optional breadcrumb inside the shell body */}
        <Breadcrumb
          items={[
            { title: <Link href="/teambuilder">Sessions</Link> },
            { title: shellTitle },
          ]}
        />

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Space>
    );
  }

  return (
    <TeamBuilderPageShell
      title={shellTitle}
      subtitle={shellSubtitle}
      metaTitle={metaTitle}
      sectionLabel="Sessions"
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      maxWidth={1200}
    >
      {content}
    </TeamBuilderPageShell>
  );
}
