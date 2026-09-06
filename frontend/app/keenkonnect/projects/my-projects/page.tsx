// app/keenkonnect/projects/my-projects/page.tsx
'use client';

import {
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  RocketOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Button,
  Dropdown,
  Progress,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import api from '@/api';
import KeenPage from '@/app/keenkonnect/KeenPageShell';

const { Text } = Typography;
const { Option } = Select;

// Aligne avec le backend: /api/keenkonnect/projects/
const PROJECTS_ENDPOINT = 'keenkonnect/projects/';

type ProjectStatus = 'idea' | 'progress' | 'completed' | 'validated';

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

interface Project {
  id: number;
  name: string;
  owner: string;
  category: string;
  status: ProjectStatus;
  createdAt: string; // ISO date string
  progress: number; // 0–100 (placeholder for now)
}

export default function MyProjectsPage(): JSX.Element {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);

        const data = await api.get<ApiProject[]>(PROJECTS_ENDPOINT);

        const mapped: Project[] = data.map((p) => ({
          id: p.id,
          name: p.title,
          owner: p.creator ?? '',
          category: p.category ?? 'Uncategorized',
          status: (p.status as ProjectStatus) || 'idea',
          createdAt: p.created_at,
          // For now, progress is a placeholder; you can later map it
          // from tasks completion stats or a dedicated field.
          progress: 0,
        }));

        setProjects(mapped);
      } catch (err) {
         
        console.error('Failed to load projects', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchProjects();
  }, []);

  const filtered: Project[] = useMemo(() => {
    if (statusFilter === 'all') return projects;
    return projects.filter((p) => p.status === statusFilter);
  }, [projects, statusFilter]);

  const handleView = (id: number): void => {
    router.push(`/keenkonnect/projects/project-workspace?projectId=${id}`);
  };

  const handleEdit = (id: number): void => {
    // Placeholder: adapt when you add an edit page
    router.push(`/keenkonnect/projects/project-workspace?projectId=${id}`);
  };

  const handleLaunch = (id: number): void => {
    router.push(`/keenkonnect/projects/project-workspace?projectId=${id}`);
  };

  const statusColors: Record<
    ProjectStatus,
    'default' | 'processing' | 'success' | 'warning' | 'error'
  > = {
    idea: 'default',
    progress: 'processing',
    completed: 'success',
    validated: 'success',
  };

  const columns: ProColumns<Project>[] = [
    {
      title: 'Project',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name}</Text>
          <Space size="small">
            <Tag icon={<TeamOutlined />}>Owner: {record.owner || 'Unknown'}</Tag>
            <Tag>{record.category}</Tag>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      valueType: 'select',
      valueEnum: {
        idea: { text: 'Idea' },
        progress: { text: 'In progress' },
        completed: { text: 'Completed' },
        validated: { text: 'Validated' },
      },
      render: (_, record) => (
        <Tag color={statusColors[record.status]}>
          {record.status === 'progress' ? 'In progress' : record.status}
        </Tag>
      ),
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      width: 200,
      render: (_, record) => (
        <Progress
          percent={record.progress}
          size="small"
          status={record.progress === 100 ? 'success' : 'active'}
        />
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      valueType: 'date',
    },
    {
      title: 'Actions',
      key: 'actions',
      valueType: 'option',
      render: (_, record) => [
        <Dropdown.Button
          key="actions"
          type="primary"
          icon={<RocketOutlined />}
          onClick={() => handleLaunch(record.id)}
          menu={{
            items: [
              {
                key: 'view',
                label: (
                  <span>
                    <EyeOutlined style={{ marginRight: 8 }} />
                    View
                  </span>
                ),
              },
              {
                key: 'edit',
                label: (
                  <span>
                    <EditOutlined style={{ marginRight: 8 }} />
                    Edit
                  </span>
                ),
              },
              {
                key: 'launch',
                label: (
                  <span>
                    <RocketOutlined style={{ marginRight: 8 }} />
                    Launch
                  </span>
                ),
              },
            ],
            onClick: ({ key }) => {
              if (key === 'view') {
                handleView(record.id);
              } else if (key === 'edit') {
                handleEdit(record.id);
              } else if (key === 'launch') {
                handleLaunch(record.id);
              }
            },
          }}
        >
          Launch
        </Dropdown.Button>,
      ],
    },
  ];

  return (
    <KeenPage
      title="My Projects"
      description="Browse and manage your KeenKonnect projects."
      metaTitle="KeenKonnect · My Projects"
    >
      <>
        {loading && (
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Spin />
          </div>
        )}

        <ProTable<Project>
          rowKey="id"
          headerTitle="My Projects"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10 }}
          search={false}
          options={false}
          loading={loading}
          cardBordered
          toolBarRender={() => [
            <Space key="filters" align="center">
              <Text>Status:</Text>
              <Select<ProjectStatus | 'all'>
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                style={{ width: 220 }}
              >
                <Option value="all">All</Option>
                <Option value="idea">Idea</Option>
                <Option value="progress">In progress</Option>
                <Option value="completed">Completed</Option>
                <Option value="validated">Validated</Option>
              </Select>
            </Space>,
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                router.push('/keenkonnect/projects/create-new-project')
              }
            >
              Create New Project
            </Button>,
          ]}
        />
      </>
    </KeenPage>
  );
}
