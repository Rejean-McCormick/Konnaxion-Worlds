// FILE: frontend/app/keenkonnect/dashboard/page.tsx
'use client';

import {
  AppstoreOutlined,
  ArrowRightOutlined,
  BellOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  DashboardOutlined,
  FileTextOutlined,
  PlusOutlined,
  RocketOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { ProCard, StatisticCard } from '@ant-design/pro-components';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Divider,
  List,
  Progress,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import Link from 'next/link';
import React from 'react';

import KeenPageShell from '@/app/keenkonnect/KeenPageShell';

const { Text, Paragraph } = Typography;

type SummaryMetric = {
  key: string;
  title: string;
  value: number;
  suffix?: string;
  description?: string;
};

type Project = {
  id: string;
  name: string;
  status: 'In Progress' | 'Planning' | 'Completed';
  role: string;
};

type Workspace = {
  id: string;
  name: string;
  participants: number;
  focus: string;
};

type KnowledgeItem = {
  id: string;
  title: string;
  type: string;
  link: string;
};

type Task = {
  id: string;
  title: string;
  due: string;
  priority: 'Low' | 'Medium' | 'High';
};

type NotificationItem = {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  time: string;
};

type TimelineEvent = {
  id: string;
  time: string;
  description: string;
};

type QuickAction = {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
};

// --- Declared preview data (no AI matching service contract yet) ---

const summaryMetrics: SummaryMetric[] = [
  {
    key: 'projects',
    title: 'Active Projects',
    value: 7,
    description: 'Across your ecosystems',
  },
  {
    key: 'workspaces',
    title: 'Live Workspaces',
    value: 3,
    description: 'Teams currently collaborating',
  },
  {
    key: 'knowledge',
    title: 'Knowledge Assets',
    value: 32,
    description: 'Docs, methods & playbooks',
  },
  {
    key: 'aiMatches',
    title: 'New AI Matches',
    value: 4,
    description: 'Suggested teams to review',
  },
];

const myProjects: Project[] = [
  {
    id: 'p1',
    name: 'Climate-Resilient Urban Plan',
    status: 'In Progress',
    role: 'Lead Facilitator',
  },
  {
    id: 'p2',
    name: 'Circular Economy Innovation Challenge',
    status: 'Planning',
    role: 'Program Orchestrator',
  },
  {
    id: 'p3',
    name: 'Multi-city Just Transition Portfolio',
    status: 'In Progress',
    role: 'Steward',
  },
];

const activeWorkspaces: Workspace[] = [
  {
    id: 'w1',
    name: 'Regional Sustainability Lab – Montreal',
    participants: 24,
    focus: 'Climate & urban resilience',
  },
  {
    id: 'w2',
    name: 'Just Transition Story Lab',
    participants: 18,
    focus: 'Narratives & social impact',
  },
  {
    id: 'w3',
    name: 'Circular Solutions Sprint – Q4',
    participants: 12,
    focus: 'Circular economy pilots',
  },
];

const knowledgeItems: KnowledgeItem[] = [
  {
    id: 'k1',
    title: 'Impact Evaluation Framework – Urban Resilience',
    type: 'Methodology',
    link: '/keenkonnect/knowledge/browse-repository',
  },
  {
    id: 'k2',
    title: 'Stakeholder Mapping Canvas – Just Transition',
    type: 'Template',
    link: '/keenkonnect/knowledge/browse-repository',
  },
  {
    id: 'k3',
    title: 'Systems Story Library – Circular Economy',
    type: 'Story Library',
    link: '/keenkonnect/knowledge/browse-repository',
  },
];

const myTasks: Task[] = [
  {
    id: 't1',
    title: 'Finalize proposal for Climate-Resilient Urban Plan',
    due: 'Today',
    priority: 'High',
  },
  {
    id: 't2',
    title: 'Review AI-recommended collaborators for Just Transition Lab',
    due: 'Tomorrow',
    priority: 'Medium',
  },
  {
    id: 't3',
    title: 'Tag and upload new blueprint to repository',
    due: 'This week',
    priority: 'Low',
  },
];

const notifications: NotificationItem[] = [
  {
    id: 'n1',
    message:
      'You have a pending invitation from Team Delta to join "Circular Solutions Sprint – Q4".',
    type: 'info',
    time: '2 hours ago',
  },
  {
    id: 'n2',
    message: 'Repository "Sustainable Materials" has 3 new documents.',
    type: 'success',
    time: 'Yesterday',
  },
  {
    id: 'n3',
    message:
      'Workspace "Regional Sustainability Lab – Montreal" starts its next cycle on Monday.',
    type: 'warning',
    time: '2 days ago',
  },
];

const activityTimeline: TimelineEvent[] = [
  {
    id: 'a1',
    time: '09:15',
    description: 'You created the project "Climate-Resilient Urban Plan".',
  },
  {
    id: 'a2',
    time: '10:02',
    description:
      'AI Team Matching suggested 2 new collaborators for "Just Transition Story Lab".',
  },
  {
    id: 'a3',
    time: '11:30',
    description:
      'New blueprint uploaded to the repository for "Circular Solutions Sprint – Q4".',
  },
  {
    id: 'a4',
    time: '14:05',
    description:
      'Workspace "Regional Sustainability Lab – Montreal" scheduled its next session.',
  },
];

const quickActions: QuickAction[] = [
  {
    key: 'newProject',
    title: 'Create project',
    description: 'Set up a new multi-partner initiative.',
    href: '/keenkonnect/projects/create-new-project',
    icon: <PlusOutlined />,
  },
  {
    key: 'launchWorkspace',
    title: 'Launch workspace',
    description: 'Open a collaboration space for your team.',
    href: '/keenkonnect/workspaces/launch-new-workspace',
    icon: <RocketOutlined />,
  },
  {
    key: 'browseRepository',
    title: 'Browse repository',
    description: 'Explore blueprints and shared documents.',
    href: '/keenkonnect/knowledge/browse-repository',
    icon: <AppstoreOutlined />,
  },
  {
    key: 'uploadDocument',
    title: 'Upload document',
    description: 'Add a new asset to the knowledge base.',
    href: '/keenkonnect/knowledge/upload-new-document',
    icon: <FileTextOutlined />,
  },
  {
    key: 'sustainabilityDashboard',
    title: 'Impact dashboard',
    description: 'Track sustainability metrics across projects.',
    href: '/keenkonnect/sustainability-impact/sustainability-dashboard',
    icon: <DashboardOutlined />,
  },
  {
    key: 'viewReputation',
    title: 'View reputation',
    description: 'See your Ethikos reputation profile.',
    href: '/keenkonnect/user-reputation/view-reputation-ekoh',
    icon: <CrownOutlined />,
  },
];

export default function KeenKonnectDashboard(): JSX.Element {
  return (
    <KeenPageShell
      title="KeenKonnect Dashboard"
      description="Orchestrate projects, workspaces, and knowledge across your ecosystems — and keep an eye on AI matches, impact, and your Ethikos profile."
      toolbar={
        <Space>
          <Link href="/keenkonnect/projects/my-projects">
            <Button>View projects</Button>
          </Link>
          <Link href="/keenkonnect/ai-team-matching/match-preferences">
            <Button type="primary" icon={<TeamOutlined />}>
              AI team matching
            </Button>
          </Link>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Dashboard preview data"
        description="Project orchestration routes are live, while dashboard summary cards and AI-match suggestions remain declared preview values until dedicated aggregate contracts are exposed."
      />
      {/* KPI band */}
      <ProCard gutter={16} wrap style={{ marginBottom: 16 }}>
        {summaryMetrics.map((metric) => (
          <StatisticCard
            key={metric.key}
            colSpan={{ xs: 24, sm: 12, md: 12, lg: 6 }}
            statistic={{
              title: metric.title,
              value: metric.value,
              suffix: metric.suffix,
              description: metric.description,
            }}
          />
        ))}
      </ProCard>

      {/* Main columns: projects/workspaces vs today-at-a-glance */}
      <ProCard split="vertical" gutter={16} style={{ marginBottom: 16 }}>
        {/* Projects & Workspaces */}
        <ProCard
          colSpan={{ xs: 24, xl: 16 }}
          title="Projects & Workspaces"
          subTitle="Where collaboration actually happens"
        >
          <ProCard split="horizontal" ghost>
            {/* My Projects */}
            <ProCard
              title="My Projects"
              bordered={false}
              extra={
                <Link href="/keenkonnect/projects/my-projects">
                  <Space size={4}>
                    <span>View all</span>
                    <ArrowRightOutlined />
                  </Space>
                </Link>
              }
            >
              <List
                itemLayout="horizontal"
                dataSource={myProjects}
                renderItem={(project) => (
                  <List.Item
                    key={project.id}
                    actions={[
                      <Link key="open" href="/keenkonnect/projects/my-projects">
                        Open
                      </Link>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{project.name}</Text>
                          <Tag color="blue">{project.role}</Tag>
                        </Space>
                      }
                      description={
                        <Space size="small">
                          <Badge
                            status={
                              project.status === 'In Progress'
                                ? 'processing'
                                : project.status === 'Planning'
                                ? 'warning'
                                : 'success'
                            }
                          />
                          <Text type="secondary">{project.status}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </ProCard>

            <Divider style={{ margin: '12px 0' }} />

            {/* Active Workspaces */}
            <ProCard
              title="Active Workspaces"
              bordered={false}
              extra={
                <Link href="/keenkonnect/workspaces/my-workspaces">
                  <Space size={4}>
                    <span>View all</span>
                    <ArrowRightOutlined />
                  </Space>
                </Link>
              }
            >
              <List
                itemLayout="horizontal"
                dataSource={activeWorkspaces}
                renderItem={(workspace) => (
                  <List.Item
                    key={workspace.id}
                    actions={[
                      <Link
                        key="open"
                        href="/keenkonnect/workspaces/my-workspaces"
                      >
                        Open
                      </Link>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Text strong>{workspace.name}</Text>
                          <Tag color="geekblue">{workspace.focus}</Tag>
                        </Space>
                      }
                      description={
                        <Text type="secondary">
                          {workspace.participants} participants currently active
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </ProCard>
          </ProCard>
        </ProCard>

        {/* Today at a Glance */}
        <ProCard
          colSpan={{ xs: 24, xl: 8 }}
          title="Today at a Glance"
          extra={<Badge count={notifications.length} offset={[8, 0]} />}
        >
          {/* My Tasks */}
          <ProCard
            title="My Tasks"
            bordered={false}
            size="small"
            subTitle={
              <Text type="secondary">Focus on impact-critical items</Text>
            }
          >
            <List
              size="small"
              dataSource={myTasks}
              renderItem={(task) => (
                <List.Item key={task.id}>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text>{task.title}</Text>
                        <Tag
                          color={
                            task.priority === 'High'
                              ? 'red'
                              : task.priority === 'Medium'
                              ? 'orange'
                              : 'default'
                          }
                        >
                          {task.priority}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Text type="secondary">
                        Due: <strong>{task.due}</strong>
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </ProCard>

          <Divider style={{ margin: '12px 0' }} />

          {/* Notifications */}
          <ProCard
            title={
              <Space>
                <BellOutlined />
                <span>Notifications</span>
              </Space>
            }
            bordered={false}
            size="small"
          >
            <List
              size="small"
              dataSource={notifications}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Text>{item.message}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.time}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </ProCard>
        </ProCard>
      </ProCard>

      {/* Knowledge Hub & Recent Activity */}
      <ProCard gutter={16} split="vertical" style={{ marginBottom: 16 }}>
        {/* Knowledge Hub */}
        <ProCard
          colSpan={{ xs: 24, md: 12 }}
          title="Knowledge Hub"
          subTitle="Methods, playbooks, and shared assets"
          extra={
            <Link href="/keenkonnect/knowledge/browse-repository">
              <Space size={4}>
                <span>Open knowledge hub</span>
                <ArrowRightOutlined />
              </Space>
            </Link>
          }
        >
          <List
            itemLayout="horizontal"
            dataSource={knowledgeItems}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                actions={[
                  <Link key="open" href={item.link}>
                    View
                  </Link>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      style={{ backgroundColor: '#f5f5f5', color: '#555' }}
                      icon={<FileTextOutlined />}
                    />
                  }
                  title={
                    <Space>
                      <Text strong>{item.title}</Text>
                      <Tag>{item.type}</Tag>
                    </Space>
                  }
                  description={
                    <Text type="secondary">
                      Recently used in your workspaces
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        </ProCard>

        {/* Recent Activity */}
        <ProCard
          colSpan={{ xs: 24, md: 12 }}
          title="Recent Activity"
          subTitle="What changed in your ecosystem"
        >
          <Timeline
            mode="left"
            items={activityTimeline.map((event) => ({
              key: event.id,
              dot: <ClockCircleOutlined />,
              children: (
                <Space direction="vertical" size={0}>
                  <Text strong>{event.time}</Text>
                  <Text type="secondary">{event.description}</Text>
                </Space>
              ),
            }))}
          />
        </ProCard>
      </ProCard>

      {/* AI matching + Ethikos Profile & Quick Actions */}
      <ProCard gutter={16} split="vertical">
        {/* AI Team Matching */}
        <ProCard
          colSpan={{ xs: 24, md: 12 }}
          title="AI Team Matching"
          subTitle="Smart suggestions for project teams"
          extra={
            <Space>
              <Link href="/keenkonnect/ai-team-matching/my-matches">
                <Button type="link" size="small">
                  View matches
                </Button>
              </Link>
              <Link href="/keenkonnect/ai-team-matching/match-preferences">
                <Button type="primary" size="small" icon={<TeamOutlined />}>
                  New matching run
                </Button>
              </Link>
            </Space>
          }
        >
          <Paragraph>
            AI matching analyses expertise, diversity, and collaboration patterns across
            your ecosystem to propose high-impact teams.
          </Paragraph>
          <List
            size="small"
            header={<Text strong>Highlights</Text>}
            dataSource={[
              '4 new suggested teams for climate resilience projects',
              '2 under-utilised experts flagged for upcoming workspaces',
              '1 cross-ecosystem collaboration opportunity linking Montreal & Nairobi labs',
            ]}
            renderItem={(text, idx) => (
              <List.Item key={idx}>
                <Text>{text}</Text>
              </List.Item>
            )}
          />
        </ProCard>

        {/* Ethikos Profile & Quick Actions */}
        <ProCard
          colSpan={{ xs: 24, md: 12 }}
          title="Ethikos Profile & Impact"
          subTitle="How your orchestration shows up across the network"
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space align="center">
              <Badge.Ribbon text="Beta">
                <Avatar
                  size={56}
                  style={{ backgroundColor: '#faad14', marginRight: 12 }}
                  icon={<CrownOutlined />}
                />
              </Badge.Ribbon>
              <div>
                <Text strong>Ethikos Orchestrator Profile</Text>
                <br />
                <Text type="secondary">
                  Reputation, trust and ethical alignment — integrated with KeenKonnect.
                </Text>
              </div>
            </Space>

            <div>
              <Text type="secondary">Profile completeness</Text>
              <Progress percent={68} size="small" />
            </div>

            <div>
              <Text type="secondary">Impact coverage across SDGs</Text>
              <Progress
                percent={72}
                size="small"
                success={{ percent: 40 }}
                format={(percent) => `${percent}% of mapped initiatives`}
              />
            </div>

            <Divider style={{ margin: '8px 0' }} />

            <ProCard
              title="Quick actions"
              bordered={false}
              size="small"
              ghost
              style={{ padding: 0 }}
            >
              <List
                grid={{ gutter: 16, xs: 1, sm: 2 }}
                dataSource={quickActions}
                renderItem={(action) => (
                  <List.Item key={action.key}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Link href={action.href}>
                        <Button block icon={action.icon}>
                          {action.title}
                        </Button>
                      </Link>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {action.description}
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            </ProCard>
          </Space>
        </ProCard>
      </ProCard>
    </KeenPageShell>
  );
}
