// C:\MyCode\Konnaxionv14\frontend\app\keenkonnect\knowledge\document-management\page.tsx
'use client';

import {
  EyeOutlined,
  PlusOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  EditableProTable,
  ModalForm,
  type ProColumns,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Input,
  List,
  message,
  Row,
  Space,
  Switch,
  Tag,
  Tooltip,
} from 'antd';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import KeenPage from '@/app/keenkonnect/KeenPageShell';

const { TextArea } = Input;

type DocumentStatus = 'Draft' | 'Published' | 'Archived';

type ManagedDocument = {
  id: string;
  title: string;
  category: string;
  language: string;
  owner: string;
  status: DocumentStatus;
  aiIndexed: boolean;
  visible: boolean;
  version: string;
  updatedAt: string;
  tags: string[];
  summary: string;
};

type VersionItem = {
  version: string;
  timestamp: string;
  author: string;
  changeSummary: string;
};

type CommentItem = {
  id: number;
  author: string;
  avatar: string;
  content: string;
  datetime: string;
};

type NewDocumentFormValues = {
  title: string;
  category: string;
  language: string;
  owner?: string;
  status?: DocumentStatus;
  aiIndexed?: boolean;
  visible?: boolean;
  tags?: string[];
  summary?: string;
};

const initialDocuments: ManagedDocument[] = [
  {
    id: 'doc-1',
    title: 'Innovative Research Document',
    category: 'Research',
    language: 'English',
    owner: 'Dr. Alice Chen',
    status: 'Published',
    aiIndexed: true,
    visible: true,
    version: '1.4',
    updatedAt: '2025-05-12',
    tags: ['robotics', 'clinical-trials'],
    summary:
      'Over the last three funding cycles, the robotics and clinical teams have collaborated on a shared protocol that aligns safety thresholds and trial milestones across sites.',
  },
  {
    id: 'doc-2',
    title: 'Robotics Safety Guidelines – v2',
    category: 'Safety & Compliance',
    language: 'English',
    owner: 'Security Office',
    status: 'Draft',
    aiIndexed: false,
    visible: true,
    version: '2.0-draft',
    updatedAt: '2025-04-30',
    tags: ['safety', 'protocol'],
    summary:
      'Draft revision of robotics safety guidelines, including new proximity sensor checks and human-in-the-loop overrides for high-risk procedures.',
  },
  {
    id: 'doc-3',
    title: 'Clinical Trial Template (Phase II)',
    category: 'Clinical Protocol',
    language: 'French',
    owner: 'Clinical Ops',
    status: 'Published',
    aiIndexed: true,
    visible: true,
    version: '1.1',
    updatedAt: '2025-03-18',
    tags: ['template', 'phase-II'],
    summary:
      'Standardized template for Phase II clinical trials, ready for localization and site-specific amendments.',
  },
  {
    id: 'doc-4',
    title: 'Legacy Device Integration Notes',
    category: 'Design Blueprint',
    language: 'English',
    owner: 'Systems Engineering',
    status: 'Archived',
    aiIndexed: false,
    visible: false,
    version: '0.9',
    updatedAt: '2024-12-02',
    tags: ['legacy', 'integration'],
    summary:
      'Historical notes on integrating first-generation devices with the current control stack. Kept for traceability.',
  },
  {
    id: 'doc-5',
    title: 'Onboarding Learning Module – Robotics Basics',
    category: 'Learning Module',
    language: 'French',
    owner: 'People & Culture',
    status: 'Published',
    aiIndexed: true,
    visible: true,
    version: '1.0',
    updatedAt: '2025-01-10',
    tags: ['onboarding', 'training'],
    summary:
      'Introductory learning module that covers robotics fundamentals, safety posture, and escalation paths for new team members.',
  },
];

const versionHistory: VersionItem[] = [
  {
    version: '1.4',
    timestamp: '2025-05-12 10:15',
    author: 'Dr. Alice Chen',
    changeSummary: 'Clarified safety thresholds for Phase II trials.',
  },
  {
    version: '1.3',
    timestamp: '2025-03-28 16:42',
    author: 'Dr. Omar El-Sayed',
    changeSummary: 'Added cross-site comparison metrics and monitoring hooks.',
  },
  {
    version: '1.2',
    timestamp: '2024-12-09 09:20',
    author: 'Dr. Helena Ruiz',
    changeSummary: 'Aligned terminology with the institutional ethics committee.',
  },
  {
    version: '1.1',
    timestamp: '2024-07-18 14:55',
    author: 'Dr. Alice Chen',
    changeSummary: 'Initial roll-out for robotics–clinical protocol harmonization.',
  },
];

const commentsData: CommentItem[] = [
  {
    id: 1,
    author: 'Dr. Alice Chen',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=female',
    content:
      'Let’s keep the safety thresholds conservative for the first pilot sites. We can relax them once we have stable telemetry.',
    datetime: '2 hours ago',
  },
  {
    id: 2,
    author: 'Dr. Omar El-Sayed',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=male',
    content:
      'Agreed. I’d also like to add one more metric around post-op mobility for the robotics-assisted procedures.',
    datetime: '1 hour ago',
  },
  {
    id: 3,
    author: 'Dr. Helena Ruiz',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=female',
    content:
      'Once this goes live, I’ll present it to the ethics board. Please tag any sections you expect to change in the next revision.',
    datetime: '25 minutes ago',
  },
];

const getStatusColor = (status: DocumentStatus): string => {
  switch (status) {
    case 'Published':
      return 'green';
    case 'Draft':
      return 'gold';
    case 'Archived':
    default:
      return 'default';
  }
};

export default function DocumentManagementPage() {
  const [messageApi, messageContextHolder] = message.useMessage();
  const router = useRouter();

  const [dataSource, setDataSource] = useState<ManagedDocument[]>(initialDocuments);
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<ManagedDocument | null>(null);

  const updateDocument = (id: string, patch: Partial<ManagedDocument>) => {
    setDataSource(prev =>
      prev.map(item => (item.id === id ? { ...item, ...patch } : item)),
    );
    setSelectedDocument(prev =>
      prev && prev.id === id ? ({ ...prev, ...patch } as ManagedDocument) : prev,
    );
  };

  const handleSaveChanges = () => {
    if (!selectedDocument) return;
    messageApi.info(
      'Changes are kept in this browser session only; no document persistence endpoint is exposed.',
    );
  };

  const handlePublishNewVersion = () => {
    if (!selectedDocument) return;
    messageApi.warning(
      'Version publishing is unavailable until a document-version persistence contract exists.',
    );
  };

  const handleCreateDocument = async (values: NewDocumentFormValues) => {
    const now = new Date();
    const newDoc: ManagedDocument = {
      id: `doc-${now.getTime()}`,
      title: values.title,
      category: values.category,
      language: values.language,
      owner: values.owner || 'You',
      status: values.status || 'Draft',
      aiIndexed: values.aiIndexed ?? true,
      visible: values.visible ?? true,
      version: '1.0',
      updatedAt: now.toISOString().slice(0, 10),
      tags: values.tags && values.tags.length ? values.tags : ['draft'],
      summary:
        values.summary ||
        'New document created from Document Management. Replace this text with the actual content or link to your storage layer.',
    };

    setDataSource(prev => [...prev, newDoc]);
    setSelectedDocument(newDoc);
    setDrawerOpen(true);
    messageApi.info(
      'Document added to the current session only; it has not been persisted.',
    );

    return true;
  };

  const columns: ProColumns<ManagedDocument>[] = [
    {
      title: 'Title',
      dataIndex: 'title',
      ellipsis: true,
      copyable: true,
      formItemProps: {
        rules: [{ required: true, message: 'Title is required' }],
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      valueType: 'select',
      filters: true,
      onFilter: true,
      valueEnum: {
        Research: { text: 'Research' },
        'Safety & Compliance': { text: 'Safety & Compliance' },
        'Clinical Protocol': { text: 'Clinical Protocol' },
        'Design Blueprint': { text: 'Design Blueprint' },
        'Learning Module': { text: 'Learning Module' },
      },
    },
    {
      title: 'Language',
      dataIndex: 'language',
      valueType: 'select',
      filters: true,
      onFilter: true,
      valueEnum: {
        English: { text: 'English' },
        French: { text: 'French' },
      },
      width: 110,
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      width: 180,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      valueType: 'select',
      filters: true,
      onFilter: true,
      valueEnum: {
        Draft: { text: 'Draft', status: 'Default' },
        Published: { text: 'Published', status: 'Success' },
        Archived: { text: 'Archived', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)}>{record.status}</Tag>
      ),
      width: 120,
    },
    {
      title: 'AI indexing',
      dataIndex: 'aiIndexed',
      valueType: 'switch',
      render: (_, record) => (
        <Tooltip
          title={
            record.aiIndexed
              ? 'Document is used by assistants and semantic search.'
              : 'Document is excluded from AI-powered features.'
          }
        >
          <Switch
            size="small"
            checked={record.aiIndexed}
            onChange={checked => updateDocument(record.id, { aiIndexed: checked })}
          />
        </Tooltip>
      ),
      width: 140,
    },
    {
      title: 'Visible',
      dataIndex: 'visible',
      valueType: 'switch',
      render: (_, record) => (
        <Switch
          size="small"
          checked={record.visible}
          onChange={checked => updateDocument(record.id, { visible: checked })}
        />
      ),
      width: 110,
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      search: false,
      render: (_, record) =>
        record.tags && record.tags.length ? (
          <Space size={[0, 8]} wrap>
            {record.tags.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
    },
    {
      title: 'Last updated',
      dataIndex: 'updatedAt',
      valueType: 'date',
      sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      width: 140,
    },
    {
      title: 'Version',
      dataIndex: 'version',
      width: 90,
    },
    {
      title: 'Actions',
      valueType: 'option',
      fixed: 'right',
      width: 170,
      render: (_, record, __, action) => [
        <a
          key="view"
          onClick={() => {
            setSelectedDocument(record);
            setDrawerOpen(true);
          }}
        >
          Details
        </a>,
        <a
          key="edit"
          onClick={() => {
            const editableAction = action as
              | { startEditable?: (key: React.Key) => void }
              | undefined;
            editableAction?.startEditable?.(record.id);
          }}
        >
          Edit
        </a>,
      ],
    },
  ];

  return (
    <KeenPage
      title="Document Management"
      description="Manage your knowledge documents, control AI indexing and visibility, and inspect versions and comments from one place."
      toolbar={
        <Space>
          <Button
            onClick={() =>
              router.push('/keenkonnect/knowledge/browse-repository')
            }
          >
            Go to library view
          </Button>
        </Space>
      }
    >
      {messageContextHolder}
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="Session-local document workspace"
        description="This screen has no general document persistence contract yet. Edits and newly created entries remain in the current browser session."
      />
      <EditableProTable<ManagedDocument>
        rowKey="id"
        bordered
        size="small"
        value={dataSource}
        // important: value from EditableProTable is readonly, so clone it
        onChange={(value: readonly ManagedDocument[]) =>
          setDataSource([...value])
        }
        maxLength={50}
        recordCreatorProps={{
          position: 'bottom',
          newRecordType: 'dataSource',
          record: () => ({
            id: `temp-${Date.now()}`,
            title: 'New document',
            category: 'Research',
            language: 'English',
            owner: 'You',
            status: 'Draft' as DocumentStatus,
            aiIndexed: true,
            visible: true,
            version: '0.1',
            updatedAt: new Date().toISOString().slice(0, 10),
            tags: ['draft'],
            summary:
              'New draft document created inline from the table. Use the drawer to refine metadata and content.',
          }),
        }}
        toolBarRender={() => [
          <ModalForm<NewDocumentFormValues>
            key="new"
            title="Add document entry"
            trigger={
              <Button type="primary" icon={<PlusOutlined />}>
                New document
              </Button>
            }
            modalProps={{ destroyOnHidden: true }}
            initialValues={{
              status: 'Draft',
              language: 'English',
              aiIndexed: true,
              visible: true,
            }}
            onFinish={handleCreateDocument}
          >
            <ProFormText
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter a title' }]}
            />
            <ProFormSelect
              name="category"
              label="Category"
              options={[
                { label: 'Research', value: 'Research' },
                { label: 'Safety & Compliance', value: 'Safety & Compliance' },
                { label: 'Clinical Protocol', value: 'Clinical Protocol' },
                { label: 'Design Blueprint', value: 'Design Blueprint' },
                { label: 'Learning Module', value: 'Learning Module' },
              ]}
              rules={[{ required: true, message: 'Please choose a category' }]}
            />
            <ProFormSelect
              name="language"
              label="Language"
              options={[
                { label: 'English', value: 'English' },
                { label: 'French', value: 'French' },
              ]}
              rules={[{ required: true, message: 'Please choose a language' }]}
            />
            <ProFormText name="owner" label="Owner" />
            <ProFormSelect
              name="status"
              label="Status"
              options={[
                { label: 'Draft', value: 'Draft' },
                { label: 'Published', value: 'Published' },
                { label: 'Archived', value: 'Archived' },
              ]}
            />
            <ProFormSelect
              name="tags"
              label="Tags"
              mode="tags"
              fieldProps={{
                tokenSeparators: [','],
              }}
              placeholder="Add tags (press Enter or comma)"
            />
            <ProFormSwitch
              name="aiIndexed"
              label="Include in AI indexing"
            />
            <ProFormSwitch
              name="visible"
              label="Visible in library"
            />
            <ProFormTextArea
              name="summary"
              label="Short content / summary"
              fieldProps={{ rows: 4 }}
            />
          </ModalForm>,
          <Button
            key="upload"
            icon={<UploadOutlined />}
            onClick={() =>
              router.push('/keenkonnect/knowledge/upload-new-document')
            }
          >
            Upload new file
          </Button>,
        ]}
        columns={columns}
        editable={{
          type: 'multiple',
          editableKeys,
          onChange: setEditableRowKeys,
          onSave: async (_key, row) => {
            setDataSource(prev =>
              prev.map(item => (item.id === row.id ? { ...item, ...row } : item)),
            );
          },
        }}
      />

      <Drawer
        title={selectedDocument ? 'Document details' : undefined}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={1000}
        destroyOnHidden
      >
        {selectedDocument && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className="flex flex-wrap items=center justify-between gap-3">
              <div>
                <h2 className="mb-1 text-xl font-semibold">
                  {selectedDocument.title}
                </h2>
                <div className="text-sm text-gray-500">
                  Last updated {selectedDocument.updatedAt} · Owner{' '}
                  {selectedDocument.owner}
                </div>
              </div>
              <Space wrap>
                <Tag color={getStatusColor(selectedDocument.status)}>
                  {selectedDocument.status}
                </Tag>
                {selectedDocument.tags.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            </div>

            <Row gutter={16}>
              <Col xs={24} md={14}>
                <Card
                  title="Session-local editing"
                  extra={
                    <Tooltip title="Open full editor in Konstruct (future integration)">
                      <Button type="link" icon={<EyeOutlined />}>
                        Open in Konstruct
                      </Button>
                    </Tooltip>
                  }
                >
                  <TextArea
                    rows={10}
                    value={selectedDocument.summary}
                    onChange={e =>
                      updateDocument(selectedDocument.id, {
                        summary: e.target.value,
                      })
                    }
                  />
                  <Divider />
                  <Space>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={handleSaveChanges}
                    >
                      Save changes
                    </Button>
                    <Button
                      icon={<UploadOutlined />}
                      onClick={handlePublishNewVersion}
                    >
                      Publish new version
                    </Button>
                  </Space>
                </Card>
              </Col>

              <Col xs={24} md={10}>
                <Card title="Metadata & access control">
                  <p>
                    <strong>Category:</strong> {selectedDocument.category}
                  </p>
                  <p>
                    <strong>Language:</strong> {selectedDocument.language}
                  </p>
                  <p>
                    <strong>Version:</strong> {selectedDocument.version}
                  </p>
                  <p>
                    <strong>AI indexing:</strong>{' '}
                    <Switch
                      size="small"
                      checked={selectedDocument.aiIndexed}
                      onChange={checked =>
                        updateDocument(selectedDocument.id, {
                          aiIndexed: checked,
                        })
                      }
                    />
                  </p>
                  <p>
                    <strong>Visible in library:</strong>{' '}
                    <Switch
                      size="small"
                      checked={selectedDocument.visible}
                      onChange={checked =>
                        updateDocument(selectedDocument.id, {
                          visible: checked,
                        })
                      }
                    />
                  </p>
                  <p>
                    <strong>Tags:</strong>{' '}
                    {selectedDocument.tags.length ? (
                      <Space size={[0, 8]} wrap>
                        {selectedDocument.tags.map(tag => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </Space>
                    ) : (
                      <span style={{ color: '#999' }}>None</span>
                    )}
                  </p>
                </Card>

                <Card title="Version history" className="mt-4">
                  <List
                    size="small"
                    dataSource={versionHistory}
                    renderItem={item => (
                      <List.Item key={item.version}>
                        <List.Item.Meta
                          title={`${item.version} · ${item.timestamp}`}
                          description={
                            <div>
                              <div>
                                <strong>{item.author}</strong>
                              </div>
                              <div>{item.changeSummary}</div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                  <Button
                    type="link"
                    style={{ padding: 0, marginTop: 8 }}
                  >
                    Compare / restore versions
                  </Button>
                </Card>

                <Card title="Comments preview" className="mt-4">
                  <List
                    itemLayout="horizontal"
                    dataSource={commentsData}
                    renderItem={comment => (
                      <List.Item key={comment.id}>
                        <List.Item.Meta
                          avatar={<Avatar src={comment.avatar} />}
                          title={comment.author}
                          description={
                            <div>
                              <div>{comment.content}</div>
                              <div style={{ color: '#999', marginTop: 4 }}>
                                {comment.datetime}
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </Space>
        )}
      </Drawer>
    </KeenPage>
  );
}
