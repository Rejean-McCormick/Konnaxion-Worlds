// FILE: frontend/app/konnected/learning-library/offline-content/page.tsx
// app/konnected/learning-library/offline-content/page.tsx
'use client';

import {
  DeleteOutlined,
  PlusOutlined,
  SyncOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { ProCard, StatisticCard } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Head from 'next/head';
import React, { useMemo, useState } from 'react';

import api, { apiDelete, apiFetch, apiPatch, apiPost } from '@/api';
import KonnectedPageShell from '@/app/konnected/KonnectedPageShell';

const { Paragraph, Text } = Typography;
const { Option } = Select;
const { Statistic } = StatisticCard;

// ---- Domain types ---------------------------------------------------------

type OfflinePackageStatus = 'scheduled' | 'building' | 'ready' | 'failed';

interface OfflinePackage {
  id: number | string;
  name: string;
  description?: string;
  status: OfflinePackageStatus;
  itemCount: number;
  totalSizeMb: number;
  lastBuiltAt?: string | null;
  targetDeviceType?: 'laptop' | 'tablet' | 'usb' | 'other';
  autoSync?: boolean;
  // Optional: when a build is in progress
  buildProgressPercent?: number;
  lastErrorMessage?: string | null;
}

type ResourceType = 'article' | 'video' | 'lesson' | 'quiz' | 'dataset';

interface OfflineableResource {
  id: number | string;
  title: string;
  type: ResourceType;
  subject?: string;
  level?: string;
  language?: string;
  sizeMb?: number;
  offlineEligible: boolean;
  includedInPackages?: string[]; // package names / IDs for quick display
}

interface RawOfflineResource {
  id?: number | string;
  title?: string;
  type?: unknown;
  resource_type?: unknown;
  content_type?: unknown;
  subject?: string;
  topic?: string;
  domain?: string;
  level?: string;
  difficulty?: string;
  language?: string;
  lang?: string;
  sizeMb?: number;
  size_mb?: number;
  bundle_size_mb?: number;
  offlineEligible?: unknown;
  offline_available?: unknown;
  offlineAvailable?: unknown;
  is_offline_available?: unknown;
  can_be_offlined?: unknown;
  includedInPackages?: unknown;
  packages?: unknown;
}

interface CreateOfflinePackagePayload {
  name: string;
  description?: string;
  targetDeviceType?: OfflinePackage['targetDeviceType'];
  maxSizeMb?: number;
  includeTypes?: ResourceType[];
  subjectFilter?: string;
  levelFilter?: string;
  languageFilter?: string;
}

// ---- API helpers ----------------------------------------------------------
// NOTE: Endpoint paths/response wrappers are inferred.
// Align them with schema-endpoints.json when wiring to the real backend.

// Use relative URLs so that NEXT_PUBLIC_API_BASE or "/api" baseURL applies
// consistently (see services/_request.ts and Global Parameter Reference).
const OFFLINE_PACKAGE_LIST_ENDPOINT = 'konnected/offline-packages/';
const OFFLINE_PACKAGE_DETAIL_ENDPOINT = (id: OfflinePackage['id']) =>
  `konnected/offline-packages/${id}/`;
const OFFLINE_PACKAGE_SYNC_ENDPOINT = (id: OfflinePackage['id']) =>
  `konnected/offline-packages/${id}/sync/`;

// Knowledge module (KonnectED) offline-eligible resources.
// We probe a small set of candidate endpoints to stay aligned with the v14
// Knowledge spec while the backend paths stabilise.
const OFFLINE_RESOURCES_ENDPOINTS: readonly string[] = [
  '/api/konnected/resources/',
  '/api/knowledge-resources/',
  '/api/knowledge/resources/',
];

function normalizeList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];

  if (raw && typeof raw === 'object') {
    const obj = raw as { results?: unknown; items?: unknown };
    if (Array.isArray(obj.results)) return obj.results as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
  }

  return [];
}

// ---- Requests -------------------------------------------------------------

async function fetchOfflinePackages(): Promise<OfflinePackage[]> {
  // api.get already returns the data T (not AxiosResponse<T>)
  const raw = await api.get(OFFLINE_PACKAGE_LIST_ENDPOINT);
  return normalizeList<OfflinePackage>(raw);
}

async function createOfflinePackage(
  payload: CreateOfflinePackagePayload,
): Promise<void> {
  await apiPost(OFFLINE_PACKAGE_LIST_ENDPOINT, payload);
}

async function deleteOfflinePackage(id: OfflinePackage['id']): Promise<void> {
  await apiDelete(OFFLINE_PACKAGE_DETAIL_ENDPOINT(id));
}

async function syncOfflinePackage(id: OfflinePackage['id']): Promise<void> {
  await apiPost(OFFLINE_PACKAGE_SYNC_ENDPOINT(id));
}

/**
 * Update a subset of package fields (currently autoSync).
 * This is wired to the "Auto sync" toggle in the table.
 */
async function updateOfflinePackage(
  id: OfflinePackage['id'],
  payload: Partial<Pick<OfflinePackage, 'autoSync'>>,
): Promise<OfflinePackage> {
  return apiPatch<OfflinePackage>(OFFLINE_PACKAGE_DETAIL_ENDPOINT(id), payload);
}

async function fetchOfflineableResources(): Promise<OfflineableResource[]> {
  let lastError: unknown;

  for (const url of OFFLINE_RESOURCES_ENDPOINTS) {
    try {
      const res = await apiFetch(url);

      if (!res.ok) {
        lastError = new Error(
          `Offline resources endpoint ${url} returned ${res.status}`,
        );
        continue;
      }

      const json = await res.json();
      const rawItems = normalizeList<RawOfflineResource>(json);

      const mapped: OfflineableResource[] = rawItems.map((raw) => {
        // Normalise type to the v14 CONTENT_TYPES_ALLOWED enum
        // ("article", "video", "lesson", "quiz", "dataset").
        const typeValue: string =
          (raw.type ??
            raw.resource_type ??
            raw.content_type ??
            'article') as string;

        const normalizedType = String(typeValue).toLowerCase();

        let type: ResourceType;
        if (
          normalizedType === 'article' ||
          normalizedType === 'video' ||
          normalizedType === 'lesson' ||
          normalizedType === 'quiz' ||
          normalizedType === 'dataset'
        ) {
          type = normalizedType as ResourceType;
        } else if (normalizedType === 'course' || normalizedType === 'module') {
          type = 'lesson';
        } else if (
          normalizedType === 'doc' ||
          normalizedType === 'document' ||
          normalizedType === 'file'
        ) {
          type = 'article';
        } else {
          type = 'article';
        }

        const sizeMb =
          typeof raw.sizeMb === 'number'
            ? raw.sizeMb
            : typeof raw.size_mb === 'number'
              ? raw.size_mb
              : typeof raw.bundle_size_mb === 'number'
                ? raw.bundle_size_mb
                : undefined;

        const offlineEligible = Boolean(
          raw.offlineEligible ??
            raw.offline_available ??
            raw.offlineAvailable ??
            raw.is_offline_available ??
            raw.can_be_offlined,
        );

        const packagesValue = raw.includedInPackages ?? raw.packages;
        const includedInPackages = Array.isArray(packagesValue)
          ? packagesValue.map((item) => String(item))
          : undefined;

        return {
          id: raw.id ?? '',
          title: raw.title ?? '',
          type,
          subject: raw.subject ?? raw.topic ?? raw.domain ?? undefined,
          level: raw.level ?? raw.difficulty ?? undefined,
          language: raw.language ?? raw.lang ?? undefined,
          sizeMb,
          offlineEligible,
          includedInPackages,
        };
      });

      return mapped;
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError) {
    throw lastError instanceof Error
      ? lastError
      : new Error('Unable to load offlineable resources.');
  }

  // Fallback: no known endpoint responded; return empty list
  // so the rest of the UI still renders.
  return [];
}

// ---- Page -----------------------------------------------------------------

export default function OfflineContentPage(): JSX.Element {
  const { message, modal } = App.useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm<CreateOfflinePackagePayload>();

  const {
    data: packages,
    loading: loadingPackages,
    error: packagesError,
    refresh: refreshPackages,
  } = useRequest(fetchOfflinePackages);

  const {
    data: resources,
    loading: loadingResources,
    error: resourcesError,
    refresh: refreshResources,
  } = useRequest(fetchOfflineableResources);

  const { loading: creating, runAsync: runCreatePackage } = useRequest(
    createOfflinePackage,
    {
      manual: true,
    },
  );
  const { loading: deleting, runAsync: runDeletePackage } = useRequest(
    deleteOfflinePackage,
    {
      manual: true,
    },
  );
  const { loading: syncing, runAsync: runSyncPackage } = useRequest(
    syncOfflinePackage,
    {
      manual: true,
    },
  );
  const { loading: updatingPackage, runAsync: runUpdatePackage } = useRequest(
    updateOfflinePackage,
    {
      manual: true,
    },
  );

  const packageList = packages ?? [];
  const resourceList = resources ?? [];

  const stats = useMemo(() => {
    const totalPackages = packageList.length;
    const readyPackages = packageList.filter((p) => p.status === 'ready').length;
    const inProgressPackages = packageList.filter((p) =>
      ['scheduled', 'building'].includes(p.status),
    ).length;

    const totalSizeMb = packageList.reduce(
      (acc, p) => acc + (p.totalSizeMb || 0),
      0,
    );
    const eligibleResourcesCount = resourceList.filter(
      (r) => r.offlineEligible,
    ).length;

    return {
      totalPackages,
      readyPackages,
      inProgressPackages,
      totalSizeMb,
      eligibleResourcesCount,
    };
  }, [packageList, resourceList]);

  const columnsPackages: ColumnsType<OfflinePackage> = [
    {
      title: 'Package name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: OfflinePackageStatus, record) => {
        let color: 'processing' | 'success' | 'error' | 'default' = 'default';
        // Explicit string to avoid assigning "Scheduled"/"Ready" to OfflinePackageStatus
        let label: string = status;

        if (status === 'scheduled' || status === 'building') {
          color = 'processing';
          label = status === 'scheduled' ? 'Scheduled' : 'Building';
        } else if (status === 'ready') {
          color = 'success';
          label = 'Ready';
        } else if (status === 'failed') {
          color = 'error';
          label = 'Failed';
        }

        return (
          <Space direction="vertical" size={0}>
            <Tag color={color}>{label}</Tag>
            {typeof record.buildProgressPercent === 'number' && (
              <Progress
                percent={record.buildProgressPercent}
                size="small"
                style={{ width: 120 }}
              />
            )}
            {record.lastErrorMessage && (
              <Text type="danger" style={{ fontSize: 12 }}>
                {record.lastErrorMessage}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Items',
      dataIndex: 'itemCount',
      key: 'itemCount',
      render: (value: number) => <Text>{value ?? 0}</Text>,
    },
    {
      title: 'Size',
      dataIndex: 'totalSizeMb',
      key: 'totalSizeMb',
      render: (value: number) => <Text>{(value ?? 0).toFixed(1)} MB</Text>,
    },
    {
      title: 'Target device',
      dataIndex: 'targetDeviceType',
      key: 'targetDeviceType',
      render: (value?: OfflinePackage['targetDeviceType']) => (
        <Text type="secondary" style={{ textTransform: 'capitalize' }}>
          {value || 'Not specified'}
        </Text>
      ),
    },
    {
      title: 'Auto sync',
      dataIndex: 'autoSync',
      key: 'autoSync',
      render: (value: boolean | undefined, record) => (
        <Switch
          checked={Boolean(value)}
          size="small"
          loading={updatingPackage}
          onChange={async (checked) => {
            try {
              await runUpdatePackage(record.id, { autoSync: checked });
              message.success(
                checked
                  ? 'Package enrolled in the weekly offline build.'
                  : 'Package removed from the automatic offline build.',
              );
              refreshPackages();
            } catch (err) {
              const msg =
                err instanceof Error
                  ? err.message
                  : 'Failed to update auto-sync setting.';
              message.error(msg);
            }
          }}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<SyncOutlined />}
            size="small"
            loading={syncing}
            onClick={() => handleSyncPackage(record)}
            disabled={record.status === 'building'}
          >
            Sync now
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            loading={deleting}
            onClick={() => handleDeletePackage(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const columnsResources: ColumnsType<OfflineableResource> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (value: string, record) => (
        <Space direction="vertical" size={0}>
          <Text>{value}</Text>
          <Space size={4} wrap>
            {record.subject && <Tag color="blue">{record.subject}</Tag>}
            {record.level && <Tag color="purple">{record.level}</Tag>}
            {record.language && <Tag>{record.language}</Tag>}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (value: ResourceType) => (
        <Tag color="geekblue" style={{ textTransform: 'capitalize' }}>
          {value}
        </Tag>
      ),
    },
    {
      title: 'Size (MB)',
      dataIndex: 'sizeMb',
      key: 'sizeMb',
      render: (value?: number) => (
        <Text>{value != null ? value.toFixed(1) : 'N/A'}</Text>
      ),
    },
    {
      title: 'Offline status',
      dataIndex: 'offlineEligible',
      key: 'offlineEligible',
      render: (value: boolean) =>
        value ? (
          <Tag color="green">Eligible</Tag>
        ) : (
          <Tag color="default">Online only</Tag>
        ),
    },
    {
      title: 'Included in packages',
      dataIndex: 'includedInPackages',
      key: 'includedInPackages',
      render: (packages?: string[]) =>
        packages && packages.length ? (
          <Space size={[4, 4]} wrap>
            {packages.map((name) => (
              <Tag key={name}>{name}</Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Not yet packaged
          </Text>
        ),
    },
  ];

  const handleCreatePackage = async (values: CreateOfflinePackagePayload) => {
    try {
      await runCreatePackage(values);
      message.success(
        'Offline package created. It will appear here once builds start.',
      );
      setIsCreateModalOpen(false);
      createForm.resetFields();
      refreshPackages();
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to create offline package.';
      message.error(msg);
    }
  };

  const handleDeletePackage = async (pkg: OfflinePackage) => {
    modal.confirm({
      title: 'Delete offline package',
      content: `Are you sure you want to delete "${pkg.name}"? This will not remove already synced data from devices.`,
      okText: 'Delete',
      okButtonProps: { danger: true, loading: deleting },
      onOk: async () => {
        try {
          await runDeletePackage(pkg.id);
          message.success('Offline package deleted.');
          refreshPackages();
        } catch (err) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Failed to delete offline package.';
          message.error(msg);
        }
      },
    });
  };

  const handleSyncPackage = async (pkg: OfflinePackage) => {
    try {
      await runSyncPackage(pkg.id);
      message.success('Sync request submitted.');
      refreshPackages();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to trigger sync.';
      message.error(msg);
    }
  };

  return (
    <>
      <Head>
        <title>Offline content – KonnectED</title>
      </Head>

      <KonnectedPageShell
        title="Offline content packages"
        subtitle="Prepare resource bundles for low-connectivity environments (e.g. schools, field teams, community centers)."
        primaryAction={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            New offline package
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <ProCard title="Offline packages overview" bordered>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Statistic title="Total packages" value={stats.totalPackages} />
                <Space size="large">
                  <StatisticCard
                    statistic={{
                      title: 'Ready',
                      value: stats.readyPackages,
                    }}
                  />
                  <StatisticCard
                    statistic={{
                      title: 'In progress',
                      value: stats.inProgressPackages,
                    }}
                  />
                </Space>
                <Statistic
                  title="Total storage (MB)"
                  value={stats.totalSizeMb.toFixed(1)}
                />
                <Statistic
                  title="Resources eligible for offline"
                  value={stats.eligibleResourcesCount}
                />
              </Space>
            </ProCard>

            {(packagesError || resourcesError) && (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
                message="Some offline APIs may not be fully wired yet"
                description="Offline package management and resource eligibility depend on KonnectED’s Knowledge backend. Once all endpoints are live, this page will display real-time data."
              />
            )}
          </Col>

          <Col xs={24} lg={14}>
            <Card
              title="Offline packages"
              extra={
                <Button
                  icon={<SyncOutlined />}
                  onClick={() => {
                    refreshPackages();
                    refreshResources();
                  }}
                  loading={loadingPackages || loadingResources}
                >
                  Refresh
                </Button>
              }
            >
              {loadingPackages ? (
                <Skeleton active />
              ) : packageList.length === 0 ? (
                <Empty
                  description={
                    <Space direction="vertical">
                      <Text>No offline packages yet.</Text>
                      <Text type="secondary">
                        Create a package to bundle resources for offline
                        deployment to devices.
                      </Text>
                    </Space>
                  }
                />
              ) : (
                <Table<OfflinePackage>
                  rowKey={(record) => String(record.id)}
                  columns={columnsPackages}
                  dataSource={packageList}
                  pagination={false}
                />
              )}
            </Card>

            <Card title="Candidate resources for offline" style={{ marginTop: 16 }}>
              {loadingResources ? (
                <Skeleton active />
              ) : resourceList.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No resources available for offline packaging yet."
                />
              ) : (
                <Table<OfflineableResource>
                  rowKey={(record) => String(record.id)}
                  columns={columnsResources}
                  dataSource={resourceList}
                  size="small"
                  pagination={{ pageSize: 8 }}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* Creation modal */}
        <Modal
          title="New offline package"
          open={isCreateModalOpen}
          onCancel={() => setIsCreateModalOpen(false)}
          destroyOnClose
          okText="Create package"
          okButtonProps={{ loading: creating }}
          onOk={() => createForm.submit()}
        >
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            Select filters and constraints for this offline bundle. The backend
            will resolve concrete resources and schedule builds according to the
            global offline cron.
          </Paragraph>

          <Form<CreateOfflinePackagePayload>
            form={createForm}
            layout="vertical"
            onFinish={handleCreatePackage}
            initialValues={{
              targetDeviceType: 'laptop',
              maxSizeMb: 2048,
              includeTypes: ['article', 'video', 'lesson'],
            }}
          >
            <Form.Item
              label="Package name"
              name="name"
              rules={[{ required: true, message: 'Please enter a package name.' }]}
            >
              <Input placeholder="e.g. Robotics basics – offline pack for School A" />
            </Form.Item>

            <Form.Item label="Description" name="description">
              <Input.TextArea
                rows={3}
                placeholder="Short description for administrators and field teams."
              />
            </Form.Item>

            <Form.Item label="Target device type" name="targetDeviceType">
              <Select>
                <Option value="laptop">Laptop / desktop (lab PCs)</Option>
                <Option value="tablet">Tablet devices</Option>
                <Option value="usb">USB drive / external media</Option>
                <Option value="other">Other / mixed devices</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  Maximum bundle size (MB)
                  <Tooltip title="Helps avoid exceeding storage on low-spec devices. Backend enforces final limits.">
                    <WarningOutlined />
                  </Tooltip>
                </Space>
              }
              name="maxSizeMb"
              rules={[
                {
                  type: 'number',
                  transform: (v) => (v === '' ? undefined : Number(v)),
                  min: 0,
                  message: 'Please enter a valid size in MB.',
                },
              ]}
            >
              <Input placeholder="e.g. 2048" type="number" min={0} />
            </Form.Item>

            <Form.Item label="Include resource types" name="includeTypes">
              <Select mode="multiple" placeholder="Select one or more types">
                <Option value="article">Articles</Option>
                <Option value="video">Videos</Option>
                <Option value="lesson">Lessons</Option>
                <Option value="quiz">Quizzes</Option>
                <Option value="dataset">Datasets</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Subject filter" name="subjectFilter">
              <Input placeholder="Optional subject filter, e.g. Robotics" />
            </Form.Item>

            <Form.Item label="Level filter" name="levelFilter">
              <Input placeholder="Optional level filter, e.g. Beginner" />
            </Form.Item>

            <Form.Item label="Language filter" name="languageFilter">
              <Input placeholder="Optional language filter, e.g. en, fr" />
            </Form.Item>
          </Form>
        </Modal>
      </KonnectedPageShell>
    </>
  );
}
