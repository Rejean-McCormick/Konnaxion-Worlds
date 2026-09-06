// FILE: frontend/app/konnected/learning-library/search-filters/page.tsx
'use client';

import { FilterOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import KonnectedPageShell from '@/app/konnected/KonnectedPageShell';

const { RangePicker } = DatePicker;
const { Text } = Typography;
const { Search } = Input;
const { Option } = Select;

type KnowledgeContentType = 'article' | 'video' | 'lesson' | 'quiz' | 'dataset';

interface KnowledgeResource {
  id: number | string;
  title: string;
  type: KnowledgeContentType | string;
  url?: string | null;
  subject?: string | null;
  level?: string | null;
  language?: string | null;
  created_at?: string | null;
  tags?: string[] | null;
}

interface KnowledgeSearchResponse {
  count: number;
  results: KnowledgeResource[];
}

interface SearchFormValues {
  q?: string;
  types?: KnowledgeContentType[];
  subjects?: string[];
  levels?: string[];
  languages?: string[];
  createdAt?: [dayjs.Dayjs, dayjs.Dayjs];
}

interface QueryState {
  q?: string;
  types?: KnowledgeContentType[];
  subjects?: string[];
  levels?: string[];
  languages?: string[];
  created_from?: string;
  created_to?: string;
  page: number;
  page_size: number;
}

const DEFAULT_PAGE_SIZE = 10;

const CONTENT_TYPES: KnowledgeContentType[] = [
  'article',
  'video',
  'lesson',
  'quiz',
  'dataset',
];

// Seed taxonomies for now; can be driven by backend dictionaries later
const SUBJECT_OPTIONS = [
  'AI & Data',
  'Sustainability & Climate',
  'Healthcare & Wellbeing',
  'Civic Innovation',
  'Education & Skills',
  'Design & Creativity',
];

const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

const LANGUAGE_OPTIONS = ['English', 'French', 'Spanish', 'Other'];

// Existing backend uses a list endpoint for KnowledgeResource.
// We support the main variants used elsewhere in the app and pick
// the first one that responds.
const KNOWLEDGE_SEARCH_ENDPOINTS = [
  '/api/knowledge-resources/',
  '/api/knowledge/resources/',
  '/api/konnected/resources/',
] as const;

type RawKnowledgeSearchResponse =
  | KnowledgeResource[]
  | {
      results?: KnowledgeResource[];
      items?: KnowledgeResource[];
      count?: number;
      total?: number;
    };

function normalizeSearchResponse(raw: RawKnowledgeSearchResponse): KnowledgeSearchResponse {
  if (Array.isArray(raw)) {
    return {
      count: raw.length,
      results: raw,
    };
  }

  const obj = raw ?? {};

  const results: KnowledgeResource[] =
    (Array.isArray(obj.results) && obj.results) ||
    (Array.isArray(obj.items) && obj.items) ||
    [];

  const count: number =
    typeof obj.count === 'number'
      ? obj.count
      : typeof obj.total === 'number'
        ? obj.total
        : results.length;

  return { count, results };
}

async function searchKnowledgeResources(query: QueryState): Promise<KnowledgeSearchResponse> {
  const params = new URLSearchParams();

  // Text search: support both v14-style `q` and DRF SearchFilter's `search`
  if (query.q) {
    params.set('q', query.q);
    params.set('search', query.q);
  }

  if (query.types && query.types.length > 0) {
    // Primary v14 param
    params.set('type', query.types.join(','));
    // Optional legacy alias used in some views
    params.set('resource_type', query.types.join(','));
  }

  if (query.subjects && query.subjects.length > 0) {
    params.set('subject', query.subjects.join(','));
  }
  if (query.levels && query.levels.length > 0) {
    params.set('level', query.levels.join(','));
  }
  if (query.languages && query.languages.length > 0) {
    params.set('language', query.languages.join(','));
  }
  if (query.created_from) {
    params.set('created_from', query.created_from);
  }
  if (query.created_to) {
    params.set('created_to', query.created_to);
  }

  params.set('page', String(query.page));
  params.set('page_size', String(query.page_size));

  const qs = params.toString();
  let lastError: unknown;

  for (const base of KNOWLEDGE_SEARCH_ENDPOINTS) {
    const url = qs ? `${base}?${qs}` : base;

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      // For 404/405 we try the next candidate; for other codes we surface the error.
      if (!res.ok) {
        if (res.status === 404 || res.status === 405) {
          lastError = new Error(`Knowledge search endpoint not available at ${base} (${res.status})`);
          continue;
        }

        const body = await res.text().catch(() => '');
        throw new Error(body || `Knowledge search failed with status ${res.status}`);
      }

      const json = (await res.json()) as RawKnowledgeSearchResponse;
      return normalizeSearchResponse(json);
    } catch (err) {
      lastError = err;
      // Try next candidate
    }
  }

  const message =
    lastError instanceof Error
      ? lastError.message
      : 'Unable to reach any knowledge search endpoint.';
  throw new Error(message);
}

export default function KonnectedKnowledgeSearchFiltersPage(): JSX.Element {
  const router = useRouter();
  const [form] = Form.useForm<SearchFormValues>();

  const [resources, setResources] = useState<KnowledgeResource[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const columns: ColumnsType<KnowledgeResource> = useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        render: (value, record) => {
          const href = record.url || '#';
          const isClickable = Boolean(record.url);
          return (
            <Space direction="vertical" size={0}>
              {isClickable ? (
                <a
                  href={href as string}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {value}
                </a>
              ) : (
                <Text strong>{value}</Text>
              )}
              <Space size="small" wrap>
                {record.subject && <Tag color="blue">{record.subject}</Tag>}
                {record.level && <Tag color="purple">{record.level}</Tag>}
                {record.language && <Tag color="geekblue">{record.language}</Tag>}
              </Space>
            </Space>
          );
        },
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        width: 140,
        render: (value: KnowledgeResource['type']) => (
          <Tag>{String(value ?? '').toUpperCase() || 'UNKNOWN'}</Tag>
        ),
      },
      {
        title: 'Tags',
        dataIndex: 'tags',
        key: 'tags',
        width: 220,
        render: (tags?: string[] | null) =>
          tags && tags.length > 0 ? (
            <Space size="small" wrap>
              {tags.map((tag) => (
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
        title: 'Added',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 140,
        render: (value?: string | null) =>
          value ? (
            <Text>{dayjs(value).format('YYYY-MM-DD')}</Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Unknown
            </Text>
          ),
      },
      {
        title: 'Actions',
        key: 'actions',
        fixed: 'right',
        width: 160,
        render: (_: unknown, record) => (
          <Space>
            {record.url && (
              <Button
                type="link"
                size="small"
                onClick={() => {
                  window.open(record.url as string, '_blank', 'noopener');
                }}
              >
                Open
              </Button>
            )}
            <Button
              size="small"
              onClick={() =>
                router.push(`/konnected/learning-library/resource/${record.id}`)
              }
            >
              View details
            </Button>
          </Space>
        ),
      },
    ],
    [router],
  );

  const runSearch = async (overridePage?: number, overridePageSize?: number) => {
    const formValues = form.getFieldsValue();

    const pageToUse = overridePage ?? page;
    const pageSizeToUse = overridePageSize ?? pageSize;

    const query: QueryState = {
      q: formValues.q?.trim() || undefined,
      types: formValues.types,
      subjects: formValues.subjects,
      levels: formValues.levels,
      languages: formValues.languages,
      created_from: formValues.createdAt?.[0]
        ? formValues.createdAt[0].startOf('day').toISOString()
        : undefined,
      created_to: formValues.createdAt?.[1]
        ? formValues.createdAt[1].endOf('day').toISOString()
        : undefined,
      page: pageToUse,
      page_size: pageSizeToUse,
    };

    setLoading(true);
    setError(null);

    try {
      const response = await searchKnowledgeResources(query);
      setResources(response.results || []);
      setTotal(response.count ?? response.results.length);
      setPage(pageToUse);
      setPageSize(pageSizeToUse);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Unexpected error during search';
      setError(message);
      setResources([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = () => {
    // Reset to first page when filters change
    void runSearch(1, pageSize);
  };

  const handleQuickSearch = (value: string) => {
    form.setFieldsValue({ q: value });
    void runSearch(1, pageSize);
  };

  const handleResetFilters = () => {
    form.resetFields();
    void runSearch(1, DEFAULT_PAGE_SIZE);
  };

  const handleTableChange: TableProps<KnowledgeResource>['onChange'] = (
    pagination,
  ) => {
    const nextPage = pagination.current || 1;
    const nextPageSize = pagination.pageSize || DEFAULT_PAGE_SIZE;
    void runSearch(nextPage, nextPageSize);
  };

  useEffect(() => {
    // Initial search on mount with default filters
    void runSearch(1, DEFAULT_PAGE_SIZE);
     
  }, []);

  // Compute active filters on each render so the Reset button state stays in sync
  const filterValues = form.getFieldsValue();
  const hasActiveFilters = Boolean(
    filterValues.q ||
      (filterValues.types && filterValues.types.length > 0) ||
      (filterValues.subjects && filterValues.subjects.length > 0) ||
      (filterValues.levels && filterValues.levels.length > 0) ||
      (filterValues.languages && filterValues.languages.length > 0) ||
      (filterValues.createdAt &&
        Array.isArray(filterValues.createdAt) &&
        filterValues.createdAt[0] &&
        filterValues.createdAt[1]),
  );

  const secondaryActions = (
    <Space>
      <Search
        placeholder="Quick search by title or description"
        allowClear
        enterButton={<SearchOutlined />}
        onSearch={handleQuickSearch}
        style={{ width: 280 }}
      />
      <Button
        icon={<ReloadOutlined />}
        onClick={handleResetFilters}
        disabled={!hasActiveFilters}
      >
        Reset filters
      </Button>
    </Space>
  );

  const primaryAction = (
    <Button
      type="primary"
      icon={<FilterOutlined />}
      onClick={() => void runSearch(page, pageSize)}
    >
      Apply filters
    </Button>
  );

  return (
    <KonnectedPageShell
      title="Search the Learning Library"
      subtitle="Run advanced searches across Knowledge resources using full-text and structured filters."
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
    >
      <Card style={{ marginBottom: 16 }}>
        <Form<SearchFormValues> form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label="Keywords"
                name="q"
                tooltip="Searches over title and description using the PostgreSQL full-text backend."
              >
                <Input
                  placeholder="e.g. data visualization, climate, robotics"
                  prefix={<SearchOutlined />}
                  allowClear
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12} lg={8}>
              <Form.Item label="Content type" name="types">
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Select content types"
                >
                  {CONTENT_TYPES.map((t) => (
                    <Option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12} lg={8}>
              <Form.Item label="Subjects" name="subjects">
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Filter by subject or theme"
                >
                  {SUBJECT_OPTIONS.map((s) => (
                    <Option key={s} value={s}>
                      {s}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={8}>
              <Form.Item label="Level" name="levels">
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Beginner, Intermediate, Advanced"
                >
                  {LEVEL_OPTIONS.map((l) => (
                    <Option key={l} value={l}>
                      {l}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12} lg={8}>
              <Form.Item label="Language" name="languages">
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Resource language"
                >
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <Option key={lang} value={lang}>
                      {lang}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12} lg={8}>
              <Form.Item label="Added to library" name="createdAt">
                <RangePicker style={{ width: '100%' }} allowEmpty={[true, true]} />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="end">
            <Col>
              <Space>
                <Button onClick={handleResetFilters}>Clear all</Button>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  htmlType="submit"
                >
                  Search
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {error && (
        <Alert
          type="error"
          showIcon
          message="Unable to run search"
          description={error}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <Text type="secondary">
              {loading
                ? 'Searching…'
                : `Showing ${resources.length} of ${total} result${
                    total === 1 ? '' : 's'
                  }`}
            </Text>
          </Space>

          <Table<KnowledgeResource>
            rowKey={(record) => String(record.id)}
            columns={columns}
            dataSource={resources}
            loading={loading}
            onChange={handleTableChange}
            pagination={{
              current: page,
              total,
              pageSize,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50],
              showTotal: (t, range) =>
                `${range[0]}–${range[1]} of ${t} resources`,
            }}
            locale={{
              emptyText: loading
                ? 'Loading resources…'
                : 'No resources match your current filters.',
            }}
            scroll={{ x: 900 }}
            bordered
            size="middle"
          />
        </Space>
      </Card>
    </KonnectedPageShell>
  );
}
