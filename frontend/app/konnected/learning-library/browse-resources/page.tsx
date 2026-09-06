// FILE: frontend/app/konnected/learning-library/browse-resources/page.tsx
// app/konnected/learning-library/browse-resources/page.tsx
'use client';

import {
  DownloadOutlined,
  FilterOutlined,
  SearchOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  message,
  Pagination,
  Rate,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import KonnectedPageShell from '@/app/konnected/KonnectedPageShell';

const { Text } = Typography;
const { Search } = Input;

/* ------------------------------------------------------------------ */
/*  Domain types (aligned with KnowledgeResource + list API)          */
/* ------------------------------------------------------------------ */

type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';

type SortOption = 'relevance' | 'newest' | 'popular' | 'shortest' | 'longest';

interface KnowledgeResource {
  id: string | number;
  title: string;
  description?: string;
  subject?: string;
  level?: KnowledgeLevel;
  language?: string;
  /** Canonical enum from Knowledge module (article, video, lesson, quiz, dataset, …) */
  resource_type: string;
  average_rating?: number | null;
  tags?: string[];
  estimated_minutes?: number | null;
  is_offline_available?: boolean;
  user_progress_percent?: number | null;
  /** Backend-aligned extras (not all are rendered, but used for navigation) */
  url?: string | null;
  type?: string | null;
  author?: string | null;
  created_at?: string | null;
}

interface KnowledgeResourceListResponse {
  count?: number;
  results?: KnowledgeResource[];
  items?: KnowledgeResource[];
  total?: number;
}

interface KnowledgeMetadataResponse {
  subjects?: string[];
  levels?: KnowledgeLevel[];
  languages?: string[];
  resource_types?: string[];
}

/* Reasonable defaults based on the Knowledge module spec */
const DEFAULT_LEVELS: KnowledgeLevel[] = ['beginner', 'intermediate', 'advanced'];
const DEFAULT_RESOURCE_TYPES = ['article', 'video', 'lesson', 'quiz', 'dataset'];
const DEFAULT_LANGUAGES = ['English', 'French', 'Spanish', 'Other'];

/* ------------------------------------------------------------------ */
/*  API endpoints                                                      */
/*  - Aligned with DRF router: /api/konnected/resources/              */
/*  - Metadata endpoint is optional; call is non-blocking.            */
/* ------------------------------------------------------------------ */

const KNOWLEDGE_RESOURCES_ENDPOINT = '/api/konnected/resources/';
const KNOWLEDGE_METADATA_ENDPOINT = '/api/konnected/resources/metadata/';

interface FiltersState {
  query: string;
  subject?: string;
  level?: KnowledgeLevel;
  language?: string;
  resourceType?: string;
  sort: SortOption;
}

/* Map UI sort options to backend ordering query param */
function mapSortToOrdering(sort: SortOption): string | undefined {
  switch (sort) {
    case 'relevance':
      return '-search_score'; // typical search backend field
    case 'newest':
      return '-created_at';
    case 'popular':
      return '-popularity';
    case 'shortest':
      return 'estimated_minutes';
    case 'longest':
      return '-estimated_minutes';
    default:
      return undefined;
  }
}

function normalizeArray<T>(values: T[] | undefined, fallback: T[]): T[] {
  return values && values.length > 0 ? values : fallback;
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function BrowseResourcesPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters & pagination
  const [filters, setFilters] = useState<FiltersState>({
    query: '',
    sort: 'relevance',
  });
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // Data
  const [resources, setResources] = useState<KnowledgeResource[]>([]);
  const [total, setTotal] = useState<number>(0);

  // Metadata for filters
  const [subjects, setSubjects] = useState<string[]>([]);
  const [levels, setLevels] = useState<KnowledgeLevel[]>(DEFAULT_LEVELS);
  const [languages, setLanguages] = useState<string[]>(DEFAULT_LANGUAGES);
  const [resourceTypes, setResourceTypes] = useState<string[]>(DEFAULT_RESOURCE_TYPES);

  // Loading / error states
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMeta, setLoadingMeta] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [sharing, setSharing] = useState<boolean>(false);

  /* ------------------------------------------------------------------ */
  /*  Query-string ↔ state sync (for "Share filters" links)             */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!searchParams) return;

    const q = searchParams.get('q') ?? '';
    const subject = searchParams.get('subject') || undefined;
    const levelParam = searchParams.get('level') as KnowledgeLevel | null;
    const language = searchParams.get('language') || undefined;
    const resourceType = searchParams.get('resourceType') || undefined;
    const sortParam = searchParams.get('sort') as SortOption | null;

    const nextFilters: FiltersState = {
      query: q,
      subject,
      level:
        levelParam && (DEFAULT_LEVELS as readonly string[]).includes(levelParam)
          ? levelParam
          : undefined,
      language,
      resourceType,
      sort:
        sortParam && ['relevance', 'newest', 'popular', 'shortest', 'longest'].includes(sortParam)
          ? sortParam
          : 'relevance',
    };

    const urlPage = Number(searchParams.get('page') || '1');
    const urlPageSize = Number(searchParams.get('page_size') || '12');

    setFilters(nextFilters);
    if (!Number.isNaN(urlPage) && urlPage > 0) {
      setPage(urlPage);
    }
    if (!Number.isNaN(urlPageSize) && urlPageSize > 0) {
      setPageSize(urlPageSize);
    }
     
  }, [searchParams]);

  /* ------------------------------------------------------------------ */
  /*  Data fetching                                                      */
  /* ------------------------------------------------------------------ */

  const fetchResources = useCallback(
    async (overridePage?: number, overridePageSize?: number) => {
      setLoading(true);
      setError(null);

      const currentPage = overridePage ?? page;
      const currentPageSize = overridePageSize ?? pageSize;

      try {
        const params: Record<string, unknown> = {
          page: currentPage,
          page_size: currentPageSize,
        };

        if (filters.query) {
          params.search = filters.query;
        }
        if (filters.subject) {
          params.subject = filters.subject;
        }
        if (filters.level) {
          params.level = filters.level;
        }
        if (filters.language) {
          params.language = filters.language;
        }
        if (filters.resourceType) {
          params.resource_type = filters.resourceType;
        }

        const ordering = mapSortToOrdering(filters.sort);
        if (ordering) {
          params.ordering = ordering;
        }

        const response = await axios.get<KnowledgeResourceListResponse>(
          KNOWLEDGE_RESOURCES_ENDPOINT,
          { params },
        );

        const raw = response.data as unknown;
        let items: KnowledgeResource[] = [];
        let count = 0;

        if (Array.isArray(raw)) {
          items = raw as KnowledgeResource[];
          count = items.length;
        } else if (raw && typeof raw === 'object') {
          const obj = raw as KnowledgeResourceListResponse;
          const maybeResults =
            (Array.isArray(obj.results) && obj.results) ||
            (Array.isArray(obj.items) && obj.items) ||
            [];
          items = maybeResults;
          count =
            typeof obj.count === 'number'
              ? obj.count
              : typeof obj.total === 'number'
              ? obj.total
              : items.length;
        }

        setResources(items);
        setTotal(count);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Unable to load knowledge resources.';
        setError(msg);
        setResources([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [filters, page, pageSize],
  );

  const fetchMetadata = useCallback(async () => {
    setLoadingMeta(true);

    try {
      const response = await axios.get<KnowledgeMetadataResponse>(KNOWLEDGE_METADATA_ENDPOINT);
      const data = response.data ?? {};

      setSubjects(data.subjects ?? []);
      setLevels(normalizeArray(data.levels, DEFAULT_LEVELS));
      setLanguages(normalizeArray(data.languages, DEFAULT_LANGUAGES));
      setResourceTypes(normalizeArray(data.resource_types, DEFAULT_RESOURCE_TYPES));
    } catch {
      // Metadata is purely additive; failure should not block the main list.
      setSubjects([]);
      setLevels(DEFAULT_LEVELS);
      setLanguages(DEFAULT_LANGUAGES);
      setResourceTypes(DEFAULT_RESOURCE_TYPES);
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  // Single effect: reacts to page / size / filters
  useEffect(() => {
    fetchResources(page, pageSize);
  }, [page, pageSize, fetchResources]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  /* ------------------------------------------------------------------ */
  /*  Handlers                                                          */
  /* ------------------------------------------------------------------ */

  const handleSearch = (value: string) => {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      query: value.trim(),
    }));
  };

  const handleFilterChange =
    <K extends keyof FiltersState>(key: K) =>
    (value: FiltersState[K]) => {
      setPage(1);
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

  const handleSortChange = (value: SortOption) => {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      sort: value,
    }));
  };

  const handleTableChangePage = (nextPage: number, nextPageSize?: number) => {
    setPage(nextPage);
    if (nextPageSize && nextPageSize !== pageSize) {
      setPageSize(nextPageSize);
    }
  };

  const handleOpenResource = (record: KnowledgeResource) => {
    // Prefer explicit URL from backend (can be external or internal).
    if (record.url) {
      const href = String(record.url);
      if (href.startsWith('http://') || href.startsWith('https://')) {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        router.push(href);
      }
      return;
    }

    // Fallback to course player route described in Knowledge module docs.
    const id = encodeURIComponent(String(record.id));
    router.push(`/course/${id}`);
  };

  const buildShareSearchParams = () => {
    const params = new URLSearchParams();

    if (filters.query) params.set('q', filters.query);
    if (filters.subject) params.set('subject', filters.subject);
    if (filters.level) params.set('level', filters.level);
    if (filters.language) params.set('language', filters.language);
    if (filters.resourceType) params.set('resourceType', filters.resourceType);
    if (filters.sort && filters.sort !== 'relevance') params.set('sort', filters.sort);

    if (page !== 1) params.set('page', String(page));
    if (pageSize !== 12) params.set('page_size', String(pageSize));

    return params;
  };

  const handleExportCurrentPage = async () => {
    if (!resources.length) {
      message.info('There are no resources to export for the current filters.');
      return;
    }

    try {
      setExporting(true);

      const header = [
        'id',
        'title',
        'subject',
        'level',
        'language',
        'resource_type',
        'average_rating',
        'estimated_minutes',
        'tags',
        'is_offline_available',
        'user_progress_percent',
      ];

      const rows = resources.map((r) => [
        r.id,
        r.title,
        r.subject ?? '',
        r.level ?? '',
        r.language ?? '',
        r.resource_type ?? '',
        r.average_rating ?? '',
        r.estimated_minutes ?? '',
        (r.tags ?? []).join('|'),
        r.is_offline_available ? 'yes' : 'no',
        r.user_progress_percent ?? '',
      ]);

      const encodeCell = (value: unknown): string => {
        const str =
          value === null || value === undefined ? '' : String(value);
        if (/[",\n]/.test(str)) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csv = [header, ...rows]
        .map((row) => row.map(encodeCell).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.href = url;
      link.download = `konnected-learning-library-${timestamp}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success('Exported current page of results as CSV.');
    } catch {
      message.error('Unable to export resources. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleShareFilters = async () => {
    try {
      setSharing(true);
      const params = buildShareSearchParams();
      const basePath = '/konnected/learning-library/browse-resources';
      const queryString = params.toString();
      const href = `${basePath}${queryString ? `?${queryString}` : ''}`;

      if (typeof window !== 'undefined') {
        const fullUrl = `${window.location.origin}${href}`;
        try {
          await navigator.clipboard.writeText(fullUrl);
          message.success('Link with current filters copied to your clipboard.');
        } catch {
          message.warning('Unable to copy link automatically. The URL has been updated instead.');
        }
      }

      router.push(href);
    } finally {
      setSharing(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Table columns                                                     */
  /* ------------------------------------------------------------------ */

  const columns: ColumnsType<KnowledgeResource> = useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        render: (value: string, record) => (
          <Space direction="vertical" size={2}>
            <Button
              type="link"
              onClick={() => handleOpenResource(record)}
              style={{ padding: 0 }}
            >
              {value}
            </Button>
            {record.description && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.description}
              </Text>
            )}
          </Space>
        ),
      },
      {
        title: 'Subject',
        dataIndex: 'subject',
        key: 'subject',
        render: (value?: string) =>
          value ? (
            <Tag color="blue">{value}</Tag>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Not specified
            </Text>
          ),
      },
      {
        title: 'Type',
        dataIndex: 'resource_type',
        key: 'resource_type',
        render: (value: string) => (
          <Tag color="geekblue" style={{ textTransform: 'capitalize' }}>
            {value || 'other'}
          </Tag>
        ),
      },
      {
        title: 'Level',
        dataIndex: 'level',
        key: 'level',
        render: (value?: KnowledgeLevel) =>
          value ? (
            <Tag color="purple" style={{ textTransform: 'capitalize' }}>
              {value}
            </Tag>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Any level
            </Text>
          ),
      },
      {
        title: 'Language',
        dataIndex: 'language',
        key: 'language',
        render: (value?: string) =>
          value ? (
            <Tag color="cyan">{value}</Tag>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Not specified
            </Text>
          ),
      },
      {
        title: 'Rating',
        dataIndex: 'average_rating',
        key: 'average_rating',
        width: 150,
        render: (value?: number | null) =>
          value != null ? (
            <Space size={4}>
              <Rate disabled allowHalf defaultValue={value} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                ({value.toFixed(1)})
              </Text>
            </Space>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Not rated yet
            </Text>
          ),
      },
      {
        title: 'Duration / min',
        dataIndex: 'estimated_minutes',
        key: 'estimated_minutes',
        width: 120,
        render: (value?: number | null) =>
          value != null ? (
            <Text>{value} min</Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              —
            </Text>
          ),
      },
      {
        title: 'Progress',
        dataIndex: 'user_progress_percent',
        key: 'user_progress_percent',
        width: 120,
        render: (value?: number | null) =>
          value != null ? (
            <Text>{value}%</Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Not started
            </Text>
          ),
      },
      {
        title: 'Tags',
        dataIndex: 'tags',
        key: 'tags',
        render: (value?: string[]) =>
          value && value.length > 0 ? (
            <Space wrap size={4}>
              {value.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              No tags
            </Text>
          ),
      },
      {
        title: 'Offline',
        dataIndex: 'is_offline_available',
        key: 'is_offline_available',
        width: 120,
        render: (value?: boolean) =>
          value ? (
            <Tag color="green">Available</Tag>
          ) : (
            <Tag>Online only</Tag>
          ),
      },
      {
        title: 'Actions',
        key: 'actions',
        fixed: 'right',
        width: 150,
        render: (_: unknown, record) => (
          <Space>
            <Button size="small" type="link" onClick={() => handleOpenResource(record)}>
              Open
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              disabled={!record.is_offline_available}
            >
              Offline
            </Button>
          </Space>
        ),
      },
    ],
    [handleOpenResource],
  );

  const hasResults = resources.length > 0;

  const filtersActive = useMemo(() => {
    const { query, subject, level, language, resourceType, sort } = filters;
    return Boolean(
      query || subject || level || language || resourceType || sort !== 'relevance',
    );
  }, [filters]);

  /* ------------------------------------------------------------------ */
  /*  Header actions                                                     */
  /* ------------------------------------------------------------------ */

  const headerPrimaryAction = (
    <Space>
      <Button
        icon={<DownloadOutlined />}
        onClick={handleExportCurrentPage}
        disabled={!hasResults}
        loading={exporting}
      >
        Export selection
      </Button>
      <Button
        icon={<ShareAltOutlined />}
        onClick={handleShareFilters}
        disabled={!hasResults && !filtersActive}
        loading={sharing}
      >
        Share filters
      </Button>
    </Space>
  );

  const headerSecondaryActions = (
    <Button
      icon={<FilterOutlined />}
      onClick={() => fetchResources(1, pageSize)}
      disabled={loading}
    >
      Refresh
    </Button>
  );

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <KonnectedPageShell
      title="Browse learning resources"
      subtitle="Explore the shared knowledge library and filter by subject, level, language, and more."
      primaryAction={headerPrimaryAction}
      secondaryActions={headerSecondaryActions}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={10}>
                <Search
                  placeholder="Search by title or description"
                  allowClear
                  enterButton={<SearchOutlined />}
                  onSearch={handleSearch}
                />
              </Col>

              <Col xs={24} md={14}>
                <Row gutter={[8, 8]} justify="end">
                  <Col xs={24} sm={12} md={6}>
                    <Select
                      value={filters.subject}
                      onChange={handleFilterChange('subject')}
                      allowClear
                      placeholder="All subjects"
                      style={{ width: '100%' }}
                      options={subjects.map((s) => ({ label: s, value: s }))}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Select
                      value={filters.level}
                      onChange={handleFilterChange('level')}
                      allowClear
                      placeholder="Any level"
                      style={{ width: '100%' }}
                      options={levels.map((lvl) => ({
                        label: lvl.charAt(0).toUpperCase() + lvl.slice(1),
                        value: lvl,
                      }))}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Select
                      value={filters.language}
                      onChange={handleFilterChange('language')}
                      allowClear
                      placeholder="Any language"
                      style={{ width: '100%' }}
                      options={languages.map((lng) => ({ label: lng, value: lng }))}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Select
                      value={filters.resourceType}
                      onChange={handleFilterChange('resourceType')}
                      allowClear
                      placeholder="All types"
                      style={{ width: '100%' }}
                      options={resourceTypes.map((t) => ({
                        label: t.charAt(0).toUpperCase() + t.slice(1),
                        value: t,
                      }))}
                    />
                  </Col>
                </Row>
              </Col>
            </Row>

            <Row
              style={{ marginTop: 16 }}
              justify="space-between"
              align="middle"
              gutter={[8, 8]}
            >
              <Col>
                {filtersActive ? (
                  <Text type="secondary">
                    <strong>Active filters:</strong>{' '}
                    {filters.query && (
                      <>
                        Search = <strong>"{filters.query}"</strong>{' '}
                      </>
                    )}
                    {filters.subject && (
                      <>
                        Subject = <strong>{filters.subject}</strong>{' '}
                      </>
                    )}
                    {filters.level && (
                      <>
                        Level = <strong>{filters.level}</strong>{' '}
                      </>
                    )}
                    {filters.language && (
                      <>
                        Language = <strong>{filters.language}</strong>{' '}
                      </>
                    )}
                    {filters.resourceType && (
                      <>
                        Type = <strong>{filters.resourceType}</strong>{' '}
                      </>
                    )}
                    {filters.sort !== 'relevance' && (
                      <>
                        Sort = <strong>{filters.sort}</strong>
                      </>
                    )}
                  </Text>
                ) : (
                  <Text type="secondary">
                    Use the search box and filters above to explore the knowledge library.
                  </Text>
                )}
              </Col>
              <Col>
                <Space align="center">
                  <Text type="secondary">Sort by</Text>
                  <Select<SortOption>
                    value={filters.sort}
                    onChange={handleSortChange}
                    style={{ width: 180 }}
                    options={[
                      { label: 'Best match', value: 'relevance' },
                      { label: 'Newest first', value: 'newest' },
                      { label: 'Most popular', value: 'popular' },
                      { label: 'Shortest duration', value: 'shortest' },
                      { label: 'Longest duration', value: 'longest' },
                    ]}
                  />
                  {loadingMeta && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Updating filter options…
                    </Text>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title="Library results"
            extra={
              <Space>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => fetchResources(1, pageSize)}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Space>
            }
          >
            {error && (
              <Alert
                type="error"
                showIcon
                message="Unable to load resources"
                description={error}
                style={{ marginBottom: 16 }}
              />
            )}

            {loading && !hasResults ? (
              <Spin
                tip="Loading resources…"
                size="large"
                style={{
                  width: '100%',
                  minHeight: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div />
              </Spin>
            ) : (
              <>
                <Table<KnowledgeResource>
                  rowKey={(row) => row.id}
                  size="middle"
                  bordered
                  columns={columns}
                  dataSource={resources}
                  loading={loading}
                  pagination={false}
                  scroll={{ x: 1100 }}
                  locale={{
                    emptyText: (
                      <div style={{ padding: '24px 0' }}>
                        <Text type="secondary">
                          No resources match your filters yet. Try adjusting your search terms or
                          filter options.
                        </Text>
                      </div>
                    ),
                  }}
                />

                <div
                  style={{
                    marginTop: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <Text type="secondary">
                    Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
                  </Text>

                  <Pagination
                    current={page}
                    total={total}
                    pageSize={pageSize}
                    showSizeChanger
                    pageSizeOptions={['6', '12', '24', '48']}
                    showTotal={(t) => `${t} item${t === 1 ? '' : 's'}`}
                    onChange={handleTableChangePage}
                  />
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </KonnectedPageShell>
  );
}
