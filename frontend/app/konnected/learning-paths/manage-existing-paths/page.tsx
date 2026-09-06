// FILE: frontend/app/konnected/learning-paths/manage-existing-paths/page.tsx
﻿'use client';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Button,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import Link from 'next/link';
import React, { useRef, useState } from 'react';

import { apiFetch } from '@/api';
import KonnectedPageShell from '@/app/konnected/KonnectedPageShell';

const { Paragraph, Text } = Typography;
const { Option } = Select;

const API_BASE = '/api/konnected/learning-paths'; // Adjust to match your backend

type LearningPathStatus = 'draft' | 'published' | 'archived';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface LearningPath {
  id: string | number;
  /** Display name of the path (maps to CertificationPath.name / LearningPath.title) */
  name: string;
  /** Optional long description */
  description?: string;
  /** Difficulty band for filtering in UI only (optional in backend) */
  difficulty?: Difficulty;
  /** Subject or topic grouping (STEM, Civics, etc.) */
  subject?: string;
  /** Human-friendly owner label (instructor or admin) */
  owner_name?: string;
  owner_id?: string | number;
  /** Tag labels for search/filter (optional) */
  tags?: string[];
  /** Draft / Published / Archived */
  status: LearningPathStatus;
  /** ISO timestamps (may come from DB or view) */
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
  /** Learners currently enrolled or who completed this path */
  learners_count?: number;
  /** Count of steps/modules in the path */
  modules_count?: number;
}

type TableQueryParams = {
  current?: number;
  pageSize?: number;
  status?: LearningPathStatus;
  owner?: string;
  subject?: string;
  keyword?: string;
  created_from?: string;
  created_to?: string;
};

type EditFormValues = {
  name: string;
  description?: string;
  difficulty?: Difficulty;
  subject?: string;
  status: LearningPathStatus;
};

type LearningPathListResponse = {
  results?: LearningPath[];
  items?: LearningPath[];
  count?: number;
  total?: number;
};

async function listLearningPaths(params: TableQueryParams) {
  const searchParams = new URLSearchParams();

  if (params.current) searchParams.set('page', String(params.current));
  if (params.pageSize) searchParams.set('page_size', String(params.pageSize));
  if (params.status) searchParams.set('status', params.status);
  if (params.owner) searchParams.set('owner', params.owner);
  if (params.subject) searchParams.set('subject', params.subject);
  if (params.keyword) searchParams.set('search', params.keyword);
  if (params.created_from) searchParams.set('created_from', params.created_from);
  if (params.created_to) searchParams.set('created_to', params.created_to);

  const res = await apiFetch(
    `${API_BASE}?${searchParams.toString()}`,
    { credentials: 'include' },
  );

  if (!res.ok) {
    throw new Error('Failed to load learning paths.');
  }

  // Support both { results, count } and { items, total } shapes
  const json = (await res.json()) as LearningPathListResponse;
  const data = (json.results ?? json.items ?? []) ?? [];
  const total = json.count ?? json.total ?? data.length;

  return { data, total };
}

async function updateLearningPath(id: string | number, payload: Partial<LearningPath>) {
  const res = await apiFetch(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to update learning path.');
  }

  return res.json();
}

async function archiveLearningPath(id: string | number) {
  const res = await apiFetch(`${API_BASE}/${id}/archive`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to archive learning path.');
  }
}

async function deleteLearningPath(id: string | number) {
  const res = await apiFetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to delete learning path.');
  }
}

function renderStatusTag(status: LearningPathStatus): React.ReactNode {
  const label =
    status === 'draft'
      ? 'Draft'
      : status === 'published'
      ? 'Published'
      : 'Archived';

  const color =
    status === 'published' ? 'green' : status === 'draft' ? 'gold' : 'default';

  return <Tag color={color}>{label}</Tag>;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function isFormValidationError(error: unknown): error is { errorFields: unknown } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errorFields' in error
  );
}

export default function ManageExistingPathsPage(): JSX.Element {
  const actionRef = useRef<ActionType>();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null);
  const [editForm] = Form.useForm<EditFormValues>();

  const openEditModal = (record: LearningPath) => {
    setEditingPath(record);
    editForm.setFieldsValue({
      name: record.name,
      description: record.description,
      difficulty: record.difficulty,
      subject: record.subject,
      status: record.status,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      if (!editingPath) return;

      setEditSubmitting(true);
      await updateLearningPath(editingPath.id, values);
      message.success('Learning path updated.');
      setEditModalOpen(false);
      setEditingPath(null);
      editForm.resetFields();
      actionRef.current?.reload();
    } catch (err: unknown) {
      // Ignore validation errors (they’re already shown by antd)
      if (isFormValidationError(err)) return;
      message.error(errorMessage(err, 'Failed to update learning path.'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const confirmArchive = (record: LearningPath) => {
    Modal.confirm({
      title: 'Archive this learning path?',
      content:
        'Learners will no longer see this path in recommendations, but historical progress may remain visible.',
      okText: 'Archive',
      onOk: async () => {
        try {
          await archiveLearningPath(record.id);
          message.success('Learning path archived.');
          actionRef.current?.reload();
        } catch (err: unknown) {
          message.error(errorMessage(err, 'Failed to archive learning path.'));
        }
      },
    });
  };

  const confirmDelete = (record: LearningPath) => {
    Modal.confirm({
      title: 'Delete this learning path?',
      content:
        'This action cannot be undone. If learners are still attached, prefer archiving instead of deleting.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteLearningPath(record.id);
          message.success('Learning path deleted.');
          actionRef.current?.reload();
        } catch (err: unknown) {
          message.error(errorMessage(err, 'Failed to delete learning path.'));
        }
      },
    });
  };

  const columns: ProColumns<LearningPath>[] = [
    {
      title: 'Path',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (dom, record) => (
        <Link href={`/konnected/learning-paths/manage-existing-paths/${record.id}`}>
          {dom}
        </Link>
      ),
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      search: {
        transform: (value: string) => ({ subject: value }),
      },
    },
    {
      title: 'Owner',
      dataIndex: 'owner_name',
      key: 'owner_name',
      ellipsis: true,
      render: (dom) => dom ?? '—',
      search: {
        transform: (value: string) => ({ owner: value }),
      },
    },
    {
      title: 'Difficulty',
      dataIndex: 'difficulty',
      key: 'difficulty',
      valueType: 'select',
      valueEnum: {
        Beginner: { text: 'Beginner' },
        Intermediate: { text: 'Intermediate' },
        Advanced: { text: 'Advanced' },
      },
      render: (_, record) => record.difficulty || '—',
    },
    {
      title: 'Modules',
      dataIndex: 'modules_count',
      key: 'modules_count',
      width: 110,
      align: 'right',
      render: (dom) => (dom ?? '—'),
      search: false,
    },
    {
      title: 'Learners',
      dataIndex: 'learners_count',
      key: 'learners_count',
      width: 120,
      align: 'right',
      render: (dom) => (dom ?? 0),
      search: false,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      valueType: 'date',
      width: 140,
      render: (_, record) => formatDate(record.created_at),
      search: false,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      valueType: 'select',
      width: 130,
      valueEnum: {
        draft: { text: 'Draft' },
        published: { text: 'Published' },
        archived: { text: 'Archived' },
      },
      render: (_, record) => renderStatusTag(record.status),
    },
    {
      title: 'Created between',
      dataIndex: 'created_at_range',
      hideInTable: true,
      valueType: 'dateRange',
      search: {
        transform: (value: [string, string]) => ({
          created_from: value[0],
          created_to: value[1],
        }),
      },
    },
    {
      title: 'Keyword',
      dataIndex: 'keyword',
      hideInTable: true,
      renderFormItem: () => (
        <Input placeholder="Search by title, description, tags…" allowClear />
      ),
      search: {
        transform: (value: string) => ({ keyword: value }),
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 220,
      valueType: 'option',
      render: (_, record) => {
        const canEdit = record.status !== 'archived';
        const canArchive = record.status !== 'archived';
        const canDelete = record.status === 'draft';

        return (
          <Space size="small">
            <Button type="link" onClick={() => openEditModal(record)} disabled={!canEdit}>
              <EditOutlined /> Edit
            </Button>
            <Button
              type="link"
              onClick={() => confirmArchive(record)}
              disabled={!canArchive}
            >
              Archive
            </Button>
            <Button
              type="link"
              danger
              onClick={() => confirmDelete(record)}
              disabled={!canDelete}
            >
              <DeleteOutlined /> Delete
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <KonnectedPageShell
      title="Manage Learning Paths"
      subtitle={
        <Paragraph style={{ marginBottom: 0 }}>
          Review, edit, archive or delete existing learning paths. Published paths
          are visible to learners and may already have active enrollments.
        </Paragraph>
      }
      primaryAction={
        <Link href="/konnected/learning-paths/create-learning-path">
          <Button type="primary" icon={<PlusOutlined />}>
            Create Path
          </Button>
        </Link>
      }
    >
      <ProTable<LearningPath, TableQueryParams>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `${total} learning paths`,
        }}
        search={{
          labelWidth: 120,
        }}
        locale={{
          emptyText: (
            <Empty description="No learning paths found.">
              <Link href="/konnected/learning-paths/create-learning-path">
                <Button type="primary" icon={<PlusOutlined />}>
                  Create New Path
                </Button>
              </Link>
            </Empty>
          ),
        }}
        toolBarRender={() => [
          <Text type="secondary" key="hint">
            Filter by owner, subject, status or date to narrow down large catalogs.
          </Text>,
        ]}
        request={async (params) => {
          try {
            const { data, total } = await listLearningPaths({
              current: params.current,
              pageSize: params.pageSize,
              status: params.status as LearningPathStatus | undefined,
              owner: params.owner as string | undefined,
              subject: params.subject as string | undefined,
              keyword: params.keyword as string | undefined,
              created_from: (params as TableQueryParams).created_from,
              created_to: (params as TableQueryParams).created_to,
            });

            return {
              data,
              total,
              success: true,
            };
          } catch (err: unknown) {
            message.error(errorMessage(err, 'Failed to load learning paths.'));
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
      />

      <Modal
        title={
          editingPath
            ? `Edit learning path – ${editingPath.name}`
            : 'Edit learning path'
        }
        open={editModalOpen}
        onOk={handleEditSubmit}
        confirmLoading={editSubmitting}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingPath(null);
          editForm.resetFields();
        }}
        destroyOnClose
      >
        <Form<EditFormValues> form={editForm} layout="vertical">
          <Form.Item
            label="Path name"
            name="name"
            rules={[{ required: true, message: 'Please enter a path name.' }]}
          >
            <Input placeholder="e.g. Intro to Sustainability for Team Leads" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Short summary of who this path is for and what it covers."
            />
          </Form.Item>

          <Form.Item label="Difficulty" name="difficulty">
            <Select allowClear placeholder="Select difficulty">
              <Option value="Beginner">Beginner</Option>
              <Option value="Intermediate">Intermediate</Option>
              <Option value="Advanced">Advanced</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Subject / Domain" name="subject">
            <Input placeholder="e.g. AI Ethics, Public Health, Civic Engagement" />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select a status.' }]}
          >
            <Select>
              <Option value="draft">Draft</Option>
              <Option value="published">Published</Option>
              <Option value="archived">Archived</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </KonnectedPageShell>
  );
}
