// FILE: frontend/app/keenkonnect/projects/project-workspace/page.tsx
'use client';

import { ProCard } from '@ant-design/pro-components';
import type { MenuProps, TabsProps } from 'antd';
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Empty,
  List,
  Menu,
  Space,
  Spin,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

import api from '@/api';
import KeenPageShell from '@/app/keenkonnect/KeenPageShell';

const { Title, Text, Paragraph } = Typography;

const PROJECTS_ENDPOINT = 'keenkonnect/projects/';

interface ApiProject {
  id: number;
  title: string;
  description: string;
  creator: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  tags: number[];
}


interface WorkspaceTask {
  id?: React.Key;
  title: string;
  description?: string;
  status?: string;
  assignee?: string;
  dueDate?: string;
}

interface WorkspaceMember {
  id?: React.Key;
  name: string;
  avatar?: string;
  role?: string;
  title?: string;
}

interface WorkspaceComment {
  id?: React.Key;
  author?: string;
  avatar?: React.ReactNode;
  content?: React.ReactNode;
  datetime?: React.ReactNode;
}

interface WorkspaceActivity {
  key?: React.Key;
  title: string;
  description?: string;
  status?: string;
  date?: string;
}

interface WorkspaceViewModel {
  id: number;
  name: string;
  description?: string;
  owner: string;
  status: string;
  domain?: string;
  createdAt: string;
  currentSprint?: string;
  deadline?: string;
  tasks?: WorkspaceTask[];
  members?: WorkspaceMember[];
  comments?: WorkspaceComment[];
  activity?: WorkspaceActivity[];
  timeline?: WorkspaceActivity[];
}

export default function ProjectWorkspacePage() {
  return (
    <KeenPageShell
      title="Project Workspace"
      description="Central hub for coordinating your project, tracking tasks, and collaborating with your team in KeenKonnect."
    >
      <Suspense fallback={<Spin style={{ marginTop: 40 }} />}>
        <Content />
      </Suspense>
    </KeenPageShell>
  );
}

function Content(): JSX.Element {
  const searchParams = useSearchParams();
  const projectIdParam =
    searchParams.get('projectId') || searchParams.get('id');
  const projectId = projectIdParam ? Number(projectIdParam) : null;

  const [workspace, setWorkspace] = useState<WorkspaceViewModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string>('overview');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<WorkspaceTask | null>(null);

  // Load workspace
  useEffect(() => {
    if (!projectId) {
      setError(
        'No project selected. Open this workspace from the projects list or pass ?projectId=<id>.',
      );
      setLoading(false);
      return;
    }

    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await api.get<ApiProject>(
          `${PROJECTS_ENDPOINT}${projectId}/`,
        );

        const mapped: WorkspaceViewModel = {
          id: data.id,
          name: data.title,
          description: data.description ?? '',
          owner: data.creator ?? '',
          status: data.status || 'Active',
          domain: data.category ?? 'Uncategorized',
          createdAt: data.created_at,
          // These can later be wired to real endpoints (tasks, messages, etc.)
          tasks: [],
          members: [],
          comments: [],
          activity: [],
        };

        setWorkspace(mapped);
      } catch (err) {
         
        console.error('Failed to load project workspace', err);
        setError(
          'Error loading workspace. Some information may be unavailable.',
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchWorkspace();
  }, [projectId]);

  // Safely derive arrays from the workspace payload
  const tasks = workspace?.tasks ?? [];
  const members = workspace?.members ?? [];
  const comments = workspace?.comments ?? [];
  const activity = workspace?.activity ?? workspace?.timeline ?? [];

  const derivedActivity =
    activity.length > 0
      ? activity
      : tasks.map((task, index) => ({
          key: task.id || `task-${index}`,
          title: task.title,
          description: task.description,
          status: task.status,
          date: task.dueDate || workspace?.deadline,
        }));

  const statusText: string = workspace?.status || 'Active';

  const statusTagColor =
    statusText === 'On Track'
      ? 'success'
      : statusText === 'At Risk'
      ? 'warning'
      : statusText === 'Blocked'
      ? 'error'
      : 'default';

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === 'Done' || task.status === 'Completed',
  ).length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === 'In Progress' || task.status === 'Doing',
  ).length;

  const menuItems: MenuProps['items'] = [
    {
      key: 'overview',
      label: 'Overview',
    },
    {
      key: 'tasks',
      label: 'Tasks & Sprints',
    },
    {
      key: 'timeline',
      label: 'Timeline',
    },
    {
      key: 'discussion',
      label: 'Discussion',
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    setActiveKey(key as string);
  };

  const handleTabChange = (key: string) => {
    setActiveKey(key);
  };

  const handleTaskClick = (task: WorkspaceTask) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  // Tabs items (new API)
  const tabsItems: TabsProps['items'] = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <>
          <ProCard
            bordered
            title="Highlights"
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: 16 }}
          >
            <List
              size="small"
              dataSource={[
                {
                  key: 'status',
                  label: 'Current status',
                  value: statusText,
                },
                {
                  key: 'sprint',
                  label: 'Active sprint',
                  value:
                    workspace?.currentSprint || 'No active sprint configured',
                },
                {
                  key: 'deadline',
                  label: 'Next deadline',
                  value: workspace?.deadline || 'No deadline set',
                },
              ]}
              renderItem={(item) => (
                <List.Item key={item.key}>
                  <Space>
                    <Text type="secondary">{item.label}:</Text>
                    <Text>{item.value}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </ProCard>

          <ProCard
            bordered
            title="Recent activity"
            bodyStyle={{ padding: 16 }}
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => setActiveKey('timeline')}
              >
                View full timeline
              </Button>
            }
          >
            {derivedActivity.length === 0 ? (
              <Empty description="No recent activity yet." />
            ) : (
              <Timeline
                style={{ marginTop: 8 }}
                items={derivedActivity.slice(0, 5).map((item) => ({
                  color:
                    item.status === 'Completed' || item.status === 'Done'
                      ? 'green'
                      : item.status === 'Blocked'
                      ? 'red'
                      : 'blue',
                  children: (
                    <div>
                      <Text strong>{item.title}</Text>
                      {item.date && (
                        <div>
                          <Text type="secondary">{item.date}</Text>
                        </div>
                      )}
                      {item.description && (
                        <Paragraph style={{ marginBottom: 0 }}>
                          {item.description}
                        </Paragraph>
                      )}
                    </div>
                  ),
                }))}
              />
            )}
          </ProCard>
        </>
      ),
    },
    {
      key: 'tasks',
      label: 'Tasks & Sprints',
      children: (
        <List
          itemLayout="horizontal"
          dataSource={tasks}
          locale={{
            emptyText: 'No tasks configured for this workspace yet.',
          }}
          renderItem={(task) => (
            <List.Item
              key={task.id || task.title}
              onClick={() => handleTaskClick(task)}
              style={{ cursor: 'pointer' }}
            >
              <List.Item.Meta
                title={
                  <Space size="small">
                    <Text strong>{task.title}</Text>
                    {task.status && <Tag>{task.status}</Tag>}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={2}>
                    {task.description && (
                      <Text type="secondary">{task.description}</Text>
                    )}
                    <Space size="small">
                      {task.assignee && (
                        <Text type="secondary">
                          Owner:&nbsp;
                          <Text>{task.assignee}</Text>
                        </Text>
                      )}
                      {task.dueDate && (
                        <Text type="secondary">
                          · Due:&nbsp;
                          <Text>{task.dueDate}</Text>
                        </Text>
                      )}
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ),
    },
    {
      key: 'timeline',
      label: 'Timeline',
      children:
        derivedActivity.length === 0 ? (
          <Empty description="No timeline events to show yet." />
        ) : (
          <Timeline
            style={{ marginTop: 8 }}
            items={derivedActivity.map((item) => ({
              color:
                item.status === 'Completed' || item.status === 'Done'
                  ? 'green'
                  : item.status === 'Blocked'
                  ? 'red'
                  : 'blue',
              children: (
                <div>
                  <Text strong>{item.title}</Text>
                  {item.date && (
                    <div>
                      <Text type="secondary">{item.date}</Text>
                    </div>
                  )}
                  {item.description && (
                    <Paragraph style={{ marginBottom: 0 }}>
                      {item.description}
                    </Paragraph>
                  )}
                </div>
              ),
            }))}
          />
        ),
    },
    {
      key: 'discussion',
      label: 'Discussion',
      children: (
        <List
          dataSource={comments}
          locale={{
            emptyText:
              'No discussion yet. Start the conversation with your team.',
          }}
          renderItem={(comment) => (
            <List.Item key={comment.id}>
              <List.Item.Meta
                avatar={
                  comment.avatar || (
                    <Avatar>
                      {comment.author?.charAt(0)?.toUpperCase() ?? '?'}
                    </Avatar>
                  )
                }
                title={
                  <Space size="small">
                    <Text strong>{comment.author ?? 'Unknown participant'}</Text>
                    {comment.datetime ? (
                      <Text type="secondary">{comment.datetime}</Text>
                    ) : null}
                  </Space>
                }
                description={comment.content}
              />
            </List.Item>
          )}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Title level={3} style={{ marginBottom: 8 }}>
        {workspace?.name || 'Project Workspace'}
      </Title>

      <Paragraph
        type="secondary"
        style={{ marginBottom: 24, maxWidth: 720 }}
      >
        {workspace?.description ||
          'Central hub for coordinating your project, tracking tasks, and collaborating with your team in KeenKonnect.'}
      </Paragraph>

      {error && (
        <Paragraph type="danger" style={{ marginBottom: 16 }}>
          {error}
        </Paragraph>
      )}

      <ProCard split="vertical" gutter={24} bordered>
        {/* Left column: context + menu + team */}
        <ProCard
          colSpan={{ xs: 24, sm: 24, md: 8, lg: 7, xl: 6 }}
          title="Workspace overview"
          bordered={false}
        >
          <Space
            direction="vertical"
            size="middle"
            style={{ width: '100%' }}
          >
            <div>
              <Text strong>Status:&nbsp;</Text>
              <Tag color={statusTagColor}>{statusText}</Tag>
            </div>

            {workspace?.currentSprint && (
              <div>
                <Text strong>Current sprint:&nbsp;</Text>
                <Text>{workspace.currentSprint}</Text>
              </div>
            )}

            {workspace?.deadline && (
              <div>
                <Text strong>Deadline:&nbsp;</Text>
                <Text>{workspace.deadline}</Text>
              </div>
            )}

            <Space size="large" style={{ marginTop: 4 }}>
              <Badge
                color="blue"
                text={
                  <span>
                    Total tasks:&nbsp;
                    <Text strong>{totalTasks}</Text>
                  </span>
                }
              />
              <Badge
                color="green"
                text={
                  <span>
                    Completed:&nbsp;
                    <Text strong>{completedTasks}</Text>
                  </span>
                }
              />
              <Badge
                color="gold"
                text={
                  <span>
                    In progress:&nbsp;
                    <Text strong>{inProgressTasks}</Text>
                  </span>
                }
              />
            </Space>

            <div style={{ marginTop: 8 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Sections
              </Text>
              <Menu
                mode="inline"
                selectedKeys={[activeKey]}
                onClick={handleMenuClick}
                items={menuItems}
                style={{ borderRight: 0 }}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Team members
              </Text>
              <List
                size="small"
                dataSource={members}
                locale={{
                  emptyText:
                    'No team members linked to this workspace yet.',
                }}
                renderItem={(member) => (
                  <List.Item key={member.id || member.name}>
                    <List.Item.Meta
                      avatar={
                        member.avatar ? (
                          <Avatar size="small" src={member.avatar} />
                        ) : (
                          <Avatar size="small">
                            {member.name?.charAt(0)?.toUpperCase() ?? '?'}
                          </Avatar>
                        )
                      }
                      title={member.name}
                      description={
                        member.role || member.title || 'Contributor'
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </Space>
        </ProCard>

        {/* Right column: main content with tabs */}
        <ProCard colSpan="auto" bordered={false}>
          <Tabs
            activeKey={activeKey}
            onChange={handleTabChange}
            items={tabsItems}
          />
        </ProCard>
      </ProCard>

      {/* Drawer for task details */}
      <Drawer
        title={selectedTask?.title}
        placement="right"
        width={400}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {selectedTask ? (
          <Space
            direction="vertical"
            size="middle"
            style={{ width: '100%' }}
          >
            <div>
              <Text strong>Status:</Text>{' '}
              {selectedTask.status || 'N/A'}
            </div>
            {selectedTask.description && (
              <Paragraph>{selectedTask.description}</Paragraph>
            )}
            <div>
              <Text strong>Owner:</Text>{' '}
              {selectedTask.assignee || 'Unassigned'}
            </div>
            {selectedTask.dueDate && (
              <div>
                <Text strong>Due date:</Text> {selectedTask.dueDate}
              </div>
            )}
          </Space>
        ) : (
          <Empty description="No task selected." />
        )}
      </Drawer>
    </>
  );
}
