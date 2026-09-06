// frontend/app/teambuilder/problems/[problemId]/page.tsx
'use client';

import {
  AlertOutlined,
  ApartmentOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CopyOutlined,
  ExclamationCircleOutlined,
  ExperimentOutlined,
  FireOutlined,
  FundOutlined,
  ProfileOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { format } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import TeamBuilderPageShell from '@/components/teambuilder/TeamBuilderPageShell';
import { teambuilderService } from '@/services/teambuilder';

const { Text, Paragraph, Title } = Typography;

/* ------------------------------------------------------------------------- */
/* Local types (since services/teambuilder/types.ts has no problem types yet) */
/* ------------------------------------------------------------------------- */

type ProblemStatus = 'ACTIVE' | 'DRAFT' | 'DEPRECATED' | string;
type ProblemRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;

interface ITeambuilderProblem {
  id: string;
  name: string;
  description?: string;
  status?: ProblemStatus;
  risk_level?: ProblemRiskLevel;
  min_team_size?: number | null;
  max_team_size?: number | null;
  recommended_modes?: string[];
  categories?: string[];
  unesco_codes?: string[];
  facilitator_notes?: string;
  created_at?: string;
  updated_at?: string;
}

type ProblemSessionStatus = 'COMPLETED' | 'PROCESSING' | 'DRAFT' | 'ARCHIVED' | string;

interface IProblemSessionSummary {
  id: string;
  name: string;
  status: ProblemSessionStatus;
  mode?: string;
  created_at?: string;
  outcome_score?: number;
}

type ProblemChangeType = 'STATUS_CHANGE' | 'EDIT' | string;

interface IProblemChangeEvent {
  id: string;
  type: ProblemChangeType;
  timestamp?: string;
  title: string;
  description?: string;
}

interface IProblemDetailResponse {
  problem: ITeambuilderProblem;
  sessions?: IProblemSessionSummary[];
  history?: IProblemChangeEvent[];
}

type TabKey = 'overview' | 'sessions' | 'taxonomy';

export default function ProblemDetailPage(): JSX.Element {
  const { problemId } = useParams();

  const [problem, setProblem] = useState<ITeambuilderProblem | null>(null);
  const [sessions, setSessions] = useState<IProblemSessionSummary[]>([]);
  const [history, setHistory] = useState<IProblemChangeEvent[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const fetchProblem = useCallback(async () => {
    if (!problemId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await teambuilderService.getProblemDetail(
        problemId as string,
      );

      setProblem(data.problem);
      setSessions(data.sessions ?? []);
      setHistory(data.history ?? []);
    } catch (err) {
       
      console.error(err);
      setError('Failed to load problem details.');
    } finally {
      setLoading(false);
    }
  }, [problemId]);

  useEffect(() => {
    fetchProblem();
  }, [fetchProblem]);

  // ---------------------------------------------------------------------------
  // Helpers & derived values
  // ---------------------------------------------------------------------------

  const riskTag = () => {
    if (!problem) return null;
    const risk = problem.risk_level ?? 'MEDIUM';

    let color: string = 'default';
    let icon: React.ReactNode = <AlertOutlined />;

    if (risk === 'LOW') {
      color = 'green';
      icon = <FundOutlined />;
    } else if (risk === 'MEDIUM') {
      color = 'gold';
      icon = <ExperimentOutlined />;
    } else if (risk === 'HIGH') {
      color = 'volcano';
      icon = <FireOutlined />;
    } else if (risk === 'CRITICAL') {
      color = 'red';
      icon = <ExclamationCircleOutlined />;
    }

    const label =
      typeof risk === 'string'
        ? risk.charAt(0) + risk.slice(1).toLowerCase()
        : 'Medium';

    return (
      <Tag color={color} icon={icon}>
        {label} risk
      </Tag>
    );
  };

  const statusBadge = () => {
    if (!problem) return null;

    switch (problem.status) {
      case 'ACTIVE':
        return <Badge status="success" text="Active" />;
      case 'DRAFT':
        return <Badge status="warning" text="Draft" />;
      case 'DEPRECATED':
        return <Badge status="error" text="Deprecated" />;
      default:
        return <Badge status="default" text={problem.status ?? 'Unknown'} />;
    }
  };

  const usageCount = sessions.length;
  const averageOutcome =
    sessions.length > 0
      ? (
          sessions.reduce(
            (sum, s) => sum + (s.outcome_score ?? 0),
            0,
          ) / sessions.length
        ).toFixed(1)
      : '—';

  const unescoTags = (problem?.unesco_codes ?? []).map((code: string) => (
    <Tag key={code} color="blue">
      {code}
    </Tag>
  ));

  const modeTags = (problem?.recommended_modes ?? []).map((mode: string) => (
    <Tag key={mode} color="purple">
      {mode}
    </Tag>
  ));

  const categoryTags = (problem?.categories ?? []).map((cat: string) => (
    <Tag key={cat} color="geekblue">
      {cat}
    </Tag>
  ));

  const showDeprecatedAlert =
    problem && (problem.status === 'DRAFT' || problem.status === 'DEPRECATED');

  // ---------------------------------------------------------------------------
  // Shell props
  // ---------------------------------------------------------------------------

  const shellTitle = problem?.name ?? 'Problem';
  const shellSubtitle =
    problem?.description && problem.description.trim().length > 0 ? (
      <Text type="secondary">{problem.description}</Text>
    ) : (
      <Text type="secondary">
        View detailed metadata, taxonomy and sessions using this problem
        template.
      </Text>
    );

  const metaTitle = problem
    ? `Team Builder · Problem · ${problem.name}`
    : 'Team Builder · Problem';

  const primaryAction = problem ? (
    <Space>
      <Button
        type="primary"
        icon={<ProjectOutlined />}
        href={`/teambuilder/create?problemId=${encodeURIComponent(problem.id)}`}
      >
        Create session with this problem
      </Button>
    </Space>
  ) : undefined;

  const secondaryActions = problem ? (
    <Space>
      <Button icon={<ArrowLeftOutlined />} href="/teambuilder/problems">
        Back to problems
      </Button>
      <Button
        icon={<CopyOutlined />}
        href={`/teambuilder/problems/create?duplicate=${encodeURIComponent(
          problem.id,
        )}`}
      >
        Duplicate
      </Button>
      <Button
        icon={<ProfileOutlined />}
        href={`/teambuilder/problems/${encodeURIComponent(problem.id)}/edit`}
      >
        Edit
      </Button>
    </Space>
  ) : (
    <Button icon={<ArrowLeftOutlined />} href="/teambuilder/problems">
      Back to problems
    </Button>
  );

  // ---------------------------------------------------------------------------
  // Tab contents
  // ---------------------------------------------------------------------------

  const renderOverviewTab = () => {
    if (!problem) {
      return (
        <Card>
          <Empty description="No problem data available." />
        </Card>
      );
    }

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {showDeprecatedAlert && (
          <Alert
            type={problem.status === 'DEPRECATED' ? 'error' : 'warning'}
            showIcon
            icon={<ExclamationCircleOutlined />}
            message={
              problem.status === 'DEPRECATED'
                ? 'This problem is deprecated'
                : 'This problem is still in draft'
            }
            description={
              problem.status === 'DEPRECATED'
                ? 'Avoid using this problem for new sessions. Existing sessions may still reference it, but it is not recommended for future work.'
                : 'You can use this problem for experiments and learning sessions, but mark it as Active when you are ready to use it widely.'
            }
          />
        )}

        {/* Meta card */}
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Descriptions title="Problem metadata" column={1} bordered={false}>
                <Descriptions.Item label="Name">
                  {problem.name}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {statusBadge()}
                </Descriptions.Item>
                <Descriptions.Item label="Risk level">
                  {riskTag()}
                </Descriptions.Item>
                <Descriptions.Item label="Typical team size">
                  {problem.min_team_size && problem.max_team_size
                    ? `${problem.min_team_size}–${problem.max_team_size} people`
                    : 'Not specified'}
                </Descriptions.Item>
                <Descriptions.Item label="Recommended modes">
                  {modeTags.length > 0 ? (
                    modeTags
                  ) : (
                    <Text type="secondary">None explicitly set</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Categories">
                  {categoryTags.length > 0 ? (
                    categoryTags
                  ) : (
                    <Text type="secondary">Not categorised yet</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Col>

            <Col xs={24} md={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Title level={5}>Usage & outcomes</Title>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="Sessions using this problem"
                      value={usageCount}
                      prefix={<ApartmentOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Avg. outcome score"
                      value={averageOutcome}
                      prefix={<FundOutlined />}
                    />
                  </Col>
                </Row>

                {problem.created_at && (
                  <Text type="secondary">
                    Created {format(new Date(problem.created_at), 'PPP p')}
                  </Text>
                )}
                {problem.updated_at && (
                  <Text type="secondary">
                    Last updated {format(new Date(problem.updated_at), 'PPP p')}
                  </Text>
                )}
              </Space>
            </Col>
          </Row>
        </Card>

        {/* History / changes */}
        <Card title="History of changes">
          {history.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No history recorded yet."
            />
          ) : (
            <Timeline
              mode="left"
              items={history.map((event) => ({
                color: event.type === 'STATUS_CHANGE' ? 'blue' : 'gray',
                children: (
                  <Space direction="vertical" size={2}>
                    <Text strong>{event.title}</Text>
                    <Text type="secondary">
                      {event.timestamp
                        ? format(new Date(event.timestamp), 'PPP p')
                        : null}
                    </Text>
                    {event.description && (
                      <Text type="secondary">{event.description}</Text>
                    )}
                  </Space>
                ),
              }))}
            />
          )}
        </Card>
      </Space>
    );
  };

  const renderSessionsTab = () => {
    if (!problem) {
      return (
        <Card>
          <Empty description="No problem loaded." />
        </Card>
      );
    }

    const columns = [
      {
        title: 'Session',
        dataIndex: 'name',
        key: 'name',
        render: (value: string, record: IProblemSessionSummary) => (
          <Button type="link" href={`/teambuilder/${record.id}`}>
            {value}
          </Button>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: ProblemSessionStatus) => {
          switch (status) {
            case 'COMPLETED':
              return <Badge status="success" text="Completed" />;
            case 'PROCESSING':
              return <Badge status="processing" text="Processing" />;
            case 'DRAFT':
              return <Badge status="warning" text="Draft" />;
            case 'ARCHIVED':
              return <Badge status="default" text="Archived" />;
            default:
              return <Badge status="default" text={status} />;
          }
        },
      },
      {
        title: 'Mode',
        dataIndex: 'mode',
        key: 'mode',
        render: (mode: string | undefined) =>
          mode ? (
            <Tag color="purple">{mode}</Tag>
          ) : (
            <Text type="secondary">—</Text>
          ),
      },
      {
        title: 'Created',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (value: string | undefined) =>
          value ? format(new Date(value), 'PPP p') : '—',
      },
      {
        title: 'Outcome score',
        dataIndex: 'outcome_score',
        key: 'outcome_score',
        render: (score: number | undefined) =>
          typeof score === 'number' ? score.toFixed(1) : '—',
      },
      {
        title: '',
        key: 'actions',
        render: (_: unknown, record: IProblemSessionSummary) => (
          <Button
            type="link"
            icon={<ArrowRightOutlined />}
            href={`/teambuilder/${record.id}`}
          >
            View
          </Button>
        ),
      },
    ];

    return (
      <Card>
        {sessions.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size={4}>
                <Text strong>No sessions yet</Text>
                <Text type="secondary">
                  Use “Create session with this problem” to generate the first
                  team configuration for this scenario.
                </Text>
              </Space>
            }
          >
            <Button
              type="primary"
              icon={<ProjectOutlined />}
              href={`/teambuilder/create?problemId=${encodeURIComponent(
                problem.id,
              )}`}
            >
              Create session
            </Button>
          </Empty>
        ) : (
          <Table<IProblemSessionSummary>
            rowKey="id"
            dataSource={sessions}
            columns={columns}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
    );
  };

  const renderTaxonomyTab = () => {
    if (!problem) {
      return (
        <Card>
          <Empty description="No problem loaded." />
        </Card>
      );
    }

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="UNESCO taxonomy & domains">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space direction="vertical">
              <Text type="secondary">UNESCO codes</Text>
              {unescoTags.length > 0 ? (
                <Space wrap>{unescoTags}</Space>
              ) : (
                <Text type="secondary">
                  No UNESCO classification set yet.
                </Text>
              )}
            </Space>

            <Space direction="vertical">
              <Text type="secondary">Categories</Text>
              {categoryTags.length > 0 ? (
                <Space wrap>{categoryTags}</Space>
              ) : (
                <Text type="secondary">
                  No additional categories defined.
                </Text>
              )}
            </Space>

            <Paragraph type="secondary">
              UNESCO taxonomy helps you classify problems according to fields of
              science, education and societal challenges. This can be used to
              route problems to the right experts and ensure coverage of
              relevant disciplines in teams.
            </Paragraph>
          </Space>
        </Card>

        <Card title="Notes for facilitators">
          {problem.facilitator_notes ? (
            <Paragraph>{problem.facilitator_notes}</Paragraph>
          ) : (
            <Text type="secondary">
              No specific notes provided yet. Use this space to add guidance on
              how to present this problem to participants.
            </Text>
          )}
        </Card>
      </Space>
    );
  };

  // ---------------------------------------------------------------------------
  // Main content
  // ---------------------------------------------------------------------------

  let body: React.ReactNode;

  if (loading && !problem) {
    body = (
      <Card>
        <Space
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '48px 0',
          }}
        >
          <Typography.Text>Loading problem…</Typography.Text>
        </Space>
      </Card>
    );
  } else if (error || !problem) {
    body = (
      <Card>
        <Alert
          type="error"
          showIcon
          message="Unable to load this problem"
          description={error ?? 'Problem not found.'}
          action={
            <Button
              type="primary"
              href="/teambuilder/problems"
              icon={<ArrowLeftOutlined />}
            >
              Back to problems
            </Button>
          }
        />
      </Card>
    );
  } else {
    body = (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Breadcrumb / context */}
        <Breadcrumb
          items={[
            { title: <Link href="/teambuilder">Team Builder</Link> },
            { title: <Link href="/teambuilder/problems">Problems</Link> },
            { title: problem.name },
          ]}
        />

        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as TabKey)}
            items={[
              {
                key: 'overview',
                label: 'Overview',
                children: renderOverviewTab(),
              },
              {
                key: 'sessions',
                label: `Sessions (${usageCount})`,
                children: renderSessionsTab(),
              },
              {
                key: 'taxonomy',
                label: 'Taxonomy',
                children: renderTaxonomyTab(),
              },
            ]}
          />
        </Card>
      </Space>
    );
  }

  return (
    <TeamBuilderPageShell
      title={shellTitle}
      subtitle={shellSubtitle}
      metaTitle={metaTitle}
      sectionLabel="Problems"
      maxWidth={1200}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
    >
      {body}
    </TeamBuilderPageShell>
  );
}
