// FILE: frontend/app/konnected/learning-library/recommended-resources/page.tsx
// app/konnected/learning-library/recommended-resources/page.tsx
'use client';

import {
  ArrowRightOutlined,
  BookOutlined,
  DislikeOutlined,
  FireOutlined,
  LikeOutlined,
  ReloadOutlined,
  SettingOutlined,
  StarFilled,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  List,
  message,
  Progress,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { apiFetch } from '@/api';
import KonnectedPageShell from '@/app/konnected/KonnectedPageShell';

const { Text } = Typography;

type ResourceType = 'article' | 'video' | 'lesson' | 'quiz' | 'dataset';

interface KnowledgeResource {
  id: string;
  title: string;
  summary: string;
  subject?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  language?: string;
  type: ResourceType;
  tags?: string[];
  estimatedDurationMinutes?: number;
  // e.g. /course/[slug] or /konnected/learning-library/resource/[id]
  viewerUrl?: string;
  // Whether this resource is available in offline bundles
  offlineAvailable?: boolean;
  // Optional label if this resource is part of a learning path / certification
  partOfPathTitle?: string;
}

interface LearningProgress {
  resourceId: string;
  progressPercent: number; // 0..100
  lastTouchedAt?: string;
}

type RecommendationSource = 'ml' | 'editorial' | 'trend';

interface KnowledgeRecommendationItem {
  recommendationId: string;
  score?: number;
  reason?: string;
  recommendedAt: string;
  source?: RecommendationSource;
  resource: KnowledgeResource;
  progress?: LearningProgress;
}

interface RecommendationsResponse {
  results: KnowledgeRecommendationItem[];
  count: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers to normalize API responses                                */
/* ------------------------------------------------------------------ */

function normalizeList<T = unknown>(raw: unknown): { items: T[]; count?: number } {
  if (Array.isArray(raw)) {
    return { items: raw as T[] };
  }

  if (raw && typeof raw === 'object') {
    const obj = raw as { results?: unknown; items?: unknown; count?: number };
    const items =
      (Array.isArray(obj.results) && (obj.results as T[])) ||
      (Array.isArray(obj.items) && (obj.items as T[])) ||
      [];
    return { items, count: typeof obj.count === 'number' ? obj.count : undefined };
  }

  return { items: [] };
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await apiFetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }

  return res.json();
}

// Simple numeric normalizer to cope with string/number fields from the API
function safeNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function normalizeRecommendations(raw: unknown): RecommendationsResponse {
  const { items, count } = normalizeList<UnknownRecord>(raw);

  const mapped: KnowledgeRecommendationItem[] = items.map((row, index) => {
    // Support both dedicated recommendation rows and plain resources.
    const resourceRaw = Object.keys(asRecord(row.resource)).length
      ? asRecord(row.resource)
      : row;
    const id = resourceRaw.id ?? row.id ?? index;

    const rawType = String(resourceRaw.type ?? resourceRaw.resource_type ?? 'article');
    const normalizedType: ResourceType =
      rawType === 'doc'
        ? 'article'
        : rawType === 'course'
          ? 'lesson'
          : (['article', 'video', 'lesson', 'quiz', 'dataset'] as const).includes(
                rawType as ResourceType,
              )
            ? (rawType as ResourceType)
            : 'article';

    const rawLevel = asOptionalString(resourceRaw.level);
    const level =
      rawLevel && ['Beginner', 'Intermediate', 'Advanced'].includes(rawLevel)
        ? (rawLevel as KnowledgeResource['level'])
        : undefined;

    const durationValue =
      resourceRaw.estimatedDurationMinutes ??
      resourceRaw.estimated_minutes ??
      resourceRaw.estimated_duration_minutes;

    const resource: KnowledgeResource = {
      id: String(id),
      title: asOptionalString(resourceRaw.title) ?? 'Untitled resource',
      summary:
        asOptionalString(resourceRaw.summary) ??
        asOptionalString(resourceRaw.description) ??
        '',
      subject: asOptionalString(resourceRaw.subject),
      level,
      language: asOptionalString(resourceRaw.language),
      type: normalizedType,
      tags: asStringArray(resourceRaw.tags ?? resourceRaw.keywords),
      estimatedDurationMinutes:
        durationValue === undefined ? undefined : safeNumber(durationValue),
      viewerUrl:
        asOptionalString(resourceRaw.viewerUrl) ?? asOptionalString(resourceRaw.url),
      offlineAvailable: Boolean(
        resourceRaw.offlineAvailable ??
          resourceRaw.is_offline_available ??
          resourceRaw.offlineEligible ??
          resourceRaw.offline_eligible,
      ),
      partOfPathTitle:
        asOptionalString(resourceRaw.partOfPathTitle) ??
        asOptionalString(resourceRaw.path_title) ??
        asOptionalString(resourceRaw.path_label),
    };

    const progressSource = asRecord(row.progress ?? resourceRaw.progress);
    let progress: LearningProgress | undefined;
    if (Object.keys(progressSource).length > 0) {
      const rawPercent =
        progressSource.progressPercent ?? progressSource.progress_percent;
      const percent = Math.max(0, Math.min(100, safeNumber(rawPercent)));

      progress = {
        resourceId: String(id),
        progressPercent: percent,
        lastTouchedAt:
          asOptionalString(progressSource.lastTouchedAt) ??
          asOptionalString(progressSource.last_touched_at),
      };
    }

    const rawScore = row.score ?? row.relevance_score;
    const rawSource = asOptionalString(row.source);
    const source =
      rawSource && ['ml', 'editorial', 'trend'].includes(rawSource)
        ? (rawSource as RecommendationSource)
        : undefined;

    return {
      recommendationId: String(row.id ?? `rec-${id}`),
      score: typeof rawScore === 'number' ? rawScore : undefined,
      reason: asOptionalString(row.reason),
      recommendedAt:
        asOptionalString(row.recommendedAt) ??
        asOptionalString(row.recommended_at) ??
        asOptionalString(resourceRaw.created_at) ??
        new Date().toISOString(),
      source,
      resource,
      progress,
    };
  });

  return {
    results: mapped,
    count: typeof count === 'number' ? count : mapped.length,
  };
}

/**
 * Strategy:
 * 1. Try the dedicated /api/konnected/recommendations/ endpoint (when wired).
 * 2. Fall back to the canonical KonnectED KnowledgeResource list:
 *      - /api/konnected/resources/
 */
async function fetchRecommendations(): Promise<RecommendationsResponse> {
  // 1) Dedicated recommendations endpoint
  try {
    const raw = await fetchJson('/api/konnected/recommendations/');
    return normalizeRecommendations(raw);
  } catch (err) {
     
    console.warn(
      'Falling back to KnowledgeResource list for recommendations',
      err,
    );
  }

  // 2) Fallback: generic knowledge resources list
  const fallbackEndpoints = ['/api/konnected/resources/'];

  for (const url of fallbackEndpoints) {
    try {
      const rawFallback = await fetchJson(url);
      return normalizeRecommendations(rawFallback);
    } catch {
      // try next variant
    }
  }

  throw new Error('Unable to load knowledge resources from any endpoint.');
}

/**
 * Send feedback only when a persisted feedback endpoint exists.
 * HTTP failures propagate so the UI cannot falsely acknowledge persistence.
 */
async function sendRecommendationFeedback(
  item: KnowledgeRecommendationItem,
  feedback: 'like' | 'dislike',
): Promise<void> {
  const response = await apiFetch('/api/konnected/recommendations/feedback/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      recommendationId: item.recommendationId,
      resourceId: item.resource.id,
      feedback,
    }),
  });

  if (!response.ok) {
    throw new Error(`Recommendation feedback is unavailable (HTTP ${response.status}).`);
  }
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function RecommendedResourcesPage(): JSX.Element {
  const router = useRouter();

  const [recommendations, setRecommendations] = useState<KnowledgeRecommendationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
  const [likeInFlightIds, setLikeInFlightIds] = useState<Set<string>>(new Set());

  const hasRecommendations = recommendations.length > 0;

  const sortedRecommendations = useMemo(
    () =>
      [...recommendations].sort((a, b) => {
        if (typeof a.score === 'number' && typeof b.score === 'number') {
          return b.score - a.score;
        }

        return (
          new Date(b.recommendedAt).getTime() -
          new Date(a.recommendedAt).getTime()
        );
      }),
    [recommendations],
  );

  const handleReload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchRecommendations();
      setRecommendations(data.results);
      setHasLoadedOnce(true);

      if (!data.results.length) {
        message.info(
          'No personalized recommendations yet. Try completing a few lessons or rating resources.',
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to load recommendations right now.';
      setError(msg);

    } finally {
      setLoading(false);
    }
  }, [hasLoadedOnce]);

  useEffect(() => {
    void handleReload();
  }, [handleReload]);

  const handleViewResource = (item: KnowledgeRecommendationItem) => {
    const href =
      item.resource.viewerUrl ??
      `/konnected/learning-library/resource/${encodeURIComponent(
        item.resource.id,
      )}`;

    router.push(href);
  };

  const handleFeedback = async (
    item: KnowledgeRecommendationItem,
    feedback: 'like' | 'dislike',
  ) => {
    const key = `${item.recommendationId}:${feedback}`;

    setLikeInFlightIds((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    try {
      await sendRecommendationFeedback(item, feedback);
      message.success(
        feedback === 'like'
          ? 'Thanks! We will show you more content like this.'
          : 'We will show you this type of content less often.',
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not send feedback. Please try again later.';
      message.error(msg);
    } finally {
      setLikeInFlightIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const renderHeaderTags = () => (
    <Space size={[8, 8]} wrap>
      <Tag icon={<StarFilled />} color="gold">
        Personalized
      </Tag>
      <Tag icon={<BookOutlined />} color="geekblue">
        Knowledge Library
      </Tag>
      <Tag icon={<FireOutlined />} color="volcano">
        Early prototype
      </Tag>
    </Space>
  );

  return (
    <>
      <Head>
        <title>Recommended resources – KonnectED</title>
      </Head>

      <KonnectedPageShell
        title="Recommended resources"
        subtitle="Personalized learning suggestions based on your activity in the KonnectED Knowledge Library."
        primaryAction={
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void handleReload()}
            loading={loading}
          >
            Refresh recommendations
          </Button>
        }
        secondaryActions={
          <Space>
            <Button
              icon={<BookOutlined />}
              onClick={() =>
                router.push('/konnected/learning-library/browse-resources')
              }
            >
              Browse library
            </Button>
            <Button icon={<SettingOutlined />} disabled>
              Recommendation settings
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space size={8} align="center">
                  <span>Recommended for you</span>
                  {renderHeaderTags()}
                </Space>
              }
            >
              {error && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="We couldn't load live recommendations."
                  description={
                    <span>
                      {error}{' '}
                      <Text type="secondary">
                        If this keeps happening, the personalized recommendation
                        API for KonnectED may not be wired yet. In that case we
                        will fall back to generic library suggestions.
                      </Text>
                    </span>
                  }
                />
              )}

              {!hasRecommendations && loading && (
                <div
                  style={{
                    minHeight: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Skeleton active paragraph={{ rows: 4 }} />
                </div>
              )}

              {!loading && !hasRecommendations && !error && (
                <Empty
                  description={
                    <Space direction="vertical" size={4}>
                      <span>No recommendations yet.</span>
                      <Text type="secondary">
                        Start a learning path or complete a few resources so we
                        can tailor suggestions to you.
                      </Text>
                    </Space>
                  }
                />
              )}

              {hasRecommendations && (
                <List
                  itemLayout="vertical"
                  dataSource={sortedRecommendations}
                  renderItem={(rec) => (
                    <List.Item
                      key={rec.recommendationId}
                      actions={[
                        <Space key="actions" size={8}>
                          <Button
                            type="link"
                            icon={<ArrowRightOutlined />}
                            onClick={() => handleViewResource(rec)}
                          >
                            Open
                          </Button>
                          <Button
                            type="text"
                            icon={<LikeOutlined />}
                            loading={likeInFlightIds.has(
                              `${rec.recommendationId}:like`,
                            )}
                            onClick={() => handleFeedback(rec, 'like')}
                          >
                            Helpful
                          </Button>
                          <Button
                            type="text"
                            icon={<DislikeOutlined />}
                            loading={likeInFlightIds.has(
                              `${rec.recommendationId}:dislike`,
                            )}
                            onClick={() => handleFeedback(rec, 'dislike')}
                          >
                            Not for me
                          </Button>
                        </Space>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space direction="vertical" size={0}>
                            <Space size={8} wrap>
                              <Text strong>{rec.resource.title}</Text>
                              {rec.resource.type && (
                                <Tag
                                  color="geekblue"
                                  style={{ textTransform: 'capitalize' }}
                                >
                                  {rec.resource.type}
                                </Tag>
                              )}
                              {rec.resource.level && (
                                <Tag color="purple">{rec.resource.level}</Tag>
                              )}
                              {rec.resource.subject && (
                                <Tag color="blue">{rec.resource.subject}</Tag>
                              )}
                              {rec.source && (
                                <Tag>
                                  {rec.source === 'ml'
                                    ? 'Suggested by AI'
                                    : rec.source === 'editorial'
                                    ? 'Curator pick'
                                    : 'Trending'}
                                </Tag>
                              )}
                            </Space>
                            {rec.reason && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {rec.reason}
                              </Text>
                            )}
                          </Space>
                        }
                        description={
                          <Space
                            direction="vertical"
                            size={4}
                            style={{ width: '100%' }}
                          >
                            {rec.resource.summary && (
                              <Text>{rec.resource.summary}</Text>
                            )}
                            <Space size={[8, 8]} wrap>
                              {rec.resource.language && (
                                <Tag>{rec.resource.language}</Tag>
                              )}
                              {rec.resource.tags?.map((tag) => (
                                <Tag key={tag}>{tag}</Tag>
                              ))}
                              {rec.resource.estimatedDurationMinutes != null && (
                                <Tag>
                                  ≈ {rec.resource.estimatedDurationMinutes} min
                                </Tag>
                              )}
                              {rec.resource.offlineAvailable && (
                                <Tag color="green">Offline available</Tag>
                              )}
                              {rec.resource.partOfPathTitle && (
                                <Tag color="magenta">
                                  Part of{' '}
                                  <Text strong>
                                    {rec.resource.partOfPathTitle}
                                  </Text>
                                </Tag>
                              )}
                            </Space>
                            <Row gutter={16}>
                              <Col xs={24} sm={12}>
                                {rec.progress ? (
                                  <Space
                                    direction="vertical"
                                    size={2}
                                    style={{ width: '100%' }}
                                  >
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: 12 }}
                                    >
                                      Your progress
                                    </Text>
                                    <Progress
                                      percent={rec.progress.progressPercent}
                                      size="small"
                                      status={
                                        rec.progress.progressPercent === 100
                                          ? 'success'
                                          : 'active'
                                      }
                                    />
                                    {rec.progress.lastTouchedAt && (
                                      <Text
                                        type="secondary"
                                        style={{ fontSize: 12 }}
                                      >
                                        Last activity:{' '}
                                        {new Date(
                                          rec.progress.lastTouchedAt,
                                        ).toLocaleString()}
                                      </Text>
                                    )}
                                  </Space>
                                ) : (
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 12 }}
                                  >
                                    You have not started this resource yet.
                                  </Text>
                                )}
                              </Col>
                              <Col xs={24} sm={12}>
                                <Space
                                  direction="vertical"
                                  size={2}
                                  style={{ width: '100%' }}
                                >
                                  {typeof rec.score === 'number' && (
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: 12 }}
                                    >
                                      Relevance score:{' '}
                                      <Text strong>
                                        {(rec.score * 100).toFixed(0)}%
                                      </Text>
                                    </Text>
                                  )}
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 12 }}
                                  >
                                    Recommended on:{' '}
                                    {new Date(
                                      rec.recommendedAt,
                                    ).toLocaleDateString()}
                                  </Text>
                                </Space>
                              </Col>
                            </Row>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card title="How these recommendations work">
                <Space direction="vertical" size={4}>
                  <Text>
                    KonnectED recommendations are an early prototype. They will
                    eventually use your learning paths, progress, and Ekoh score
                    to tailor suggestions.
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    For now, recommendations may rely on simple heuristics like
                    subject matches, language preferences, and popularity.
                  </Text>
                </Space>
              </Card>

              <Card title="Tips to improve recommendations">
                <List
                  size="small"
                  dataSource={[
                    'Complete or mark a few lessons as done.',
                    'Rate or leave feedback on resources.',
                    'Join a learning path and follow it for a while.',
                    'Try content in your preferred language first.',
                  ]}
                  renderItem={(tip) => <List.Item>{tip}</List.Item>}
                />
              </Card>

              <Card title="KonnectED tips & summary">
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Looking for a more structured experience?
                  </Text>
                  <Button
                    type="primary"
                    icon={<BookOutlined />}
                    onClick={() =>
                      router.push('/konnected/learning-paths/my-learning-path')
                    }
                  >
                    Go to my learning paths
                  </Button>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Or browse curated learning paths and certification programs
                    from the main dashboard.
                  </Text>
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </KonnectedPageShell>
    </>
  );
}
