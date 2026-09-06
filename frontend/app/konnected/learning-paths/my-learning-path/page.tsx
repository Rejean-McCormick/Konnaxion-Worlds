// FILE: frontend/app/konnected/learning-paths/my-learning-path/page.tsx
'use client';

import { assertCurrentWorldResponse, scopeBrowserApiUrl } from '@/lib/worlds';

import { ClockCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { TabsProps } from 'antd';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import KonnectedPageShell from '@/app/konnected/KonnectedPageShell';

const { Text, Paragraph, Title } = Typography;
const { Option } = Select;

type LearningPathStatus = 'active' | 'completed' | 'archived';

type Level = 'Beginner' | 'Intermediate' | 'Advanced';

interface LearningPathProgress {
  completedItems: number;
  totalItems: number;
  percentage: number;
  lastActivityAt?: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  level?: Level;
  tags?: string[];
  estimatedMinutes?: number;
  status: LearningPathStatus;
  progress: LearningPathProgress;
  startedAt?: string;
  completedAt?: string | null;
  // Optional link to the next resource in the path
  nextResourceHref?: string;
  nextResourceLabel?: string;
}

type TabKey = 'active' | 'completed' | 'all';
type SortKey = 'recent' | 'progress' | 'title';

/**
 * Fallback mock data so the page stays functional even without the backend.
 * Replace this with real API data once endpoints are wired.
 */
const MOCK_LEARNING_PATHS: LearningPath[] = [
  {
    id: 'lp-beginner-web',
    title: 'Beginner Web Development',
    description:
      'A structured path introducing HTML, CSS, and JavaScript fundamentals for first-time learners.',
    level: 'Beginner',
    tags: ['Web', 'Foundations', 'HTML/CSS/JS'],
    estimatedMinutes: 360,
    status: 'active',
    progress: {
      completedItems: 3,
      totalItems: 5,
      percentage: 60,
      lastActivityAt: '2025-01-05T15:30:00Z',
    },
    startedAt: '2025-01-01T09:00:00Z',
    completedAt: null,
    nextResourceHref:
      '/konnected/learning-library/browse-resources?pathId=lp-beginner-web',
    nextResourceLabel: 'Continue with CSS Layouts',
  },
  {
    id: 'lp-ai-ethics',
    title: 'AI & Ethics',
    description:
      'Explore responsible AI design, bias mitigation, and governance frameworks across industries.',
    level: 'Intermediate',
    tags: ['AI', 'Ethics', 'Governance'],
    estimatedMinutes: 420,
    status: 'active',
    progress: {
      completedItems: 1,
      totalItems: 6,
      percentage: 17,
      lastActivityAt: '2025-01-03T10:15:00Z',
    },
    startedAt: '2025-01-02T11:00:00Z',
    completedAt: null,
    nextResourceHref:
      '/konnected/learning-library/browse-resources?pathId=lp-ai-ethics',
    nextResourceLabel: 'Resume: What is Responsible AI?',
  },
  {
    id: 'lp-sustainability',
    title: 'Sustainability & Impact Projects',
    description:
      'A curated sequence of resources to design, measure, and communicate sustainability projects.',
    level: 'Advanced',
    tags: ['Sustainability', 'Impact', 'Measurement'],
    estimatedMinutes: 540,
    status: 'completed',
    progress: {
      completedItems: 8,
      totalItems: 8,
      percentage: 100,
      lastActivityAt: '2024-12-20T16:00:00Z',
    },
    startedAt: '2024-11-15T09:00:00Z',
    completedAt: '2024-12-20T16:00:00Z',
    nextResourceHref:
      '/konnected/learning-library/recommended-resources?fromPath=lp-sustainability',
    nextResourceLabel: 'Go to recommended follow-ups',
  },
];

function safeRandomId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `lp-${Math.random().toString(36).slice(2)}`;
}

type RawLearningPath = {
  id?: string | number;
  learning_path_id?: string | number;
  slug?: string;
  title?: string;
  name?: string;
  description?: string;
  summary?: string;
  level?: Level;
  tags?: string[];
  tagList?: string[];
  estimatedMinutes?: number;
  estimated_duration_minutes?: number;
  status?: LearningPathStatus;
  totalItems?: number;
  modulesCount?: number;
  resourcesCount?: number;
  completedItems?: number;
  completedModules?: number;
  lastActivityAt?: string;
  last_activity_at?: string;
  updatedAt?: string;
  updated_at?: string;
  startedAt?: string;
  started_at?: string;
  completedAt?: string | null;
  completed_at?: string | null;
  nextResourceHref?: string;
  next_resource_href?: string;
  nextResourceLabel?: string;
  next_resource_label?: string;
  progress?: {
    totalItems?: number;
    completedItems?: number;
    percentage?: number;
    lastActivityAt?: string;
    last_activity_at?: string;
  };
};

function normalizeLearningPath(value: unknown): LearningPath {
  const raw =
    value && typeof value === 'object' ? (value as RawLearningPath) : {};
  const totalItems =
    raw?.progress?.totalItems ??
    raw?.totalItems ??
    raw?.modulesCount ??
    raw?.resourcesCount ??
    0;
  const completedItems =
    raw?.progress?.completedItems ??
    raw?.completedItems ??
    raw?.completedModules ??
    0;
  const percentage =
    raw?.progress?.percentage ??
    (totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0);

  const status: LearningPathStatus =
    raw?.status && ['active', 'completed', 'archived'].includes(raw.status)
      ? raw.status
      : percentage === 100
      ? 'completed'
      : 'active';

  const rawId = raw?.id ?? raw?.learning_path_id ?? raw?.slug ?? safeRandomId();

  return {
    id: String(rawId),
    title: raw.title ?? raw.name ?? 'Untitled learning path',
    description: raw.description ?? raw.summary ?? '',
    level: raw.level as Level | undefined,
    tags: raw.tags ?? raw.tagList ?? [],
    estimatedMinutes:
      raw.estimatedMinutes ?? raw.estimated_duration_minutes ?? undefined,
    status,
    progress: {
      completedItems,
      totalItems,
      percentage,
      lastActivityAt:
        raw.progress?.lastActivityAt ??
        raw.progress?.last_activity_at ??
        raw.lastActivityAt ??
        raw.last_activity_at ??
        raw.updatedAt ??
        raw.updated_at,
    },
    startedAt: raw.startedAt ?? raw.started_at,
    completedAt: raw.completedAt ?? raw.completed_at ?? null,
    nextResourceHref:
      raw.nextResourceHref ??
      raw.next_resource_href ??
      (typeof window !== 'undefined' && raw.id
        ? `/konnected/learning-library/browse-resources?pathId=${raw.id}`
        : undefined),
    nextResourceLabel:
      raw.nextResourceLabel ?? raw.next_resource_label ?? undefined,
  };
}

type MyLearningPathsApiResponse = {
  items?: unknown[];
  results?: unknown[];
};

type FetchResult = {
  data: LearningPath[];
  error: Error | null;
};

/**
 * Fetches learning paths for the current learner.
 * Always resolves; on any failure it returns mock data plus an Error.
 */
async function fetchMyLearningPaths(): Promise<FetchResult> {
  try {
    const res = await fetch(scopeBrowserApiUrl('/api/konnected/learning-paths/my'), {
      method: 'GET',
      cache: 'no-store',
    });

    // Treat 404 as "backend not wired yet" – use mocks but surface a warning.
    if (res.status === 404) {
      const error = new Error('Learning paths API not available yet (404).');
       
      console.warn(error.message);
      return { data: MOCK_LEARNING_PATHS, error };
    }

    if (!res.ok) {
      const error = new Error(`Failed to load learning paths (${res.status}).`);
       
      console.error(error);
      return { data: MOCK_LEARNING_PATHS, error };
    }

    assertCurrentWorldResponse(
      res.headers.get('X-Konnaxion-World'),
      res.headers.get('X-Konnaxion-World-Release-Id'),
    );

    const json = (await res.json()) as MyLearningPathsApiResponse | unknown[];

    const rawList: unknown[] = Array.isArray(json)
      ? json
      : (json.items ?? json.results ?? []);

    if (!Array.isArray(rawList) || rawList.length === 0) {
      return { data: MOCK_LEARNING_PATHS, error: null };
    }

    return {
      data: rawList.map((item) => normalizeLearningPath(item)),
      error: null,
    };
  } catch (err) {
    const error =
      err instanceof Error
        ? err
        : new Error('Unable to load your learning paths right now.');
     
    console.error('Error fetching learning paths', err);
    return { data: MOCK_LEARNING_PATHS, error };
  }
}

export default function MyLearningPathsPage(): JSX.Element {
  const router = useRouter();
  const { message } = AntdApp.useApp();

  const [paths, setPaths] = useState<LearningPath[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const { data, error: loadError } = await fetchMyLearningPaths();

      if (cancelled) return;

      setPaths(data);
      if (loadError) {
        setError(loadError.message);
      }
      setLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleTabChange: TabsProps['onChange'] = (key) => {
    setActiveTab(key as TabKey);
  };

  const handleSortChange = (value: SortKey) => {
    setSortKey(value);
  };

  const handleResume = (path: LearningPath) => {
    const href =
      path.nextResourceHref ??
      `/konnected/learning-library/browse-resources?pathId=${path.id}`;
    router.push(href);
  };

  const handleMarkComplete = (pathId: string) => {
    // TODO: POST /api/konnected/learning-paths/{id}/complete (mark learner path as complete)
    setPaths((prev) =>
      (prev ?? []).map((p) =>
        p.id === pathId
          ? {
              ...p,
              status: 'completed',
              completedAt: new Date().toISOString(),
              progress: {
                ...p.progress,
                completedItems: p.progress.totalItems,
                percentage: 100,
              },
            }
          : p,
      ),
    );
    message.success('Learning path marked as completed.');
  };

  const handleLeavePath = (pathId: string) => {
    // TODO: POST /api/konnected/learning-paths/{id}/leave (leave learning path)
    setPaths((prev) => (prev ?? []).filter((p) => p.id !== pathId));
    message.success('Learning path removed from your list.');
  };

  const handleBrowseCatalog = () => {
    router.push('/konnected/learning-library/browse-resources');
  };

  const stats = useMemo(() => {
    if (!paths || paths.length === 0) {
      return {
        total: 0,
        active: 0,
        completed: 0,
        avgCompletion: 0,
      };
    }

    const total = paths.length;
    const active = paths.filter((p) => p.status === 'active').length;
    const completed = paths.filter((p) => p.status === 'completed').length;
    const avgCompletion = Math.round(
      paths.reduce((sum, p) => sum + (p.progress?.percentage ?? 0), 0) /
        Math.max(total, 1),
    );

    return { total, active, completed, avgCompletion };
  }, [paths]);

  const filteredAndSortedPaths: LearningPath[] = useMemo(() => {
    if (!paths) return [];

    let filtered = paths;

    if (activeTab === 'active') {
      filtered = filtered.filter((p) => p.status === 'active');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter((p) => p.status === 'completed');
    } else if (activeTab === 'all') {
      filtered = filtered.filter((p) => p.status !== 'archived');
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === 'title') {
        return a.title.localeCompare(b.title);
      }

      if (sortKey === 'progress') {
        return (b.progress?.percentage ?? 0) - (a.progress?.percentage ?? 0);
      }

      // 'recent' (default) – use last activity or started date
      const aDate =
        a.progress?.lastActivityAt ??
        a.completedAt ??
        a.startedAt ??
        '1970-01-01';
      const bDate =
        b.progress?.lastActivityAt ??
        b.completedAt ??
        b.startedAt ??
        '1970-01-01';
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    return sorted;
  }, [paths, activeTab, sortKey]);

  const hasAnyPaths = (paths?.length ?? 0) > 0;
  const activeCount = paths?.filter((p) => p.status === 'active').length ?? 0;
  const completedCount =
    paths?.filter((p) => p.status === 'completed').length ?? 0;

  const tabsItems: TabsProps['items'] = [
    {
      key: 'active',
      label: `Active (${activeCount})`,
    },
    {
      key: 'completed',
      label: `Completed (${completedCount})`,
    },
    {
      key: 'all',
      label: `All (${paths?.length ?? 0})`,
    },
  ];

  return (
    <KonnectedPageShell
      title="My Learning Paths"
      subtitle="Track your in-progress and completed learning paths across the KonnectED Knowledge Library."
      primaryAction={
        <Button type="primary" onClick={handleBrowseCatalog}>
          Browse new learning paths
        </Button>
      }
      secondaryActions={
        <Space>
          <Text type="secondary">Sort by</Text>
          <Select<SortKey>
            value={sortKey}
            size="small"
            style={{ width: 160 }}
            onChange={handleSortChange}
          >
            <Option value="recent">Most recent activity</Option>
            <Option value="progress">Highest completion</Option>
            <Option value="title">Title (A–Z)</Option>
          </Select>
        </Space>
      }
    >
      {/* Top summary cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Space direction="vertical" size={4}>
              <Text type="secondary">Active paths</Text>
              <Title level={3} style={{ margin: 0 }}>
                {stats.active}
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Space direction="vertical" size={4}>
              <Text type="secondary">Completed paths</Text>
              <Title level={3} style={{ margin: 0 }}>
                {stats.completed}
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Space direction="vertical" size={4}>
              <Text type="secondary">Total enrolled</Text>
              <Title level={3} style={{ margin: 0 }}>
                {stats.total}
              </Title>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary">Average completion</Text>
              <Progress
                percent={stats.avgCompletion}
                size="small"
                status={stats.avgCompletion === 100 ? 'success' : 'active'}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 16 }}
          message="Unable to fully sync with the learning backend."
          description={
            <span>
              Showing locally cached / mock data for now. Once the KonnectED
              Learning Paths API is wired, this page will refresh
              automatically.
            </span>
          }
        />
      )}

      {/* Empty state when there is nothing at all */}
      {!loading && !hasAnyPaths && (
        <Card>
          <Empty
            description="You are not enrolled in any learning paths yet."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Space direction="vertical">
              <Button type="primary" onClick={handleBrowseCatalog}>
                Explore the Knowledge Library
              </Button>
              <Text type="secondary">
                Browse curated learning paths or assemble your own from
                KonnectED resources.
              </Text>
            </Space>
          </Empty>
        </Card>
      )}

      {/* Tabs + list */}
      {hasAnyPaths && (
        <>
          <Tabs
            items={tabsItems}
            activeKey={activeTab}
            onChange={handleTabChange}
            style={{ marginBottom: 16 }}
          />

          {loading ? (
            <Row gutter={[16, 16]}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <Col xs={24} md={12} lg={8} key={idx}>
                  <Card>
                    <Skeleton active paragraph={{ rows: 4 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : filteredAndSortedPaths.length === 0 ? (
            <Card>
              <Empty
                description={
                  activeTab === 'active'
                    ? 'No active learning paths in this view.'
                    : activeTab === 'completed'
                    ? 'You have not completed any learning paths yet.'
                    : 'No learning paths match the current filters.'
                }
              >
                {activeTab === 'active' && completedCount > 0 && (
                  <Text type="secondary">
                    You do have completed paths – switch to the
                    &quot;Completed&quot; tab to review them.
                  </Text>
                )}
                {activeTab === 'completed' && activeCount > 0 && (
                  <Text type="secondary">
                    You still have active paths in progress – check the
                    &quot;Active&quot; tab to resume.
                  </Text>
                )}
                {stats.total === 0 && (
                  <Space direction="vertical" style={{ marginTop: 8 }}>
                    <Button type="primary" onClick={handleBrowseCatalog}>
                      Explore the Knowledge Library
                    </Button>
                  </Space>
                )}
              </Empty>
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {filteredAndSortedPaths.map((path) => {
                const minutes = path.estimatedMinutes ?? 0;
                const hours = minutes / 60;
                const isCompleted = path.status === 'completed';
                const progress = path.progress?.percentage ?? 0;

                return (
                  <Col xs={24} md={12} lg={8} key={path.id}>
                    <Card
                      hoverable
                      title={
                        <Space>
                          <span>{path.title}</span>
                          {path.level && <Tag color="blue">{path.level}</Tag>}
                          {isCompleted && (
                            <Tag color="green">Completed</Tag>
                          )}
                        </Space>
                      }
                      extra={
                        path.progress?.lastActivityAt ? (
                          <Space size={4}>
                            <ClockCircleOutlined />
                            <Text type="secondary">
                              Last activity{' '}
                              {new Date(
                                path.progress.lastActivityAt,
                              ).toLocaleDateString()}
                            </Text>
                          </Space>
                        ) : null
                      }
                      actions={[
                        <Button
                          key="resume"
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={() => handleResume(path)}
                        >
                          {isCompleted ? 'Review path' : 'Resume'}
                        </Button>,
                        !isCompleted && (
                          <Button
                            key="complete"
                            type="default"
                            onClick={() => handleMarkComplete(path.id)}
                          >
                            Mark complete
                          </Button>
                        ),
                        <Button
                          key="leave"
                          type="link"
                          danger
                          onClick={() => handleLeavePath(path.id)}
                        >
                          Leave path
                        </Button>,
                      ].filter(Boolean)}
                    >
                      <Space
                        direction="vertical"
                        size="small"
                        style={{ width: '100%' }}
                      >
                        {path.description && (
                          <Paragraph
                            type="secondary"
                            ellipsis={{ rows: 3 }}
                            style={{ marginBottom: 8 }}
                          >
                            {path.description}
                          </Paragraph>
                        )}

                        {path.tags && path.tags.length > 0 && (
                          <Space wrap style={{ marginBottom: 4 }}>
                            {path.tags.map((tag) => (
                              <Tag key={tag}>{tag}</Tag>
                            ))}
                          </Space>
                        )}

                        <Space
                          direction="vertical"
                          style={{ width: '100%', marginTop: 4 }}
                        >
                          <Space
                            align="center"
                            style={{
                              width: '100%',
                              justifyContent: 'space-between',
                            }}
                          >
                            <Text type="secondary">
                              {path.progress?.completedItems ?? 0} of{' '}
                              {path.progress?.totalItems ?? 0} items completed
                            </Text>
                            {minutes > 0 && (
                              <Text type="secondary">
                                ~
                                {hours >= 1
                                  ? `${hours.toFixed(1)} h`
                                  : `${minutes} min`}{' '}
                                total
                              </Text>
                            )}
                          </Space>
                          <Progress
                            percent={progress}
                            status={isCompleted ? 'success' : 'active'}
                            size="small"
                          />
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </>
      )}
    </KonnectedPageShell>
  );
}
