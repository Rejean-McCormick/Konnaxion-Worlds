// FILE: frontend/app/keenkonnect/workspaces/browse-available-workspaces/page.tsx
'use client';

import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Input,
  List,
  Pagination,
  Row,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import KeenPageShell from '@/app/keenkonnect/KeenPageShell';

const { Search } = Input;
const { Text } = Typography;

type WorkspaceCategory = 'focus' | 'collaboration' | 'creative' | 'innovation';

interface Workspace {
  id: string;
  name: string;
  owner: string;
  purpose: string;
  tools: string[];
  category: WorkspaceCategory;
  currentUsers: number;
  lastActive: string;
  isJoinable: boolean;
  participants: string[];
}

const PREVIEW_WORKSPACES: Workspace[] = [
  {
    id: '1',
    name: 'Data Science Hub',
    owner: 'Alice',
    purpose: 'Collaborative workspace for data analysis and machine learning projects.',
    tools: ['Data Science Notebook', 'Python'],
    category: 'focus',
    currentUsers: 10,
    lastActive: '2023-09-06 10:00',
    isJoinable: true,
    participants: ['Alice', 'Noah', 'Luc'],
  },
  {
    id: '2',
    name: 'VR Collaboration Space',
    owner: 'Bob',
    purpose: 'Virtual reality space for immersive teamwork.',
    tools: ['VR', '3D Modeling'],
    category: 'collaboration',
    currentUsers: 5,
    lastActive: '2023-09-06 09:30',
    isJoinable: false,
    participants: ['Bob', 'Ravi'],
  },
  {
    id: '3',
    name: 'Programming Lab',
    owner: 'Charlie',
    purpose: 'Workspace for coding projects and software development.',
    tools: ['Programming', 'Collaboration Tools'],
    category: 'focus',
    currentUsers: 8,
    lastActive: '2023-09-06 11:15',
    isJoinable: true,
    participants: ['Charlie', 'Mia', 'Jon'],
  },
  {
    id: '4',
    name: 'Design Studio',
    owner: 'Diana',
    purpose: 'Creative space for design brainstorming and UI/UX work.',
    tools: ['Design Tools', 'Whiteboard'],
    category: 'creative',
    currentUsers: 3,
    lastActive: '2023-09-06 08:45',
    isJoinable: true,
    participants: ['Diana', 'Lea'],
  },
  {
    id: '5',
    name: 'Innovators Room',
    owner: 'Edward',
    purpose: 'Workspace for innovative projects and ideation.',
    tools: ['Brainstorming', 'Prototyping'],
    category: 'innovation',
    currentUsers: 12,
    lastActive: '2023-09-06 10:30',
    isJoinable: false,
    participants: ['Edward', 'Sara', 'Tom', 'Yasmin'],
  },
];

const workspaceTabs = [
  { key: 'all', label: 'All Workspaces' },
  { key: 'focus', label: 'Focus Pods' },
  { key: 'collaboration', label: 'Collaboration Spaces' },
  { key: 'creative', label: 'Creative Studios' },
  { key: 'innovation', label: 'Innovation Labs' },
];

export default function BrowseAvailableWorkspaces(): JSX.Element {
  const router = useRouter();

  const [searchText, setSearchText] = useState('');
  const [selectedTool, setSelectedTool] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;

  const filteredWorkspaces = useMemo<Workspace[]>(() => {
    const lowerSearch = searchText.toLowerCase();

    return PREVIEW_WORKSPACES.filter((workspace) => {
      const matchesTab =
        activeTab === 'all' ||
        workspace.category === (activeTab as WorkspaceCategory);

      const matchesSearch =
        !lowerSearch ||
        workspace.name.toLowerCase().includes(lowerSearch) ||
        workspace.purpose.toLowerCase().includes(lowerSearch);

      const matchesTool =
        selectedTool === 'All' || workspace.tools.includes(selectedTool);

      return matchesTab && matchesSearch && matchesTool;
    });
  }, [searchText, selectedTool, activeTab]);

  const paginatedWorkspaces = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredWorkspaces.slice(startIndex, startIndex + pageSize);
  }, [filteredWorkspaces, currentPage, pageSize]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setCurrentPage(1);
  };

  return (
    <KeenPageShell
      title="Browse Available Workspaces"
      description="Discover active collaboration spaces you can join across KeenKonnect."
      toolbar={
        <Button
          type="primary"
          onClick={() =>
            router.push('/keenkonnect/workspaces/launch-new-workspace')
          }
        >
          Launch New Workspace
        </Button>
      }
    >
      <Alert
        type="info"
        showIcon
        message="Workspace discovery preview"
        description="KeenKonnect does not expose a workspace persistence or membership contract in this build. The records below are declared preview data; join/request actions are disabled."
        style={{ marginBottom: 16 }}
      />
      {/* Search & filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12}>
          <Search
            placeholder="Search workspaces"
            allowClear
            onSearch={(value) => {
              setSearchText(value);
              setCurrentPage(1);
            }}
          />
        </Col>
        <Col xs={24} sm={12}>
          <Select
            value={selectedTool}
            style={{ width: '100%' }}
            onChange={(value: string) => {
              setSelectedTool(value);
              setCurrentPage(1);
            }}
            options={[
              { value: 'All', label: 'All Tools' },
              { value: 'Data Science Notebook', label: 'Data Science Notebook' },
              { value: 'VR', label: 'VR' },
              { value: 'Programming', label: 'Programming' },
              { value: 'Design Tools', label: 'Design Tools' },
              { value: '3D Modeling', label: '3D Modeling' },
              { value: 'Whiteboard', label: 'Whiteboard' },
              { value: 'Brainstorming', label: 'Brainstorming' },
              { value: 'Prototyping', label: 'Prototyping' },
            ]}
          />
        </Col>
      </Row>

      {/* Category tabs */}
      <Tabs
        items={workspaceTabs}
        activeKey={activeTab}
        onChange={handleTabChange}
        style={{ marginBottom: 16 }}
      />

      <Divider />

      {/* Workspaces list */}
      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3 }}
        dataSource={paginatedWorkspaces}
        renderItem={(workspace: Workspace) => (
          <List.Item key={workspace.id}>
            <Card
              hoverable
              title={workspace.name}
              extra={
                <Space size="small">
                  <Text type="secondary">Host: {workspace.owner}</Text>
                  <Badge
                    status={workspace.isJoinable ? 'success' : 'warning'}
                    text={workspace.isJoinable ? 'Joinable' : 'Request only'}
                  />
                </Space>
              }
              actions={[
                <Button
                  key="join"
                  type="primary"
                  disabled
                  title="Workspace membership is unavailable until a backend contract exists."
                >
                  {workspace.isJoinable ? 'Join' : 'Request Access'}
                </Button>,
              ]}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text>{workspace.purpose}</Text>

                <Space wrap>
                  <Tag color="blue">{workspace.category.toUpperCase()}</Tag>
                  {workspace.tools.map((tool) => (
                    <Tag key={tool}>{tool}</Tag>
                  ))}
                </Space>

                <Divider style={{ margin: '12px 0' }} />

                <Row justify="space-between" align="middle">
                  <Col>
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">Currently online</Text>
                      <Tag color="geekblue">
                        {workspace.currentUsers} users
                      </Tag>
                    </Space>
                  </Col>
                  <Col>
                    <Space
                      direction="vertical"
                      size={0}
                      style={{ textAlign: 'right' }}
                    >
                      <Text type="secondary">Last active</Text>
                      <Text>{workspace.lastActive}</Text>
                    </Space>
                  </Col>
                </Row>

                <Divider style={{ margin: '12px 0' }} />

                {/* Avatar.Group showing preview participants */}
                <Space direction="vertical" size={4}>
                  <Text type="secondary">Active collaborators</Text>
                  <Avatar.Group max={{ count: 3 }}>
                    {workspace.participants.map((name) => (
                      <Avatar key={name}>
                        {name.charAt(0).toUpperCase()}
                      </Avatar>
                    ))}
                  </Avatar.Group>
                </Space>
              </Space>
            </Card>
          </List.Item>
        )}
      />

      <Row justify="center" style={{ marginTop: 24 }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredWorkspaces.length}
          onChange={(page) => setCurrentPage(page)}
        />
      </Row>
    </KeenPageShell>
  );
}
